/* =====================================================================
   MUKEN STORE — pages.js
   Páginas (views) renderizadas pelo roteador: início, sobre, contato,
   privacidade e 404. Cada view expõe:
     - title:  título da aba
     - render: retorna o HTML da página
     - mount:  liga eventos após a renderização (retorna função de limpeza)
   ===================================================================== */
(function (MK) {
  'use strict';

  const { icon } = MK.ui;

  const ORBIT_PATH = 'M568.0 150.0 L567.4 163.1 L565.5 176.0 L562.5 188.6 L558.4 200.5 L553.2 211.7 L547.1 222.1 L540.2 231.5 L532.7 239.9 L524.5 247.1 L516.0 253.3 L507.1 258.4 L498.0 262.4 L488.8 265.3 L479.5 267.2 L470.3 268.3 L461.1 268.4 L452.1 267.7 L443.3 266.4 L434.7 264.3 L426.3 261.7 L418.2 258.5 L410.3 254.8 L402.6 250.7 L395.2 246.3 L388.0 241.5 L381.1 236.4 L374.4 231.1 L367.8 225.5 L361.5 219.8 L355.3 213.9 L349.3 207.9 L343.5 201.7 L337.8 195.4 L332.2 189.1 L326.6 182.7 L321.2 176.2 L315.9 169.7 L310.5 163.1 L305.3 156.6 L300.0 150.0 L294.7 143.4 L289.5 136.9 L284.1 130.3 L278.8 123.8 L273.4 117.3 L267.8 110.9 L262.2 104.6 L256.5 98.3 L250.7 92.1 L244.7 86.1 L238.5 80.2 L232.2 74.5 L225.6 68.9 L218.9 63.6 L212.0 58.5 L204.8 53.7 L197.4 49.3 L189.7 45.2 L181.8 41.5 L173.7 38.3 L165.3 35.7 L156.7 33.6 L147.9 32.3 L138.9 31.6 L129.7 31.7 L120.5 32.8 L111.2 34.7 L102.0 37.6 L92.9 41.6 L84.0 46.7 L75.5 52.9 L67.3 60.1 L59.8 68.5 L52.9 77.9 L46.8 88.3 L41.6 99.5 L37.5 111.4 L34.5 124.0 L32.6 136.9 L32.0 150.0 L32.6 163.1 L34.5 176.0 L37.5 188.6 L41.6 200.5 L46.8 211.7 L52.9 222.1 L59.8 231.5 L67.3 239.9 L75.5 247.1 L84.0 253.3 L92.9 258.4 L102.0 262.4 L111.2 265.3 L120.5 267.2 L129.7 268.3 L138.9 268.4 L147.9 267.7 L156.7 266.4 L165.3 264.3 L173.7 261.7 L181.8 258.5 L189.7 254.8 L197.4 250.7 L204.8 246.3 L212.0 241.5 L218.9 236.4 L225.6 231.1 L232.2 225.5 L238.5 219.8 L244.7 213.9 L250.7 207.9 L256.5 201.7 L262.2 195.4 L267.8 189.1 L273.4 182.7 L278.8 176.2 L284.1 169.7 L289.5 163.1 L294.7 156.6 L300.0 150.0 L305.3 143.4 L310.5 136.9 L315.9 130.3 L321.2 123.8 L326.6 117.3 L332.2 110.9 L337.8 104.6 L343.5 98.3 L349.3 92.1 L355.3 86.1 L361.5 80.2 L367.8 74.5 L374.4 68.9 L381.1 63.6 L388.0 58.5 L395.2 53.7 L402.6 49.3 L410.3 45.2 L418.2 41.5 L426.3 38.3 L434.7 35.7 L443.3 33.6 L452.1 32.3 L461.1 31.6 L470.3 31.7 L479.5 32.8 L488.8 34.7 L498.0 37.6 L507.1 41.6 L516.0 46.7 L524.5 52.9 L532.7 60.1 L540.2 68.5 L547.1 77.9 L553.2 88.3 L558.4 99.5 L562.5 111.4 L565.5 124.0 L567.4 136.9Z';

  /* ------------------------------------------------------------------
     HERO — "BEYOND EVERY LIMIT."
     ------------------------------------------------------------------ */
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
      ['shield', 'Garantia MUKEN de 2 anos'],
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

  /* ------------------------------------------------------------------
     VIEW: Início
     ------------------------------------------------------------------ */
  MK.views.home = {
    title: 'MUKEN STORE — Beyond Every Limit.',
    render() {
      return `${heroSection()}${marquee()}`;
    },
    mount(root) {
      const cleanups = [mountParallax(root)];
      return () => cleanups.forEach((fn) => typeof fn === 'function' && fn());
    },
  };

  /* ------------------------------------------------------------------
     VIEW: 404 (rota inexistente)
     ------------------------------------------------------------------ */
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
