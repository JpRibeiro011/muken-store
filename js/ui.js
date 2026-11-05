/* =====================================================================
   MUKEN STORE — ui.js
   Componentes de interface reutilizáveis:
   - templates (ícone, estrelas, preço, card de produto, skeleton, vazio)
   - notificações personalizadas (toasts) com ação e "desfazer"
   - diálogos acessíveis (modal, drawer, confirmação) com retorno de foco
   - animações de entrada ao rolar (IntersectionObserver)
   - anúncios para leitores de tela (aria-live)
   ===================================================================== */
(function (MK) {
  'use strict';

  const { escapeHTML: esc, formatPrice, formatRating } = MK.utils;

  /* ------------------------------------------------------------------
     Templates básicos
     ------------------------------------------------------------------ */
  function icon(name, className = '') {
    return `<svg class="icon ${className}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
  }

  /** Estrelas com preenchimento parcial (ex.: 4,7 = 4 estrelas e 70%). */
  function stars(rating, count, options = {}) {
    const five = Array.from({ length: 5 }, () => icon('star', 'icon--fill')).join('');
    const label = `Avaliação ${formatRating(rating)} de 5${count ? `, ${count} avaliações` : ''}`;
    return `
      <span class="rating ${options.large ? 'rating--lg' : ''}" role="img" aria-label="${label}">
        <span class="rating__stars" style="--rating:${Number(rating).toFixed(2)}" aria-hidden="true">
          ${five}<span class="rating__fill">${five}</span>
        </span>
        <span class="rating__value" aria-hidden="true">${formatRating(rating)}</span>
        ${count ? `<span class="rating__count" aria-hidden="true">(${count})</span>` : ''}
      </span>`;
  }

  /** Bloco de preço com preço promocional, preço original e parcelamento. */
  function price(product, options = {}) {
    const P = MK.products;
    const final = P.finalPrice(product);
    const promo = P.hasPromo(product);
    const inst = P.installments(final);
    const note = options.note === false
      ? ''
      : `<span class="price__note">${inst.count > 1 ? `ou <strong>${inst.count}x de ${formatPrice(inst.value)}</strong> sem juros` : 'à vista'}</span>`;
    return `
      <div class="price ${options.large ? 'price--lg' : ''}">
        ${promo ? '<span class="sr-only">Preço promocional:</span>' : '<span class="sr-only">Preço:</span>'}
        <span class="price__current">${formatPrice(final)}</span>
        ${promo ? `<span class="price__old"><span class="sr-only">Preço original:</span>${formatPrice(product.price)}</span>` : ''}
        ${note}
      </div>`;
  }

  /** Indicador textual de disponibilidade (cor + texto, nunca só cor). */
  function stockTag(product) {
    const a = MK.products.availability(product);
    return `<span class="stock stock--${a.code}">${esc(a.label)}</span>`;
  }

  function badges(product) {
    const P = MK.products;
    const list = [];
    const a = P.availability(product);
    if (a.code === 'out') list.push('<span class="badge badge--out">Esgotado</span>');
    if (P.hasPromo(product) && a.code !== 'out') list.push(`<span class="badge badge--sale">-${P.discountPercent(product)}%</span>`);
    if (product.isNew) list.push(`<span class="badge badge--new">${icon('sparkles')}Novo</span>`);
    if (a.code === 'low') list.push(`<span class="badge badge--low">Últimas ${a.stock}</span>`);
    return list.join('');
  }

  function favButton(product, extraClass = '') {
    const active = Boolean(MK.favorites && MK.favorites.has(product.id));
    const label = active ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`;
    return `
      <button class="fav-toggle ${extraClass}" type="button" data-action="toggle-favorite" data-id="${esc(product.id)}"
              aria-pressed="${active}" aria-label="${esc(label)}" title="${active ? 'Remover dos favoritos' : 'Favoritar'}">
        ${icon('heart')}
      </button>`;
  }

  /** Card de produto usado em todas as vitrines. */
  function productCard(product, options = {}) {
    const P = MK.products;
    const a = P.availability(product);
    const out = a.code === 'out';
    const index = options.index || 0;
    const url = `#/produto/${encodeURIComponent(product.id)}`;
    return `
      <article class="product-card ${out ? 'is-out' : ''}" data-reveal style="--i:${index % 8}" data-product-id="${esc(product.id)}">
        <div class="product-card__media media-loading">
          <img class="product-card__img" src="${esc(product.image)}" alt="${esc(product.imageAlt)}"
               width="800" height="800" loading="lazy" decoding="async">
          <div class="product-card__badges">${badges(product)}</div>
          ${favButton(product, 'product-card__fav')}
          <button class="product-card__quick" type="button" data-action="quick-view" data-id="${esc(product.id)}"
                  aria-label="Visualização rápida de ${esc(product.name)}">
            ${icon('eye')}<span>Visualização rápida</span>
          </button>
        </div>
        <div class="product-card__body">
          <p class="product-card__cat">${esc(P.categoryName(product.category))}</p>
          <h3 class="product-card__name"><a href="${url}">${esc(product.name)}</a></h3>
          <p class="product-card__sub muted small">${esc(product.subtitle)}</p>
          ${stars(product.rating, product.reviewsCount)}
          ${price(product)}
          <div class="product-card__footer">
            ${stockTag(product)}
            <button class="btn btn--primary btn--sm" type="button" data-action="add-to-cart" data-id="${esc(product.id)}"
                    ${out ? 'disabled aria-disabled="true"' : ''} aria-label="${out ? `${esc(product.name)} esgotado` : `Adicionar ${esc(product.name)} ao carrinho`}">
              ${icon(out ? 'x-circle' : 'bag')}<span>${out ? 'Esgotado' : 'Adicionar'}</span>
            </button>
          </div>
        </div>
      </article>`;
  }

  /** Linha horizontal com posição no ranking (mais vendidos). */
  function productRow(product, rank) {
    const P = MK.products;
    const out = P.availability(product).code === 'out';
    return `
      <article class="product-row" data-reveal style="--i:${rank % 8}">
        <span class="product-row__rank" aria-hidden="true">${String(rank).padStart(2, '0')}</span>
        <div class="product-row__media media-loading">
          <img src="${esc(product.image)}" alt="" width="800" height="800" loading="lazy" decoding="async">
        </div>
        <div class="product-row__info">
          <p class="product-card__cat">${esc(P.categoryName(product.category))}</p>
          <h3 class="product-row__name"><a href="#/produto/${encodeURIComponent(product.id)}"><span class="sr-only">${rank}º mais vendido: </span>${esc(product.name)}</a></h3>
          <p class="product-row__meta">${stars(product.rating, product.reviewsCount)} · ${MK.utils.formatRating(product.sold / 1000)} mil vendidos</p>
        </div>
        <div class="product-row__side">
          ${price(product, { note: false })}
          <button class="btn btn--secondary btn--sm" type="button" data-action="add-to-cart" data-id="${esc(product.id)}"
                  ${out ? 'disabled' : ''} aria-label="${out ? `${esc(product.name)} esgotado` : `Adicionar ${esc(product.name)} ao carrinho`}">
            ${icon(out ? 'x-circle' : 'plus')}<span>${out ? 'Esgotado' : 'Adicionar'}</span>
          </button>
        </div>
      </article>`;
  }

  function skeletonCards(count = 8) {
    return Array.from({ length: count }, () => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton-card__media"></div>
        <div class="skeleton-card__body">
          <div class="skeleton skeleton-line skeleton-line--sm"></div>
          <div class="skeleton skeleton-line skeleton-line--lg"></div>
          <div class="skeleton skeleton-line skeleton-line--md"></div>
          <div class="skeleton skeleton-line skeleton-line--btn"></div>
        </div>
      </div>`).join('');
  }

  function emptyState({ iconName = 'infinity', title, text, actions = '', compact = false, headingLevel = 2 }) {
    const h = `h${headingLevel}`;
    return `
      <div class="empty-state ${compact ? 'empty-state--compact' : ''}">
        <div class="empty-state__icon">${icon(iconName, 'icon--xl')}</div>
        <${h} class="empty-state__title">${title}</${h}>
        ${text ? `<p class="empty-state__text">${text}</p>` : ''}
        ${actions ? `<div class="empty-state__actions">${actions}</div>` : ''}
      </div>`;
  }

  /* ------------------------------------------------------------------
     Imagens: remove o shimmer quando a imagem termina de carregar
     ------------------------------------------------------------------ */
  function handleMediaLoaded(event) {
    const target = event.target;
    if (target && target.tagName === 'IMG') {
      const holder = target.closest('.media-loading');
      if (holder) holder.classList.remove('media-loading');
    }
  }
  document.addEventListener('load', handleMediaLoaded, true);
  document.addEventListener('error', handleMediaLoaded, true);

  /** Garante que imagens já carregadas (cache) não fiquem com shimmer. */
  function settleMedia(root = document) {
    root.querySelectorAll('.media-loading img').forEach((img) => {
      if (img.complete && img.naturalWidth > 0) img.closest('.media-loading').classList.remove('media-loading');
    });
  }

  /* ------------------------------------------------------------------
     Notificações (toasts)
     ------------------------------------------------------------------ */
  const TOAST_ICONS = { success: 'check-circle', error: 'x-circle', warning: 'alert', info: 'info' };
  const MAX_TOASTS = 4;

  function toast({ type = 'info', title, message = '', action = null, duration = 4200 } = {}) {
    const region = document.querySelector('[data-toast-region]');
    if (!region) return null;

    while (region.children.length >= MAX_TOASTS) region.firstElementChild.remove();

    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `
      <span class="toast__icon">${icon(TOAST_ICONS[type] || 'info')}</span>
      <div class="toast__body">
        <p class="toast__title">${esc(title)}</p>
        ${message ? `<p class="toast__message">${esc(message)}</p>` : ''}
        ${action ? `<button type="button" class="btn btn--link toast__action">${esc(action.label)}</button>` : ''}
      </div>
      <button type="button" class="icon-btn toast__close" aria-label="Fechar notificação">${icon('close')}</button>
      <span class="toast__progress" style="animation-duration:${duration}ms"></span>`;

    let timer = null;
    let remaining = duration;
    let startedAt = Date.now();

    const dismiss = () => {
      if (el.classList.contains('is-leaving')) return;
      clearTimeout(timer);
      el.classList.add('is-leaving');
      el.addEventListener('animationend', () => {
        el.remove();
        document.body.classList.toggle('has-toasts', region.children.length > 0);
      }, { once: true });
    };

    const start = () => {
      startedAt = Date.now();
      timer = setTimeout(dismiss, remaining);
    };

    // pausa enquanto o usuário interage (heurística: controle do usuário)
    el.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      remaining -= Date.now() - startedAt;
    });
    el.addEventListener('mouseleave', start);
    el.addEventListener('focusin', () => clearTimeout(timer));

    el.querySelector('.toast__close').addEventListener('click', dismiss);
    if (action) {
      el.querySelector('.toast__action').addEventListener('click', () => {
        action.onClick();
        dismiss();
      });
    }

    region.appendChild(el);
    document.body.classList.add('has-toasts');
    start();
    return { dismiss };
  }

  /* ------------------------------------------------------------------
     Diálogos (usam <dialog> nativo: foco preso e ESC automáticos)
     ------------------------------------------------------------------ */
  const returnFocus = new WeakMap();

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    returnFocus.set(dialog, document.activeElement);
    dialog.classList.remove('is-closing');
    dialog.showModal();
    document.body.classList.add('is-locked');
  }

  function closeDialog(dialog, { immediate = false } = {}) {
    if (!dialog || !dialog.open) return Promise.resolve();
    return new Promise((resolve) => {
      const finish = () => {
        dialog.classList.remove('is-closing');
        if (dialog.open) dialog.close();
        if (!document.querySelector('dialog[open]')) document.body.classList.remove('is-locked');
        const previous = returnFocus.get(dialog);
        if (previous && document.contains(previous) && typeof previous.focus === 'function') {
          previous.focus({ preventScroll: true });
        }
        dialog.dispatchEvent(new CustomEvent('mk:closed'));
        resolve();
      };
      if (immediate || MK.utils.prefersReducedMotion()) {
        finish();
        return;
      }
      dialog.classList.add('is-closing');
      setTimeout(finish, 210);
    });
  }

  /** Configura comportamento padrão de todos os diálogos da página. */
  function setupDialogs() {
    document.querySelectorAll('dialog').forEach((dialog) => {
      // ESC: fecha com animação
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeDialog(dialog);
      });
      // clique no fundo escurecido (backdrop) fecha o diálogo
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    });
  }

  /** Confirmação acessível que retorna Promise<boolean> (prevenção de erros). */
  function confirm({ title = 'Tem certeza?', message = '', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'danger' } = {}) {
    const dialog = document.getElementById('confirm-dialog');
    if (!dialog) return Promise.resolve(window.confirm(message || title));

    dialog.querySelector('#confirm-title').textContent = title;
    dialog.querySelector('#confirm-message').textContent = message;
    const okBtn = dialog.querySelector('[data-confirm-ok]');
    const cancelBtn = dialog.querySelector('[data-confirm-cancel]');
    okBtn.textContent = confirmLabel;
    cancelBtn.textContent = cancelLabel;
    okBtn.className = `btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`;
    const iconBox = dialog.querySelector('[data-confirm-icon]');
    iconBox.className = `confirm__icon ${tone === 'danger' ? 'confirm__icon--danger' : ''}`;

    return new Promise((resolve) => {
      let result = false;
      const onOk = (event) => {
        event.preventDefault();
        result = true;
        closeDialog(dialog);
      };
      const onCancel = (event) => {
        event.preventDefault();
        closeDialog(dialog);
      };
      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      dialog.addEventListener('mk:closed', () => {
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      }, { once: true });
      openDialog(dialog);
      cancelBtn.focus();
    });
  }

  /* ------------------------------------------------------------------
     Animações de entrada ao rolar
     ------------------------------------------------------------------ */
  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 })
    : null;

  function reveal(root = document) {
    const items = root.querySelectorAll('[data-reveal]:not(.is-visible)');
    if (!revealObserver || MK.utils.prefersReducedMotion()) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    items.forEach((el) => revealObserver.observe(el));
  }

  /* ------------------------------------------------------------------
     Pequenos utilitários de interface
     ------------------------------------------------------------------ */
  function announce(message) {
    const region = document.querySelector('[data-announcer]');
    if (!region) return;
    region.textContent = '';
    // pequeno atraso garante que leitores de tela percebam a mudança
    setTimeout(() => { region.textContent = message; }, 60);
  }

  /** Atualiza um contador (badge) com animação de "pulo". */
  function setCount(selector, value) {
    document.querySelectorAll(selector).forEach((badge) => {
      const previous = Number(badge.textContent) || 0;
      badge.textContent = value > 99 ? '99+' : String(value);
      badge.hidden = value <= 0;
      if (value > previous) {
        badge.classList.remove('is-bumping');
        void badge.offsetWidth; // reinicia a animação
        badge.classList.add('is-bumping');
      }
    });
  }

  function setBusy(button, busy) {
    if (!button) return;
    button.setAttribute('aria-busy', busy ? 'true' : 'false');
    button.disabled = Boolean(busy);
  }

  /** Atualiza todos os botões de favorito de um produto exibidos na tela. */
  function syncFavoriteButtons(id, active, animate = false) {
    document.querySelectorAll(`[data-action="toggle-favorite"][data-id="${CSS.escape(id)}"]`).forEach((btn) => {
      const product = MK.products.byId(id);
      const name = product ? product.name : 'produto';
      btn.setAttribute('aria-pressed', String(active));
      btn.setAttribute('title', active ? 'Remover dos favoritos' : 'Favoritar');
      if (btn.dataset.label === 'text') {
        const text = btn.querySelector('[data-fav-text]');
        if (text) text.textContent = active ? 'Favoritado' : 'Favoritar';
        btn.setAttribute('aria-label', active ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`);
      } else {
        btn.setAttribute('aria-label', active ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`);
      }
      if (animate && active) {
        btn.classList.remove('is-popping');
        void btn.offsetWidth;
        btn.classList.add('is-popping');
      }
    });
  }

  MK.ui = {
    icon,
    stars,
    price,
    stockTag,
    badges,
    favButton,
    productCard,
    productRow,
    skeletonCards,
    emptyState,
    settleMedia,
    toast,
    openDialog,
    closeDialog,
    setupDialogs,
    confirm,
    reveal,
    announce,
    setCount,
    setBusy,
    syncFavoriteButtons,
  };
})(window.MK = window.MK || {});
