/* =====================================================================
   MUKEN STORE — cart.js
   Carrinho de compras completo:
   - adicionar, remover (com "desfazer"), aumentar e diminuir quantidade
   - bloqueio de quantidades acima do estoque disponível
   - cálculo de subtotal, descontos (promoções + cupom), frete e total
   - cupons promocionais fictícios com regras (mínimo, %, valor, frete)
   - persistência no LocalStorage e sincronização entre abas
   - gaveta lateral (mini carrinho) e página completa do carrinho
   Também expõe MK.shipping (frete simulado por região do CEP).
   ===================================================================== */
(function (MK) {
  'use strict';

  const { escapeHTML: esc, formatPrice, roundMoney, $, $$ } = MK.utils;
  const { icon } = MK.ui;

  /* ==================================================================
     FRETE (simulado a partir do primeiro dígito do CEP)
     ================================================================== */
  const FREE_SHIPPING_FROM = 299;
  const SHIPPING_METHODS = {
    standard: { id: 'standard', label: 'Entrega padrão', price: 24.9 },
    express: { id: 'express', label: 'Entrega expressa', price: 39.9 },
  };
  const REGIONS = [
    { name: 'Grande São Paulo', standard: [2, 4], express: [1, 2] },
    { name: 'Interior e litoral de SP', standard: [3, 5], express: [1, 2] },
    { name: 'RJ e ES', standard: [4, 6], express: [2, 3] },
    { name: 'Minas Gerais', standard: [4, 6], express: [2, 3] },
    { name: 'BA e SE', standard: [6, 9], express: [3, 4] },
    { name: 'PE, AL, PB e RN', standard: [7, 10], express: [3, 5] },
    { name: 'CE, PI, MA e Região Norte', standard: [8, 12], express: [4, 6] },
    { name: 'Centro-Oeste, TO e RO', standard: [5, 8], express: [3, 4] },
    { name: 'PR e SC', standard: [4, 7], express: [2, 3] },
    { name: 'Rio Grande do Sul', standard: [5, 8], express: [2, 4] },
  ];

  const shipping = {
    FREE_SHIPPING_FROM,
    METHODS: SHIPPING_METHODS,

    maskCEP(value) {
      const d = MK.utils.onlyDigits(value).slice(0, 8);
      return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
    },

    region(cep) {
      const digit = Number(MK.utils.onlyDigits(cep).charAt(0));
      return REGIONS[Number.isFinite(digit) ? digit : 0] || REGIONS[0];
    },

    regionName(cep) {
      return this.region(cep).name;
    },

    eta(method, cep) {
      if (!cep) return method === 'express' ? '1 a 5 dias úteis' : '2 a 12 dias úteis';
      const [min, max] = this.region(cep)[method];
      return `${min} a ${max} dias úteis`;
    },

    /** Preço do frete conforme método, subtotal e cupom de frete grátis. */
    price(method, subtotal, freeByCoupon = false) {
      if (subtotal <= 0) return 0;
      if (method === 'express') return SHIPPING_METHODS.express.price;
      if (freeByCoupon || subtotal >= FREE_SHIPPING_FROM) return 0;
      return SHIPPING_METHODS.standard.price;
    },

    options(subtotal, cep, freeByCoupon = false) {
      return Object.values(SHIPPING_METHODS).map((m) => ({
        id: m.id,
        label: m.label,
        eta: this.eta(m.id, cep),
        price: this.price(m.id, subtotal, freeByCoupon),
      }));
    },

    /** Data estimada de entrega (pula fins de semana). */
    deliveryDate(method, cep, from = new Date()) {
      const [, max] = cep ? this.region(cep)[method] : [0, method === 'express' ? 5 : 12];
      const date = new Date(from);
      let added = 0;
      while (added < max) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) added += 1;
      }
      return date;
    },
  };

  /* ==================================================================
     CUPONS FICTÍCIOS
     ================================================================== */
  const COUPONS = {
    MUKEN10: { code: 'MUKEN10', type: 'percent', value: 10, min: 0, label: '10% de desconto em todo o carrinho' },
    INFINITO15: { code: 'INFINITO15', type: 'percent', value: 15, min: 500, label: '15% OFF em compras a partir de R$ 500' },
    BEYOND50: { code: 'BEYOND50', type: 'fixed', value: 50, min: 350, label: 'R$ 50 OFF em compras a partir de R$ 350' },
    FRETEZERO: { code: 'FRETEZERO', type: 'shipping', value: 0, min: 0, label: 'Frete padrão grátis em qualquer valor' },
  };

  function evaluateCoupon(code, subtotal) {
    if (!code) return null;
    const coupon = COUPONS[code];
    if (!coupon) return { code, valid: false, discount: 0, message: 'Cupom inválido ou expirado.' };
    if (subtotal < coupon.min) {
      return {
        ...coupon,
        valid: false,
        discount: 0,
        message: `Válido a partir de ${formatPrice(coupon.min)} em produtos. Faltam ${formatPrice(coupon.min - subtotal)}.`,
      };
    }
    let discount = 0;
    if (coupon.type === 'percent') discount = roundMoney(subtotal * (coupon.value / 100));
    if (coupon.type === 'fixed') discount = Math.min(coupon.value, subtotal);
    return { ...coupon, valid: true, discount, message: coupon.label };
  }

  /* ==================================================================
     ESTADO DO CARRINHO
     ================================================================== */
  let items = [];
  let couponCode = null;

  function persist() {
    MK.storage.write('cart', { items, updatedAt: Date.now() });
    if (couponCode) MK.storage.write('coupon', couponCode);
    else MK.storage.remove('coupon');
  }

  /** Lê o LocalStorage e saneia os dados (produtos removidos, estoque menor etc.). */
  function load() {
    const saved = MK.storage.read('cart', null);
    const list = saved && Array.isArray(saved.items) ? saved.items : [];
    const adjusted = [];
    items = [];
    list.forEach((item) => {
      const product = MK.products.byId(item && item.id);
      const qty = Math.floor(Number(item && item.qty));
      if (!product || !Number.isFinite(qty) || qty < 1) return;
      const stock = MK.products.stock(product);
      if (stock <= 0) {
        adjusted.push(`${product.name} esgotou e foi removido`);
        return;
      }
      if (qty > stock) adjusted.push(`${product.name}: quantidade ajustada para ${stock}`);
      items.push({ id: product.id, qty: Math.min(qty, stock), addedAt: Number(item.addedAt) || Date.now() });
    });
    const savedCoupon = MK.storage.read('coupon', null);
    couponCode = typeof savedCoupon === 'string' && COUPONS[savedCoupon] ? savedCoupon : null;
    if (adjusted.length) persist();
    return adjusted;
  }

  function changed(detail = {}) {
    persist();
    MK.utils.emit('cart:change', { count: cart.count(), ...detail });
  }

  const cart = {
    COUPONS,

    items() {
      return items.map((item) => ({ ...item }));
    },

    count() {
      return items.reduce((sum, item) => sum + item.qty, 0);
    },

    isEmpty() {
      return items.length === 0;
    },

    quantityOf(id) {
      const item = items.find((i) => i.id === id);
      return item ? item.qty : 0;
    },

    /**
     * Adiciona um produto respeitando o estoque.
     * Retorna { ok, added, reason } para quem chamou exibir feedback.
     */
    add(id, qty = 1, { silent = false } = {}) {
      const product = MK.products.byId(id);
      if (!product) return { ok: false, added: 0, reason: 'not-found' };
      const amount = Math.max(1, Math.floor(Number(qty)) || 1);
      const stock = MK.products.stock(product);
      const current = this.quantityOf(id);

      if (stock <= 0) {
        MK.ui.toast({ type: 'error', title: 'Produto esgotado', message: `${product.name} não está disponível no momento.` });
        return { ok: false, added: 0, reason: 'out-of-stock' };
      }
      if (current >= stock) {
        MK.ui.toast({ type: 'warning', title: 'Limite de estoque atingido', message: `Você já tem todas as ${stock} unidade(s) disponíveis de ${product.name} no carrinho.` });
        return { ok: false, added: 0, reason: 'stock-limit' };
      }

      const added = Math.min(amount, stock - current);
      const existing = items.find((i) => i.id === id);
      if (existing) existing.qty += added;
      else items.push({ id, qty: added, addedAt: Date.now() });
      changed({ action: 'add', id });

      if (added < amount) {
        MK.ui.toast({ type: 'warning', title: 'Quantidade ajustada ao estoque', message: `Só foi possível adicionar ${added} unidade(s) de ${product.name}.` });
      } else if (!silent) {
        MK.ui.toast({
          type: 'success',
          title: 'Adicionado ao carrinho',
          message: `${added}× ${product.name}`,
          action: { label: 'Ver carrinho', onClick: () => cart.openDrawer() },
        });
      }
      return { ok: true, added, reason: added < amount ? 'partial' : null };
    },

    /** Define a quantidade de um item (mínimo 1, máximo = estoque). */
    setQty(id, qty) {
      const item = items.find((i) => i.id === id);
      const product = MK.products.byId(id);
      if (!item || !product) return false;
      const stock = MK.products.stock(product);
      let value = Math.floor(Number(qty));
      if (!Number.isFinite(value) || value < 1) value = 1;
      if (value > stock) {
        value = stock;
        MK.ui.toast({ type: 'warning', title: 'Limite de estoque', message: `Há apenas ${stock} unidade(s) disponíveis de ${product.name}.` });
      }
      if (value === item.qty) {
        MK.utils.emit('cart:change', { count: this.count(), action: 'noop' });
        return false;
      }
      item.qty = value;
      changed({ action: 'qty', id });
      return true;
    },

    increment(id) {
      return this.setQty(id, this.quantityOf(id) + 1);
    },

    decrement(id) {
      const qty = this.quantityOf(id);
      if (qty <= 1) return false;
      return this.setQty(id, qty - 1);
    },

    /** Remove um item e oferece "desfazer" na notificação. */
    remove(id, { silent = false } = {}) {
      const index = items.findIndex((i) => i.id === id);
      if (index < 0) return null;
      const [removed] = items.splice(index, 1);
      changed({ action: 'remove', id });
      if (!silent) {
        const product = MK.products.byId(id);
        MK.ui.toast({
          type: 'info',
          title: 'Item removido',
          message: `${product ? product.name : 'Produto'} saiu do carrinho.`,
          action: { label: 'Desfazer', onClick: () => cart.restore(removed, index) },
          duration: 6000,
        });
      }
      return removed;
    },

    restore(item, index = items.length) {
      if (!item || items.some((i) => i.id === item.id)) return;
      const stock = MK.products.stock(item.id);
      if (stock <= 0) return;
      items.splice(Math.min(index, items.length), 0, { ...item, qty: Math.min(item.qty, stock) });
      changed({ action: 'restore', id: item.id });
      MK.ui.toast({ type: 'success', title: 'Item restaurado', message: 'O produto voltou para o carrinho.' });
    },

    clear({ keepCoupon = false } = {}) {
      items = [];
      if (!keepCoupon) couponCode = null;
      changed({ action: 'clear' });
    },

    /* ---------- Cupons ---------- */
    coupon() {
      return couponCode;
    },

    applyCoupon(rawCode) {
      const code = String(rawCode || '').trim().toUpperCase().replace(/\s+/g, '');
      if (!code) return { ok: false, message: 'Digite o código do cupom.' };
      if (!COUPONS[code]) return { ok: false, message: `O cupom “${code}” é inválido ou expirou.` };
      const evaluation = evaluateCoupon(code, this.totals().subtotal);
      couponCode = code;
      changed({ action: 'coupon' });
      return evaluation.valid
        ? { ok: true, message: `Cupom ${code} aplicado: ${evaluation.label}.` }
        : { ok: true, pending: true, message: `Cupom ${code} salvo. ${evaluation.message}` };
    },

    removeCoupon() {
      couponCode = null;
      changed({ action: 'coupon' });
    },

    /* ---------- Linhas e totais ---------- */
    lines() {
      const P = MK.products;
      return items
        .map((item) => {
          const product = P.byId(item.id);
          if (!product) return null;
          const unit = P.finalPrice(product);
          return {
            id: item.id,
            product,
            qty: item.qty,
            unit,
            unitOriginal: product.price,
            total: roundMoney(unit * item.qty),
            totalOriginal: roundMoney(product.price * item.qty),
            stock: P.stock(product),
          };
        })
        .filter(Boolean);
    },

    /**
     * Calcula todos os valores do pedido.
     * @param {object} options shippingMethod ('standard'|'express'), payment ('pix'|'card'|'boleto'), cep
     */
    totals({ shippingMethod = 'standard', payment = null } = {}) {
      const lines = this.lines();
      const itemsCount = lines.reduce((sum, l) => sum + l.qty, 0);
      const subtotalOriginal = roundMoney(lines.reduce((sum, l) => sum + l.totalOriginal, 0));
      const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.total, 0));
      const productDiscount = roundMoney(subtotalOriginal - subtotal);
      const coupon = evaluateCoupon(couponCode, subtotal);
      const couponDiscount = coupon && coupon.valid ? coupon.discount : 0;
      const freeByCoupon = Boolean(coupon && coupon.valid && coupon.type === 'shipping');
      const shippingPrice = shipping.price(shippingMethod, subtotal, freeByCoupon);
      const base = roundMoney(Math.max(0, subtotal - couponDiscount));
      const pixDiscount = payment === 'pix' ? roundMoney(base * 0.05) : 0;
      const total = roundMoney(base + shippingPrice - pixDiscount);
      return {
        itemsCount,
        subtotalOriginal,
        productDiscount,
        subtotal,
        coupon,
        couponDiscount,
        freeByCoupon,
        shippingMethod,
        shipping: shippingPrice,
        remainingForFree: Math.max(0, roundMoney(FREE_SHIPPING_FROM - subtotal)),
        pixDiscount,
        totalDiscount: roundMoney(productDiscount + couponDiscount + pixDiscount),
        total,
      };
    },

    /* ---------- Interface ---------- */
    openDrawer() {
      renderDrawer();
      MK.ui.openDialog(document.getElementById('cart-drawer'));
    },

    /** Recarrega o estado a partir do LocalStorage (ex.: dados apagados). */
    reload() {
      load();
      MK.utils.emit('cart:change', { count: cart.count(), action: 'sync' });
    },

    init() {
      const adjusted = load();
      updateHeader(false);
      MK.utils.on('cart:change', () => {
        updateHeader(true);
        const drawer = document.getElementById('cart-drawer');
        if (drawer && drawer.open) renderDrawer();
      });
      MK.utils.on('inventory:change', () => {
        load();
        updateHeader(false);
      });
      // Outra aba alterou o carrinho/cupom: recarrega e atualiza a tela
      const resync = () => {
        load();
        MK.utils.emit('cart:change', { count: cart.count(), action: 'sync' });
      };
      MK.storage.subscribe('cart', resync);
      MK.storage.subscribe('coupon', resync);
      if (adjusted.length) {
        setTimeout(() => MK.ui.toast({ type: 'warning', title: 'Seu carrinho foi atualizado', message: adjusted.join('; ') + '.' }), 600);
      }
    },
  };

  /* ==================================================================
     TEMPLATES
     ================================================================== */
  function freeShippingProgress(totals) {
    if (totals.freeByCoupon) {
      return `<div class="progress progress--done">${icon('check-circle', 'icon--sm')}<span>Frete padrão <strong>grátis</strong> com o cupom FRETEZERO.</span></div>`;
    }
    const pct = Math.min(100, Math.round((totals.subtotal / FREE_SHIPPING_FROM) * 100));
    const text = totals.remainingForFree > 0
      ? `Faltam <strong>${formatPrice(totals.remainingForFree)}</strong> para ganhar <strong>frete grátis</strong>.`
      : `${icon('check-circle', 'icon--sm')} Você ganhou <strong>frete grátis</strong> na entrega padrão!`;
    return `
      <div class="progress ${totals.remainingForFree > 0 ? '' : 'progress--done'}">
        <span>${text}</span>
        <div class="progress__bar" role="progressbar" aria-label="Progresso para frete grátis" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="progress__fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }

  function lineHTML(line, variant = 'page') {
    const { product, qty, stock } = line;
    const P = MK.products;
    const promo = P.hasPromo(product);
    const atMax = qty >= stock;
    const url = `#/produto/${encodeURIComponent(product.id)}`;
    const qtyId = `cart-qty-${variant}-${product.id}`;
    return `
      <li class="cart-line cart-line--${variant}" data-line="${esc(product.id)}">
        <a class="cart-line__media" href="${url}" tabindex="-1" aria-hidden="true">
          <img src="${esc(product.image)}" alt="" width="800" height="800" loading="lazy">
        </a>
        <div class="cart-line__info">
          <p class="cart-line__cat">${esc(P.categoryName(product.category))}</p>
          <h3 class="cart-line__name"><a href="${url}">${esc(product.name)}</a></h3>
          <p class="cart-line__unit">
            ${formatPrice(line.unit)} <span class="muted">/ un.</span>
            ${promo ? `<s class="cart-line__old"><span class="sr-only">Preço original</span>${formatPrice(line.unitOriginal)}</s>` : ''}
          </p>
          ${atMax ? `<p class="cart-line__warn">${icon('alert', 'icon--xs')}Máximo disponível em estoque (${stock}).</p>` : ''}
        </div>
        <div class="cart-line__qty">
          <div class="qty qty--sm">
            <button class="qty__btn" type="button" data-action="cart-dec" data-id="${esc(product.id)}" aria-label="Diminuir quantidade de ${esc(product.name)}" ${qty <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
            <label class="sr-only" for="${qtyId}">Quantidade de ${esc(product.name)}</label>
            <input class="qty__input" id="${qtyId}" type="number" inputmode="numeric" min="1" max="${stock}" value="${qty}" data-cart-qty="${esc(product.id)}">
            <button class="qty__btn" type="button" data-action="cart-inc" data-id="${esc(product.id)}" aria-label="Aumentar quantidade de ${esc(product.name)}" ${atMax ? 'disabled' : ''}>${icon('plus')}</button>
          </div>
        </div>
        <div class="cart-line__total">
          <span class="sr-only">Total do item:</span>
          <strong>${formatPrice(line.total)}</strong>
          ${promo ? `<span class="cart-line__saving">economia de ${formatPrice(line.totalOriginal - line.total)}</span>` : ''}
        </div>
        <button class="icon-btn icon-btn--sm cart-line__remove" type="button" data-action="cart-remove" data-id="${esc(product.id)}" aria-label="Remover ${esc(product.name)} do carrinho" title="Remover">${icon('trash')}</button>
        ${variant === 'page' && MK.favorites ? `<button class="btn btn--link cart-line__later" type="button" data-action="cart-save-later" data-id="${esc(product.id)}">${icon('heart', 'icon--xs')}Mover para favoritos</button>` : ''}
      </li>`;
  }

  function summaryRows(totals, { showShippingLabel = true } = {}) {
    const rows = [
      `<div class="summary__row"><dt>Subtotal (${MK.utils.pluralize(totals.itemsCount, 'item', 'itens')})</dt><dd>${formatPrice(totals.subtotalOriginal)}</dd></div>`,
    ];
    if (totals.productDiscount > 0) {
      rows.push(`<div class="summary__row summary__row--discount"><dt>Descontos em produtos</dt><dd>− ${formatPrice(totals.productDiscount)}</dd></div>`);
    }
    if (totals.coupon) {
      rows.push(totals.coupon.valid && totals.coupon.type !== 'shipping'
        ? `<div class="summary__row summary__row--discount"><dt>Cupom ${esc(totals.coupon.code)}</dt><dd>− ${formatPrice(totals.couponDiscount)}</dd></div>`
        : totals.coupon.valid
          ? `<div class="summary__row summary__row--discount"><dt>Cupom ${esc(totals.coupon.code)}</dt><dd>Frete grátis</dd></div>`
          : `<div class="summary__row summary__row--muted"><dt>Cupom ${esc(totals.coupon.code)}</dt><dd>não aplicado</dd></div>`);
    }
    if (totals.pixDiscount > 0) {
      rows.push(`<div class="summary__row summary__row--discount"><dt>Desconto PIX (5%)</dt><dd>− ${formatPrice(totals.pixDiscount)}</dd></div>`);
    }
    const methodLabel = totals.shippingMethod === 'express' ? 'expresso' : 'padrão';
    rows.push(`<div class="summary__row"><dt>Frete${showShippingLabel ? ` (${methodLabel})` : ''}</dt><dd>${totals.shipping === 0 ? '<span class="text-success">Grátis</span>' : formatPrice(totals.shipping)}</dd></div>`);
    return rows.join('');
  }

  function summaryTotal(totals) {
    return `<div class="summary__total"><dt>Total</dt><dd data-cart-total>${formatPrice(totals.total)}</dd></div>`;
  }

  /** Texto auxiliar (fica FORA do <dl>, que só aceita pares dt/dd). */
  function summaryHint(totals) {
    const pix = roundMoney((totals.subtotal - totals.couponDiscount) * 0.95 + totals.shipping);
    const inst = MK.products.installments(totals.total);
    return `<p class="summary__hint">ou <strong>${formatPrice(pix)}</strong> no PIX · até ${inst.count}x de ${formatPrice(inst.value)} sem juros</p>`;
  }

  /* ---------- Gaveta (mini carrinho) ---------- */
  function renderDrawer() {
    const panel = $('[data-cart-drawer]');
    if (!panel) return;
    const lines = cart.lines();
    const totals = cart.totals();
    const header = `
      <div class="drawer__header">
        <h2 class="drawer__title" id="cart-drawer-title">${icon('bag')}Seu carrinho <small>${MK.utils.pluralize(totals.itemsCount, 'item', 'itens')}</small></h2>
        <button class="icon-btn" type="button" data-action="close-dialog" aria-label="Fechar carrinho">${icon('close')}</button>
      </div>`;

    if (!lines.length) {
      panel.innerHTML = `${header}
        <div class="drawer__body drawer__body--empty">
          ${MK.ui.emptyState({
            iconName: 'bag',
            title: 'Seu carrinho está vazio',
            text: 'Explore a coleção e adicione seus favoritos. Eles ficarão salvos aqui, mesmo se você fechar o navegador.',
            actions: '<a class="btn btn--primary" href="#/catalogo">Explorar produtos</a>',
            compact: true,
          })}
        </div>`;
      return;
    }

    panel.innerHTML = `${header}
      <div class="drawer__body">
        ${freeShippingProgress(totals)}
        <ul class="cart-lines cart-lines--drawer">${lines.map((l) => lineHTML(l, 'drawer')).join('')}</ul>
      </div>
      <div class="drawer__footer">
        <div class="summary-block">
          <dl class="summary summary--compact">${summaryRows(totals)}${summaryTotal(totals)}</dl>
          ${summaryHint(totals)}
        </div>
        <div class="drawer__actions">
          <a class="btn btn--secondary" href="#/carrinho">Ver carrinho</a>
          <a class="btn btn--primary" href="#/checkout">Finalizar compra ${icon('arrow-right', 'btn__arrow')}</a>
        </div>
      </div>`;
    MK.ui.settleMedia(panel);
  }

  function updateHeader(animate) {
    const count = cart.count();
    MK.ui.setCount('[data-cart-count]', count);
    const button = $('[data-cart-button]');
    if (button) button.setAttribute('aria-label', `Abrir carrinho (${MK.utils.pluralize(count, 'item', 'itens')})`);
    if (!animate) $$('[data-cart-count]').forEach((b) => b.classList.remove('is-bumping'));
  }

  /* ==================================================================
     PÁGINA DO CARRINHO
     ================================================================== */
  function couponBox(totals) {
    const applied = totals.coupon;
    const demo = Object.values(COUPONS).map((c) => `
      <button type="button" class="chip" data-fill-coupon="${c.code}" title="${esc(c.label)}">${icon('tag')}${c.code}</button>`).join('');
    return `
      <form class="coupon-form" data-coupon-form novalidate>
        <label class="field__label" for="coupon-input">Cupom de desconto</label>
        ${applied ? `
          <div class="coupon-applied ${applied.valid ? '' : 'is-pending'}">
            ${icon(applied.valid ? 'check-circle' : 'alert', 'icon--sm')}
            <div><strong>${esc(applied.code)}</strong><span>${esc(applied.message)}</span></div>
            <button class="btn btn--link" type="button" data-remove-coupon>Remover</button>
          </div>` : `
          <div class="input-group">
            <input class="input" id="coupon-input" name="coupon" placeholder="Ex.: MUKEN10" autocomplete="off" autocapitalize="characters" maxlength="20" aria-describedby="coupon-feedback">
            <button class="btn btn--secondary" type="submit">Aplicar</button>
          </div>`}
        <p class="field-error" id="coupon-feedback" aria-live="polite"></p>
        <div class="coupon-demo">
          <span class="small muted">Cupons para teste:</span>
          <div class="coupon-demo__list">${demo}</div>
        </div>
      </form>`;
  }

  function cartPageHTML() {
    const lines = cart.lines();
    if (!lines.length) {
      const suggestions = MK.products.featured(4).map((p, i) => MK.ui.productCard(p, { index: i })).join('');
      return `
        <section class="container page-body">
          <div class="page-head">
            <nav class="breadcrumb" aria-label="Você está em"><ol><li><a href="#/">Início</a></li><li><span aria-current="page">Carrinho</span></li></ol></nav>
            <h1 class="h1">Carrinho</h1>
          </div>
          ${MK.ui.emptyState({
            iconName: 'bag',
            title: 'Seu carrinho está vazio',
            text: 'Que tal começar pelos destaques da coleção? Os itens adicionados ficam salvos neste navegador.',
            actions: `<a class="btn btn--primary" href="#/catalogo">${icon('grid')}Explorar catálogo</a><a class="btn btn--secondary" href="#/catalogo?promo=1">${icon('tag')}Ver ofertas</a>`,
          })}
          <div class="section section--tight">
            <h2 class="h3" style="margin-bottom:1.25rem">Sugestões para você</h2>
            <div class="product-grid">${suggestions}</div>
          </div>
        </section>`;
    }

    const totals = cart.totals();
    return `
      <section class="container page-body cart-page">
        <div class="page-head">
          <nav class="breadcrumb" aria-label="Você está em"><ol><li><a href="#/">Início</a></li><li><span aria-current="page">Carrinho</span></li></ol></nav>
          <h1 class="h1">Carrinho</h1>
          <p>Você tem <strong data-cart-items>${MK.utils.pluralize(totals.itemsCount, 'item', 'itens')}</strong> no carrinho. Revise as quantidades antes de finalizar.</p>
        </div>
        <div class="cart-layout">
          <div class="cart-main">
            <div class="cart-main__head">
              <span>Produto</span><span>Quantidade</span><span>Total</span>
            </div>
            <ul class="cart-lines" data-cart-lines>${lines.map((l) => lineHTML(l, 'page')).join('')}</ul>
            <div class="cart-main__foot">
              <a class="btn btn--ghost" href="#/catalogo">${icon('arrow-left')}Continuar comprando</a>
              <button class="btn btn--ghost cart-clear" type="button" data-action="cart-clear">${icon('trash')}Esvaziar carrinho</button>
            </div>
          </div>
          <aside class="cart-summary card card--pad" aria-labelledby="summary-title">
            <h2 class="h3" id="summary-title">Resumo do pedido</h2>
            ${freeShippingProgress(totals)}
            <div class="summary-block">
              <dl class="summary">${summaryRows(totals)}${summaryTotal(totals)}</dl>
              ${summaryHint(totals)}
            </div>
            ${couponBox(totals)}
            <a class="btn btn--primary btn--lg btn--block" href="#/checkout">${icon('lock')}Finalizar compra</a>
            <p class="secure-note">${icon('shield', 'icon--sm')}Ambiente de demonstração: nenhum pagamento real é processado.</p>
          </aside>
        </div>
      </section>`;
  }

  MK.views.cart = {
    title: 'Carrinho',
    render: cartPageHTML,
    mount(root) {
      const rerender = () => {
        const scrollY = window.scrollY;
        const focusedId = document.activeElement && document.activeElement.id;
        root.innerHTML = cartPageHTML();
        MK.ui.reveal(root);
        MK.ui.settleMedia(root);
        if (focusedId) {
          const el = document.getElementById(focusedId);
          if (el) el.focus({ preventScroll: true });
        }
        window.scrollTo(0, scrollY);
      };

      const off = MK.utils.on('cart:change', rerender);

      root.addEventListener('submit', (event) => {
        const form = event.target.closest('[data-coupon-form]');
        if (!form) return;
        event.preventDefault();
        const input = form.elements.coupon;
        const result = cart.applyCoupon(input ? input.value : '');
        if (!result.ok) {
          const feedback = $('#coupon-feedback', root);
          feedback.textContent = result.message;
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          return;
        }
        MK.ui.toast({ type: result.pending ? 'warning' : 'success', title: result.pending ? 'Cupom aguardando valor mínimo' : 'Cupom aplicado!', message: result.message });
      });

      root.addEventListener('click', (event) => {
        const fill = event.target.closest('[data-fill-coupon]');
        if (fill) {
          if (cart.coupon()) cart.removeCoupon();
          const result = cart.applyCoupon(fill.dataset.fillCoupon);
          MK.ui.toast({ type: result.pending ? 'warning' : 'success', title: result.pending ? 'Cupom aguardando valor mínimo' : 'Cupom aplicado!', message: result.message });
          return;
        }
        if (event.target.closest('[data-remove-coupon]')) {
          const code = cart.coupon();
          cart.removeCoupon();
          MK.ui.toast({ type: 'info', title: 'Cupom removido', message: `${code} não está mais aplicado.` });
        }
      });

      root.addEventListener('input', (event) => {
        if (event.target.name === 'coupon') {
          event.target.removeAttribute('aria-invalid');
          const feedback = $('#coupon-feedback', root);
          if (feedback) feedback.textContent = '';
        }
      });

      return () => off();
    },
  };

  /* ==================================================================
     AÇÕES GLOBAIS (cards, gaveta e página)
     ================================================================== */
  Object.assign(MK.actions, {
    'add-to-cart': (button) => {
      const result = cart.add(button.dataset.id, 1);
      if (result.ok) {
        button.classList.remove('is-added');
        void button.offsetWidth;
        button.classList.add('is-added');
      }
    },
    'open-cart': () => cart.openDrawer(),
    'cart-inc': (button) => cart.increment(button.dataset.id),
    'cart-dec': (button) => cart.decrement(button.dataset.id),
    'cart-remove': (button) => cart.remove(button.dataset.id),
    'cart-clear': async () => {
      const ok = await MK.ui.confirm({
        title: 'Esvaziar carrinho?',
        message: `Todos os ${MK.utils.pluralize(cart.count(), 'item', 'itens')} serão removidos. Esta ação não pode ser desfeita.`,
        confirmLabel: 'Esvaziar',
      });
      if (ok) {
        cart.clear();
        MK.ui.toast({ type: 'info', title: 'Carrinho esvaziado', message: 'Todos os itens foram removidos.' });
      }
    },
  });

  // Edição direta da quantidade (campo numérico) na página e na gaveta
  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-cart-qty]');
    if (input) cart.setQty(input.dataset.cartQty, input.value);
  });

  MK.cart = cart;
  MK.shipping = shipping;
})(window.MK = window.MK || {});
