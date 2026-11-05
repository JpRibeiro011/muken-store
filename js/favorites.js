/* =====================================================================
   MUKEN STORE — favorites.js
   Lista de favoritos persistida no LocalStorage:
   - adicionar/remover (com "desfazer"), consultar e limpar
   - contador no cabeçalho e botões sincronizados em toda a página
   - sincronização entre abas
   - página "Favoritos" com ações em lote (adicionar todos ao carrinho)
   ===================================================================== */
(function (MK) {
  'use strict';

  const { $ } = MK.utils;
  const { icon } = MK.ui;

  let entries = []; // [{ id, addedAt }]

  function load() {
    const saved = MK.storage.read('favorites', []);
    entries = (Array.isArray(saved) ? saved : [])
      .map((item) => (typeof item === 'string' ? { id: item, addedAt: Date.now() } : item))
      .filter((item) => item && MK.products.byId(item.id));
  }

  function save() {
    MK.storage.write('favorites', entries);
  }

  function updateHeader() {
    const count = entries.length;
    MK.ui.setCount('[data-fav-count]', count);
    const link = $('[data-fav-link]');
    if (link) link.setAttribute('aria-label', `Favoritos (${MK.utils.pluralize(count, 'produto', 'produtos')})`);
  }

  function changed(id, active, animate) {
    save();
    updateHeader();
    if (id) MK.ui.syncFavoriteButtons(id, active, animate);
    MK.utils.emit('favorites:change', { id, active, count: entries.length });
  }

  const favorites = {
    list() {
      return entries.map((e) => e.id);
    },

    /** Produtos favoritados, do mais recente para o mais antigo. */
    products() {
      return entries
        .slice()
        .sort((a, b) => b.addedAt - a.addedAt)
        .map((e) => MK.products.byId(e.id))
        .filter(Boolean);
    },

    has(id) {
      return entries.some((e) => e.id === id);
    },

    count() {
      return entries.length;
    },

    add(id, { silent = false } = {}) {
      if (this.has(id) || !MK.products.byId(id)) return false;
      entries.push({ id, addedAt: Date.now() });
      changed(id, true, true);
      if (!silent) {
        MK.ui.toast({
          type: 'success',
          title: 'Adicionado aos favoritos',
          message: MK.products.byId(id).name,
          action: { label: 'Ver favoritos', onClick: () => MK.router.go('/favoritos') },
        });
      }
      return true;
    },

    remove(id, { silent = false } = {}) {
      const index = entries.findIndex((e) => e.id === id);
      if (index < 0) return false;
      const [removed] = entries.splice(index, 1);
      changed(id, false, false);
      if (!silent) {
        MK.ui.toast({
          type: 'info',
          title: 'Removido dos favoritos',
          message: MK.products.byId(id).name,
          action: {
            label: 'Desfazer',
            onClick: () => {
              if (favorites.has(id)) return;
              entries.splice(Math.min(index, entries.length), 0, removed);
              changed(id, true, true);
            },
          },
        });
      }
      return true;
    },

    toggle(id) {
      if (this.has(id)) {
        this.remove(id);
        return false;
      }
      this.add(id);
      return true;
    },

    clear() {
      const ids = this.list();
      entries = [];
      save();
      updateHeader();
      ids.forEach((id) => MK.ui.syncFavoriteButtons(id, false));
      MK.utils.emit('favorites:change', { count: 0 });
    },

    /** Recarrega do LocalStorage e sincroniza a interface (outra aba, dados apagados). */
    reload() {
      const before = new Set(this.list());
      load();
      const after = new Set(this.list());
      updateHeader();
      new Set([...before, ...after]).forEach((id) => MK.ui.syncFavoriteButtons(id, after.has(id)));
      MK.utils.emit('favorites:change', { count: entries.length, sync: true });
    },

    init() {
      load();
      updateHeader();
      MK.storage.subscribe('favorites', () => this.reload());
    },
  };

  /* ------------------------------------------------------------------
     Página de favoritos
     ------------------------------------------------------------------ */
  function pageHTML() {
    const list = favorites.products();
    const head = `
      <div class="page-head">
        <nav class="breadcrumb" aria-label="Você está em"><ol><li><a href="#/">Início</a></li><li><span aria-current="page">Favoritos</span></li></ol></nav>
        <h1 class="h1">Favoritos</h1>
        <p>${list.length ? `Você salvou ${MK.utils.pluralize(list.length, 'produto', 'produtos')}. Eles ficam guardados neste navegador.` : 'Salve produtos tocando no coração para encontrá-los depois.'}</p>
      </div>`;

    if (!list.length) {
      return `
        <section class="container page-body">
          ${head}
          ${MK.ui.emptyState({
            iconName: 'heart',
            title: 'Sua lista de favoritos está vazia',
            text: 'Toque no ícone de coração em qualquer produto para salvá-lo aqui. Sua lista continua disponível mesmo depois de fechar o navegador.',
            actions: `<a class="btn btn--primary" href="#/catalogo">${icon('grid')}Explorar catálogo</a><a class="btn btn--secondary" href="#/catalogo?new=1">${icon('sparkles')}Ver lançamentos</a>`,
          })}
        </section>`;
    }

    const available = list.filter((p) => MK.products.isAvailable(p)).length;
    return `
      <section class="container page-body">
        ${head}
        <div class="favorites-toolbar">
          <p class="muted small">${MK.utils.pluralize(available, 'disponível', 'disponíveis')} para compra</p>
          <div class="favorites-toolbar__actions">
            <button class="btn btn--secondary btn--sm" type="button" data-action="favorites-to-cart" ${available ? '' : 'disabled'}>${icon('bag')}Adicionar todos ao carrinho</button>
            <button class="btn btn--ghost btn--sm" type="button" data-action="favorites-clear">${icon('trash')}Limpar favoritos</button>
          </div>
        </div>
        <div class="product-grid" data-favorites-grid>${list.map((p, i) => MK.ui.productCard(p, { index: i })).join('')}</div>
      </section>`;
  }

  MK.views.favorites = {
    title: 'Favoritos',
    render: pageHTML,
    mount(root) {
      const off = MK.utils.on('favorites:change', () => {
        root.innerHTML = pageHTML();
        MK.ui.reveal(root);
        MK.ui.settleMedia(root);
      });
      return () => off();
    },
  };

  /* ------------------------------------------------------------------
     Ações globais
     ------------------------------------------------------------------ */
  Object.assign(MK.actions, {
    'toggle-favorite': (button) => favorites.toggle(button.dataset.id),

    'favorites-to-cart': () => {
      let added = 0;
      const skipped = [];
      favorites.products().forEach((product) => {
        const free = MK.products.stock(product) - MK.cart.quantityOf(product.id);
        if (free <= 0) {
          skipped.push(product.name);
          return;
        }
        const result = MK.cart.add(product.id, 1, { silent: true });
        if (result.ok) added += result.added;
      });
      MK.ui.toast(added
        ? {
          type: skipped.length ? 'warning' : 'success',
          title: `${MK.utils.pluralize(added, 'produto adicionado', 'produtos adicionados')} ao carrinho`,
          message: skipped.length ? `Sem estoque disponível: ${skipped.join(', ')}.` : 'Todos os favoritos disponíveis foram para o carrinho.',
          action: { label: 'Ver carrinho', onClick: () => MK.cart.openDrawer() },
        }
        : { type: 'warning', title: 'Nada foi adicionado', message: 'Os favoritos estão esgotados ou já estão no carrinho no limite do estoque.' });
    },

    'favorites-clear': async () => {
      const ok = await MK.ui.confirm({
        title: 'Limpar favoritos?',
        message: `${MK.utils.pluralize(favorites.count(), 'produto será removido', 'produtos serão removidos')} da sua lista.`,
        confirmLabel: 'Limpar lista',
      });
      if (ok) {
        favorites.clear();
        MK.ui.toast({ type: 'info', title: 'Favoritos limpos', message: 'Sua lista foi esvaziada.' });
      }
    },

    /* Carrinho → favoritos ("salvar para depois") */
    'cart-save-later': (button) => {
      const id = button.dataset.id;
      favorites.add(id, { silent: true });
      MK.cart.remove(id, { silent: true });
      MK.ui.toast({
        type: 'success',
        title: 'Movido para favoritos',
        message: `${MK.products.byId(id).name} foi salvo para depois.`,
        action: { label: 'Ver favoritos', onClick: () => MK.router.go('/favoritos') },
      });
    },
  });

  MK.favorites = favorites;
})(window.MK = window.MK || {});
