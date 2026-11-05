/* =====================================================================
   MUKEN STORE — filters.js
   Pesquisa e filtros do catálogo.
   - Busca por nome/descrição/tags sem diferenciar acentos e maiúsculas
   - Filtros SIMULTÂNEOS: texto + categorias + faixa de preço + promoção
     + lançamentos + disponibilidade, combinados com a ordenação
   - Estado dos filtros refletido na URL (#/catalogo?cat=moda&promo=1),
     o que permite compartilhar links e usar o botão "voltar"
   - Sugestões em tempo real na busca do cabeçalho (combobox acessível)
   ===================================================================== */
(function (MK) {
  'use strict';

  const { escapeHTML: esc, normalize, formatPrice, debounce, $, $$ } = MK.utils;
  const { icon } = MK.ui;

  const SORTS = [
    { id: 'relevance', label: 'Mais relevantes' },
    { id: 'price-asc', label: 'Menor preço' },
    { id: 'price-desc', label: 'Maior preço' },
    { id: 'name-asc', label: 'Ordem alfabética (A–Z)' },
    { id: 'name-desc', label: 'Ordem alfabética (Z–A)' },
    { id: 'rating', label: 'Melhor avaliados' },
    { id: 'bestsellers', label: 'Mais vendidos' },
    { id: 'newest', label: 'Lançamentos recentes' },
  ];

  const PRICE_STEP = 10;
  const QUICK_RANGES = [
    { label: 'Até R$ 200', min: 0, max: 200 },
    { label: 'R$ 200 a R$ 500', min: 200, max: 500 },
    { label: 'R$ 500 a R$ 1.000', min: 500, max: 1000 },
    { label: 'Acima de R$ 1.000', min: 1000, max: null },
  ];

  /** Limites globais de preço (arredondados) com base no catálogo. */
  function priceBounds() {
    const prices = MK.products.all().map((p) => MK.products.finalPrice(p));
    return { min: 0, max: Math.ceil(Math.max(...prices) / 100) * 100 };
  }

  /* ------------------------------------------------------------------
     ESTADO <-> URL
     ------------------------------------------------------------------ */
  function defaultState() {
    const bounds = priceBounds();
    return { q: '', categories: [], min: bounds.min, max: bounds.max, promo: false, isNew: false, inStock: false, sort: 'relevance' };
  }

  function parseState(query) {
    const state = defaultState();
    const bounds = priceBounds();
    const validCats = MK.products.categories().map((c) => c.id);
    state.q = (query.get('q') || '').slice(0, 60);
    state.categories = (query.get('cat') || '').split(',').filter((c) => validCats.includes(c));
    const min = Number(query.get('min'));
    const max = Number(query.get('max'));
    if (query.has('min') && Number.isFinite(min)) state.min = MK.utils.clamp(min, bounds.min, bounds.max);
    if (query.has('max') && Number.isFinite(max)) state.max = MK.utils.clamp(max, bounds.min, bounds.max);
    if (state.min > state.max) [state.min, state.max] = [state.max, state.min];
    state.promo = query.get('promo') === '1';
    state.isNew = query.get('new') === '1';
    state.inStock = query.get('stock') === '1';
    const sort = query.get('sort');
    if (SORTS.some((s) => s.id === sort)) state.sort = sort;
    return state;
  }

  function toQuery(state) {
    const bounds = priceBounds();
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.categories.length) params.set('cat', state.categories.join(','));
    if (state.min > bounds.min) params.set('min', String(state.min));
    if (state.max < bounds.max) params.set('max', String(state.max));
    if (state.promo) params.set('promo', '1');
    if (state.isNew) params.set('new', '1');
    if (state.inStock) params.set('stock', '1');
    if (state.sort !== 'relevance') params.set('sort', state.sort);
    const qs = params.toString();
    return qs ? `/catalogo?${qs}` : '/catalogo';
  }

  /* ------------------------------------------------------------------
     MOTOR DE BUSCA
     ------------------------------------------------------------------ */
  const searchIndex = new Map();

  function indexOf(product) {
    if (!searchIndex.has(product.id)) {
      searchIndex.set(product.id, {
        name: normalize(product.name),
        meta: normalize(`${product.subtitle} ${MK.products.categoryName(product.category)} ${product.tags.join(' ')}`),
        text: normalize(`${product.shortDescription} ${product.description.join(' ')}`),
      });
    }
    return searchIndex.get(product.id);
  }

  /** Pontuação de relevância (0 = não corresponde). Todos os termos precisam aparecer. */
  function score(product, terms) {
    if (!terms.length) return 1;
    const idx = indexOf(product);
    let total = 0;
    for (const term of terms) {
      let s = 0;
      if (idx.name.startsWith(term)) s += 12;
      else if (idx.name.split(/\s+/).some((word) => word.startsWith(term))) s += 9;
      else if (idx.name.includes(term)) s += 6;
      if (idx.meta.includes(term)) s += 4;
      if (idx.text.includes(term)) s += 1;
      if (s === 0) return 0;
      total += s;
    }
    return total;
  }

  function terms(query) {
    return normalize(query).split(/\s+/).filter(Boolean);
  }

  function search(query, list = MK.products.all()) {
    const t = terms(query);
    return list
      .map((product) => ({ product, score: score(product, t) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.product.sold - a.product.sold)
      .map((r) => r.product);
  }

  /** Aplica TODOS os filtros ao mesmo tempo e depois ordena. */
  function apply(state, list = MK.products.all()) {
    const P = MK.products;
    const t = terms(state.q);
    const scored = [];

    for (const product of list) {
      const s = score(product, t);
      if (s === 0) continue;
      if (state.categories.length && !state.categories.includes(product.category)) continue;
      const price = P.finalPrice(product);
      if (price < state.min || price > state.max) continue;
      if (state.promo && !P.hasPromo(product)) continue;
      if (state.isNew && !product.isNew) continue;
      if (state.inStock && !P.isAvailable(product)) continue;
      scored.push({ product, score: s });
    }

    const byName = (a, b) => a.product.name.localeCompare(b.product.name, 'pt-BR');
    const sorters = {
      relevance: (a, b) => b.score - a.score || Number(b.product.featured) - Number(a.product.featured) || b.product.sold - a.product.sold,
      'price-asc': (a, b) => P.finalPrice(a.product) - P.finalPrice(b.product) || byName(a, b),
      'price-desc': (a, b) => P.finalPrice(b.product) - P.finalPrice(a.product) || byName(a, b),
      'name-asc': byName,
      'name-desc': (a, b) => byName(b, a),
      rating: (a, b) => b.product.rating - a.product.rating || b.product.reviewsCount - a.product.reviewsCount,
      bestsellers: (a, b) => b.product.sold - a.product.sold,
      newest: (a, b) => b.product.releaseDate.localeCompare(a.product.releaseDate),
    };
    scored.sort(sorters[state.sort] || sorters.relevance);
    return scored.map((r) => r.product);
  }

  function activeFilterCount(state) {
    const bounds = priceBounds();
    return (state.q ? 1 : 0) + state.categories.length
      + (state.min > bounds.min || state.max < bounds.max ? 1 : 0)
      + (state.promo ? 1 : 0) + (state.isNew ? 1 : 0) + (state.inStock ? 1 : 0);
  }

  /* ------------------------------------------------------------------
     VIEW: Catálogo
     ------------------------------------------------------------------ */
  function headingFor(state) {
    if (state.q) return { title: `Resultados para “${esc(state.q)}”`, text: 'Refine a busca com os filtros ao lado.' };
    if (state.categories.length === 1 && !state.promo && !state.isNew) {
      const c = MK.products.category(state.categories[0]);
      return { title: esc(c.name), text: esc(c.description) };
    }
    if (state.promo && !state.isNew) return { title: 'Ofertas', text: 'Preços especiais por tempo limitado em produtos selecionados.' };
    if (state.isNew && !state.promo) return { title: 'Lançamentos', text: 'As novidades mais recentes da coleção Infinite Series.' };
    return { title: 'Todos os produtos', text: 'Tecnologia, moda, acessórios e lifestyle com a assinatura MUKEN.' };
  }

  function filtersPanel(state) {
    const P = MK.products;
    const bounds = priceBounds();
    const cats = P.categories().map((c) => `
      <label class="check">
        <input type="checkbox" name="cat" value="${c.id}" ${state.categories.includes(c.id) ? 'checked' : ''}>
        <span class="check__box">${icon('check')}</span>
        <span>${esc(c.name)}</span>
        <span class="check__count" aria-label="${P.countByCategory(c.id)} produtos">${P.countByCategory(c.id)}</span>
      </label>`).join('');

    const quick = QUICK_RANGES.map((r, i) => `
      <button type="button" class="chip" data-quick-range="${i}">${esc(r.label)}</button>`).join('');

    return `
      <aside class="filters" id="catalog-filters" aria-labelledby="filters-title" data-filters>
        <div class="filters__head">
          <h2 class="filters__title" id="filters-title">${icon('sliders')}Filtros</h2>
          <button class="icon-btn filters__close" type="button" data-close-filters aria-label="Fechar filtros">${icon('close')}</button>
        </div>
        <form class="filters__form" data-filters-form novalidate>
          <div class="filter-group">
            <label class="filter-group__label" for="filter-q">Pesquisar</label>
            <div class="filter-search">
              ${icon('search')}
              <input class="input" id="filter-q" type="search" name="q" value="${esc(state.q)}" placeholder="Nome, tipo ou característica" maxlength="60" autocomplete="off">
            </div>
          </div>

          <fieldset class="filter-group">
            <legend class="filter-group__label">Categoria</legend>
            <div class="filter-group__options">${cats}</div>
          </fieldset>

          <fieldset class="filter-group">
            <legend class="filter-group__label">Faixa de preço</legend>
            <div class="range" data-range>
              <div class="range__track"><div class="range__fill" data-range-fill></div></div>
              <input type="range" name="minRange" min="${bounds.min}" max="${bounds.max}" step="${PRICE_STEP}" value="${state.min}" aria-label="Preço mínimo">
              <input type="range" name="maxRange" min="${bounds.min}" max="${bounds.max}" step="${PRICE_STEP}" value="${state.max}" aria-label="Preço máximo">
            </div>
            <div class="price-inputs">
              <label class="price-input">
                <span>Mínimo</span>
                <span class="price-input__box">R$ <input class="input" type="number" name="min" inputmode="numeric" min="${bounds.min}" max="${bounds.max}" step="${PRICE_STEP}" value="${state.min}"></span>
              </label>
              <span class="price-inputs__sep" aria-hidden="true">—</span>
              <label class="price-input">
                <span>Máximo</span>
                <span class="price-input__box">R$ <input class="input" type="number" name="max" inputmode="numeric" min="${bounds.min}" max="${bounds.max}" step="${PRICE_STEP}" value="${state.max}"></span>
              </label>
            </div>
            <div class="quick-ranges">${quick}</div>
          </fieldset>

          <fieldset class="filter-group">
            <legend class="filter-group__label">Seleções</legend>
            <label class="switch"><span>${icon('tag', 'icon--sm')} Somente promoções</span><input type="checkbox" name="promo" ${state.promo ? 'checked' : ''}><span class="switch__track" aria-hidden="true"></span></label>
            <label class="switch"><span>${icon('sparkles', 'icon--sm')} Somente lançamentos</span><input type="checkbox" name="isNew" ${state.isNew ? 'checked' : ''}><span class="switch__track" aria-hidden="true"></span></label>
            <label class="switch"><span>${icon('check-circle', 'icon--sm')} Somente disponíveis</span><input type="checkbox" name="inStock" ${state.inStock ? 'checked' : ''}><span class="switch__track" aria-hidden="true"></span></label>
          </fieldset>

          <button class="btn btn--ghost btn--block" type="button" data-clear-filters>${icon('refresh')}Limpar todos os filtros</button>
        </form>
        <div class="filters__footer">
          <button class="btn btn--primary btn--block" type="button" data-close-filters data-show-results>Ver resultados</button>
        </div>
      </aside>`;
  }

  function resultsHTML(list, state) {
    if (!list.length) {
      const suggestions = ['fone', 'moletom', 'luminária', 'mochila']
        .map((s) => `<a class="chip" href="#/catalogo?q=${encodeURIComponent(s)}">${icon('search')}${s}</a>`).join('');
      return MK.ui.emptyState({
        iconName: 'search',
        title: 'Nenhum produto encontrado',
        text: state.q
          ? `Não encontramos resultados para “${esc(state.q)}” com os filtros atuais. Verifique a ortografia ou remova alguns filtros.`
          : 'Nenhum produto atende a essa combinação de filtros. Experimente ampliar a faixa de preço ou remover alguns filtros.',
        actions: `<button class="btn btn--primary" type="button" data-clear-filters>${icon('refresh')}Limpar filtros</button>
                  <div class="empty-state__suggestions"><span class="muted small">Buscas populares:</span>${suggestions}</div>`,
      });
    }
    return list.map((p, i) => MK.ui.productCard(p, { index: i })).join('');
  }

  function chipsHTML(state) {
    const bounds = priceBounds();
    const chips = [];
    if (state.q) chips.push(['q', `Busca: “${esc(state.q)}”`]);
    state.categories.forEach((c) => chips.push([`cat:${c}`, esc(MK.products.categoryName(c))]));
    if (state.min > bounds.min || state.max < bounds.max) {
      chips.push(['price', `${formatPrice(state.min)} – ${formatPrice(state.max)}`]);
    }
    if (state.promo) chips.push(['promo', 'Em promoção']);
    if (state.isNew) chips.push(['isNew', 'Lançamentos']);
    if (state.inStock) chips.push(['inStock', 'Disponíveis']);
    if (!chips.length) return '';
    return `
      <span class="active-filters__label">Filtros ativos:</span>
      ${chips.map(([key, label]) => `
        <button type="button" class="chip chip--active" data-remove-filter="${esc(key)}" aria-label="Remover filtro ${label.replace(/<[^>]+>/g, '')}">
          ${label}${icon('close')}
        </button>`).join('')}
      <button type="button" class="btn btn--link small" data-clear-filters>Limpar tudo</button>`;
  }

  MK.views.catalog = {
    title(ctx) {
      const state = parseState(ctx.query);
      return headingFor(state).title.replace(/&[^;]+;/g, '').replace(/[“”]/g, '"');
    },

    render(ctx) {
      const state = parseState(ctx.query);
      const heading = headingFor(state);
      const loaded = MK.products.isLoaded();
      const list = loaded ? apply(state) : [];
      const sortOptions = SORTS.map((s) => `<option value="${s.id}" ${state.sort === s.id ? 'selected' : ''}>${s.label}</option>`).join('');
      const count = activeFilterCount(state);

      return `
        <section class="container catalog">
          <div class="page-head catalog__head">
            <nav class="breadcrumb" aria-label="Você está em">
              <ol><li><a href="#/">Início</a></li><li><span aria-current="page">Catálogo</span></li></ol>
            </nav>
            <h1 class="h1" data-catalog-title>${heading.title}</h1>
            <p data-catalog-text>${heading.text}</p>
          </div>

          <div class="catalog__layout">
            ${filtersPanel(state)}
            <div class="filters-overlay" data-close-filters hidden></div>

            <div class="catalog__main">
              <div class="catalog__toolbar">
                <button class="btn btn--secondary filters-toggle" type="button" data-open-filters aria-controls="catalog-filters" aria-expanded="false">
                  ${icon('sliders')}Filtros<span class="filters-toggle__count" data-filter-count ${count ? '' : 'hidden'}>${count}</span>
                </button>
                <p class="catalog__count" data-results-count aria-live="polite">${loaded ? MK.utils.pluralize(list.length, 'produto encontrado', 'produtos encontrados') : 'Carregando produtos…'}</p>
                <div class="catalog__sort">
                  <label for="catalog-sort">Ordenar por</label>
                  <select class="select" id="catalog-sort" name="sort" data-sort>${sortOptions}</select>
                </div>
              </div>
              <div class="active-filters" data-active-filters>${chipsHTML(state)}</div>
              <div class="product-grid product-grid--3 catalog__grid" data-results aria-busy="${loaded ? 'false' : 'true'}">
                ${loaded ? resultsHTML(list, state) : MK.ui.skeletonCards(6)}
              </div>
            </div>
          </div>
        </section>`;
    },

    mount(root, ctx) {
      let state = parseState(ctx.query);
      const form = $('[data-filters-form]', root);
      const panel = $('[data-filters]', root);
      const overlay = $('.filters-overlay', root);
      const toggle = $('[data-open-filters]', root);
      const results = $('[data-results]', root);
      const countEl = $('[data-results-count]', root);
      const chipsEl = $('[data-active-filters]', root);
      const sortSelect = $('[data-sort]', root);
      const bounds = priceBounds();
      let alive = true;

      /* --- leitura do formulário --- */
      function readForm() {
        const data = new FormData(form);
        let min = Number(form.elements.min.value);
        let max = Number(form.elements.max.value);
        if (!Number.isFinite(min) || form.elements.min.value === '') min = bounds.min;
        if (!Number.isFinite(max) || form.elements.max.value === '') max = bounds.max;
        min = MK.utils.clamp(min, bounds.min, bounds.max);
        max = MK.utils.clamp(max, bounds.min, bounds.max);
        if (min > max) [min, max] = [max, min];
        return {
          q: String(data.get('q') || '').trim().slice(0, 60),
          categories: data.getAll('cat'),
          min,
          max,
          promo: form.elements.promo.checked,
          isNew: form.elements.isNew.checked,
          inStock: form.elements.inStock.checked,
          sort: sortSelect.value,
        };
      }

      /* --- escrita no formulário (ex.: ao remover um chip) --- */
      function writeForm(s) {
        form.elements.q.value = s.q;
        $$('input[name="cat"]', form).forEach((input) => { input.checked = s.categories.includes(input.value); });
        form.elements.min.value = s.min;
        form.elements.max.value = s.max;
        form.elements.minRange.value = s.min;
        form.elements.maxRange.value = s.max;
        form.elements.promo.checked = s.promo;
        form.elements.isNew.checked = s.isNew;
        form.elements.inStock.checked = s.inStock;
        sortSelect.value = s.sort;
        updateRangeFill();
      }

      function updateRangeFill() {
        const fill = $('[data-range-fill]', root);
        const min = Number(form.elements.minRange.value);
        const max = Number(form.elements.maxRange.value);
        const span = bounds.max - bounds.min || 1;
        fill.style.left = `${((min - bounds.min) / span) * 100}%`;
        fill.style.right = `${100 - ((max - bounds.min) / span) * 100}%`;
        $$('[data-quick-range]', root).forEach((chip) => {
          const r = QUICK_RANGES[Number(chip.dataset.quickRange)];
          const active = min === r.min && max === (r.max === null ? bounds.max : r.max);
          chip.classList.toggle('chip--active', active);
          chip.setAttribute('aria-pressed', String(active));
        });
      }

      /* --- aplica filtros e atualiza a interface --- */
      function update({ announce = true } = {}) {
        state = readForm();
        const list = apply(state);
        results.innerHTML = resultsHTML(list, state);
        results.setAttribute('aria-busy', 'false');
        countEl.textContent = MK.utils.pluralize(list.length, 'produto encontrado', 'produtos encontrados');
        chipsEl.innerHTML = chipsHTML(state);
        const count = activeFilterCount(state);
        const badge = $('[data-filter-count]', root);
        badge.textContent = String(count);
        badge.hidden = count === 0;
        const showBtn = $('[data-show-results]', root);
        showBtn.textContent = list.length ? `Ver ${MK.utils.pluralize(list.length, 'produto', 'produtos')}` : 'Nenhum resultado';
        const heading = headingFor(state);
        $('[data-catalog-title]', root).innerHTML = heading.title;
        $('[data-catalog-text]', root).innerHTML = heading.text;
        document.title = `${heading.title.replace(/&[^;]+;/g, '').replace(/[“”]/g, '"')} | MUKEN STORE`;
        MK.router.replace(toQuery(state));
        MK.ui.reveal(results);
        MK.ui.settleMedia(results);
        if (!announce) countEl.removeAttribute('aria-live');
        else countEl.setAttribute('aria-live', 'polite');
      }

      const debouncedUpdate = debounce(update, 220);

      /* --- eventos --- */
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        update();
      });

      form.addEventListener('input', (event) => {
        const { name } = event.target;
        if (name === 'minRange' || name === 'maxRange') {
          let min = Number(form.elements.minRange.value);
          let max = Number(form.elements.maxRange.value);
          if (min > max - PRICE_STEP) {
            if (name === 'minRange') min = max - PRICE_STEP;
            else max = min + PRICE_STEP;
            form.elements.minRange.value = Math.max(bounds.min, min);
            form.elements.maxRange.value = Math.min(bounds.max, max);
          }
          form.elements.min.value = form.elements.minRange.value;
          form.elements.max.value = form.elements.maxRange.value;
          updateRangeFill();
          debouncedUpdate();
        } else if (name === 'q' || name === 'min' || name === 'max') {
          debouncedUpdate();
        }
      });

      form.addEventListener('change', (event) => {
        const { name } = event.target;
        if (name === 'min' || name === 'max') {
          const s = readForm();
          writeForm(s); // normaliza valores fora do limite ou invertidos
          update();
        } else if (['cat', 'promo', 'isNew', 'inStock'].includes(name)) {
          update();
        }
      });

      sortSelect.addEventListener('change', () => update());

      root.addEventListener('click', (event) => {
        const quick = event.target.closest('[data-quick-range]');
        if (quick) {
          const r = QUICK_RANGES[Number(quick.dataset.quickRange)];
          const s = readForm();
          const isActive = quick.classList.contains('chip--active');
          s.min = isActive ? bounds.min : r.min;
          s.max = isActive ? bounds.max : (r.max === null ? bounds.max : r.max);
          writeForm(s);
          update();
          return;
        }

        const remove = event.target.closest('[data-remove-filter]');
        if (remove) {
          const key = remove.dataset.removeFilter;
          const s = readForm();
          if (key === 'q') s.q = '';
          else if (key.startsWith('cat:')) s.categories = s.categories.filter((c) => c !== key.slice(4));
          else if (key === 'price') { s.min = bounds.min; s.max = bounds.max; }
          else s[key] = false;
          writeForm(s);
          update();
          const next = $('[data-remove-filter]', chipsEl) || sortSelect;
          next.focus();
          return;
        }

        if (event.target.closest('[data-clear-filters]')) {
          const s = defaultState();
          s.sort = sortSelect.value;
          writeForm(s);
          update();
          MK.ui.toast({ type: 'info', title: 'Filtros removidos', message: 'Exibindo todos os produtos.' });
          return;
        }

        if (event.target.closest('[data-open-filters]')) openPanel();
        else if (event.target.closest('[data-close-filters]')) closePanel();
      });

      /* --- painel de filtros em telas pequenas (gaveta) --- */
      function openPanel() {
        panel.classList.add('is-open');
        overlay.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('is-locked');
        const first = panel.querySelector('input, button');
        if (first) first.focus();
      }

      function closePanel() {
        if (!panel.classList.contains('is-open')) return;
        panel.classList.remove('is-open');
        overlay.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-locked');
        toggle.focus();
      }

      const onKey = (event) => {
        if (event.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
      };
      document.addEventListener('keydown', onKey);

      updateRangeFill();

      // Primeira visita: aguarda o "carregamento" (skeleton) e então renderiza
      if (!MK.products.isLoaded()) {
        MK.products.load().then(() => {
          if (alive) update({ announce: false });
        });
      }

      return () => {
        alive = false;
        document.removeEventListener('keydown', onKey);
        document.body.classList.remove('is-locked');
      };
    },
  };

  /* ------------------------------------------------------------------
     BUSCA DO CABEÇALHO COM SUGESTÕES (padrão combobox WAI-ARIA)
     ------------------------------------------------------------------ */
  function highlight(name, query) {
    const n = normalize(name);
    const t = terms(query).sort((a, b) => b.length - a.length)[0];
    if (!t) return esc(name);
    const index = n.indexOf(t);
    if (index < 0 || n.length !== name.length) return esc(name);
    return `${esc(name.slice(0, index))}<mark>${esc(name.slice(index, index + t.length))}</mark>${esc(name.slice(index + t.length))}`;
  }

  const headerSearch = {
    init() {
      const form = $('[data-search-form]');
      const input = $('#header-search-input');
      const box = $('#search-suggestions');
      if (!form || !input || !box) return;

      let options = [];
      let active = -1;

      const close = () => {
        box.hidden = true;
        box.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        options = [];
        active = -1;
      };

      const setActive = (index) => {
        options.forEach((el) => el.setAttribute('aria-selected', 'false'));
        active = index;
        if (index >= 0 && options[index]) {
          options[index].setAttribute('aria-selected', 'true');
          input.setAttribute('aria-activedescendant', options[index].id);
          options[index].scrollIntoView({ block: 'nearest' });
        } else {
          input.removeAttribute('aria-activedescendant');
        }
      };

      const go = (path) => {
        close();
        input.value = '';
        input.blur();
        if (MK.app) MK.app.toggleMobileSearch(false);
        MK.router.go(path);
      };

      const renderSuggestions = () => {
        const q = input.value.trim();
        if (!q) {
          close();
          return;
        }
        const results = search(q).slice(0, 5);
        const items = results.map((p, i) => `
          <div class="suggestion" role="option" id="suggestion-${i}" aria-selected="false" data-href="/produto/${encodeURIComponent(p.id)}">
            <span class="suggestion__media"><img src="${esc(p.image)}" alt="" width="48" height="48"></span>
            <span>
              <span class="suggestion__name">${highlight(p.name, q)}</span>
              <span class="suggestion__cat">${esc(MK.products.categoryName(p.category))} · ${esc(p.subtitle)}</span>
            </span>
            <span class="suggestion__price">${formatPrice(MK.products.finalPrice(p))}</span>
          </div>`).join('');
        box.innerHTML = results.length
          ? `${items}<div class="suggestion-all" role="option" id="suggestion-all" aria-selected="false" data-href="/catalogo?q=${encodeURIComponent(q)}">${icon('search', 'icon--sm')}Ver todos os resultados para “${esc(q)}”</div>`
          : `<div class="suggestion-empty" role="option" aria-disabled="true" aria-selected="false" id="suggestion-none">Nenhum produto para “${esc(q)}”. Tente “fone” ou “moletom”.</div>`;
        box.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        options = $$('[data-href]', box);
        active = -1;
      };

      input.addEventListener('input', debounce(renderSuggestions, 120));

      input.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' && options.length) {
          event.preventDefault();
          setActive((active + 1) % options.length);
        } else if (event.key === 'ArrowUp' && options.length) {
          event.preventDefault();
          setActive(active <= 0 ? options.length - 1 : active - 1);
        } else if (event.key === 'Escape') {
          if (!box.hidden) close();
          else input.value = '';
        } else if (event.key === 'Enter' && active >= 0 && options[active]) {
          event.preventDefault();
          go(options[active].dataset.href);
        }
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const q = input.value.trim();
        if (!q) {
          input.focus();
          return;
        }
        go(`/catalogo?q=${encodeURIComponent(q)}`);
      });

      box.addEventListener('mousedown', (event) => event.preventDefault()); // mantém o foco no campo
      box.addEventListener('click', (event) => {
        const option = event.target.closest('[data-href]');
        if (option) go(option.dataset.href);
      });

      document.addEventListener('click', (event) => {
        if (!event.target.closest('[data-search-form]')) close();
      });

      input.addEventListener('focus', () => {
        if (input.value.trim()) renderSuggestions();
      });

      MK.utils.on('route:change', close);
    },
  };

  MK.filters = { SORTS, parseState, toQuery, apply, search, priceBounds, defaultState };
  MK.search = headerSearch;
})(window.MK = window.MK || {});
