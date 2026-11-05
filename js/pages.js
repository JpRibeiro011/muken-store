/* =====================================================================
   MUKEN STORE — pages.js
   Páginas (views) renderizadas pelo roteador:
   início, detalhes do produto, visualização rápida (modal) e 404.
   Cada view expõe:
     - title:  título da aba (texto ou função)
     - render: retorna o HTML da página
     - mount:  liga eventos após a renderização (retorna função de limpeza)
   ===================================================================== */
(function (MK) {
  'use strict';

  const { escapeHTML: esc, formatPrice, formatRating, $, $$ } = MK.utils;
  const { icon } = MK.ui;

  const ORBIT_PATH = 'M568.0 150.0 L567.4 163.1 L565.5 176.0 L562.5 188.6 L558.4 200.5 L553.2 211.7 L547.1 222.1 L540.2 231.5 L532.7 239.9 L524.5 247.1 L516.0 253.3 L507.1 258.4 L498.0 262.4 L488.8 265.3 L479.5 267.2 L470.3 268.3 L461.1 268.4 L452.1 267.7 L443.3 266.4 L434.7 264.3 L426.3 261.7 L418.2 258.5 L410.3 254.8 L402.6 250.7 L395.2 246.3 L388.0 241.5 L381.1 236.4 L374.4 231.1 L367.8 225.5 L361.5 219.8 L355.3 213.9 L349.3 207.9 L343.5 201.7 L337.8 195.4 L332.2 189.1 L326.6 182.7 L321.2 176.2 L315.9 169.7 L310.5 163.1 L305.3 156.6 L300.0 150.0 L294.7 143.4 L289.5 136.9 L284.1 130.3 L278.8 123.8 L273.4 117.3 L267.8 110.9 L262.2 104.6 L256.5 98.3 L250.7 92.1 L244.7 86.1 L238.5 80.2 L232.2 74.5 L225.6 68.9 L218.9 63.6 L212.0 58.5 L204.8 53.7 L197.4 49.3 L189.7 45.2 L181.8 41.5 L173.7 38.3 L165.3 35.7 L156.7 33.6 L147.9 32.3 L138.9 31.6 L129.7 31.7 L120.5 32.8 L111.2 34.7 L102.0 37.6 L92.9 41.6 L84.0 46.7 L75.5 52.9 L67.3 60.1 L59.8 68.5 L52.9 77.9 L46.8 88.3 L41.6 99.5 L37.5 111.4 L34.5 124.0 L32.6 136.9 L32.0 150.0 L32.6 163.1 L34.5 176.0 L37.5 188.6 L41.6 200.5 L46.8 211.7 L52.9 222.1 L59.8 231.5 L67.3 239.9 L75.5 247.1 L84.0 253.3 L92.9 258.4 L102.0 262.4 L111.2 265.3 L120.5 267.2 L129.7 268.3 L138.9 268.4 L147.9 267.7 L156.7 266.4 L165.3 264.3 L173.7 261.7 L181.8 258.5 L189.7 254.8 L197.4 250.7 L204.8 246.3 L212.0 241.5 L218.9 236.4 L225.6 231.1 L232.2 225.5 L238.5 219.8 L244.7 213.9 L250.7 207.9 L256.5 201.7 L262.2 195.4 L267.8 189.1 L273.4 182.7 L278.8 176.2 L284.1 169.7 L289.5 163.1 L294.7 156.6 L300.0 150.0 L305.3 143.4 L310.5 136.9 L315.9 130.3 L321.2 123.8 L326.6 117.3 L332.2 110.9 L337.8 104.6 L343.5 98.3 L349.3 92.1 L355.3 86.1 L361.5 80.2 L367.8 74.5 L374.4 68.9 L381.1 63.6 L388.0 58.5 L395.2 53.7 L402.6 49.3 L410.3 45.2 L418.2 41.5 L426.3 38.3 L434.7 35.7 L443.3 33.6 L452.1 32.3 L461.1 31.6 L470.3 31.7 L479.5 32.8 L488.8 34.7 L498.0 37.6 L507.1 41.6 L516.0 46.7 L524.5 52.9 L532.7 60.1 L540.2 68.5 L547.1 77.9 L553.2 88.3 L558.4 99.5 L562.5 111.4 L565.5 124.0 L567.4 136.9Z';
  const RECENT_LIMIT = 8;

  /* ==================================================================
     PRODUTOS VISTOS RECENTEMENTE (LocalStorage)
     ================================================================== */
  const recent = {
    list() {
      const ids = MK.storage.read('recent', []);
      return (Array.isArray(ids) ? ids : []).map((id) => MK.products.byId(id)).filter(Boolean);
    },
    add(id) {
      const ids = (MK.storage.read('recent', []) || []).filter((item) => item !== id);
      ids.unshift(id);
      MK.storage.write('recent', ids.slice(0, RECENT_LIMIT));
    },
    clear() {
      MK.storage.remove('recent');
    },
  };
  MK.recent = recent;

  /* ==================================================================
     INÍCIO — HERO "BEYOND EVERY LIMIT."
     ================================================================== */
  function heroSection() {
    const rings = [92, 128, 164, 200, 236, 272]
      .map((r, i) => `<circle cx="300" cy="300" r="${r}" stroke-opacity="${(0.34 - i * 0.045).toFixed(3)}" stroke-width="${i % 2 ? 1 : 1.4}" ${i % 3 === 1 ? 'stroke-dasharray="2 10"' : ''}/>`)
      .join('');
    return `
      <section class="hero" aria-labelledby="hero-title">
        <div class="container hero__inner">
          <div class="hero__content">
            <p class="eyebrow" data-hero-in style="--d:0">Infinite Series · Coleção 2026</p>
            <h1 class="display hero__title" id="hero-title" data-hero-in style="--d:1">
              <span>BEYOND</span><span>EVERY</span><span class="gradient-text">LIMIT.</span>
            </h1>
            <p class="lead hero__lead" data-hero-in style="--d:2">
              Tecnologia, moda e lifestyle desenhados para quem enxerga além do comum.
              Design minimalista, materiais premium e uma experiência sem limites.
            </p>
            <div class="hero__actions" data-hero-in style="--d:3">
              <a class="btn btn--primary btn--lg" href="#/catalogo">Explorar coleção ${icon('arrow-right', 'btn__arrow')}</a>
              <a class="btn btn--secondary btn--lg" href="#/catalogo?new=1">${icon('sparkles')}Ver lançamentos</a>
            </div>
            <ul class="hero__perks" data-hero-in style="--d:4">
              <li>${icon('truck')}<span><strong>Frete grátis</strong><small>acima de R$ 299</small></span></li>
              <li>${icon('zap')}<span><strong>5% OFF no PIX</strong><small>pagamento simulado</small></span></li>
              <li>${icon('refresh')}<span><strong>Troca em 30 dias</strong><small>sem burocracia</small></span></li>
            </ul>
          </div>

          <div class="hero__visual" aria-hidden="true" data-parallax>
            <div class="hero__layer" data-depth="12">
              <svg class="void-rings" viewBox="0 0 600 600">
                <g class="ring-spin">${rings}</g>
                <g class="ring-spin ring-spin--rev"><circle cx="300" cy="300" r="290" stroke-opacity=".18" stroke-dasharray="1 14" stroke-width="2"/></g>
              </svg>
            </div>
            <div class="void-core"></div>
            <div class="hero__layer" data-depth="20">
              <svg class="infinity-orbit" viewBox="0 0 600 300">
                <defs>
                  <linearGradient id="hero-light" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#60A5FA"/>
                    <stop offset="1" stop-color="#A78BFA"/>
                  </linearGradient>
                </defs>
                <path class="infinity-orbit__track" d="${ORBIT_PATH}" pathLength="1000"/>
                <path class="infinity-orbit__light" d="${ORBIT_PATH}" pathLength="1000"/>
              </svg>
            </div>
            <div class="hero__layer" data-depth="34">
              <div class="hero__product">
                <img src="assets/images/products/halo-x.svg" alt="" width="800" height="800" fetchpriority="high">
              </div>
            </div>
            <div class="hero__chip hero__chip--a">
              <span class="hero__chip-icon">${icon('infinity')}</span>
              <span><strong>Halo X</strong>Cancelamento de ruído adaptativo</span>
            </div>
            <div class="hero__chip hero__chip--b">
              <span class="hero__chip-icon">${icon('zap')}</span>
              <span><strong>40 h de bateria</strong>Áudio espacial · Bluetooth 5.4</span>
            </div>
          </div>
        </div>
      </section>`;
  }

  /** Faixa com rolagem infinita (o conceito de infinito em movimento). */
  function marquee() {
    const items = [
      ['infinity', 'Beyond every limit.'],
      ['truck', 'Frete grátis acima de R$ 299'],
      ['zap', '5% OFF no PIX'],
      ['card', 'Até 10x sem juros'],
      ['refresh', 'Troca grátis em 30 dias'],
      ['sparkles', 'Infinite Series 2026'],
      ['shield', 'Garantia MUKEN de até 2 anos'],
    ];
    const group = (hidden) => `
      <ul class="marquee__group" ${hidden ? 'aria-hidden="true"' : ''}>
        ${items.map(([ic, text]) => `<li class="marquee__item">${icon(ic)}${text}</li>`).join('')}
      </ul>`;
    return `
      <section class="marquee" aria-label="Benefícios MUKEN">
        <div class="marquee__track">${group(false)}${group(true)}</div>
      </section>`;
  }

  /* ==================================================================
     INÍCIO — SEÇÕES DE PRODUTOS
     ================================================================== */
  function sectionHead({ eyebrow, title, id, text = '', link = '' }) {
    return `
      <div class="section-head">
        <div class="section-head__text">
          <p class="eyebrow">${eyebrow}</p>
          <h2 class="h2" id="${id}">${title}</h2>
          ${text ? `<p>${text}</p>` : ''}
        </div>
        ${link}
      </div>`;
  }

  function categoriesSection() {
    const P = MK.products;
    const cards = P.categories().map((c, i) => `
      <a class="category-card" href="#/catalogo?cat=${c.id}" data-reveal style="--i:${i}">
        <span class="category-card__index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="category-card__media"><img src="${esc(c.cover)}" alt="" width="800" height="800" loading="lazy"></span>
        <span class="category-card__body">
          <span class="category-card__icon">${icon(c.icon)}</span>
          <span class="category-card__name">${esc(c.name)}</span>
          <span class="category-card__tagline">${esc(c.tagline)}</span>
          <span class="category-card__count">${MK.utils.pluralize(P.countByCategory(c.id), 'produto', 'produtos')}</span>
        </span>
        <span class="category-card__arrow" aria-hidden="true">${icon('arrow-up-right')}</span>
      </a>`).join('');
    return `
      <section class="section" aria-labelledby="home-categories">
        <div class="container">
          ${sectionHead({
            eyebrow: 'Explore',
            title: 'Quatro universos, <span class="gradient-text">infinitas possibilidades</span>',
            id: 'home-categories',
            text: 'Do áudio imersivo ao streetwear técnico: escolha por onde começar.',
            link: `<a class="btn btn--secondary" href="#/catalogo">Ver catálogo completo ${icon('arrow-right', 'btn__arrow')}</a>`,
          })}
          <div class="category-grid">${cards}</div>
        </div>
      </section>`;
  }

  function featuredInner() {
    return MK.products.featured(4).map((p, i) => MK.ui.productCard(p, { index: i })).join('');
  }

  function featuredSection(loaded) {
    return `
      <section class="section section--alt" aria-labelledby="home-featured">
        <div class="container">
          ${sectionHead({
            eyebrow: 'Destaques',
            title: 'Ícones da coleção',
            id: 'home-featured',
            text: 'Um destaque de cada universo MUKEN, escolhido pela nossa curadoria.',
            link: `<a class="btn btn--ghost" href="#/catalogo">Ver todos ${icon('arrow-right', 'btn__arrow')}</a>`,
          })}
          <div class="product-grid" data-home-featured aria-busy="${!loaded}">${loaded ? featuredInner() : MK.ui.skeletonCards(4)}</div>
        </div>
      </section>`;
  }

  /** Próximo domingo às 23:59:59 (promoção semanal recorrente). */
  function promoDeadline() {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + ((7 - now.getDay()) % 7));
    end.setHours(23, 59, 59, 999);
    if (end <= now) end.setDate(end.getDate() + 7);
    return end;
  }

  function promoSection() {
    const P = MK.products;
    const maxOff = Math.max(...P.onSale().map((p) => P.discountPercent(p)));
    return `
      <section class="section section--tight" aria-labelledby="home-promo">
        <div class="container">
          <div class="promo" data-reveal>
            <div class="promo__glow" aria-hidden="true"></div>
            <div class="promo__content">
              <p class="eyebrow promo__eyebrow">Infinite Week · Oferta da semana</p>
              <h2 class="h2 promo__title" id="home-promo">Até ${maxOff}% OFF<br>+ 10% extra com cupom</h2>
              <p class="promo__text">Peças selecionadas com preços especiais. Use o cupom abaixo no carrinho e aproveite antes que o tempo acabe.</p>
              <div class="promo__coupon">
                <span class="promo__coupon-label">Cupom</span>
                <code class="promo__code">MUKEN10</code>
                <button class="btn btn--sm promo__copy" type="button" data-action="copy" data-copy="MUKEN10" data-copy-label="Cupom MUKEN10 copiado. Cole no carrinho para aplicar.">${icon('copy')}Copiar</button>
              </div>
              <div class="countdown" data-countdown role="timer" aria-label="Tempo restante da oferta">
                <div class="countdown__unit"><span class="countdown__value" data-unit="d">00</span><span class="countdown__label">Dias</span></div>
                <div class="countdown__unit"><span class="countdown__value" data-unit="h">00</span><span class="countdown__label">Horas</span></div>
                <div class="countdown__unit"><span class="countdown__value" data-unit="m">00</span><span class="countdown__label">Min</span></div>
                <div class="countdown__unit"><span class="countdown__value" data-unit="s">00</span><span class="countdown__label">Seg</span></div>
              </div>
              <a class="btn btn--light btn--lg" href="#/catalogo?promo=1">Ver todas as ofertas ${icon('arrow-right', 'btn__arrow')}</a>
            </div>
            <div class="promo__visual" aria-hidden="true">
              <div class="promo__ring"></div>
              <img class="promo__img promo__img--a" src="assets/images/products/aurora-lamp.svg" alt="" width="800" height="800" loading="lazy">
              <img class="promo__img promo__img--b" src="assets/images/products/iris-shades.svg" alt="" width="800" height="800" loading="lazy">
            </div>
          </div>
        </div>
      </section>`;
  }

  function mountCountdown(root) {
    const box = $('[data-countdown]', root);
    if (!box) return null;
    const deadline = promoDeadline();
    const units = { d: $('[data-unit="d"]', box), h: $('[data-unit="h"]', box), m: $('[data-unit="m"]', box), s: $('[data-unit="s"]', box) };
    const tick = () => {
      const diff = Math.max(0, deadline - Date.now());
      const total = Math.floor(diff / 1000);
      const values = { d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
      Object.keys(units).forEach((k) => { units[k].textContent = String(values[k]).padStart(2, '0'); });
      box.setAttribute('aria-label', `Tempo restante da oferta: ${values.d} dias, ${values.h} horas e ${values.m} minutos`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }

  function launchesInner() {
    return MK.products.newArrivals(8).map((p, i) => MK.ui.productCard(p, { index: i })).join('');
  }

  function launchesSection(loaded) {
    return `
      <section class="section" aria-labelledby="home-launches">
        <div class="container">
          ${sectionHead({
            eyebrow: 'Lançamentos',
            title: 'Acabou de chegar',
            id: 'home-launches',
            text: 'As novidades mais recentes da Infinite Series, ordenadas por data de lançamento.',
            link: `<div class="carousel__controls">
                     <button class="icon-btn carousel__btn" type="button" data-carousel-prev aria-label="Lançamentos anteriores" aria-controls="launches-track">${icon('chevron-left')}</button>
                     <button class="icon-btn carousel__btn" type="button" data-carousel-next aria-label="Próximos lançamentos" aria-controls="launches-track">${icon('chevron-right')}</button>
                   </div>`,
          })}
          <div class="carousel">
            <div class="carousel__track" id="launches-track" data-carousel tabindex="0" aria-label="Carrossel de lançamentos" aria-busy="${!loaded}">
              ${loaded ? launchesInner() : MK.ui.skeletonCards(4)}
            </div>
          </div>
        </div>
      </section>`;
  }

  function mountCarousel(root) {
    const track = $('[data-carousel]', root);
    if (!track) return null;
    const prev = $('[data-carousel-prev]', root);
    const next = $('[data-carousel-next]', root);
    const step = () => {
      const card = track.firstElementChild;
      return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : track.clientWidth;
    };
    const update = () => {
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', (event) => {
      if (event.target !== track) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
    window.addEventListener('resize', update);
    update();
    return { update, cleanup: () => window.removeEventListener('resize', update) };
  }

  function bestsellersInner() {
    const P = MK.products;
    const [top, ...rest] = P.bestSellers(5);
    const out = P.availability(top).code === 'out';
    return `
      <article class="spotlight" data-reveal>
        <span class="spotlight__rank" aria-hidden="true">#01</span>
        <div class="spotlight__media media-loading">
          <img src="${esc(top.image)}" alt="${esc(top.imageAlt)}" width="800" height="800" loading="lazy">
        </div>
        <div class="spotlight__body">
          <p class="product-card__cat">${esc(P.categoryName(top.category))} · Mais vendido da loja</p>
          <h3 class="spotlight__name"><a href="#/produto/${encodeURIComponent(top.id)}">${esc(top.name)}</a></h3>
          <p class="muted small">${esc(top.shortDescription)}</p>
          ${MK.ui.stars(top.rating, top.reviewsCount)}
          ${MK.ui.price(top)}
          <div class="spotlight__actions">
            <button class="btn btn--primary" type="button" data-action="add-to-cart" data-id="${esc(top.id)}" ${out ? 'disabled' : ''}>${icon('bag')}Adicionar ao carrinho</button>
            ${MK.ui.favButton(top, 'icon-btn icon-btn--ghost')}
          </div>
        </div>
      </article>
      <div class="ranking">${rest.map((p, i) => MK.ui.productRow(p, i + 2)).join('')}</div>`;
  }

  function bestsellersSection(loaded) {
    return `
      <section class="section section--alt" aria-labelledby="home-bestsellers">
        <div class="container">
          ${sectionHead({
            eyebrow: 'Mais vendidos',
            title: 'Os favoritos de quem vai além',
            id: 'home-bestsellers',
            text: 'Ranking atualizado com base nas unidades vendidas da coleção.',
            link: `<a class="btn btn--ghost" href="#/catalogo?sort=bestsellers">Ver ranking completo ${icon('arrow-right', 'btn__arrow')}</a>`,
          })}
          <div class="bestsellers" data-home-bestsellers aria-busy="${!loaded}">
            ${loaded ? bestsellersInner() : `<div class="skeleton spotlight-skeleton"></div><div class="ranking">${'<div class="skeleton row-skeleton"></div>'.repeat(4)}</div>`}
          </div>
        </div>
      </section>`;
  }

  function manifestoSection() {
    const P = MK.products;
    const avg = P.all().reduce((sum, p) => sum + p.rating, 0) / P.all().length;
    const pillars = [
      ['infinity', 'Design atemporal', 'Formas essenciais que não envelhecem. Cada peça é desenhada para durar muito além das tendências.'],
      ['eye', 'Atenção aos detalhes', 'Da costura reforçada ao alumínio usinado: tudo o que você vê — e o que não vê — é pensado com precisão.'],
      ['zap', 'Tecnologia invisível', 'Recursos avançados que simplificam a rotina sem ruído visual. A tecnologia serve, não aparece.'],
    ];
    return `
      <section class="section manifesto" aria-labelledby="home-manifesto">
        <div class="container manifesto__inner">
          <div class="manifesto__text" data-reveal>
            <p class="eyebrow">Manifesto MUKEN</p>
            <h2 class="h2" id="home-manifesto">Não acreditamos em limites. Acreditamos em <span class="gradient-text">profundidade.</span></h2>
            <p class="lead">A MUKEN nasce da ideia de infinito: a busca contínua por produtos melhores, mais bonitos e mais duradouros.</p>
            <a class="btn btn--secondary" href="#/sobre">Conheça a marca ${icon('arrow-right', 'btn__arrow')}</a>
          </div>
          <div class="manifesto__pillars">
            ${pillars.map(([ic, title, text], i) => `
              <article class="pillar" data-reveal style="--i:${i}">
                <span class="pillar__icon">${icon(ic)}</span>
                <h3 class="pillar__title">${title}</h3>
                <p class="pillar__text">${text}</p>
              </article>`).join('')}
          </div>
          <dl class="stats" data-reveal>
            <div class="stats__item"><dt>Avaliação média</dt><dd>${formatRating(avg)}<span>/5</span></dd></div>
            <div class="stats__item"><dt>Produtos na coleção</dt><dd>${P.all().length}</dd></div>
            <div class="stats__item"><dt>Dias para troca</dt><dd>30</dd></div>
            <div class="stats__item"><dt>Anos de garantia</dt><dd>até 2</dd></div>
          </dl>
        </div>
      </section>`;
  }

  function recentSection() {
    const items = recent.list().slice(0, 4);
    if (!items.length) return '';
    return `
      <section class="section section--tight" aria-labelledby="home-recent">
        <div class="container">
          ${sectionHead({
            eyebrow: 'Continue de onde parou',
            title: 'Vistos recentemente',
            id: 'home-recent',
            link: `<button class="btn btn--ghost" type="button" data-clear-recent>${icon('trash')}Limpar histórico</button>`,
          })}
          <div class="product-grid">${items.map((p, i) => MK.ui.productCard(p, { index: i })).join('')}</div>
        </div>
      </section>`;
  }

  /** Efeito de profundidade: camadas do hero acompanham o ponteiro. */
  function mountParallax(root) {
    const visual = root.querySelector('[data-parallax]');
    if (!visual || MK.utils.prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return null;
    const layers = Array.from(visual.querySelectorAll('[data-depth]'));
    const hero = root.querySelector('.hero');
    let frame = null;

    const onMove = (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        layers.forEach((layer) => {
          const depth = Number(layer.dataset.depth);
          layer.style.transform = `translate3d(${(-x * depth).toFixed(1)}px, ${(-y * depth).toFixed(1)}px, 0)`;
        });
      });
    };
    const onLeave = () => layers.forEach((layer) => { layer.style.transform = ''; });

    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }

  MK.views.home = {
    title: 'MUKEN STORE — Beyond Every Limit.',
    render() {
      const loaded = MK.products.isLoaded();
      return `
        ${heroSection()}
        ${marquee()}
        ${categoriesSection()}
        ${featuredSection(loaded)}
        ${promoSection()}
        ${launchesSection(loaded)}
        ${bestsellersSection(loaded)}
        ${recentSection()}
        ${manifestoSection()}`;
    },
    mount(root) {
      const carousel = mountCarousel(root);
      const cleanups = [mountParallax(root), mountCountdown(root), carousel && carousel.cleanup];
      let alive = true;

      // Primeira visita: troca os skeletons pelos produtos após o "carregamento"
      if (!MK.products.isLoaded()) {
        MK.products.load().then(() => {
          if (!alive) return;
          const fill = (selector, html) => {
            const el = $(selector, root);
            if (!el) return;
            el.innerHTML = html;
            el.setAttribute('aria-busy', 'false');
            MK.ui.reveal(el);
            MK.ui.settleMedia(el);
          };
          fill('[data-home-featured]', featuredInner());
          fill('[data-carousel]', launchesInner());
          fill('[data-home-bestsellers]', bestsellersInner());
          if (carousel) carousel.update();
        });
      }

      root.addEventListener('click', (event) => {
        if (event.target.closest('[data-clear-recent]')) {
          recent.clear();
          const section = event.target.closest('section');
          if (section) section.remove();
          MK.ui.toast({ type: 'info', title: 'Histórico limpo', message: 'A lista de produtos vistos recentemente foi apagada.' });
        }
      });

      return () => {
        alive = false;
        cleanups.forEach((fn) => typeof fn === 'function' && fn());
      };
    },
  };

  /* ==================================================================
     DETALHES DO PRODUTO
     ================================================================== */
  /** Quantidade máxima que ainda pode ser adicionada (estoque − carrinho). */
  function maxAddable(product) {
    const inCart = MK.cart ? MK.cart.quantityOf(product.id) : 0;
    return Math.max(0, MK.products.stock(product) - inCart);
  }

  function qtyControl(product, idPrefix) {
    const max = maxAddable(product);
    const disabled = max <= 0;
    return `
      <div class="buy-qty">
        <label class="field__label" for="${idPrefix}-qty">Quantidade</label>
        <div class="qty" data-qty>
          <button class="qty__btn" type="button" data-qty-dec aria-label="Diminuir quantidade" ${disabled ? 'disabled' : ''}>${icon('minus')}</button>
          <input class="qty__input" id="${idPrefix}-qty" type="number" inputmode="numeric" min="1" max="${Math.max(1, max)}" value="1" ${disabled ? 'disabled' : ''} aria-describedby="${idPrefix}-qty-hint">
          <button class="qty__btn" type="button" data-qty-inc aria-label="Aumentar quantidade" ${disabled || max <= 1 ? 'disabled' : ''}>${icon('plus')}</button>
        </div>
        <p class="field-hint" id="${idPrefix}-qty-hint" data-qty-hint>${qtyHint(product)}</p>
      </div>`;
  }

  function qtyHint(product) {
    const stock = MK.products.stock(product);
    const inCart = MK.cart ? MK.cart.quantityOf(product.id) : 0;
    if (stock <= 0) return 'Produto esgotado no momento.';
    if (inCart >= stock) return `Você já tem ${inCart} no carrinho — todo o estoque disponível.`;
    if (inCart > 0) return `Você já tem ${inCart} no carrinho. Pode adicionar mais ${stock - inCart}.`;
    return `Máximo de ${stock} ${stock === 1 ? 'unidade' : 'unidades'} por pedido.`;
  }

  /** Liga o seletor de quantidade (mínimo 1, máximo = estoque disponível). */
  function bindQty(scope, product) {
    const input = $('.qty__input', scope);
    const dec = $('[data-qty-dec]', scope);
    const inc = $('[data-qty-inc]', scope);
    const hint = $('[data-qty-hint]', scope);
    if (!input) return { value: () => 1, refresh() {} };

    const sync = () => {
      const max = maxAddable(product);
      let value = parseInt(input.value, 10);
      if (!Number.isFinite(value) || value < 1) value = 1;
      if (max > 0 && value > max) value = max;
      input.value = String(value);
      input.max = String(Math.max(1, max));
      input.disabled = max <= 0;
      dec.disabled = max <= 0 || value <= 1;
      inc.disabled = max <= 0 || value >= max;
      if (hint) hint.textContent = qtyHint(product);
      const addBtn = $('[data-buy-add]', scope);
      const buyBtn = $('[data-buy-now]', scope);
      [addBtn, buyBtn].forEach((btn) => {
        if (!btn) return;
        btn.disabled = max <= 0;
      });
    };

    dec.addEventListener('click', () => { input.value = String((parseInt(input.value, 10) || 1) - 1); sync(); });
    inc.addEventListener('click', () => {
      const max = maxAddable(product);
      const next = (parseInt(input.value, 10) || 1) + 1;
      if (next > max) {
        MK.ui.toast({ type: 'warning', title: 'Limite de estoque', message: `Só há ${MK.products.stock(product)} unidade(s) disponíveis deste produto.` });
      }
      input.value = String(next);
      sync();
    });
    input.addEventListener('change', sync);
    sync();
    return { value: () => parseInt(input.value, 10) || 1, refresh: sync };
  }

  function stockMeter(product) {
    const a = MK.products.availability(product);
    const pct = Math.round((a.stock / Math.max(product.stock, 1)) * 100);
    const text = a.code === 'out'
      ? 'Sem unidades disponíveis no momento.'
      : `${a.stock} ${a.stock === 1 ? 'unidade disponível' : 'unidades disponíveis'}`;
    return `
      <div class="stock-meter stock-meter--${a.code}">
        <div class="field__row">${MK.ui.stockTag(product)}<span class="small muted">${text}</span></div>
        <div class="stock-meter__bar" role="progressbar" aria-label="Estoque disponível" aria-valuemin="0" aria-valuemax="${product.stock}" aria-valuenow="${a.stock}">
          <div class="stock-meter__fill" style="width:${a.code === 'out' ? 100 : Math.max(pct, 6)}%"></div>
        </div>
      </div>`;
  }

  function priceBlockLarge(product) {
    const P = MK.products;
    const final = P.finalPrice(product);
    const pix = MK.utils.roundMoney(final * 0.95);
    return `
      <div class="buy-price">
        <div class="buy-price__row">
          ${MK.ui.price(product, { large: true, note: false })}
          ${P.hasPromo(product) ? `<span class="badge badge--sale">-${P.discountPercent(product)}%</span>` : ''}
        </div>
        ${P.hasPromo(product) ? `<p class="buy-price__save">${icon('tag', 'icon--sm')}Você economiza ${formatPrice(P.savings(product))}</p>` : ''}
        <p class="buy-price__terms">
          ${(() => { const inst = P.installments(final); return inst.count > 1 ? `Em até <strong>${inst.count}x de ${formatPrice(inst.value)}</strong> sem juros` : 'Pagamento à vista'; })()}
          <span aria-hidden="true">·</span> <strong>${formatPrice(pix)}</strong> no PIX (5% OFF)
        </p>
      </div>`;
  }

  function reviewsPanel(product) {
    const dist = product.ratingDistribution;
    return `
      <div class="reviews">
        <div class="reviews__summary card card--pad">
          <p class="reviews__avg">${formatRating(product.rating)}</p>
          ${MK.ui.stars(product.rating, 0, { large: true })}
          <p class="muted small">${product.reviewsCount} avaliações</p>
          <ul class="reviews__bars" aria-label="Distribuição das notas">
            ${dist.map((pct, i) => `
              <li><span>${5 - i} ${icon('star', 'icon--fill icon--xs')}</span>
                <span class="reviews__bar"><span style="width:${pct}%"></span></span>
                <span class="small muted">${pct}%</span></li>`).join('')}
          </ul>
        </div>
        <div class="reviews__list">
          ${product.reviews.map((r) => `
            <article class="review card card--pad">
              <header class="review__head">
                <span class="review__avatar" aria-hidden="true">${esc(r.author.charAt(0))}</span>
                <div>
                  <p class="review__author">${esc(r.author)} ${r.verified ? `<span class="badge badge--success">${icon('check')}Compra verificada</span>` : ''}</p>
                  <p class="small muted">${MK.utils.formatDate(`${r.date}T12:00:00`)}</p>
                </div>
                ${MK.ui.stars(r.rating, 0)}
              </header>
              <h3 class="review__title">${esc(r.title)}</h3>
              <p class="review__text">${esc(r.text)}</p>
            </article>`).join('')}
          <p class="callout">${icon('info')}As avaliações exibidas são fictícias e servem apenas para demonstração deste projeto acadêmico.</p>
        </div>
      </div>`;
  }

  function productTabs(product) {
    const tabs = [
      ['desc', 'Descrição', `
        <div class="prose product-desc">${product.description.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`],
      ['specs', 'Especificações', `
        <div class="table-wrap"><table class="table specs-table">
          <caption class="sr-only">Especificações técnicas de ${esc(product.name)}</caption>
          <tbody>${product.specs.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}
          <tr><th scope="row">Código</th><td>${esc(product.id)}</td></tr></tbody>
        </table></div>`],
      ['reviews', `Avaliações (${product.reviewsCount})`, reviewsPanel(product)],
    ];
    return `
      <div class="tabs product-tabs" data-tabs>
        <div class="tabs__list" role="tablist" aria-label="Informações do produto">
          ${tabs.map(([id, label], i) => `
            <button class="tabs__tab" type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}"
                    aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${label}</button>`).join('')}
        </div>
        ${tabs.map(([id, , content], i) => `
          <div class="tabs__panel" role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}" tabindex="0" ${i === 0 ? '' : 'hidden'}>${content}</div>`).join('')}
      </div>`;
  }

  /** Abas acessíveis (setas, Home/End) — padrão WAI-ARIA. */
  function bindTabs(scope) {
    const tabs = $$('[role="tab"]', scope);
    const select = (tab, focus = true) => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        $(`#${t.getAttribute('aria-controls')}`, scope).hidden = !selected;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
        if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (event.key === 'Home') next = tabs[0];
        if (event.key === 'End') next = tabs[tabs.length - 1];
        if (next) {
          event.preventDefault();
          select(next);
        }
      });
    });
    return { select };
  }

  /** Zoom da imagem acompanhando o cursor (desktop) ou por toque. */
  function bindZoom(stage) {
    if (!stage) return;
    const img = $('img', stage);
    const move = (event) => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
    };
    stage.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') stage.classList.add('is-zoomed');
    });
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerleave', () => stage.classList.remove('is-zoomed'));
    stage.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      move(event);
      stage.classList.toggle('is-zoomed');
    });
  }

  function shippingEstimator() {
    if (!MK.shipping) return '';
    return `
      <form class="ship-calc" data-ship-calc novalidate>
        <label class="field__label" for="ship-cep">${icon('truck', 'icon--sm')} Calcular frete e prazo</label>
        <div class="input-group">
          <input class="input" id="ship-cep" name="cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9" aria-describedby="ship-cep-error">
          <button class="btn btn--secondary" type="submit">Calcular</button>
        </div>
        <p class="field-error" id="ship-cep-error" aria-live="polite"></p>
        <div class="ship-calc__result" data-ship-result aria-live="polite"></div>
      </form>`;
  }

  function bindShipping(scope, product) {
    const form = $('[data-ship-calc]', scope);
    if (!form || !MK.shipping) return;
    const input = form.elements.cep;
    const error = $('#ship-cep-error', form);
    const result = $('[data-ship-result]', form);
    input.addEventListener('input', () => {
      input.value = MK.shipping.maskCEP(input.value);
      if (input.getAttribute('aria-invalid') === 'true' && MK.utils.onlyDigits(input.value).length === 8) {
        input.removeAttribute('aria-invalid');
        error.textContent = '';
      }
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const cep = MK.utils.onlyDigits(input.value);
      if (cep.length !== 8) {
        input.setAttribute('aria-invalid', 'true');
        error.textContent = 'Digite um CEP com 8 números, por exemplo 01310-100.';
        result.innerHTML = '';
        input.focus();
        return;
      }
      const subtotal = MK.products.finalPrice(product);
      const options = MK.shipping.options(subtotal, cep);
      result.innerHTML = `
        <p class="small muted">Entrega para a região <strong>${esc(MK.shipping.regionName(cep))}</strong> (estimativa simulada):</p>
        <ul class="ship-list">${options.map((o) => `
          <li><span>${icon(o.id === 'express' ? 'zap' : 'truck', 'icon--sm')}<strong>${esc(o.label)}</strong> · ${esc(o.eta)}</span>
              <strong class="${o.price === 0 ? 'text-success' : ''}">${o.price === 0 ? 'Grátis' : formatPrice(o.price)}</strong></li>`).join('')}
        </ul>`;
    });
  }

  function productNotFound(id) {
    return `
      <section class="container page-body not-found">
        <div class="not-found__code" aria-hidden="true">4<span>${icon('infinity')}</span>4</div>
        <h1 class="h1">Produto não encontrado</h1>
        <p class="lead">Não existe nenhum produto com o código “${esc(id)}”. Ele pode ter sido removido ou o link está incorreto.</p>
        <div class="not-found__actions">
          <a class="btn btn--primary" href="#/catalogo">${icon('grid')}Ver catálogo</a>
          <a class="btn btn--secondary" href="#/">Voltar ao início</a>
        </div>
      </section>`;
  }

  MK.views.product = {
    title(ctx) {
      const product = MK.products.byId(ctx.params.id);
      return product ? `${product.name} — ${product.subtitle}` : 'Produto não encontrado';
    },

    render(ctx) {
      const P = MK.products;
      const product = P.byId(ctx.params.id);
      if (!product) return productNotFound(ctx.params.id);
      const category = P.category(product.category);
      const out = !P.isAvailable(product);
      const related = P.related(product, 4);

      return `
        <section class="container product-page">
          <nav class="breadcrumb product-page__crumbs" aria-label="Você está em">
            <ol>
              <li><a href="#/">Início</a></li>
              <li><a href="#/catalogo">Catálogo</a></li>
              <li><a href="#/catalogo?cat=${category.id}">${esc(category.name)}</a></li>
              <li><span aria-current="page">${esc(product.name)}</span></li>
            </ol>
          </nav>

          <div class="product-page__grid">
            <div class="product-gallery">
              <div class="product-stage media-loading" data-zoom>
                <img src="${esc(product.image)}" alt="${esc(product.imageAlt)}" width="800" height="800">
                <div class="product-card__badges">${MK.ui.badges(product)}</div>
                <span class="product-stage__hint" aria-hidden="true">${icon('zoom', 'icon--sm')}Passe o mouse para ampliar</span>
              </div>
              <ul class="product-gallery__features" aria-label="Destaques do produto">
                ${product.highlights.map((h) => `<li>${icon('check-circle', 'icon--sm')}${esc(h)}</li>`).join('')}
              </ul>
            </div>

            <div class="product-info" data-buy-box>
              <p class="product-info__cat"><a class="text-link" href="#/catalogo?cat=${category.id}">${icon(category.icon, 'icon--sm')}${esc(category.name)}</a>${product.isNew ? '<span class="badge badge--info">Lançamento</span>' : ''}</p>
              <h1 class="h1 product-info__name">${esc(product.name)}</h1>
              <p class="product-info__subtitle">${esc(product.subtitle)}</p>
              <a class="product-info__rating" href="#panel-reviews" data-goto-reviews>${MK.ui.stars(product.rating, product.reviewsCount, { large: true })}<span class="small">Ver avaliações</span></a>

              ${priceBlockLarge(product)}

              <p class="product-info__short">${esc(product.shortDescription)}</p>

              ${stockMeter(product)}

              <div class="buy-actions">
                ${qtyControl(product, 'pdp')}
                <div class="buy-actions__buttons">
                  <button class="btn btn--primary btn--lg" type="button" data-buy-add ${out ? 'disabled' : ''}>${icon('bag')}${out ? 'Produto esgotado' : 'Adicionar ao carrinho'}</button>
                  <button class="btn btn--secondary btn--lg" type="button" data-buy-now ${out ? 'disabled' : ''}>${icon('zap')}Comprar agora</button>
                  ${(() => {
                    const fav = Boolean(MK.favorites && MK.favorites.has(product.id));
                    return `<button class="btn btn--ghost btn--lg fav-toggle" type="button" data-action="toggle-favorite" data-id="${esc(product.id)}" data-label="text" aria-pressed="${fav}" aria-label="${fav ? `Remover ${esc(product.name)} dos favoritos` : `Adicionar ${esc(product.name)} aos favoritos`}">${icon('heart')}<span data-fav-text>${fav ? 'Favoritado' : 'Favoritar'}</span></button>`;
                  })()}
                </div>
              </div>

              ${shippingEstimator()}

              <ul class="perks-list">
                <li>${icon('truck')}<span><strong>Frete grátis</strong> em compras acima de R$ 299 (entrega padrão)</span></li>
                <li>${icon('refresh')}<span><strong>Troca grátis</strong> em até 30 dias após o recebimento</span></li>
                <li>${icon('shield')}<span><strong>Compra protegida</strong> — ambiente de demonstração, sem cobranças reais</span></li>
              </ul>
            </div>
          </div>

          ${productTabs(product)}

          <section class="section related" aria-labelledby="related-title">
            ${sectionHead({ eyebrow: 'Combine com', title: 'Produtos relacionados', id: 'related-title', link: `<a class="btn btn--ghost" href="#/catalogo?cat=${category.id}">Mais de ${esc(category.name)} ${icon('arrow-right', 'btn__arrow')}</a>` })}
            <div class="product-grid">${related.map((p, i) => MK.ui.productCard(p, { index: i })).join('')}</div>
          </section>
        </section>`;
    },

    mount(root, ctx) {
      const product = MK.products.byId(ctx.params.id);
      if (!product) return null;
      recent.add(product.id);

      const box = $('[data-buy-box]', root);
      const qty = bindQty(box, product);
      const tabs = bindTabs($('[data-tabs]', root));
      bindZoom($('[data-zoom]', root));
      bindShipping(box, product);

      $('[data-goto-reviews]', root).addEventListener('click', (event) => {
        event.preventDefault(); // o hash é usado pelo roteador
        tabs.select($('#tab-reviews', root));
        $('[data-tabs]', root).scrollIntoView({ behavior: MK.utils.prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      });

      const add = (thenCheckout) => {
        if (!MK.cart) return;
        const result = MK.cart.add(product.id, qty.value(), { silent: thenCheckout });
        qty.refresh();
        if (thenCheckout && result.ok) MK.router.go('/checkout');
      };
      $('[data-buy-add]', box).addEventListener('click', () => add(false));
      $('[data-buy-now]', box).addEventListener('click', () => add(true));

      // Mantém a quantidade coerente se o carrinho mudar (ex.: em outra aba)
      const off = MK.utils.on('cart:change', () => qty.refresh());
      return () => off();
    },
  };

  /* ==================================================================
     VISUALIZAÇÃO RÁPIDA (modal)
     ================================================================== */
  function quickViewHTML(product) {
    const P = MK.products;
    const out = !P.isAvailable(product);
    const fav = Boolean(MK.favorites && MK.favorites.has(product.id));
    return `
      <button class="icon-btn modal__close" type="button" data-action="close-dialog" aria-label="Fechar visualização rápida">${icon('close')}</button>
      <div class="quick-view">
        <div class="quick-view__media media-loading">
          <img src="${esc(product.image)}" alt="${esc(product.imageAlt)}" width="800" height="800">
          <div class="product-card__badges">${MK.ui.badges(product)}</div>
        </div>
        <div class="quick-view__info" data-buy-box>
          <p class="product-card__cat">${esc(P.categoryName(product.category))}</p>
          <h2 class="h2 quick-view__name" id="quick-view-title">${esc(product.name)}</h2>
          <p class="muted">${esc(product.subtitle)}</p>
          ${MK.ui.stars(product.rating, product.reviewsCount)}
          ${MK.ui.price(product)}
          <p class="quick-view__desc">${esc(product.shortDescription)}</p>
          ${stockMeter(product)}
          <div class="buy-actions">
            ${qtyControl(product, 'qv')}
            <div class="buy-actions__buttons">
              <button class="btn btn--primary" type="button" data-buy-add ${out ? 'disabled' : ''}>${icon('bag')}${out ? 'Esgotado' : 'Adicionar ao carrinho'}</button>
              <button class="btn btn--ghost fav-toggle" type="button" data-action="toggle-favorite" data-id="${esc(product.id)}" data-label="text" aria-pressed="${fav}" aria-label="${fav ? `Remover ${esc(product.name)} dos favoritos` : `Adicionar ${esc(product.name)} aos favoritos`}">${icon('heart')}<span data-fav-text>${fav ? 'Favoritado' : 'Favoritar'}</span></button>
            </div>
          </div>
          <a class="btn btn--link" href="#/produto/${encodeURIComponent(product.id)}">Ver detalhes completos ${icon('arrow-right', 'icon--sm')}</a>
        </div>
      </div>`;
  }

  MK.actions['quick-view'] = (button) => {
    const product = MK.products.byId(button.dataset.id);
    const dialog = document.getElementById('quick-view');
    if (!product || !dialog) return;
    const panel = $('[data-quick-view]', dialog);
    panel.innerHTML = quickViewHTML(product);
    const box = $('[data-buy-box]', panel);
    const qty = bindQty(box, product);
    $('[data-buy-add]', box).addEventListener('click', () => {
      if (!MK.cart) return;
      const result = MK.cart.add(product.id, qty.value());
      qty.refresh();
      if (result.ok) MK.ui.closeDialog(dialog);
    });
    MK.ui.openDialog(dialog);
    MK.ui.settleMedia(panel);
    $('.modal__close', panel).focus();
  };

  /* ==================================================================
     404
     ================================================================== */
  MK.views.notFound = {
    title: 'Página não encontrada',
    render() {
      return `
        <section class="container page-body not-found">
          <div class="not-found__code" aria-hidden="true">4<span>${icon('infinity')}</span>4</div>
          <h1 class="h1">Você foi além do limite.</h1>
          <p class="lead">A página que você procura não existe ou foi movida. Que tal voltar ao início ou explorar o catálogo?</p>
          <div class="not-found__actions">
            <a class="btn btn--primary" href="#/">${icon('arrow-left')}Voltar ao início</a>
            <a class="btn btn--secondary" href="#/catalogo">Explorar catálogo</a>
          </div>
        </section>`;
    },
  };
})(window.MK = window.MK || {});
