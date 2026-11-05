/* =====================================================================
   MUKEN STORE — checkout.js
   Finalização de compra DEMONSTRATIVA (nenhum pagamento real):
   - assistente em 3 etapas: identificação, entrega e pagamento
   - máscaras (CPF, telefone, CEP) e validação acessível campo a campo
   - CPF validado pelos dígitos verificadores + gerador de CPF de teste
   - endereço preenchido pelo CEP (ViaCEP, opcional) com fallback manual
   - PIX simulado, cartão simulado (somente cartões de TESTE, sem digitar
     número real) e boleto demonstrativo
   - resumo dinâmico, número do pedido e tela de sucesso
   ===================================================================== */
(function (MK) {
  'use strict';

  const { escapeHTML: esc, formatPrice, onlyDigits, roundMoney, $, $$ } = MK.utils;
  const { icon } = MK.ui;

  const UFS = [
    ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'],
    ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'],
    ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
    ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
    ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
    ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
  ];

  /** Cartões de TESTE (números públicos de teste; nenhum dado real é solicitado). */
  const TEST_CARDS = [
    { id: 'approved-a', label: 'Cartão de teste A', number: '4242 4242 4242 4242', last4: '4242', result: 'approved', hint: 'Pagamento aprovado' },
    { id: 'approved-b', label: 'Cartão de teste B', number: '5555 5555 5555 4444', last4: '4444', result: 'approved', hint: 'Pagamento aprovado' },
    { id: 'declined', label: 'Cartão de teste C', number: '4000 0000 0000 0002', last4: '0002', result: 'declined', hint: 'Simula pagamento recusado' },
  ];

  /* ==================================================================
     MÁSCARAS E VALIDAÇÕES
     ================================================================== */
  const masks = {
    cpf(value) {
      const d = onlyDigits(value).slice(0, 11);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
      if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    },
    phone(value) {
      const d = onlyDigits(value).slice(0, 11);
      if (!d) return '';
      if (d.length <= 2) return `(${d}`;
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    },
    cep(value) {
      return MK.shipping.maskCEP(value);
    },
  };

  /** Validação oficial do CPF (dígitos verificadores módulo 11). */
  function isValidCPF(value) {
    const d = onlyDigits(value);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    const digit = (len) => {
      let sum = 0;
      for (let i = 0; i < len; i += 1) sum += Number(d[i]) * (len + 1 - i);
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };
    return digit(9) === Number(d[9]) && digit(10) === Number(d[10]);
  }

  /** Gera um CPF FICTÍCIO matematicamente válido, apenas para testes. */
  function generateTestCPF() {
    const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    if (base.every((n) => n === base[0])) base[8] = (base[8] + 1) % 10;
    const calc = (arr) => {
      const sum = arr.reduce((acc, n, i) => acc + n * (arr.length + 1 - i), 0);
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };
    base.push(calc(base));
    base.push(calc(base));
    return masks.cpf(base.join(''));
  }

  const validators = {
    name(v) {
      const value = v.trim();
      if (!value) return 'Informe seu nome completo.';
      if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(value)) return 'Use apenas letras no nome.';
      const parts = value.split(/\s+/).filter((p) => p.replace(/[.'-]/g, '').length >= 1);
      if (parts.length < 2) return 'Informe nome e sobrenome.';
      return '';
    },
    email(v) {
      if (!v.trim()) return 'Informe seu e-mail.';
      return MK.utils.isEmail(v) ? '' : 'E-mail inválido. Exemplo: nome@dominio.com';
    },
    cpf(v) {
      const d = onlyDigits(v);
      if (!d) return 'Informe um CPF fictício (use “Gerar CPF de teste”).';
      if (d.length !== 11) return 'O CPF deve ter 11 números.';
      return isValidCPF(d) ? '' : 'CPF inválido. Confira os números ou gere um CPF de teste.';
    },
    phone(v) {
      const d = onlyDigits(v);
      if (!d) return 'Informe um telefone com DDD.';
      if (d.length < 10) return 'Telefone incompleto: inclua o DDD e o número.';
      if (Number(d.slice(0, 2)) < 11) return 'DDD inválido.';
      if (d.length === 11 && d[2] !== '9') return 'Celular com 11 dígitos deve começar com 9 após o DDD.';
      return '';
    },
    cep(v) {
      const d = onlyDigits(v);
      if (!d) return 'Informe o CEP.';
      return d.length === 8 ? '' : 'O CEP deve ter 8 números.';
    },
    street(v) {
      return v.trim().length >= 3 ? '' : 'Informe o endereço (rua, avenida, bairro).';
    },
    number(v) {
      const value = v.trim();
      if (!value) return 'Informe o número (ou S/N).';
      return /^(\d{1,6}[A-Za-z]?|s\/?n)$/i.test(value) ? '' : 'Use apenas números ou “S/N”.';
    },
    complement(v) {
      return v.length > 60 ? 'Use no máximo 60 caracteres.' : '';
    },
    city(v) {
      const value = v.trim();
      if (value.length < 2) return 'Informe a cidade.';
      return /\d/.test(value) ? 'A cidade não deve conter números.' : '';
    },
    state(v) {
      return UFS.some(([uf]) => uf === v) ? '' : 'Selecione o estado.';
    },
  };

  const STEP_FIELDS = {
    1: ['name', 'email', 'cpf', 'phone'],
    2: ['cep', 'street', 'number', 'complement', 'city', 'state'],
    3: [],
  };

  const FIELD_LABELS = {
    name: 'Nome completo', email: 'E-mail', cpf: 'CPF', phone: 'Telefone', cep: 'CEP',
    street: 'Endereço', number: 'Número', complement: 'Complemento', city: 'Cidade', state: 'Estado',
  };

  /* ==================================================================
     CONSULTA DE CEP (ViaCEP) — melhoria opcional, com fallback manual
     ================================================================== */
  async function lookupCEP(cep) {
    const digits = onlyDigits(cep);
    if (digits.length !== 8 || !/^https?:$/.test(window.location.protocol) || typeof fetch !== 'function') return { ok: false, reason: 'unavailable' };
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => controller && controller.abort(), 5000);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, controller ? { signal: controller.signal } : {});
      if (!response.ok) return { ok: false, reason: 'http' };
      const data = await response.json();
      if (data.erro) return { ok: false, reason: 'not-found' };
      return {
        ok: true,
        street: [data.logradouro, data.bairro].filter(Boolean).join(' — '),
        city: data.localidade || '',
        state: data.uf || '',
      };
    } catch (error) {
      return { ok: false, reason: 'network' };
    } finally {
      clearTimeout(timer);
    }
  }

  /* ==================================================================
     PAGAMENTOS SIMULADOS: códigos PIX/boleto e QR ilustrativo
     ================================================================== */
  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededDigits(seed, length) {
    let x = hash(seed) || 1;
    let out = '';
    for (let i = 0; i < length; i += 1) {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
      out += String(x % 10);
    }
    return out;
  }

  function pixCode(orderId, total) {
    return `MUKEN-PIX-DEMO-${orderId}-${String(Math.round(total * 100)).padStart(8, '0')}-${seededDigits(orderId, 6)}`;
  }

  function boletoLine(orderId, total) {
    const d = `03399${seededDigits(`${orderId}b`, 33)}${String(Math.round(total * 100)).padStart(9, '0')}`.slice(0, 47);
    return `${d.slice(0, 5)}.${d.slice(5, 10)} ${d.slice(10, 15)}.${d.slice(15, 21)} ${d.slice(21, 26)}.${d.slice(26, 32)} ${d.slice(32, 33)} ${d.slice(33)}`;
  }

  /** QR Code ILUSTRATIVO (padrão visual determinístico; não realiza pagamento). */
  function demoQR(seed) {
    const n = 29;
    let x = hash(seed) || 7;
    const rand = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967295; };
    const finder = (r, c) => {
      const inBox = (r0, c0) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
      for (const [r0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
        if (inBox(r0, c0)) {
          const rr = r - r0;
          const cc = c - c0;
          return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4) ? 1 : 0;
        }
      }
      const nearFinder = (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
      return nearFinder ? 0 : null;
    };
    let rects = '';
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) {
        const f = finder(r, c);
        const on = f === null ? (r === 6 || c === 6 ? (r + c) % 2 === 0 : rand() > 0.52) : f === 1;
        if (on) rects += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
      }
    }
    return `<svg class="pix-qr" viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="QR Code ilustrativo do PIX (não realiza pagamento)"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><g fill="#0B1220">${rects}</g></svg>`;
  }

  function businessDaysFrom(date, days) {
    const d = new Date(date);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added += 1;
    }
    d.setHours(23, 59, 0, 0);
    return d.getTime();
  }

  /* ==================================================================
     TEMPLATES DO CHECKOUT
     ================================================================== */
  function field({ id, name, label, type = 'text', autocomplete = '', inputmode = '', placeholder = '', required = true, value = '', cls = '', hint = '', maxlength = '', extra = '' }) {
    const describedBy = [`${id}-error`, hint ? `${id}-hint` : ''].filter(Boolean).join(' ');
    return `
      <div class="field ${cls}">
        <label class="field__label" for="${id}">${label}${required ? '<span class="req" aria-hidden="true">*</span>' : '<span class="opt">(opcional)</span>'}</label>
        <input class="input" id="${id}" name="${name}" type="${type}" value="${esc(value)}"
          ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${inputmode ? `inputmode="${inputmode}"` : ''}
          ${placeholder ? `placeholder="${esc(placeholder)}"` : ''} ${maxlength ? `maxlength="${maxlength}"` : ''}
          ${required ? 'required aria-required="true"' : ''} aria-describedby="${describedBy}">
        ${extra}
        ${hint ? `<p class="field-hint" id="${id}-hint">${hint}</p>` : ''}
        <p class="field-error" id="${id}-error" aria-live="polite"></p>
      </div>`;
  }

  function stepper(current, completed) {
    const steps = [[1, 'Identificação', 'user'], [2, 'Entrega', 'truck'], [3, 'Pagamento', 'card']];
    return `
      <ol class="stepper" aria-label="Etapas da compra">
        ${steps.map(([n, label, ic]) => {
          const done = completed.has(n) && n !== current;
          const state = n === current ? 'is-current' : done ? 'is-done' : '';
          return `
            <li class="stepper__step ${state}" ${n === current ? 'aria-current="step"' : ''}>
              <button type="button" class="stepper__btn" data-goto-step="${n}" ${done ? '' : 'disabled'} aria-label="Etapa ${n}: ${label}${done ? ' (concluída, editar)' : n === current ? ' (atual)' : ''}">
                <span class="stepper__num">${done ? icon('check', 'icon--sm') : icon(ic, 'icon--sm')}</span>
                <span class="stepper__label"><small>Etapa ${n}</small>${label}</span>
              </button>
            </li>`;
        }).join('<li class="stepper__line" aria-hidden="true"></li>')}
      </ol>`;
  }

  function shippingOptions(state) {
    const totals = MK.cart.totals();
    const cep = onlyDigits(state.data.cep || '');
    const options = MK.shipping.options(totals.subtotal, cep.length === 8 ? cep : null, totals.freeByCoupon);
    return options.map((o) => `
      <label class="option-card">
        <input type="radio" name="shippingMethod" value="${o.id}" ${state.shippingMethod === o.id ? 'checked' : ''}>
        <span class="option-card__radio" aria-hidden="true"></span>
        <span class="option-card__icon">${icon(o.id === 'express' ? 'zap' : 'truck')}</span>
        <span class="option-card__body">
          <span class="option-card__title">${esc(o.label)}</span>
          <span class="option-card__desc">${cep.length === 8 ? esc(o.eta) : 'Informe o CEP para ver o prazo'}</span>
        </span>
        <span class="option-card__aside ${o.price === 0 ? 'text-success' : ''}">${o.price === 0 ? 'Grátis' : formatPrice(o.price)}</span>
      </label>`).join('');
  }

  function paymentOptions(state) {
    const base = MK.cart.totals({ shippingMethod: state.shippingMethod });
    const pixTotals = MK.cart.totals({ shippingMethod: state.shippingMethod, payment: 'pix' });
    const inst = MK.products.installments(base.total);
    const opts = [
      ['pix', 'zap', 'PIX', `5% OFF · ${formatPrice(pixTotals.total)} · aprovação simulada`, formatPrice(pixTotals.total)],
      ['card', 'card', 'Cartão de crédito', `Até ${inst.count}x de ${formatPrice(inst.value)} sem juros · cartões de teste`, formatPrice(base.total)],
      ['boleto', 'barcode', 'Boleto bancário', 'Vence em 3 dias úteis · demonstrativo', formatPrice(base.total)],
    ];
    return opts.map(([id, ic, title, desc, price]) => `
      <label class="option-card">
        <input type="radio" name="payment" value="${id}" ${state.payment === id ? 'checked' : ''}>
        <span class="option-card__radio" aria-hidden="true"></span>
        <span class="option-card__icon">${icon(ic)}</span>
        <span class="option-card__body">
          <span class="option-card__title">${title}</span>
          <span class="option-card__desc">${desc}</span>
        </span>
        <span class="option-card__aside">${price}</span>
      </label>`).join('');
  }

  function paymentPanel(state) {
    if (state.payment === 'card') {
      const card = TEST_CARDS.find((c) => c.id === state.card) || TEST_CARDS[0];
      const totals = MK.cart.totals({ shippingMethod: state.shippingMethod });
      const max = MK.products.installments(totals.total).count;
      const installments = Math.min(state.installments, max);
      const holder = (state.data.name || 'NOME DO TITULAR').toUpperCase();
      return `
        <div class="pay-panel">
          <div class="credit-card ${card.result === 'declined' ? 'credit-card--declined' : ''}" aria-hidden="true">
            <div class="credit-card__top"><span class="credit-card__chip"></span>
              <svg class="credit-card__logo" viewBox="0 0 218.98 107.38"><use href="#logo-symbol"/></svg></div>
            <p class="credit-card__number">${card.number}</p>
            <div class="credit-card__bottom"><span><small>Titular</small>${esc(holder.slice(0, 26))}</span><span><small>Validade</small>12/30</span></div>
            <span class="credit-card__tag">CARTÃO DE TESTE</span>
          </div>
          <fieldset class="test-cards">
            <legend class="field__label">Escolha um cartão de teste <span class="req" aria-hidden="true">*</span></legend>
            ${TEST_CARDS.map((c) => `
              <label class="check check--radio">
                <input type="radio" name="card" value="${c.id}" ${state.card === c.id ? 'checked' : ''}>
                <span class="check__box check__box--radio" aria-hidden="true"></span>
                <span><strong>${c.label}</strong> · final ${c.last4} <span class="muted">— ${c.hint}</span></span>
              </label>`).join('')}
          </fieldset>
          <div class="field">
            <label class="field__label" for="co-installments">Parcelamento</label>
            <select class="select" id="co-installments" name="installments">
              ${Array.from({ length: max }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === installments ? 'selected' : ''}>${n}x de ${formatPrice(roundMoney(totals.total / n))} sem juros${n === 1 ? ' (à vista)' : ''}</option>`).join('')}
            </select>
          </div>
          <p class="callout">${icon('shield')}Por segurança, esta loja conceitual <strong>não solicita nem armazena</strong> número, validade ou código de cartões reais — apenas cartões de teste fictícios.</p>
        </div>`;
    }
    if (state.payment === 'boleto') {
      return `
        <div class="pay-panel">
          <p class="callout">${icon('barcode')}O boleto <strong>demonstrativo</strong> será gerado após a confirmação, com vencimento em 3 dias úteis. A compensação é simulada em alguns minutos.</p>
        </div>`;
    }
    return `
      <div class="pay-panel">
        <p class="callout">${icon('zap')}Após confirmar, exibiremos um <strong>QR Code ilustrativo</strong> e um código “copia e cola” de demonstração. A aprovação é simulada em cerca de 1 minuto.</p>
      </div>`;
  }

  function reviewBlock(state) {
    const d = state.data;
    const cpf = onlyDigits(d.cpf || '');
    const method = { pix: 'PIX (5% OFF)', card: 'Cartão de crédito (teste)', boleto: 'Boleto demonstrativo' }[state.payment];
    const ship = MK.shipping.METHODS[state.shippingMethod];
    return `
      <div class="review-block">
        <h3 class="review-block__title">Revise seu pedido</h3>
        <dl class="review-block__grid">
          <div><dt>${icon('user', 'icon--xs')} Dados</dt><dd>${esc(d.name || '—')}<br>${esc(d.email || '—')}<br>${esc(d.phone || '—')} · CPF ${cpf.length === 11 ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` : '—'}</dd><button type="button" class="btn btn--link small" data-goto-step="1">Editar</button></div>
          <div><dt>${icon('map-pin', 'icon--xs')} Entrega</dt><dd>${esc(d.street || '—')}, ${esc(d.number || '')}${d.complement ? ` — ${esc(d.complement)}` : ''}<br>${esc(d.city || '')}/${esc(d.state || '')} · CEP ${esc(d.cep || '')}<br>${esc(ship.label)}</dd><button type="button" class="btn btn--link small" data-goto-step="2">Editar</button></div>
          <div><dt>${icon('card', 'icon--xs')} Pagamento</dt><dd>${method}</dd></div>
        </dl>
      </div>`;
  }

  function summaryHTML(state) {
    const lines = MK.cart.lines();
    const totals = MK.cart.totals({ shippingMethod: state.shippingMethod, payment: state.payment });
    const rows = [];
    rows.push(`<div class="summary__row"><dt>Subtotal (${MK.utils.pluralize(totals.itemsCount, 'item', 'itens')})</dt><dd>${formatPrice(totals.subtotalOriginal)}</dd></div>`);
    if (totals.productDiscount > 0) rows.push(`<div class="summary__row summary__row--discount"><dt>Descontos em produtos</dt><dd>− ${formatPrice(totals.productDiscount)}</dd></div>`);
    if (totals.coupon && totals.coupon.valid && totals.couponDiscount > 0) rows.push(`<div class="summary__row summary__row--discount"><dt>Cupom ${esc(totals.coupon.code)}</dt><dd>− ${formatPrice(totals.couponDiscount)}</dd></div>`);
    if (totals.coupon && !totals.coupon.valid) rows.push(`<div class="summary__row summary__row--muted"><dt>Cupom ${esc(totals.coupon.code)}</dt><dd>não aplicado</dd></div>`);
    if (totals.pixDiscount > 0) rows.push(`<div class="summary__row summary__row--discount"><dt>Desconto PIX (5%)</dt><dd>− ${formatPrice(totals.pixDiscount)}</dd></div>`);
    rows.push(`<div class="summary__row"><dt>Frete (${state.shippingMethod === 'express' ? 'expresso' : 'padrão'})</dt><dd>${totals.shipping === 0 ? '<span class="text-success">Grátis</span>' : formatPrice(totals.shipping)}</dd></div>`);
    let hint = '';
    if (state.payment === 'card') {
      const n = Math.min(state.installments, MK.products.installments(totals.total).count);
      hint = `<p class="summary__hint">${n}x de ${formatPrice(roundMoney(totals.total / n))} sem juros no cartão de teste</p>`;
    } else if (state.payment === 'pix') {
      hint = `<p class="summary__hint text-success">Você economiza ${formatPrice(totals.totalDiscount)} no total</p>`;
    }
    return `
      <h2 class="h3" id="checkout-summary-title">Resumo do pedido</h2>
      <ul class="mini-lines">
        ${lines.map((l) => `
          <li class="mini-line">
            <span class="mini-line__media"><img src="${esc(l.product.image)}" alt="" width="800" height="800"><span class="mini-line__qty" aria-hidden="true">${l.qty}</span></span>
            <span class="mini-line__name">${esc(l.product.name)}<small>${l.qty} × ${formatPrice(l.unit)}</small></span>
            <span class="mini-line__total">${formatPrice(l.total)}</span>
          </li>`).join('')}
      </ul>
      <a class="btn btn--link small" href="#/carrinho">${icon('arrow-left', 'icon--xs')}Editar carrinho</a>
      <dl class="summary">${rows.join('')}
        <div class="summary__total"><dt>Total</dt><dd data-checkout-total>${formatPrice(totals.total)}</dd></div>
        ${hint}
      </dl>
      <p class="secure-note">${icon('lock', 'icon--sm')}Checkout demonstrativo · nenhuma cobrança real</p>`;
  }

  function checkoutHTML(state) {
    const d = state.data;
    const ufOptions = UFS.map(([uf, name]) => `<option value="${uf}" ${d.state === uf ? 'selected' : ''}>${name} (${uf})</option>`).join('');
    const profileNote = state.profileLoaded
      ? `<p class="callout callout--success profile-note">${icon('check-circle')}<span>Preenchemos com os dados salvos neste navegador. <button type="button" class="btn btn--link" data-forget-profile>Esquecer meus dados</button></span></p>`
      : '';

    return `
      <section class="container page-body checkout">
        <div class="page-head">
          <nav class="breadcrumb" aria-label="Você está em"><ol><li><a href="#/">Início</a></li><li><a href="#/carrinho">Carrinho</a></li><li><span aria-current="page">Checkout</span></li></ol></nav>
          <h1 class="h1">Finalizar compra</h1>
          <p>Checkout 100% simulado para fins acadêmicos: use dados fictícios. Campos com <span class="req-inline">*</span> são obrigatórios.</p>
        </div>

        <div data-stepper>${stepper(state.step, state.completed)}</div>

        <div class="checkout__layout">
          <form class="checkout__form" data-checkout-form novalidate>
            <div class="callout callout--danger error-summary" data-error-summary tabindex="-1" hidden></div>
            ${profileNote}

            <fieldset class="checkout-step" data-step="1" ${state.step === 1 ? '' : 'hidden'}>
              <legend class="checkout-step__title"><span class="checkout-step__num">1</span>Seus dados</legend>
              <div class="form-grid">
                ${field({ id: 'co-name', name: 'name', label: 'Nome completo', autocomplete: 'name', placeholder: 'Ex.: Ana Souza', value: d.name, maxlength: 80 })}
                ${field({ id: 'co-email', name: 'email', label: 'E-mail', type: 'email', autocomplete: 'email', inputmode: 'email', placeholder: 'nome@dominio.com', value: d.email, cls: 'field--half', maxlength: 80 })}
                ${field({ id: 'co-phone', name: 'phone', label: 'Telefone', type: 'tel', autocomplete: 'tel-national', inputmode: 'tel', placeholder: '(11) 91234-5678', value: d.phone, cls: 'field--half', maxlength: 15 })}
                ${field({
                  id: 'co-cpf', name: 'cpf', label: 'CPF (fictício)', inputmode: 'numeric', placeholder: '000.000.000-00', value: d.cpf, maxlength: 14,
                  hint: 'Use apenas um CPF fictício. Ele é validado, mas nunca é enviado a nenhum servidor.',
                  extra: `<button type="button" class="btn btn--link small field__action" data-generate-cpf>${icon('sparkles', 'icon--xs')}Gerar CPF de teste</button>`,
                })}
              </div>
              <div class="checkout-step__actions">
                <a class="btn btn--ghost" href="#/carrinho">${icon('arrow-left')}Voltar ao carrinho</a>
                <button class="btn btn--primary" type="button" data-next-step>Continuar para entrega ${icon('arrow-right', 'btn__arrow')}</button>
              </div>
            </fieldset>

            <fieldset class="checkout-step" data-step="2" ${state.step === 2 ? '' : 'hidden'}>
              <legend class="checkout-step__title"><span class="checkout-step__num">2</span>Endereço de entrega</legend>
              <div class="form-grid">
                ${field({
                  id: 'co-cep', name: 'cep', label: 'CEP', inputmode: 'numeric', autocomplete: 'postal-code', placeholder: '00000-000', value: d.cep, cls: 'field--third', maxlength: 9,
                  extra: '<span class="field__status" data-cep-status aria-live="polite"></span>',
                })}
                ${field({ id: 'co-street', name: 'street', label: 'Endereço', autocomplete: 'address-line1', placeholder: 'Rua, avenida e bairro', value: d.street, cls: 'field--two-thirds', maxlength: 120 })}
                ${field({ id: 'co-number', name: 'number', label: 'Número', inputmode: 'numeric', placeholder: 'Ex.: 1200', value: d.number, cls: 'field--third', maxlength: 8 })}
                ${field({ id: 'co-complement', name: 'complement', label: 'Complemento', autocomplete: 'address-line2', placeholder: 'Apto, bloco, referência', value: d.complement, cls: 'field--two-thirds', required: false, maxlength: 60 })}
                ${field({ id: 'co-city', name: 'city', label: 'Cidade', autocomplete: 'address-level2', placeholder: 'Ex.: São Paulo', value: d.city, cls: 'field--two-thirds', maxlength: 60 })}
                <div class="field field--third">
                  <label class="field__label" for="co-state">Estado<span class="req" aria-hidden="true">*</span></label>
                  <select class="select" id="co-state" name="state" autocomplete="address-level1" required aria-required="true" aria-describedby="co-state-error">
                    <option value="">Selecione</option>${ufOptions}
                  </select>
                  <p class="field-error" id="co-state-error" aria-live="polite"></p>
                </div>
              </div>
              <fieldset class="option-group">
                <legend class="field__label">Forma de entrega</legend>
                <div class="option-list" data-shipping-options>${shippingOptions(state)}</div>
              </fieldset>
              <div class="checkout-step__actions">
                <button class="btn btn--ghost" type="button" data-prev-step>${icon('arrow-left')}Voltar</button>
                <button class="btn btn--primary" type="button" data-next-step>Continuar para pagamento ${icon('arrow-right', 'btn__arrow')}</button>
              </div>
            </fieldset>

            <fieldset class="checkout-step" data-step="3" ${state.step === 3 ? '' : 'hidden'}>
              <legend class="checkout-step__title"><span class="checkout-step__num">3</span>Pagamento</legend>
              <div class="option-list" data-payment-options role="radiogroup" aria-label="Forma de pagamento">${paymentOptions(state)}</div>
              <div data-payment-panel>${paymentPanel(state)}</div>
              <div data-review>${reviewBlock(state)}</div>
              <div class="checkout-consents">
                <label class="check">
                  <input type="checkbox" name="terms" ${state.terms ? 'checked' : ''} aria-describedby="co-terms-error">
                  <span class="check__box">${icon('check')}</span>
                  <span>Li e concordo com a <a class="text-link" href="#/privacidade" target="_blank" rel="noopener">Política de Privacidade</a> e entendo que esta é uma <strong>compra simulada</strong>.<span class="req" aria-hidden="true">*</span></span>
                </label>
                <p class="field-error" id="co-terms-error" aria-live="polite"></p>
                <label class="check">
                  <input type="checkbox" name="saveProfile" ${state.saveProfile ? 'checked' : ''}>
                  <span class="check__box">${icon('check')}</span>
                  <span>Salvar nome, contato e endereço neste navegador para as próximas compras (o CPF nunca é salvo).</span>
                </label>
              </div>
              <div class="callout callout--danger" data-payment-error role="alert" hidden></div>
              <div class="checkout-step__actions">
                <button class="btn btn--ghost" type="button" data-prev-step>${icon('arrow-left')}Voltar</button>
                <button class="btn btn--primary btn--lg" type="submit" data-confirm-order>${icon('lock')}Confirmar pedido</button>
              </div>
            </fieldset>
          </form>

          <aside class="checkout__summary card card--pad" aria-labelledby="checkout-summary-title" data-checkout-summary>
            ${summaryHTML(state)}
          </aside>
        </div>
      </section>`;
  }

  function emptyCheckout() {
    return `
      <section class="container page-body">
        <div class="page-head">
          <nav class="breadcrumb" aria-label="Você está em"><ol><li><a href="#/">Início</a></li><li><span aria-current="page">Checkout</span></li></ol></nav>
          <h1 class="h1">Finalizar compra</h1>
        </div>
        ${MK.ui.emptyState({
          iconName: 'bag',
          title: 'Não há itens para finalizar',
          text: 'Seu carrinho está vazio. Adicione produtos para continuar com a compra simulada.',
          actions: `<a class="btn btn--primary" href="#/catalogo">${icon('grid')}Explorar catálogo</a><a class="btn btn--secondary" href="#/pedidos">${icon('package')}Meus pedidos</a>`,
        })}
      </section>`;
  }

  /* ==================================================================
     VIEW: CHECKOUT
     ================================================================== */
  function initialState() {
    const profile = MK.storage.read('profile', null);
    const data = { name: '', email: '', cpf: '', phone: '', cep: '', street: '', number: '', complement: '', city: '', state: '' };
    let profileLoaded = false;
    if (profile && typeof profile === 'object') {
      ['name', 'email', 'phone', 'cep', 'street', 'number', 'complement', 'city', 'state'].forEach((key) => {
        if (typeof profile[key] === 'string') data[key] = profile[key];
      });
      profileLoaded = Boolean(profile.name);
    }
    return {
      step: 1,
      completed: new Set(),
      data,
      shippingMethod: 'standard',
      payment: 'pix',
      card: TEST_CARDS[0].id,
      installments: 1,
      terms: false,
      saveProfile: profileLoaded,
      profileLoaded,
      processing: false,
    };
  }

  MK.views.checkout = {
    title: 'Finalizar compra',

    render() {
      if (MK.cart.isEmpty()) return emptyCheckout();
      this.state = initialState();
      return checkoutHTML(this.state);
    },

    mount(root) {
      if (MK.cart.isEmpty()) return null;
      const state = this.state || initialState();
      const form = $('[data-checkout-form]', root);
      const summary = $('[data-checkout-summary]', root);
      const errorSummary = $('[data-error-summary]', root);
      let cepTimer = null;
      let lastLookup = '';

      /* ---------- leitura e validação ---------- */
      const readData = () => {
        Object.keys(state.data).forEach((key) => {
          if (form.elements[key]) state.data[key] = form.elements[key].value;
        });
      };

      const showFieldError = (input, message) => {
        const error = $(`#${input.id}-error`, root);
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        input.classList.toggle('is-valid', !message && input.value.trim() !== '');
        if (error) error.textContent = message;
      };

      const validateField = (name) => {
        const input = form.elements[name];
        if (!input || !validators[name]) return '';
        const message = validators[name](input.value);
        showFieldError(input, message);
        return message;
      };

      const validateStep = (step) => {
        const errors = [];
        STEP_FIELDS[step].forEach((name) => {
          const message = validateField(name);
          if (message) errors.push({ name, message });
        });
        if (step === 3) {
          const terms = form.elements.terms;
          const termsError = $('#co-terms-error', root);
          if (!terms.checked) {
            errors.push({ name: 'terms', message: 'Aceite os termos para confirmar o pedido.' });
            terms.setAttribute('aria-invalid', 'true');
            termsError.textContent = 'Você precisa aceitar os termos para confirmar o pedido.';
          } else {
            terms.removeAttribute('aria-invalid');
            termsError.textContent = '';
          }
        }
        return errors;
      };

      const renderErrorSummary = (errors) => {
        if (!errors.length) {
          errorSummary.hidden = true;
          errorSummary.innerHTML = '';
          return;
        }
        errorSummary.innerHTML = `
          ${icon('alert')}
          <div>
            <p><strong>Corrija ${errors.length === 1 ? 'o campo abaixo' : `os ${errors.length} campos abaixo`} para continuar:</strong></p>
            <ul>${errors.map((e) => `<li><a href="#" data-focus-field="${e.name}">${FIELD_LABELS[e.name] || 'Termos'}: ${esc(e.message)}</a></li>`).join('')}</ul>
          </div>`;
        errorSummary.hidden = false;
      };

      /* ---------- navegação entre etapas ---------- */
      const refreshStepper = () => {
        $('[data-stepper]', root).innerHTML = stepper(state.step, state.completed);
      };

      const refreshSummary = () => {
        summary.innerHTML = summaryHTML(state);
        MK.ui.settleMedia(summary);
      };

      const refreshDynamic = () => {
        readData();
        $('[data-shipping-options]', root).innerHTML = shippingOptions(state);
        $('[data-payment-options]', root).innerHTML = paymentOptions(state);
        $('[data-payment-panel]', root).innerHTML = paymentPanel(state);
        $('[data-review]', root).innerHTML = reviewBlock(state);
        refreshSummary();
      };

      const goToStep = (step, { focus = true } = {}) => {
        state.step = step;
        $$('[data-step]', root).forEach((fs) => { fs.hidden = Number(fs.dataset.step) !== step; });
        renderErrorSummary([]);
        refreshStepper();
        if (step === 3) refreshDynamic();
        const fieldset = $(`[data-step="${step}"]`, root);
        const top = fieldset.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: Math.max(0, top), behavior: MK.utils.prefersReducedMotion() ? 'auto' : 'smooth' });
        if (focus) {
          const first = fieldset.querySelector('input:not([type="hidden"]), select');
          if (first) first.focus({ preventScroll: true });
        }
        MK.ui.announce(`Etapa ${step} de 3`);
      };

      const tryAdvance = () => {
        readData();
        const errors = validateStep(state.step);
        if (errors.length) {
          renderErrorSummary(errors);
          const first = form.elements[errors[0].name];
          if (first) first.focus();
          return false;
        }
        state.completed.add(state.step);
        goToStep(state.step + 1);
        return true;
      };

      /* ---------- CEP: máscara, frete e preenchimento automático ---------- */
      const handleCEP = () => {
        const input = form.elements.cep;
        const status = $('[data-cep-status]', root);
        const digits = onlyDigits(input.value);
        readData();
        $('[data-shipping-options]', root).innerHTML = shippingOptions(state);
        refreshSummary();
        if (digits.length !== 8 || digits === lastLookup) return;
        lastLookup = digits;
        clearTimeout(cepTimer);
        cepTimer = setTimeout(async () => {
          status.innerHTML = `<span class="spinner" aria-hidden="true"></span><span class="sr-only">Consultando CEP…</span>`;
          const result = await lookupCEP(digits);
          if (onlyDigits(form.elements.cep.value) !== digits) return;
          if (result.ok) {
            if (result.street) form.elements.street.value = result.street;
            if (result.city) form.elements.city.value = result.city;
            if (result.state) form.elements.state.value = result.state;
            ['street', 'city', 'state'].forEach((n) => form.elements[n].value && validateField(n));
            status.innerHTML = `<span class="field__status-ok">${icon('check-circle', 'icon--xs')}Endereço encontrado</span>`;
            form.elements.number.focus();
          } else if (result.reason === 'not-found') {
            status.innerHTML = `<span class="field__status-warn">${icon('alert', 'icon--xs')}CEP não encontrado — preencha manualmente</span>`;
          } else {
            status.innerHTML = `<span class="field__status-info">${icon('info', 'icon--xs')}Preencha o endereço manualmente</span>`;
          }
          readData();
        }, 350);
      };

      /* ---------- eventos ---------- */
      form.addEventListener('input', (event) => {
        const { name } = event.target;
        if (name === 'cpf') event.target.value = masks.cpf(event.target.value);
        if (name === 'phone') event.target.value = masks.phone(event.target.value);
        if (name === 'cep') {
          event.target.value = masks.cep(event.target.value);
          handleCEP();
        }
        if (validators[name] && event.target.getAttribute('aria-invalid') === 'true') validateField(name);
      });

      form.addEventListener('focusout', (event) => {
        const { name } = event.target;
        if (validators[name] && event.target.value.trim() !== '') validateField(name);
      });

      form.addEventListener('change', (event) => {
        const { name, value } = event.target;
        if (name === 'shippingMethod') {
          state.shippingMethod = value;
          refreshSummary();
        } else if (name === 'payment') {
          state.payment = value;
          $('[data-payment-panel]', root).innerHTML = paymentPanel(state);
          $('[data-review]', root).innerHTML = reviewBlock(state);
          $('[data-payment-error]', root).hidden = true;
          refreshSummary();
        } else if (name === 'card') {
          state.card = value;
          $('[data-payment-panel]', root).innerHTML = paymentPanel(state);
          $('[data-payment-error]', root).hidden = true;
          const radio = form.querySelector(`input[name="card"][value="${value}"]`);
          if (radio) radio.focus();
        } else if (name === 'installments') {
          state.installments = Number(value) || 1;
          refreshSummary();
        } else if (name === 'terms') {
          state.terms = event.target.checked;
          if (state.terms) {
            event.target.removeAttribute('aria-invalid');
            $('#co-terms-error', root).textContent = '';
          }
        } else if (name === 'saveProfile') {
          state.saveProfile = event.target.checked;
        } else if (name === 'state' && validators.state) {
          validateField('state');
        }
      });

      root.addEventListener('click', (event) => {
        const target = event.target;
        if (target.closest('[data-next-step]')) {
          tryAdvance();
        } else if (target.closest('[data-prev-step]')) {
          readData();
          goToStep(state.step - 1);
        } else if (target.closest('[data-goto-step]')) {
          readData();
          goToStep(Number(target.closest('[data-goto-step]').dataset.gotoStep));
        } else if (target.closest('[data-generate-cpf]')) {
          const input = form.elements.cpf;
          input.value = generateTestCPF();
          validateField('cpf');
          input.focus();
          MK.ui.toast({ type: 'info', title: 'CPF de teste gerado', message: `${input.value} — número fictício válido apenas para testes.` });
        } else if (target.closest('[data-focus-field]')) {
          event.preventDefault();
          const name = target.closest('[data-focus-field]').dataset.focusField;
          const input = form.elements[name];
          if (input) input.focus();
        } else if (target.closest('[data-forget-profile]')) {
          MK.storage.remove('profile');
          state.saveProfile = false;
          state.profileLoaded = false;
          const note = $('.profile-note', root);
          if (note) note.remove();
          if (form.elements.saveProfile) form.elements.saveProfile.checked = false;
          MK.ui.toast({ type: 'info', title: 'Dados esquecidos', message: 'Seus dados de entrega foram apagados deste navegador.' });
        }
      });

      // Enter em um campo das etapas 1 e 2 avança (em vez de enviar o formulário)
      form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.tagName === 'INPUT' && state.step < 3 && event.target.type !== 'checkbox') {
          event.preventDefault();
          tryAdvance();
        }
      });

      /* ---------- confirmação do pedido ---------- */
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (state.processing) return; // evita envio duplicado
        readData();

        for (const step of [1, 2]) {
          const errors = validateStep(step);
          if (errors.length) {
            goToStep(step, { focus: false });
            renderErrorSummary(errors);
            form.elements[errors[0].name].focus();
            return;
          }
          state.completed.add(step);
        }
        const errors = validateStep(3);
        if (errors.length) {
          renderErrorSummary(errors);
          form.elements.terms.focus();
          return;
        }
        renderErrorSummary([]);

        // Revalida o estoque no momento da compra
        const lines = MK.cart.lines();
        const problem = lines.find((l) => l.qty > MK.products.stock(l.product));
        if (problem || !lines.length) {
          MK.ui.toast({ type: 'error', title: 'Estoque alterado', message: 'Um item do carrinho mudou de disponibilidade. Revise o carrinho.' });
          MK.router.go('/carrinho');
          return;
        }

        const button = $('[data-confirm-order]', root);
        const paymentError = $('[data-payment-error]', root);
        paymentError.hidden = true;
        state.processing = true;
        MK.ui.setBusy(button, true);
        MK.ui.announce('Processando pagamento simulado…');
        await MK.utils.sleep(1400);

        const card = TEST_CARDS.find((c) => c.id === state.card) || TEST_CARDS[0];
        if (state.payment === 'card' && card.result === 'declined') {
          state.processing = false;
          MK.ui.setBusy(button, false);
          paymentError.innerHTML = `${icon('x-circle')}<div><strong>Pagamento recusado (simulação).</strong> O cartão de teste C sempre é recusado para demonstrar o tratamento de erros. Escolha outro cartão de teste ou outra forma de pagamento.</div>`;
          paymentError.hidden = false;
          paymentError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          MK.ui.toast({ type: 'error', title: 'Pagamento recusado', message: 'Nenhum valor foi cobrado. Tente outro método.' });
          return;
        }

        const totals = MK.cart.totals({ shippingMethod: state.shippingMethod, payment: state.payment });
        const cpf = onlyDigits(state.data.cpf);
        const cep = onlyDigits(state.data.cep);
        const installments = Math.min(state.installments, MK.products.installments(totals.total).count);
        const now = Date.now();
        const orderData = {
          items: lines.map((l) => ({ id: l.id, name: l.product.name, image: l.product.image, category: l.product.category, qty: l.qty, unit: l.unit, unitOriginal: l.unitOriginal, total: l.total })),
          totals,
          coupon: totals.coupon && totals.coupon.valid ? totals.coupon.code : null,
          customer: { name: state.data.name.trim(), email: state.data.email.trim(), phone: state.data.phone, cpfMasked: `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` },
          address: { cep: masks.cep(cep), street: state.data.street.trim(), number: state.data.number.trim(), complement: state.data.complement.trim(), city: state.data.city.trim(), state: state.data.state },
          shipping: {
            method: state.shippingMethod,
            label: MK.shipping.METHODS[state.shippingMethod].label,
            price: totals.shipping,
            eta: MK.shipping.eta(state.shippingMethod, cep),
            estimatedDate: MK.shipping.deliveryDate(state.shippingMethod, cep).getTime(),
          },
          payment: { method: state.payment },
        };
        if (state.payment === 'card') {
          Object.assign(orderData.payment, { installments, installmentValue: roundMoney(totals.total / installments), cardLast4: card.last4 });
        }
        if (state.payment === 'boleto') orderData.payment.dueDate = businessDaysFrom(now, 3);
        if (state.payment === 'pix') orderData.payment.expiresAt = now + 30 * 60000;

        const order = MK.orders.create(orderData);
        if (state.payment === 'pix') order.payment.code = pixCode(order.id, totals.total);
        if (state.payment === 'boleto') order.payment.line = boletoLine(order.id, totals.total);
        // grava os códigos gerados a partir do número do pedido
        const all = MK.storage.read('orders', []);
        const index = all.findIndex((o) => o.id === order.id);
        if (index >= 0) {
          all[index] = order;
          MK.storage.write('orders', all);
        }

        MK.inventory.registerSale(lines.map((l) => ({ id: l.id, qty: l.qty })));
        if (state.saveProfile) {
          // Salva apenas dados de entrega/contato autorizados (nunca o CPF)
          const { customer, address } = orderData;
          MK.storage.write('profile', {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            cep: address.cep,
            street: address.street,
            number: address.number,
            complement: address.complement,
            city: address.city,
            state: address.state,
            savedAt: now,
          });
        }
        MK.cart.clear();
        state.processing = false;
        MK.router.go(`/pedido/${encodeURIComponent(order.id)}?novo=1`);
      });

      // O carrinho pode mudar em outra aba: atualiza o resumo ou a página
      const off = MK.utils.on('cart:change', () => {
        if (state.processing) return;
        if (MK.cart.isEmpty()) {
          MK.router.refresh();
          return;
        }
        refreshDynamic();
      });

      refreshStepper();
      return () => {
        off();
        clearTimeout(cepTimer);
      };
    },
  };

  /* ==================================================================
     VIEW: PEDIDO CONFIRMADO / DETALHES DO PEDIDO
     ================================================================== */
  function paymentInstructions(order) {
    const st = MK.orders.status(order);
    const p = order.payment;
    if (p.method === 'pix') {
      const pending = st.code === 'received';
      return `
        <div class="pay-result">
          <div class="pay-result__head">${icon('zap')}<div><h2 class="h3">Pagamento via PIX</h2><p class="muted small">${pending ? 'Aguardando confirmação (simulada em ~1 minuto).' : 'Pagamento confirmado (simulação).'}</p></div>
            <span class="badge badge--${pending ? 'warning' : 'success'}" data-pay-status>${pending ? 'Aguardando' : 'Aprovado'}</span></div>
          <div class="pix-box">
            ${demoQR(order.id)}
            <div class="pix-box__info">
              <p class="small muted">Código “copia e cola” <strong>de demonstração</strong>:</p>
              <div class="copy-field"><code>${esc(p.code || '')}</code><button class="btn btn--secondary btn--sm" type="button" data-action="copy" data-copy="${esc(p.code || '')}" data-copy-label="Código PIX de demonstração copiado.">${icon('copy')}Copiar</button></div>
              ${pending ? `<p class="small">Expira em <strong data-pix-countdown data-expires="${p.expiresAt}">30:00</strong></p>` : ''}
              <p class="callout">${icon('info')}QR Code e código ilustrativos: não realizam pagamentos reais.</p>
            </div>
          </div>
        </div>`;
    }
    if (p.method === 'boleto') {
      const pending = st.code === 'received';
      return `
        <div class="pay-result">
          <div class="pay-result__head">${icon('barcode')}<div><h2 class="h3">Boleto demonstrativo</h2><p class="muted small">Vencimento: ${MK.utils.formatDate(p.dueDate)}</p></div>
            <span class="badge badge--${pending ? 'warning' : 'success'}" data-pay-status>${pending ? 'Aguardando pagamento' : 'Compensado'}</span></div>
          <div class="boleto-box">
            <div class="boleto-bars" aria-hidden="true">${seededDigits(order.id, 70).split('').map((n) => `<span style="width:${(Number(n) % 3) + 1}px"></span>`).join('')}</div>
            <p class="small muted">Linha digitável <strong>fictícia</strong>:</p>
            <div class="copy-field"><code>${esc(p.line || '')}</code><button class="btn btn--secondary btn--sm" type="button" data-action="copy" data-copy="${esc(onlyDigits(p.line || ''))}" data-copy-label="Linha digitável de demonstração copiada.">${icon('copy')}Copiar</button></div>
            <p class="callout">${icon('info')}Boleto sem valor de pagamento. A compensação é simulada após alguns minutos.</p>
          </div>
        </div>`;
    }
    return `
      <div class="pay-result">
        <div class="pay-result__head">${icon('card')}<div><h2 class="h3">Cartão de crédito (teste)</h2><p class="muted small">${p.installments}x de ${formatPrice(p.installmentValue)} sem juros · cartão final ${esc(p.cardLast4)}</p></div>
          <span class="badge badge--success">Aprovado</span></div>
        <p class="callout callout--success">${icon('check-circle')}Pagamento aprovado na simulação. Nenhum valor foi cobrado.</p>
      </div>`;
  }

  MK.views.orderSuccess = {
    title(ctx) {
      const order = MK.orders.get(ctx.params.id);
      if (!order) return 'Pedido não encontrado';
      return ctx.query.get('novo') === '1' ? `Pedido ${order.id} confirmado` : `Pedido ${order.id}`;
    },

    render(ctx) {
      const order = MK.orders.get(ctx.params.id);
      if (!order) {
        return `
          <section class="container page-body">
            <div class="page-head"><h1 class="h1">Pedido não encontrado</h1></div>
            ${MK.ui.emptyState({
              iconName: 'package',
              title: `Não encontramos o pedido “${esc(ctx.params.id)}”`,
              text: 'Os pedidos ficam salvos apenas no navegador em que foram feitos. Confira seu histórico.',
              actions: `<a class="btn btn--primary" href="#/pedidos">${icon('package')}Meus pedidos</a><a class="btn btn--secondary" href="#/catalogo">Ver catálogo</a>`,
            })}
          </section>`;
      }
      const isNew = ctx.query.get('novo') === '1';
      const first = order.customer.name.split(/\s+/)[0];
      const UI = MK.ordersUI;
      return `
        <section class="container page-body success">
          <div class="success__hero">
            <div class="success__check" aria-hidden="true">
              <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36"/><path d="M25 41.5 35.5 52 56 30"/></svg>
            </div>
            <p class="eyebrow eyebrow--plain">${isNew ? 'Compra simulada concluída' : 'Detalhes do pedido'}</p>
            <h1 class="h1">${isNew ? `Pedido confirmado, ${esc(first)}!` : `Pedido ${esc(order.id)}`}</h1>
            <p class="lead">${isNew ? 'Obrigado por comprar na MUKEN. Enviamos (simbolicamente) a confirmação para ' : 'Realizado em ' + MK.utils.formatDateTime(order.createdAt) + ' · contato: '}<strong>${esc(order.customer.email)}</strong>.</p>
            <div class="success__number">
              <span class="small muted">Número do pedido</span>
              <strong data-order-number>${esc(order.id)}</strong>
              <button class="icon-btn icon-btn--sm" type="button" data-action="copy" data-copy="${esc(order.id)}" data-copy-label="Número do pedido copiado." aria-label="Copiar número do pedido">${icon('copy')}</button>
            </div>
          </div>

          <div class="success__grid">
            <div class="success__main">
              ${paymentInstructions(order)}
              <div class="card card--pad">
                <h2 class="h3">Acompanhamento</h2>
                <div data-success-timeline>${UI.timelineHTML(order)}</div>
              </div>
            </div>
            <aside class="card card--pad success__aside">
              <h2 class="h3">Resumo</h2>
              ${UI.itemsHTML(order)}
              ${UI.totalsHTML(order)}
              <div class="success__meta">
                <p>${icon('map-pin', 'icon--sm')}<span>${UI.addressLine(order)}</span></p>
                <p>${icon('truck', 'icon--sm')}<span>${esc(order.shipping.label)} · previsão de entrega: <strong>${MK.utils.formatDate(order.shipping.estimatedDate)}</strong></span></p>
                <p>${icon('card', 'icon--sm')}<span>${UI.paymentLine(order)}</span></p>
              </div>
            </aside>
          </div>

          <div class="success__actions">
            <a class="btn btn--primary btn--lg" href="#/pedidos">${icon('package')}Acompanhar meus pedidos</a>
            <a class="btn btn--secondary btn--lg" href="#/catalogo">Continuar comprando</a>
          </div>
        </section>`;
    },

    mount(root, ctx) {
      const order = MK.orders.get(ctx.params.id);
      if (!order) return null;
      if (ctx.query.get('novo') === '1') {
        MK.ui.toast({ type: 'success', title: 'Pedido realizado com sucesso!', message: `Número ${order.id}. Nenhuma cobrança real foi feita.` });
      }
      const tick = () => {
        const countdown = $('[data-pix-countdown]', root);
        if (countdown) {
          const left = Math.max(0, Number(countdown.dataset.expires) - Date.now());
          const m = Math.floor(left / 60000);
          const s = Math.floor((left % 60000) / 1000);
          countdown.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      };
      tick();
      const timer = setInterval(tick, 1000);
      const statusTimer = setInterval(() => {
        const box = $('[data-success-timeline]', root);
        if (box) box.innerHTML = MK.ordersUI.timelineHTML(order);
        const st = MK.orders.status(order);
        const badge = $('[data-pay-status]', root);
        if (badge && st.code !== 'received') {
          badge.textContent = order.payment.method === 'boleto' ? 'Compensado' : 'Aprovado';
          badge.className = 'badge badge--success';
          const countdown = $('[data-pix-countdown]', root);
          if (countdown) countdown.closest('p').remove();
        }
      }, 10000);
      return () => {
        clearInterval(timer);
        clearInterval(statusTimer);
      };
    },
  };

  MK.checkout = { masks, validators, isValidCPF, generateTestCPF, lookupCEP, TEST_CARDS, UFS };
})(window.MK = window.MK || {});
