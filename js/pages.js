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
     INÍCIO — HERO "SEIS OLHOS" (六眼)
     O olho é uma ilustração original (íris procedural em SVG). A
     referência a Satoru Gojo é só conceitual: o azul dos Seis Olhos,
     o Infinito (無限) e o Vazio Ilimitado (無量空処) — sem personagens,
     logotipos ou artes oficiais da franquia.
     ================================================================== */
  let hudCache = '';

  /** Anel técnico ao redor do olho: marcações em graus e texto em órbita. */
  function eyeHUD() {
    if (hudCache) return hudCache;
    const C = 300;
    const pt = (r, deg) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return [(C + r * Math.cos(a)).toFixed(1), (C + r * Math.sin(a)).toFixed(1)];
    };
    const ticks = [];
    for (let deg = 0; deg < 360; deg += 2) {
      const major = deg % 30 === 0;
      const [x1, y1] = pt(major ? 272 : deg % 10 === 0 ? 281 : 287, deg);
      const [x2, y2] = pt(294, deg);
      ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${major ? ' class="hud-major"' : ''}/>`);
    }
    const arc = (r, from, to) => {
      const [x1, y1] = pt(r, from);
      const [x2, y2] = pt(r, to);
      return `<path class="hud-accent" d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}"/>`;
    };
    const marks = [0, 90, 180, 270].map((deg) => {
      const [x, y] = pt(298, deg);
      return `<rect class="hud-dot" x="${(x - 2.5).toFixed(1)}" y="${(y - 2.5).toFixed(1)}" width="5" height="5" transform="rotate(${deg} ${x} ${y})"/>`;
    }).join('');
    const phrase = 'MUKEN OCULAR SYSTEM · SIX EYES · CALIBRATED TO INFINITY · ';
    hudCache = `
      <svg class="eye__hud" viewBox="0 0 600 600" focusable="false">
        <defs><path id="hud-orbit" d="M300 50 A250 250 0 1 1 299.9 50"/></defs>
        <g fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="300" cy="300" r="298" stroke-opacity=".35"/>
          <circle cx="300" cy="300" r="266" stroke-opacity=".22"/>
          <circle cx="300" cy="300" r="240" stroke-opacity=".5" stroke-dasharray="1 5"/>
          <circle cx="300" cy="300" r="230" stroke-opacity=".22"/>
          <g stroke-opacity=".55">${ticks.join('')}</g>
          <g stroke-width="2">${arc(298, 312, 352)}${arc(298, 132, 172)}</g>
        </g>
        ${marks}
        <text textLength="1565" lengthAdjust="spacing"><textPath href="#hud-orbit">${phrase.repeat(3)}</textPath></text>
      </svg>`;
    return hudCache;
  }

  function heroSection() {
    const drop = MK.products.newArrivals(1)[0];
    return `
      <section class="hero dark-scope" aria-labelledby="hero-title">
        <div class="hero__grid" aria-hidden="true"></div>
        <div class="container hero__inner">
          <div class="hero__content">
            <p class="eyebrow" data-hero-in style="--d:0">Infinite Series — Coleção 2026</p>
            <h1 class="display hero__title" id="hero-title" data-hero-in style="--d:1">
              <span>BEYOND</span><span>EVERY</span><span class="hero__title-accent">LIMIT.</span>
            </h1>
            <p class="lead hero__lead" data-hero-in style="--d:2">
              Tecnologia, moda e lifestyle com precisão de engenharia.
              Peças essenciais, materiais premium e uma experiência pensada
              para quem enxerga além do comum.
            </p>
            <div class="hero__actions" data-hero-in style="--d:3">
              <a class="btn btn--primary btn--lg" href="#/catalogo">Explorar coleção ${icon('arrow-right', 'btn__arrow')}</a>
              <a class="btn btn--secondary btn--lg" href="#/catalogo?new=1">Ver lançamentos</a>
            </div>
            <dl class="hero__specs" data-hero-in style="--d:4">
              <div><dt>Frete</dt><dd>Grátis acima de R$ 299</dd></div>
              <div><dt>PIX</dt><dd>5% de desconto</dd></div>
              <div><dt>Trocas</dt><dd>Até 30 dias</dd></div>
            </dl>
          </div>

          <div class="hero__visual" aria-hidden="true" data-eye>
            <div class="eye" data-hero-in style="--d:2">
              ${eyeHUD()}
              <div class="eye__ball" data-eye-ball>
                <img class="eye__iris" src="assets/images/six-eyes-iris.svg" alt="" width="800" height="800" fetchpriority="high">
                <span class="eye__pupil" data-eye-pupil></span>
                <span class="eye__shine eye__shine--a"></span>
                <span class="eye__shine eye__shine--b"></span>
              </div>
            </div>
            <p class="hero__tag hero__tag--a"><span class="jp" lang="ja">六眼</span>Six Eyes · <strong>Ocular 01</strong></p>
            <p class="hero__tag hero__tag--b">Foco <strong data-eye-coords>+0.00 / +0.00</strong></p>
            <p class="hero__vertical jp" lang="ja">すべての限界を超えて</p>
          </div>
        </div>
        ${drop ? `
        <a class="hero__drop" href="#/produto/${encodeURIComponent(drop.id)}" data-hero-in style="--d:5">
          <img src="${esc(drop.image)}" alt="" width="54" height="54">
          <span>Novo drop<strong>${esc(drop.name)}</strong></span>
          ${icon('arrow-right')}
        </a>` : ''}
        <p class="hero__scroll" aria-hidden="true">Role para explorar</p>
      </section>`;
  }

  /**
   * O olho acompanha o ponteiro (íris desloca pouco, pupila mais) e, parado,
   * faz pequenos movimentos sacádicos. Desligado com "reduzir movimento".
   */
  function mountEye(root) {
    const stage = $('[data-eye]', root);
    if (!stage || MK.utils.prefersReducedMotion()) return null;
    const ball = $('[data-eye-ball]', stage);
    const pupil = $('[data-eye-pupil]', stage);
    const coords = $('[data-eye-coords]', root);
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    let frame = 0;
    let timer = 0;
    let lastMove = 0;
    let visible = true;

    const fmt = (n) => `${n < 0 ? '−' : '+'}${Math.abs(n).toFixed(2)}`;
    const look = (nx, ny, focus) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const size = ball.offsetWidth || 1;
        ball.style.setProperty('--ex', `${(nx * size * 0.035).toFixed(1)}px`);
        ball.style.setProperty('--ey', `${(ny * size * 0.035).toFixed(1)}px`);
        pupil.style.setProperty('--px', `${(nx * size * 0.12).toFixed(1)}px`);
        pupil.style.setProperty('--py', `${(ny * size * 0.12).toFixed(1)}px`);
        pupil.style.setProperty('--ps', focus ? '0.78' : '1');
        if (coords) coords.textContent = `${fmt(nx)} / ${fmt(-ny)}`;
      });
    };

    const onMove = (event) => {
      if (!visible) return;
      lastMove = Date.now();
      const r = ball.getBoundingClientRect();
      const dx = event.clientX - (r.left + r.width / 2);
      const dy = event.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const k = Math.min(1, dist / (Math.max(window.innerWidth, window.innerHeight) * 0.55));
      const angle = Math.atan2(dy, dx);
      look(Math.cos(angle) * k, Math.sin(angle) * k, dist < r.width / 2);
    };

    const saccade = () => {
      timer = setTimeout(() => {
        if (visible && Date.now() - lastMove > 2600) {
          const angle = Math.random() * Math.PI * 2;
          const k = 0.15 + Math.random() * 0.55;
          look(Math.cos(angle) * k, Math.sin(angle) * k * 0.6, false);
        }
        saccade();
      }, 1800 + Math.random() * 2400);
    };

    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; })
      : null;
    if (observer) observer.observe(stage);
    if (finePointer) window.addEventListener('pointermove', onMove, { passive: true });
    saccade();

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }

  /** Faixa com rolagem infinita (o conceito de infinito em movimento). */
  function marquee() {
    const items = [
      'Beyond every limit',
      'Frete grátis acima de R$ 299',
      '5% OFF no PIX',
      'Até 10x sem juros',
      'Troca grátis em 30 dias',
      'Infinite Series 2026',
      'Garantia de até 2 anos',
    ];
    const group = (hidden) => `
      <ul class="marquee__group" ${hidden ? 'aria-hidden="true"' : ''}>
        ${items.map((text) => `<li class="marquee__item">${text}</li>`).join('')}
      </ul>`;
    return `
      <section class="marquee" aria-label="Benefícios MUKEN">
        <div class="marquee__track">${group(false)}${group(true)}</div>
      </section>`;
  }

  /* ==================================================================
     INÍCIO — SEÇÕES DE PRODUTOS
     ================================================================== */
  /** Cabeçalho editorial: linha fina, índice numerado e rótulo técnico. */
  function sectionHead({ index, label, title, id, text = '', link = '' }) {
    return `
      <div class="section-head">
        <p class="section-head__meta"><span class="section-head__index" aria-hidden="true">${index}</span><span>${label}</span></p>
        <div class="section-head__text">
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
        <span class="category-card__top">
          <span class="category-card__index">${String(i + 1).padStart(2, '0')}</span>
          <span>${MK.utils.pluralize(P.countByCategory(c.id), 'produto', 'produtos')}</span>
        </span>
        <span class="category-card__media"><img src="${esc(c.cover)}" alt="" width="800" height="800" loading="lazy"></span>
        <span class="category-card__body">
          <span class="category-card__name">${esc(c.name)}</span>
          <span class="category-card__tagline">${esc(c.tagline)}</span>
        </span>
        <span class="category-card__arrow" aria-hidden="true">${icon('arrow-up-right')}</span>
      </a>`).join('');
    return `
      <section class="section" aria-labelledby="home-categories">
        <div class="container">
          ${sectionHead({
            index: '01',
            label: 'Categorias',
            title: 'Quatro universos.',
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
            index: '02',
            label: 'Destaques',
            title: 'Ícones da coleção.',
            id: 'home-featured',
            text: 'Um destaque de cada universo MUKEN, escolhido pela curadoria.',
            link: `<a class="btn btn--secondary" href="#/catalogo">Ver todos ${icon('arrow-right', 'btn__arrow')}</a>`,
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

  /** Promoção da semana — "Vazio Ilimitado" (無量空処). */
  function promoSection() {
    const P = MK.products;
    const onSale = P.onSale().slice().sort((a, b) => P.discountPercent(b) - P.discountPercent(a));
    const top = onSale[0];
    const maxOff = top ? P.discountPercent(top) : 0;
    return `
      <section class="void dark-scope" aria-labelledby="home-promo">
        <div class="void__stars" aria-hidden="true"></div>
        <div class="void__orb" aria-hidden="true"></div>
        <p class="void__kanji jp" lang="ja" aria-hidden="true">無量空処</p>
        <div class="container void__inner">
          <div class="void__content" data-reveal>
            <p class="eyebrow">03 — Infinite Week · Vazio Ilimitado</p>
            <h2 class="display void__title" id="home-promo">Até ${maxOff}% OFF.<br><span class="outline-text">+10% extra.</span></h2>
            <p class="lead">Peças selecionadas com preço especial e mais 10% de desconto com o cupom abaixo. A oferta se renova todo domingo, às 23h59.</p>
            <div class="void__coupon">
              <span class="label">Cupom</span>
              <code>MUKEN10</code>
              <button class="btn btn--primary btn--sm" type="button" data-action="copy" data-copy="MUKEN10" data-copy-label="Cupom MUKEN10 copiado. Cole no carrinho para aplicar.">${icon('copy')}Copiar</button>
            </div>
            <div class="countdown" data-countdown role="timer" aria-label="Tempo restante da oferta">
              <div class="countdown__unit"><span class="countdown__value" data-unit="d">00</span><span class="countdown__label">Dias</span></div>
              <div class="countdown__unit"><span class="countdown__value" data-unit="h">00</span><span class="countdown__label">Horas</span></div>
              <div class="countdown__unit"><span class="countdown__value" data-unit="m">00</span><span class="countdown__label">Min</span></div>
              <div class="countdown__unit"><span class="countdown__value" data-unit="s">00</span><span class="countdown__label">Seg</span></div>
            </div>
            <a class="btn btn--secondary btn--lg" href="#/catalogo?promo=1">Ver todas as ofertas ${icon('arrow-right', 'btn__arrow')}</a>
          </div>
          ${top ? `
          <figure class="void__visual" data-reveal style="--i:2">
            <img src="${esc(top.image)}" alt="" width="800" height="800" loading="lazy">
            <figcaption class="void__caption">
              <span>${esc(top.name)}</span>
              <span class="void__caption-off">−${maxOff}%</span>
            </figcaption>
          </figure>` : ''}
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
            index: '04',
            label: 'Lançamentos',
            title: 'Acabou de chegar.',
            id: 'home-launches',
            text: 'As novidades mais recentes da Infinite Series, por data de lançamento.',
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
            index: '05',
            label: 'Mais vendidos',
            title: 'Os mais desejados.',
            id: 'home-bestsellers',
            text: 'Ranking calculado a partir das unidades vendidas da coleção.',
            link: `<a class="btn btn--secondary" href="#/catalogo?sort=bestsellers">Ranking completo ${icon('arrow-right', 'btn__arrow')}</a>`,
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
    // Pilares da marca, cada um ligado a um conceito do Infinito
    const pillars = [
      ['無限', 'Infinito', 'Design atemporal: formas essenciais que não envelhecem e foram feitas para durar muito além das tendências.'],
      ['六眼', 'Precisão', 'Da costura reforçada ao alumínio usinado, tudo o que você vê — e o que não vê — é pensado nos detalhes.'],
      ['蒼', 'Energia', 'Tecnologia invisível: recursos avançados que simplificam a rotina sem ruído visual.'],
    ];
    return `
      <section class="section manifesto" aria-labelledby="home-manifesto">
        <p class="manifesto__kanji jp" lang="ja" aria-hidden="true">無限</p>
        <div class="container">
          <div class="manifesto__inner">
            <div class="manifesto__text" data-reveal>
              <p class="eyebrow">06 — Manifesto MUKEN</p>
              <h2 class="h2 manifesto__title" id="home-manifesto">Não acreditamos em limites. Acreditamos em <span class="gradient-text">profundidade.</span></h2>
              <p class="lead">A MUKEN nasce da ideia de infinito: a busca contínua por produtos melhores, mais bonitos e mais duradouros.</p>
              <a class="btn btn--secondary" href="#/sobre">Conheça a marca ${icon('arrow-right', 'btn__arrow')}</a>
            </div>
            <ol class="manifesto__pillars">
              ${pillars.map(([kanji, title, text], i) => `
                <li class="pillar" data-reveal style="--i:${i}">
                  <span class="pillar__kanji jp" lang="ja" aria-hidden="true">${kanji}</span>
                  <h3 class="pillar__title">${title}</h3>
                  <p class="pillar__text">${text}</p>
                </li>`).join('')}
            </ol>
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
            index: '—',
            label: 'Continue de onde parou',
            title: 'Vistos recentemente.',
            id: 'home-recent',
            link: `<button class="btn btn--ghost" type="button" data-clear-recent>${icon('trash')}Limpar histórico</button>`,
          })}
          <div class="product-grid">${items.map((p, i) => MK.ui.productCard(p, { index: i })).join('')}</div>
        </div>
      </section>`;
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
      const cleanups = [mountEye(root), mountCountdown(root), carousel && carousel.cleanup];
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
                <span class="product-stage__hint" aria-hidden="true">${icon('zoom', 'icon--sm')}Passe o mouse ou toque para ampliar</span>
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
            ${sectionHead({ index: '+', label: 'Combine com', title: 'Produtos relacionados.', id: 'related-title', link: `<a class="btn btn--ghost" href="#/catalogo?cat=${category.id}">Mais de ${esc(category.name)} ${icon('arrow-right', 'btn__arrow')}</a>` })}
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
     SOBRE A MUKEN (marca, conceito e identidade visual)
     ================================================================== */
  const PALETTE = [
    ['Preto profundo', '#080A12', 'Fundo principal — o “vazio” que dá profundidade.'],
    ['Azul marinho', '#10182B', 'Superfícies elevadas: menus, gavetas e modais.'],
    ['Azul elétrico', '#2563EB', 'Cor principal de ação e destaque.'],
    ['Azul luminoso', '#60A5FA', 'Links, foco e o brilho da íris.'],
    ['Branco gelo', '#F8FAFC', 'Textos e contrastes.'],
    ['Cinza', '#94A3B8', 'Textos secundários.'],
    ['Roxo de destaque', '#8B5CF6', 'Acento raro: símbolo e halo do Vazio.'],
  ];

  MK.views.about = {
    title: 'Sobre a MUKEN',
    render() {
      const values = [
        ['infinity', 'Exclusividade', 'Coleções enxutas e numeradas, pensadas para durar e não para lotar o armário.'],
        ['sparkles', 'Modernidade', 'Linguagem visual contemporânea, sem excessos e sem pressa de envelhecer.'],
        ['cpu', 'Tecnologia', 'Materiais técnicos e recursos inteligentes a serviço da rotina.'],
        ['eye', 'Sofisticação', 'Acabamentos precisos, do alumínio usinado à costura reforçada.'],
        ['grid', 'Minimalismo', 'Só o essencial: cada elemento precisa justificar sua existência.'],
        ['zap', 'Personalidade', 'Detalhes de assinatura — o azul elétrico e o símbolo do infinito.'],
        ['arrow-up-right', 'Inovação', 'Experimentação constante para ir além do que já existe.'],
      ];
      const pillars = [
        ['無限', 'Infinito', 'O símbolo da marca é um infinito entrelaçado: uma linha contínua que passa por trás de si mesma e cria profundidade real.'],
        ['六眼', 'Visão', 'O olhar que enxerga além: no início do site, uma íris original em azul elétrico acompanha o movimento do cursor.'],
        ['空', 'Vazio', 'Fundos quase pretos, anéis técnicos e um campo de estrelas criam a sensação de um espaço ilimitado.'],
        ['蒼', 'Energia', 'Movimento contínuo e preciso: a faixa sem fim, a contagem regressiva e as microinterações.'],
      ];
      return `
        <section class="about-hero">
          <p class="about-hero__kanji jp" lang="ja" aria-hidden="true">無限</p>
          <div class="container about-hero__inner">
            <nav class="breadcrumb" aria-label="Você está em"><ol><li><a href="#/">Início</a></li><li><span aria-current="page">Sobre</span></li></ol></nav>
            <p class="eyebrow">Sobre a MUKEN</p>
            <h1 class="display about-hero__title">Projetada para ir <span class="gradient-text">além do limite.</span></h1>
            <p class="lead">A MUKEN é uma marca conceitual de tecnologia, moda e lifestyle. Criamos produtos essenciais, de design minimalista e acabamento premium, para pessoas que não aceitam limites.</p>
          </div>
        </section>

        <section class="section section--tight">
          <div class="container about-story">
            <div class="about-story__text" data-reveal>
              <p class="eyebrow">O nome</p>
              <h2 class="h2">MUKEN significa infinito.</h2>
              <p>O nome nasce do conceito de <strong>infinito</strong> — uma ideia celebrada pela cultura pop japonesa contemporânea, em que o infinito aparece como uma barreira impossível de atravessar e, ao mesmo tempo, como um poder sem limites.</p>
              <p>Transformamos essa referência em uma identidade <strong>totalmente original</strong>: em vez de personagens ou símbolos existentes, usamos quatro conceitos — infinito, visão, vazio e energia — como base para cores, formas, movimento e linguagem.</p>
              <p class="about-slogan">BEYOND EVERY LIMIT.<span class="jp" lang="ja">すべての限界を超えて</span></p>
            </div>
            <div class="about-pillars">
              ${pillars.map(([kanji, title, text], i) => `
                <article class="about-pillar" data-reveal style="--i:${i}">
                  <div class="about-pillar__top" aria-hidden="true"><span class="about-pillar__kanji jp" lang="ja">${kanji}</span><span>0${i + 1}</span></div>
                  <h3 class="about-pillar__title">${title}</h3>
                  <p>${text}</p>
                </article>`).join('')}
            </div>
          </div>
        </section>

        <section class="section section--alt" aria-labelledby="about-values">
          <div class="container">
            ${sectionHead({ index: '02', label: 'Personalidade', title: 'Os valores que guiam cada produto.', id: 'about-values' })}
            <div class="values-grid">
              ${values.map(([ic, title, text], i) => `
                <article class="value-card" data-reveal style="--i:${i}">
                  <span class="value-card__icon">${icon(ic)}</span>
                  <h3 class="value-card__title">${title}</h3>
                  <p>${text}</p>
                </article>`).join('')}
              <div class="value-card value-card--brand" data-reveal style="--i:7">
                <span class="jp" lang="ja" aria-hidden="true">無限</span>
                <p><strong>BEYOND EVERY LIMIT.</strong>Sete valores, uma direção.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="section" aria-labelledby="about-identity">
          <div class="container">
            ${sectionHead({ index: '03', label: 'Identidade visual', title: 'Um sistema visual próprio.', id: 'about-identity', text: 'Logotipo, paleta e tipografia criados para a MUKEN. Clique em uma cor para copiar o código.' })}
            <div class="brand-board">
              <figure class="brand-tile brand-tile--dark" data-reveal>
                <img src="assets/logo/muken-logo-horizontal-dark.svg" alt="Logotipo horizontal da MUKEN para fundos escuros" width="437" height="56">
                <figcaption>Versão horizontal · fundo escuro</figcaption>
              </figure>
              <figure class="brand-tile brand-tile--light" data-reveal style="--i:1">
                <img src="assets/logo/muken-logo-horizontal-light.svg" alt="Logotipo horizontal da MUKEN para fundos claros" width="437" height="56">
                <figcaption>Versão horizontal · fundo claro</figcaption>
              </figure>
              <figure class="brand-tile brand-tile--symbol" data-reveal style="--i:2">
                <img src="assets/logo/muken-symbol.svg" alt="Símbolo da MUKEN: infinito entrelaçado em gradiente azul e roxo" width="219" height="107">
                <figcaption>Símbolo · infinito entrelaçado</figcaption>
              </figure>
              <figure class="brand-tile brand-tile--favicon" data-reveal style="--i:3">
                <img src="assets/icons/favicon.svg" alt="Versão reduzida do símbolo usada como favicon" width="96" height="96">
                <figcaption>Versão reduzida · favicon</figcaption>
              </figure>
            </div>
            <ul class="palette" aria-label="Paleta de cores da marca">
              ${PALETTE.map(([name, hex, use], i) => `
                <li data-reveal style="--i:${i}">
                  <button type="button" class="swatch" data-action="copy" data-copy="${hex}" data-copy-label="Cor ${name} (${hex}) copiada." aria-label="Copiar ${name}, ${hex}">
                    <span class="swatch__color" style="background:${hex}"></span>
                    <span class="swatch__name">${name}</span>
                    <code class="swatch__hex">${hex}</code>
                    <span class="swatch__use">${use}</span>
                  </button>
                </li>`).join('')}
            </ul>
            <div class="type-specimen" data-reveal>
              <div><p class="type-specimen__label">Títulos · Archivo Expanded</p><p class="type-specimen__display">Beyond 2026</p></div>
              <div><p class="type-specimen__label">Textos e interface · Inter</p><p class="type-specimen__body">Tecnologia, moda e lifestyle com legibilidade em qualquer tela. 0123456789</p></div>
              <div><p class="type-specimen__label">Dados técnicos · JetBrains Mono</p><p class="type-specimen__mono">MK-TEC-001 · R$ 1.599,00 · 40 h</p></div>
              <div><p class="type-specimen__label">Elementos gráficos · Noto Sans JP</p><p class="type-specimen__jp"><span lang="ja">無限 六眼 蒼</span><small>Infinito · Seis Olhos · Azul</small></p></div>
            </div>
          </div>
        </section>

        <section class="section section--tight">
          <div class="container">
            <div class="academic-note card card--pad" data-reveal>
              <span class="academic-note__icon">${icon('info')}</span>
              <div>
                <h2 class="h3">Nota acadêmica</h2>
                <p>A MUKEN STORE é uma <strong>loja conceitual</strong> desenvolvida como atividade acadêmica com a metodologia <strong>Vibe Coding</strong>. O nome e a identidade fazem referência conceitual ao infinito presente no universo de <em>Jujutsu Kaisen</em> (associado ao personagem Satoru Gojo), traduzida em uma identidade visual original — sem uso de personagens, logotipos, imagens ou artes oficiais da franquia, e sem qualquer vínculo com seus detentores. Produtos, preços, avaliações e pedidos são fictícios.</p>
              </div>
            </div>
            <div class="about-cta" data-reveal>
              <h2 class="h2">Pronto para ir além?</h2>
              <a class="btn btn--primary btn--lg" href="#/catalogo">Explorar a coleção ${icon('arrow-right', 'btn__arrow')}</a>
            </div>
          </div>
        </section>`;
    },
  };

  /* ==================================================================
     CONTATO (formulário validado + FAQ)
     ================================================================== */
  const SUBJECTS = ['Dúvida sobre produto', 'Acompanhamento de pedido', 'Trocas e devoluções', 'Parcerias e imprensa', 'Outro assunto'];
  const FAQ = [
    ['Os pagamentos são reais?', 'Não. A MUKEN STORE é um projeto acadêmico: PIX, cartão e boleto são simulados e nenhum valor é cobrado. Nunca digite dados reais de cartão.'],
    ['Como usar os cupons?', 'No carrinho, digite MUKEN10, INFINITO15 (a partir de R$ 500), BEYOND50 (a partir de R$ 350) ou FRETEZERO e clique em “Aplicar”.'],
    ['Qual é o prazo de entrega?', 'O prazo é estimado pelo CEP: de 2 a 12 dias úteis na entrega padrão e de 1 a 6 dias úteis na expressa. A entrega é simulada.'],
    ['Como funciona a troca?', 'Na proposta da marca, trocas são gratuitas em até 30 dias após o recebimento. Como a loja é conceitual, nenhum envio real acontece.'],
    ['Onde ficam salvos meus dados?', 'Somente no LocalStorage do seu navegador. Você pode ver e apagar tudo na página de Política de Privacidade.'],
  ];

  function contactFormHTML() {
    const orders = MK.orders ? MK.orders.list().slice(0, 10) : [];
    return `
      <form class="contact-form card card--pad" data-contact-form novalidate>
        <h2 class="h3">Envie uma mensagem</h2>
        <div class="form-grid">
          <div class="field field--half">
            <label class="field__label" for="ct-name">Nome<span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="ct-name" name="name" autocomplete="name" maxlength="80" required aria-required="true" aria-describedby="ct-name-error">
            <p class="field-error" id="ct-name-error" aria-live="polite"></p>
          </div>
          <div class="field field--half">
            <label class="field__label" for="ct-email">E-mail<span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="ct-email" name="email" type="email" autocomplete="email" maxlength="80" required aria-required="true" aria-describedby="ct-email-error">
            <p class="field-error" id="ct-email-error" aria-live="polite"></p>
          </div>
          <div class="field field--half">
            <label class="field__label" for="ct-subject">Assunto<span class="req" aria-hidden="true">*</span></label>
            <select class="select" id="ct-subject" name="subject" required aria-required="true" aria-describedby="ct-subject-error">
              <option value="">Selecione</option>${SUBJECTS.map((s) => `<option>${s}</option>`).join('')}
            </select>
            <p class="field-error" id="ct-subject-error" aria-live="polite"></p>
          </div>
          <div class="field field--half">
            <label class="field__label" for="ct-order">Pedido relacionado<span class="opt">(opcional)</span></label>
            <select class="select" id="ct-order" name="order">
              <option value="">${orders.length ? 'Nenhum' : 'Você ainda não tem pedidos'}</option>
              ${orders.map((o) => `<option value="${esc(o.id)}">${esc(o.id)} — ${MK.utils.formatShortDate(o.createdAt)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <div class="field__row">
              <label class="field__label" for="ct-message">Mensagem<span class="req" aria-hidden="true">*</span></label>
              <span class="field-hint" data-char-count aria-live="polite">0/500</span>
            </div>
            <textarea class="textarea" id="ct-message" name="message" maxlength="500" required aria-required="true" aria-describedby="ct-message-hint ct-message-error"></textarea>
            <p class="field-hint" id="ct-message-hint">Mínimo de 20 caracteres.</p>
            <p class="field-error" id="ct-message-error" aria-live="polite"></p>
          </div>
        </div>
        <label class="check">
          <input type="checkbox" name="consent" aria-describedby="ct-consent-error">
          <span class="check__box">${icon('check')}</span>
          <span>Autorizo o uso destes dados apenas para responder ao meu contato, conforme a <a class="text-link" href="#/privacidade">Política de Privacidade</a>.<span class="req" aria-hidden="true">*</span></span>
        </label>
        <p class="field-error" id="ct-consent-error" aria-live="polite"></p>
        <button class="btn btn--primary btn--lg" type="submit">${icon('mail')}Enviar mensagem</button>
        <p class="small muted">Envio simulado: a mensagem fica registrada apenas neste navegador.</p>
      </form>`;
  }

  MK.views.contact = {
    title: 'Contato',
    render() {
      return `
        <section class="container page-body">
          <div class="page-head">
            <nav class="breadcrumb" aria-label="Você está em"><ol><li><a href="#/">Início</a></li><li><span aria-current="page">Contato</span></li></ol></nav>
            <p class="eyebrow">Atendimento</p>
            <h1 class="h1">Fale com a MUKEN</h1>
            <p>Dúvidas sobre produtos, pedidos ou trocas? Envie uma mensagem — o atendimento é simulado, mas o formulário funciona de verdade.</p>
          </div>
          <div class="contact-layout">
            <div data-contact-slot>${contactFormHTML()}</div>
            <aside class="contact-aside">
              <ul class="contact-channels">
                <li class="card card--pad">${icon('mail')}<div><h2 class="contact-channels__title">E-mail</h2><p>atendimento@muken.example</p><p class="small muted">Endereço fictício (domínio reservado para exemplos)</p></div></li>
                <li class="card card--pad">${icon('chat')}<div><h2 class="contact-channels__title">Chat</h2><p>Seg. a sex., das 9h às 18h</p><p class="small muted">Canal conceitual</p></div></li>
                <li class="card card--pad">${icon('map-pin')}<div><h2 class="contact-channels__title">Showroom</h2><p>São Paulo, SP — Brasil</p><p class="small muted">Localização conceitual</p></div></li>
              </ul>
              <div class="faq">
                <h2 class="h3">Perguntas frequentes</h2>
                <div class="accordion">
                  ${FAQ.map(([q, a], i) => `
                    <details ${i === 0 ? 'open' : ''}>
                      <summary>${q}${icon('plus')}</summary>
                      <div class="accordion__content"><p>${a}</p></div>
                    </details>`).join('')}
                </div>
              </div>
            </aside>
          </div>
        </section>`;
    },
    mount(root) {
      const slot = $('[data-contact-slot]', root);

      const bind = () => {
        const form = $('[data-contact-form]', slot);
        const counter = $('[data-char-count]', form);
        const rules = {
          name: (v) => (v.trim().length >= 3 ? '' : 'Informe seu nome (mínimo de 3 letras).'),
          email: (v) => (MK.utils.isEmail(v) ? '' : 'Informe um e-mail válido, como nome@dominio.com.'),
          subject: (v) => (v ? '' : 'Selecione o assunto.'),
          message: (v) => (v.trim().length >= 20 ? '' : `Escreva pelo menos 20 caracteres (faltam ${20 - v.trim().length}).`),
        };
        const check = (name) => {
          const input = form.elements[name];
          const message = rules[name](input.value);
          input.setAttribute('aria-invalid', String(Boolean(message)));
          $(`#ct-${name}-error`, form).textContent = message;
          return message;
        };

        form.addEventListener('input', (event) => {
          if (event.target.name === 'message') counter.textContent = `${event.target.value.length}/500`;
          if (rules[event.target.name] && event.target.getAttribute('aria-invalid') === 'true') check(event.target.name);
        });
        form.addEventListener('focusout', (event) => {
          if (rules[event.target.name] && event.target.value.trim()) check(event.target.name);
        });

        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const invalid = Object.keys(rules).filter((name) => check(name));
          const consent = form.elements.consent;
          const consentError = $('#ct-consent-error', form);
          consentError.textContent = consent.checked ? '' : 'É necessário autorizar o uso dos dados para enviar.';
          consent.setAttribute('aria-invalid', String(!consent.checked));
          if (invalid.length || !consent.checked) {
            (invalid.length ? form.elements[invalid[0]] : consent).focus();
            return;
          }
          const button = form.querySelector('button[type="submit"]');
          MK.ui.setBusy(button, true);
          await MK.utils.sleep(900);
          const protocol = `ATD-${MK.utils.randomCode(6)}`;
          const messages = MK.storage.read('messages', []);
          messages.push({
            protocol,
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim(),
            subject: form.elements.subject.value,
            order: form.elements.order.value || null,
            message: form.elements.message.value.trim(),
            sentAt: Date.now(),
          });
          MK.storage.write('messages', messages);
          slot.innerHTML = `
            <div class="contact-success card card--pad" tabindex="-1">
              <div class="success__check" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36"/><path d="M25 41.5 35.5 52 56 30"/></svg></div>
              <h2 class="h2">Mensagem enviada!</h2>
              <p>Obrigado, ${esc(form.elements.name.value.trim().split(/\s+/)[0])}. Seu protocolo é <strong>${protocol}</strong>. Em uma loja real, responderíamos em até 1 dia útil.</p>
              <button class="btn btn--secondary" type="button" data-new-message>${icon('mail')}Enviar outra mensagem</button>
            </div>`;
          $('.contact-success', slot).focus();
          MK.ui.toast({ type: 'success', title: 'Mensagem enviada (simulação)', message: `Protocolo ${protocol}.` });
        });
      };

      slot.addEventListener('click', (event) => {
        if (event.target.closest('[data-new-message]')) {
          slot.innerHTML = contactFormHTML();
          bind();
          $('#ct-name', slot).focus();
        }
      });
      bind();
      return null;
    },
  };

  /* ==================================================================
     POLÍTICA DE PRIVACIDADE (com gestão real dos dados locais)
     ================================================================== */
  function storedDataTable() {
    const S = MK.storage;
    const stored = new Set(S.keys());
    const rows = Object.entries(S.KEYS).map(([key, info]) => {
      const has = stored.has(key);
      return `
        <tr>
          <th scope="row">${esc(info.label)}<br><code>${S.PREFIX}${key}</code></th>
          <td>${esc(info.description)}</td>
          <td>${has ? '<span class="badge badge--info">Salvo</span>' : '<span class="badge badge--neutral">Vazio</span>'}</td>
          <td>${has ? `<button class="btn btn--link small" type="button" data-delete-key="${key}" aria-label="Apagar ${esc(info.label)}">Apagar</button>` : '—'}</td>
        </tr>`;
    }).join('');
    const bytes = S.usage();
    const size = bytes < 1024 ? `${bytes} bytes` : `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
    return `
      <div class="table-wrap">
        <table class="table data-table">
          <caption class="sr-only">Dados da MUKEN salvos neste navegador</caption>
          <thead><tr><th scope="col">Dado</th><th scope="col">Finalidade</th><th scope="col">Situação</th><th scope="col"><span class="sr-only">Ação</span></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="small muted">Espaço ocupado: aproximadamente ${size}${S.isPersistent() ? '' : ' (armazenamento local indisponível: os dados valem apenas para esta sessão)'}.</p>`;
  }

  MK.views.privacy = {
    title: 'Política de Privacidade',
    render() {
      return `
        <section class="container container--narrow page-body">
          <div class="page-head">
            <nav class="breadcrumb" aria-label="Você está em"><ol><li><a href="#/">Início</a></li><li><span aria-current="page">Privacidade</span></li></ol></nav>
            <p class="eyebrow">Transparência</p>
            <h1 class="h1">Política de Privacidade</h1>
            <p>Última atualização: 5 de novembro de 2026. Inspirada nos princípios da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>
          </div>
          <div class="prose">
            <p class="callout">${icon('info')}A MUKEN STORE é uma <strong>loja conceitual de um projeto acadêmico</strong>. Não há servidores, contas de usuário, cobranças ou entregas reais. Use sempre dados fictícios.</p>

            <h2>1. Quais dados tratamos</h2>
            <p>Somente os dados que você mesmo informa ou gera ao usar a loja: itens do carrinho e favoritos, pedidos simulados (com nome, e-mail, telefone, endereço e CPF <strong>mascarado</strong>), mensagens do formulário de contato, e-mail da newsletter e preferências, como o tema.</p>

            <h2>2. Onde os dados ficam</h2>
            <p>Tudo fica no <strong>LocalStorage do seu navegador</strong>, neste dispositivo. Nenhum dado pessoal é enviado para servidores da MUKEN — eles não existem. Outra pessoa que use o mesmo navegador poderá ver essas informações.</p>

            <h2>3. Finalidade</h2>
            <ul>
              <li>Manter carrinho, favoritos e histórico de pedidos entre visitas;</li>
              <li>Preencher o checkout mais rápido, apenas se você autorizar “salvar meus dados”;</li>
              <li>Lembrar suas preferências (tema e produtos vistos recentemente).</li>
            </ul>

            <h2>4. Compartilhamento</h2>
            <p>Não compartilhamos dados. A única comunicação externa opcional é a consulta de endereço pelo CEP no checkout: quando você digita um CEP, <strong>apenas o CEP</strong> é enviado ao serviço público ViaCEP para preencher rua, cidade e estado. Se preferir, preencha o endereço manualmente.</p>

            <h2>5. Cookies</h2>
            <p>A loja não utiliza cookies nem ferramentas de rastreamento ou publicidade. As fontes são hospedadas no próprio site.</p>

            <h2>6. Segurança</h2>
            <p>Nunca solicitamos dados reais de cartão: o checkout usa apenas cartões de teste. O CPF informado é validado no próprio navegador e salvo somente de forma mascarada no pedido.</p>

            <h2>7. Seus direitos</h2>
            <p>Como titular, você pode acessar, corrigir e eliminar seus dados (LGPD, art. 18). Aqui você exerce esses direitos diretamente: veja abaixo o que está salvo e apague o que quiser.</p>
          </div>

          <section class="data-panel card card--pad" aria-labelledby="data-title">
            <h2 class="h3" id="data-title">${icon('shield')} Seus dados neste navegador</h2>
            <div data-stored-data>${storedDataTable()}</div>
            <button class="btn btn--danger" type="button" data-delete-all>${icon('trash')}Apagar todos os meus dados</button>
          </section>

          <div class="prose">
            <h2>8. Contato</h2>
            <p>Dúvidas sobre esta política? Use a página de <a href="#/contato">contato</a> (simulada).</p>
          </div>
        </section>`;
    },
    mount(root) {
      const refresh = () => { $('[data-stored-data]', root).innerHTML = storedDataTable(); };
      root.addEventListener('click', async (event) => {
        const one = event.target.closest('[data-delete-key]');
        if (one) {
          const key = one.dataset.deleteKey;
          const info = MK.storage.KEYS[key];
          const ok = await MK.ui.confirm({ title: `Apagar “${info.label}”?`, message: info.description, confirmLabel: 'Apagar' });
          if (!ok) return;
          MK.storage.remove(key);
          if (key === 'cart' || key === 'coupon') MK.cart.reload();
          if (key === 'favorites') MK.favorites.reload();
          if (key === 'inventory') MK.inventory.reset();
          if (key === 'theme') {
            MK.theme.set('dark'); // volta ao padrão da marca e sincroniza os botões
            MK.storage.remove('theme');
          }
          refresh();
          MK.ui.toast({ type: 'success', title: 'Dado apagado', message: `${info.label} foi removido deste navegador.` });
          return;
        }
        if (event.target.closest('[data-delete-all]')) {
          const ok = await MK.ui.confirm({
            title: 'Apagar todos os dados?',
            message: 'Carrinho, favoritos, pedidos, estoque simulado, preferências e mensagens serão apagados deste navegador. A página será recarregada.',
            confirmLabel: 'Apagar tudo',
          });
          if (!ok) return;
          MK.storage.clearAll();
          MK.ui.toast({ type: 'success', title: 'Dados apagados', message: 'Recarregando a loja…' });
          setTimeout(() => window.location.reload(), 900);
        }
      });
      return null;
    },
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
