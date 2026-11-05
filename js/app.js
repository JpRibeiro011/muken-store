/* =====================================================================
   MUKEN STORE — app.js
   Ponto de entrada da aplicação:
   - tema claro/escuro (persistido no LocalStorage; escuro é o padrão)
   - roteador SPA baseado em hash (#/rota), ideal para GitHub Pages,
     pois não exige configuração de servidor
   - comportamento do cabeçalho, menu, pesquisa móvel e atalhos
   - delegação global de ações (data-action) para todos os módulos
   ===================================================================== */
(function (MK) {
  'use strict';

  const { $, $$ } = MK.utils;
  MK.actions = MK.actions || {};
  MK.views = MK.views || {};

  /* ==================================================================
     TEMA
     ================================================================== */
  const theme = {
    get() {
      return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    },
    set(value) {
      const next = value === 'light' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      MK.storage.write('theme', next);
      syncThemeUI();
      MK.ui.announce(next === 'light' ? 'Tema claro ativado' : 'Tema escuro ativado');
    },
    toggle() {
      this.set(this.get() === 'dark' ? 'light' : 'dark');
    },
  };

  function syncThemeUI() {
    const isDark = theme.get() === 'dark';
    const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';
    $$('.theme-toggle').forEach((btn) => btn.setAttribute('aria-label', label));
    $$('[data-theme-label]').forEach((el) => { el.textContent = label; });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#080A12' : '#F4F7FB');
  }

  /* ==================================================================
     ROTEADOR
     ================================================================== */
  const routes = [
    { pattern: /^\/$/, view: 'home' },
    { pattern: /^\/catalogo$/, view: 'catalog' },
    { pattern: /^\/produto\/([^/]+)$/, view: 'product', keys: ['id'] },
    { pattern: /^\/carrinho$/, view: 'cart' },
    { pattern: /^\/checkout$/, view: 'checkout' },
    { pattern: /^\/pedido\/([^/]+)$/, view: 'orderSuccess', keys: ['id'] },
    { pattern: /^\/pedidos$/, view: 'orders' },
    { pattern: /^\/favoritos$/, view: 'favorites' },
    { pattern: /^\/sobre$/, view: 'about' },
    { pattern: /^\/contato$/, view: 'contact' },
    { pattern: /^\/privacidade$/, view: 'privacy' },
  ];

  /** Converte "#/produto/MK-1?x=1" em { path: "/produto/MK-1", query }. */
  function parseLocation() {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const [pathPart, queryPart = ''] = raw.split('?');
    let path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
    path = path.replace(/\/+$/, '') || '/';
    return { path, query: new URLSearchParams(queryPart) };
  }

  function matchRoute(path) {
    for (const route of routes) {
      const match = path.match(route.pattern);
      if (match) {
        const params = {};
        (route.keys || []).forEach((key, index) => {
          try {
            params[key] = decodeURIComponent(match[index + 1]);
          } catch (error) {
            params[key] = match[index + 1];
          }
        });
        return { view: route.view, params };
      }
    }
    return { view: 'notFound', params: {} };
  }

  /** Chave do item de menu ativo para a rota atual. */
  function navKey(path, query) {
    if (path === '/') return 'home';
    if (path === '/catalogo') {
      if (query.get('new') === '1') return 'lancamentos';
      if (query.get('promo') === '1') return 'ofertas';
      return 'catalogo';
    }
    return path.split('/')[1];
  }

  function updateActiveNav(path = parseLocation().path, query = parseLocation().query) {
    const key = navKey(path, query);
    $$('[data-nav]').forEach((link) => {
      const active = link.dataset.nav === key;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  let cleanup = null;
  let navToken = 0;
  let isFirstRender = true;

  function errorView() {
    return `
      <section class="container page-body">
        <div class="page-head"><h1 class="h1">Algo saiu do previsto</h1></div>
        ${MK.ui.emptyState({
          iconName: 'alert',
          title: 'Não foi possível carregar esta página',
          text: 'Tente recarregar. Se o problema continuar, volte para a página inicial.',
          actions: '<button class="btn btn--primary" type="button" onclick="location.reload()">Recarregar</button><a class="btn btn--secondary" href="#/">Ir para o início</a>',
        })}
      </section>`;
  }

  async function render() {
    const token = ++navToken;
    const { path, query } = parseLocation();
    const match = matchRoute(path);
    const viewName = MK.views[match.view] ? match.view : 'notFound';
    const view = MK.views[viewName] || { title: 'MUKEN STORE', render: errorView };
    const ctx = { path, query, params: match.params, view: viewName };

    closeTransientUI();
    if (typeof cleanup === 'function') {
      try { cleanup(); } catch (error) { console.error(error); }
    }
    cleanup = null;

    let html;
    try {
      html = await view.render(ctx);
    } catch (error) {
      console.error('[MUKEN] Falha ao renderizar a página.', error);
      html = errorView();
    }
    if (token !== navToken) return; // outra navegação começou nesse meio-tempo

    const app = $('#app');
    app.innerHTML = `<div class="view" data-view="${viewName}">${html}</div>`;
    const root = app.firstElementChild;

    try {
      cleanup = typeof view.mount === 'function' ? view.mount(root, ctx) : null;
    } catch (error) {
      console.error('[MUKEN] Falha ao iniciar a página.', error);
    }

    const title = typeof view.title === 'function' ? view.title(ctx) : view.title;
    document.title = title && !title.includes('MUKEN') ? `${title} | MUKEN STORE` : (title || 'MUKEN STORE');
    updateActiveNav(path, query);
    window.scrollTo(0, 0);
    MK.ui.reveal(root);
    MK.ui.settleMedia(root);

    // Acessibilidade: em navegações (não no primeiro carregamento), leva o
    // foco ao título da nova página e anuncia a troca para leitores de tela.
    if (!isFirstRender) {
      const heading = root.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      MK.ui.announce(`Página: ${document.title}`);
    }
    isFirstRender = false;
    MK.utils.emit('route:change', ctx);
  }

  const router = {
    /** Navega para uma rota (ex.: "/catalogo?cat=moda"). */
    go(path) {
      if (window.location.hash === `#${path}`) render();
      else window.location.hash = path;
    },
    /** Atualiza a URL sem recarregar a página (usado pelos filtros). */
    replace(path) {
      window.history.replaceState(null, '', `#${path}`);
      const { path: p, query } = parseLocation();
      updateActiveNav(p, query);
    },
    current: parseLocation,
    refresh: render,
  };

  /* ==================================================================
     CABEÇALHO E ELEMENTOS GLOBAIS
     ================================================================== */
  function closeTransientUI() {
    closeDropdown();
    const header = $('[data-header]');
    if (header && header.classList.contains('is-search-open')) toggleMobileSearch(false);
    $$('dialog[open]').forEach((dialog) => {
      if (dialog.id !== 'confirm-dialog') MK.ui.closeDialog(dialog, { immediate: true });
    });
  }

  function setupScrollEffects() {
    const header = $('[data-header]');
    const backToTop = $('.back-to-top');
    backToTop.hidden = false;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      const show = y > 700;
      backToTop.classList.toggle('is-visible', show);
      backToTop.tabIndex = show ? 0 : -1;
      backToTop.setAttribute('aria-hidden', String(!show));
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  // Menu suspenso "Categorias"
  function closeDropdown() {
    const trigger = $('[data-dropdown-trigger]');
    const menu = $('[data-dropdown]');
    if (!trigger || !menu) return;
    trigger.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
  }

  function setupDropdown() {
    const trigger = $('[data-dropdown-trigger]');
    const menu = $('[data-dropdown]');
    if (!trigger || !menu) return;
    const items = () => $$('a', menu);

    const open = (focusFirst) => {
      trigger.setAttribute('aria-expanded', 'true');
      menu.hidden = false;
      if (focusFirst) items()[0].focus();
    };

    trigger.addEventListener('click', () => {
      if (trigger.getAttribute('aria-expanded') === 'true') closeDropdown();
      else open(false);
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        open(true);
      }
    });

    menu.addEventListener('keydown', (event) => {
      const list = items();
      const index = list.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        closeDropdown();
        trigger.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        list[(index + 1) % list.length].focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        list[(index - 1 + list.length) % list.length].focus();
      }
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeDropdown();
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.main-nav__item--dropdown')) closeDropdown();
    });

    trigger.parentElement.addEventListener('focusout', (event) => {
      if (!trigger.parentElement.contains(event.relatedTarget)) closeDropdown();
    });
  }

  // Pesquisa em telas pequenas (abre uma barra abaixo do cabeçalho)
  function toggleMobileSearch(force) {
    const header = $('[data-header]');
    const button = $('.search-toggle');
    const open = typeof force === 'boolean' ? force : !header.classList.contains('is-search-open');
    header.classList.toggle('is-search-open', open);
    if (button) {
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Fechar pesquisa' : 'Abrir pesquisa');
    }
    if (open) $('#header-search-input').focus();
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      const target = event.target;
      const typing = target.closest('input, textarea, select, [contenteditable="true"]');
      if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        const input = $('#header-search-input');
        if (input.offsetParent === null) toggleMobileSearch(true);
        else input.focus();
      }
    });
  }

  function setupSkipLink() {
    const link = $('[data-skip-link]');
    if (!link) return;
    link.addEventListener('click', (event) => {
      event.preventDefault(); // não altera o hash (que é usado pelo roteador)
      const main = $('#app');
      main.focus({ preventScroll: true });
      main.scrollIntoView();
    });
  }

  function setupMenuDrawer() {
    const drawer = $('#menu-drawer');
    const button = $('[data-action="open-menu"]');
    drawer.addEventListener('click', (event) => {
      if (event.target.closest('a')) MK.ui.closeDialog(drawer, { immediate: true });
    });
    drawer.addEventListener('mk:closed', () => button.setAttribute('aria-expanded', 'false'));
  }

  function setupNewsletter() {
    const form = $('[data-newsletter-form]');
    if (!form) return;
    const input = form.elements.email;
    const error = $('#newsletter-error');

    const validate = () => {
      const ok = MK.utils.isEmail(input.value);
      input.setAttribute('aria-invalid', String(!ok));
      error.textContent = ok ? '' : 'Informe um e-mail válido, como nome@dominio.com.';
      return ok;
    };

    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validate();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validate()) {
        input.focus();
        return;
      }
      const email = input.value.trim().toLowerCase();
      const list = MK.storage.read('newsletter', []);
      if (list.some((item) => item.email === email)) {
        MK.ui.toast({ type: 'info', title: 'Você já faz parte da lista', message: `${email} já está inscrito na newsletter.` });
      } else {
        list.push({ email, subscribedAt: Date.now() });
        MK.storage.write('newsletter', list);
        MK.ui.toast({ type: 'success', title: 'Inscrição confirmada!', message: 'Você receberá os próximos drops em primeira mão (simulação).' });
      }
      form.reset();
      input.removeAttribute('aria-invalid');
    });
  }

  /* ==================================================================
     AÇÕES GLOBAIS (delegação de eventos)
     ================================================================== */
  Object.assign(MK.actions, {
    'toggle-theme': () => theme.toggle(),
    'open-menu': (button) => {
      button.setAttribute('aria-expanded', 'true');
      MK.ui.openDialog($('#menu-drawer'));
    },
    'close-dialog': (button) => MK.ui.closeDialog(button.closest('dialog')),
    'toggle-search': () => toggleMobileSearch(),
    'scroll-top': () => {
      window.scrollTo({ top: 0, behavior: MK.utils.prefersReducedMotion() ? 'auto' : 'smooth' });
      const brand = $('.site-header .brand');
      if (brand) brand.focus({ preventScroll: true });
    },
    social: (button) => {
      MK.ui.toast({
        type: 'info',
        title: `${button.dataset.network} da MUKEN`,
        message: 'Perfil fictício — a MUKEN é uma marca conceitual criada para um projeto acadêmico.',
      });
    },
    copy: async (button) => {
      const ok = await MK.utils.copyToClipboard(button.dataset.copy || '');
      MK.ui.toast(ok
        ? { type: 'success', title: 'Copiado!', message: button.dataset.copyLabel || 'Conteúdo copiado para a área de transferência.' }
        : { type: 'error', title: 'Não foi possível copiar', message: 'Selecione o texto e copie manualmente.' });
    },
  });

  function setupActionDelegation() {
    document.addEventListener('click', (event) => {
      const element = event.target.closest('[data-action]');
      if (!element || element.disabled || element.getAttribute('aria-disabled') === 'true') return;
      const handler = MK.actions[element.dataset.action];
      if (!handler) return;
      if (element.tagName === 'A') event.preventDefault();
      handler(element, event);
    });
  }

  /* ==================================================================
     INICIALIZAÇÃO
     ================================================================== */
  function init() {
    MK.ui.setupDialogs();
    syncThemeUI();
    setupActionDelegation();
    setupScrollEffects();
    setupDropdown();
    setupKeyboardShortcuts();
    setupSkipLink();
    setupMenuDrawer();
    setupNewsletter();
    $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

    // Outros módulos se inicializam aqui (contadores, sincronização etc.)
    ['favorites', 'cart', 'search'].forEach((name) => {
      if (MK[name] && typeof MK[name].init === 'function') MK[name].init();
    });

    // Tema alterado em outra aba
    MK.storage.subscribe('theme', (value) => {
      if (value === 'light' || value === 'dark') {
        document.documentElement.setAttribute('data-theme', value);
        syncThemeUI();
      }
    });

    window.addEventListener('hashchange', render);
    render();
  }

  MK.theme = theme;
  MK.router = router;
  MK.app = { updateActiveNav, toggleMobileSearch };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.MK = window.MK || {});
