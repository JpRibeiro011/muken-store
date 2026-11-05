/* =====================================================================
   MUKEN STORE — orders.js
   Histórico de pedidos simulados:
   - criação do pedido com número fictício único (ex.: MK261105-7F3K)
   - "fotografia" dos itens e valores no momento da compra
   - status demonstrativo que evolui automaticamente com o tempo
     (recebido → pagamento aprovado → em separação → enviado → entregue)
   - página "Meus pedidos" com detalhes, linha do tempo e recompra
   Os dados ficam somente no LocalStorage deste navegador.
   ===================================================================== */
(function (MK) {
  'use strict';

  const { escapeHTML: esc, formatPrice, $ } = MK.utils;
  const { icon } = MK.ui;

  const PAYMENT_LABELS = { pix: 'PIX (simulado)', card: 'Cartão de crédito (simulado)', boleto: 'Boleto (demonstrativo)' };

  /** Minutos após a compra em que cada etapa é atingida (demonstração). */
  const TIMELINES = {
    card: { paid: 0, picking: 2, shipped: 10, delivered: 60 },
    pix: { paid: 1, picking: 3, shipped: 12, delivered: 60 },
    boleto: { paid: 3, picking: 5, shipped: 15, delivered: 60 },
  };

  const STEPS = [
    { code: 'received', label: 'Pedido recebido', icon: 'package' },
    { code: 'paid', label: 'Pagamento aprovado', icon: 'check-circle' },
    { code: 'picking', label: 'Em separação', icon: 'grid' },
    { code: 'shipped', label: 'Enviado', icon: 'truck' },
    { code: 'delivered', label: 'Entregue', icon: 'shield' },
  ];

  function read() {
    const list = MK.storage.read('orders', []);
    return Array.isArray(list) ? list.filter((o) => o && o.id && Array.isArray(o.items)) : [];
  }

  function generateId(existing) {
    const now = new Date();
    const date = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    let id;
    do {
      id = `MK${date}-${MK.utils.randomCode(4)}`;
    } while (existing.some((o) => o.id === id));
    return id;
  }

  const orders = {
    STEPS,
    PAYMENT_LABELS,

    list() {
      return read().sort((a, b) => b.createdAt - a.createdAt);
    },

    get(id) {
      return read().find((o) => o.id === id) || null;
    },

    count() {
      return read().length;
    },

    /** Registra um novo pedido e devolve o objeto salvo. */
    create(data) {
      const list = read();
      const order = { ...data, id: generateId(list), createdAt: Date.now(), version: 1 };
      list.push(order);
      MK.storage.write('orders', list);
      MK.utils.emit('orders:change', { id: order.id });
      return order;
    },

    clear() {
      MK.storage.remove('orders');
      MK.utils.emit('orders:change', {});
    },

    /**
     * Status demonstrativo calculado a partir do tempo decorrido.
     * Retorna a etapa atual e a linha do tempo completa.
     */
    status(order, now = Date.now()) {
      const plan = TIMELINES[order.payment.method] || TIMELINES.card;
      const minutes = (now - order.createdAt) / 60000;
      const reached = (code) => code === 'received' || minutes >= plan[code];
      let currentIndex = 0;
      STEPS.forEach((step, index) => { if (reached(step.code)) currentIndex = index; });
      const current = STEPS[currentIndex];
      let label = current.label;
      if (current.code === 'received') {
        label = order.payment.method === 'boleto' ? 'Aguardando pagamento' : order.payment.method === 'pix' ? 'Aguardando PIX' : 'Pedido recebido';
      }
      const tone = { received: 'warning', paid: 'info', picking: 'info', shipped: 'accent', delivered: 'success' }[current.code];
      const timeline = STEPS.map((step, index) => {
        const offset = step.code === 'received' ? 0 : plan[step.code];
        return { ...step, done: index <= currentIndex, current: index === currentIndex, at: order.createdAt + offset * 60000 };
      });
      return { code: current.code, label, tone, timeline, progress: currentIndex / (STEPS.length - 1) };
    },
  };

  /* ==================================================================
     TEMPLATES REUTILIZÁVEIS (também usados na tela de sucesso)
     ================================================================== */
  function timelineHTML(order) {
    const st = orders.status(order);
    return `
      <ol class="timeline" aria-label="Andamento do pedido">
        ${st.timeline.map((step) => `
          <li class="timeline__step ${step.done ? 'is-done' : ''} ${step.current ? 'is-current' : ''}">
            <span class="timeline__dot">${icon(step.done ? 'check' : step.icon, 'icon--xs')}</span>
            <span class="timeline__label">${esc(step.label)}</span>
            <span class="timeline__time">${step.done ? MK.utils.formatDateTime(step.at) : `previsto ${MK.utils.formatTime(step.at)}`}</span>
          </li>`).join('')}
      </ol>
      <p class="timeline__note">${icon('info', 'icon--xs')}Status demonstrativo: avança automaticamente com o passar do tempo para simular a entrega.</p>`;
  }

  function itemsHTML(order) {
    return `
      <ul class="order-items">
        ${order.items.map((item) => `
          <li class="order-item">
            <span class="order-item__media"><img src="${esc(item.image)}" alt="" width="800" height="800" loading="lazy"></span>
            <span class="order-item__info">
              <a class="order-item__name" href="#/produto/${encodeURIComponent(item.id)}">${esc(item.name)}</a>
              <span class="small muted">${item.qty} × ${formatPrice(item.unit)}</span>
            </span>
            <span class="order-item__total"><span class="sr-only">Quantidade ${item.qty}, total </span>${formatPrice(item.total)}</span>
          </li>`).join('')}
      </ul>`;
  }

  function totalsHTML(order) {
    const t = order.totals;
    const rows = [`<div class="summary__row"><dt>Subtotal (${MK.utils.pluralize(t.itemsCount, 'item', 'itens')})</dt><dd>${formatPrice(t.subtotalOriginal)}</dd></div>`];
    if (t.productDiscount > 0) rows.push(`<div class="summary__row summary__row--discount"><dt>Descontos em produtos</dt><dd>− ${formatPrice(t.productDiscount)}</dd></div>`);
    if (t.couponDiscount > 0) rows.push(`<div class="summary__row summary__row--discount"><dt>Cupom ${esc(order.coupon || '')}</dt><dd>− ${formatPrice(t.couponDiscount)}</dd></div>`);
    if (t.pixDiscount > 0) rows.push(`<div class="summary__row summary__row--discount"><dt>Desconto PIX (5%)</dt><dd>− ${formatPrice(t.pixDiscount)}</dd></div>`);
    rows.push(`<div class="summary__row"><dt>Frete (${esc(order.shipping.label.toLowerCase())})</dt><dd>${t.shipping === 0 ? '<span class="text-success">Grátis</span>' : formatPrice(t.shipping)}</dd></div>`);
    rows.push(`<div class="summary__total"><dt>Total</dt><dd>${formatPrice(t.total)}</dd></div>`);
    return `<dl class="summary">${rows.join('')}</dl>`;
  }

  function paymentLine(order) {
    const p = order.payment;
    if (p.method === 'card') return `${PAYMENT_LABELS.card} · ${p.installments}x de ${formatPrice(p.installmentValue)} · final ${esc(p.cardLast4)}`;
    if (p.method === 'boleto') return `${PAYMENT_LABELS.boleto} · vencimento ${MK.utils.formatShortDate(p.dueDate)}`;
    return PAYMENT_LABELS.pix;
  }

  function addressLine(order) {
    const a = order.address;
    return `${esc(a.street)}, ${esc(a.number)}${a.complement ? ` — ${esc(a.complement)}` : ''} · ${esc(a.city)}/${esc(a.state)} · CEP ${esc(a.cep)}`;
  }

  /* ==================================================================
     PÁGINA "MEUS PEDIDOS"
     ================================================================== */
  function orderCard(order, index) {
    const st = orders.status(order);
    const thumbs = order.items.slice(0, 4).map((item) => `<span class="order-card__thumb"><img src="${esc(item.image)}" alt="" width="800" height="800" loading="lazy"></span>`).join('');
    const more = order.items.length > 4 ? `<span class="order-card__thumb order-card__thumb--more">+${order.items.length - 4}</span>` : '';
    return `
      <article class="order-card card" data-order="${esc(order.id)}" data-reveal style="--i:${index % 6}">
        <header class="order-card__head">
          <div>
            <p class="order-card__label">Pedido</p>
            <h2 class="order-card__id">${esc(order.id)}</h2>
          </div>
          <div>
            <p class="order-card__label">Data</p>
            <p>${MK.utils.formatDateTime(order.createdAt)}</p>
          </div>
          <div>
            <p class="order-card__label">Total</p>
            <p class="order-card__total">${formatPrice(order.totals.total)}</p>
          </div>
          <span class="badge badge--${st.tone}" data-order-status>${esc(st.label)}</span>
        </header>
        <div class="order-card__body">
          <div class="order-card__thumbs" aria-hidden="true">${thumbs}${more}</div>
          <div class="order-card__summary">
            <p><strong>${MK.utils.pluralize(order.totals.itemsCount, 'item', 'itens')}</strong>: ${order.items.map((i) => `${esc(i.name)} (${i.qty}×)`).join(', ')}</p>
            <p class="small muted">${icon('card', 'icon--xs')} ${paymentLine(order)}</p>
          </div>
          <div class="order-card__progress" aria-hidden="true"><span style="width:${Math.round(st.progress * 100)}%"></span></div>
        </div>
        <details class="order-card__details">
          <summary>${icon('chevron-down', 'icon--sm')}<span>Ver detalhes do pedido</span></summary>
          <div class="order-card__grid">
            <section>
              <h3 class="order-card__subtitle">Produtos</h3>
              ${itemsHTML(order)}
            </section>
            <section>
              <h3 class="order-card__subtitle">Valores</h3>
              ${totalsHTML(order)}
              <h3 class="order-card__subtitle">Entrega</h3>
              <p class="small">${addressLine(order)}</p>
              <p class="small muted">${esc(order.shipping.label)} · previsão: ${MK.utils.formatDate(order.shipping.estimatedDate)}</p>
            </section>
            <section>
              <h3 class="order-card__subtitle">Acompanhamento</h3>
              <div data-order-timeline>${timelineHTML(order)}</div>
            </section>
          </div>
          <div class="order-card__actions">
            <a class="btn btn--secondary btn--sm" href="#/pedido/${encodeURIComponent(order.id)}">${icon('eye')}Comprovante</a>
            <button class="btn btn--primary btn--sm" type="button" data-action="order-rebuy" data-id="${esc(order.id)}">${icon('refresh')}Comprar novamente</button>
          </div>
        </details>
      </article>`;
  }

  function ordersPageHTML() {
    const list = orders.list();
    const head = `
      <div class="page-head">
        <nav class="breadcrumb" aria-label="Você está em"><ol><li><a href="#/">Início</a></li><li><span aria-current="page">Meus pedidos</span></li></ol></nav>
        <h1 class="h1">Meus pedidos</h1>
        <p>Histórico dos pedidos simulados neste navegador${list.length ? ` — ${MK.utils.pluralize(list.length, 'pedido', 'pedidos')} no total` : ''}.</p>
      </div>`;
    if (!list.length) {
      return `
        <section class="container page-body">
          ${head}
          ${MK.ui.emptyState({
            iconName: 'package',
            title: 'Você ainda não fez pedidos',
            text: 'Quando você finalizar uma compra simulada, ela aparecerá aqui com número, itens, valores, forma de pagamento e status de entrega.',
            actions: `<a class="btn btn--primary" href="#/catalogo">${icon('grid')}Explorar catálogo</a>`,
          })}
        </section>`;
    }
    const spent = list.reduce((sum, o) => sum + o.totals.total, 0);
    return `
      <section class="container page-body">
        ${head}
        <div class="orders-toolbar">
          <dl class="orders-stats">
            <div><dt>Pedidos</dt><dd>${list.length}</dd></div>
            <div><dt>Total em compras</dt><dd>${formatPrice(spent)}</dd></div>
          </dl>
          <button class="btn btn--ghost btn--sm" type="button" data-action="orders-clear">${icon('trash')}Limpar histórico</button>
        </div>
        <div class="orders-list">${list.map(orderCard).join('')}</div>
      </section>`;
  }

  MK.views.orders = {
    title: 'Meus pedidos',
    render: ordersPageHTML,
    mount(root) {
      // Atualiza os status demonstrativos periodicamente
      const timer = setInterval(() => {
        root.querySelectorAll('[data-order]').forEach((card) => {
          const order = orders.get(card.dataset.order);
          if (!order) return;
          const st = orders.status(order);
          const badge = $('[data-order-status]', card);
          badge.textContent = st.label;
          badge.className = `badge badge--${st.tone}`;
          $('.order-card__progress span', card).style.width = `${Math.round(st.progress * 100)}%`;
          $('[data-order-timeline]', card).innerHTML = timelineHTML(order);
        });
      }, 15000);
      const off = MK.utils.on('orders:change', () => {
        root.innerHTML = ordersPageHTML();
        MK.ui.reveal(root);
      });
      return () => {
        clearInterval(timer);
        off();
      };
    },
  };

  Object.assign(MK.actions, {
    'order-rebuy': (button) => {
      const order = orders.get(button.dataset.id);
      if (!order || !MK.cart) return;
      let added = 0;
      const skipped = [];
      order.items.forEach((item) => {
        const stock = MK.products.stock(item.id);
        const free = stock - MK.cart.quantityOf(item.id);
        if (free <= 0) {
          skipped.push(item.name);
          return;
        }
        const result = MK.cart.add(item.id, Math.min(item.qty, free), { silent: true });
        if (result.ok) added += result.added;
      });
      if (added) {
        MK.ui.toast({
          type: skipped.length ? 'warning' : 'success',
          title: `${MK.utils.pluralize(added, 'item adicionado', 'itens adicionados')} ao carrinho`,
          message: skipped.length ? `Sem estoque no momento: ${skipped.join(', ')}.` : 'Os produtos do pedido voltaram para o carrinho.',
          action: { label: 'Ver carrinho', onClick: () => MK.cart.openDrawer() },
        });
      } else {
        MK.ui.toast({ type: 'error', title: 'Não foi possível recomprar', message: 'Os produtos deste pedido estão sem estoque disponível.' });
      }
    },
    'orders-clear': async () => {
      const ok = await MK.ui.confirm({
        title: 'Limpar histórico de pedidos?',
        message: 'Todos os pedidos simulados deste navegador serão apagados. O estoque já vendido não é devolvido.',
        confirmLabel: 'Limpar histórico',
      });
      if (ok) {
        orders.clear();
        MK.ui.toast({ type: 'info', title: 'Histórico apagado', message: 'Seus pedidos simulados foram removidos.' });
      }
    },
  });

  MK.orders = orders;
  MK.ordersUI = { timelineHTML, itemsHTML, totalsHTML, paymentLine, addressLine };
})(window.MK = window.MK || {});
