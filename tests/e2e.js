/* =====================================================================
   MUKEN STORE — testes automatizados ponta a ponta (opcional)
   ---------------------------------------------------------------------
   Requisitos: Node.js 18+ e Playwright (Chromium).
     npm install --no-save playwright axe-core
     npx playwright install chromium
     node tests/e2e.js
   Para testar o site publicado em vez do servidor local:
     MUKEN_URL=https://jpribeiro011.github.io/muken-store/ node tests/e2e.js
   O script sobe um servidor estático próprio (sem dependências), abre a
   loja no Chromium e valida as funcionalidades. A auditoria de
   acessibilidade (axe-core) só roda se o pacote estiver instalado.
   Não faz parte do site publicado: serve apenas para validação.
   ===================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json',
};

/* ---------- servidor estático mínimo ---------- */
function startServer() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(ROOT, url === '/' ? 'index.html' : url);
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, '404.html');
    res.writeHead(file.endsWith('404.html') && !url.endsWith('404.html') ? 404 : 200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/* ---------- mini executor de testes ---------- */
const results = [];
async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - start });
    console.log(`  ✔ ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.log(`  ✘ ${name}\n      → ${error.message}`);
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function equal(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message} (esperado: ${JSON.stringify(expected)}, obtido: ${JSON.stringify(actual)})`);
}
/** "R$ 1.234,56" -> 1234.56 (ignora o espaço não separável do Intl) */
const money = (text) => Number(String(text).replace(/[^\d,]/g, '').replace(',', '.'));
const clean = (text) => String(text).replace(/\s+/g, ' ').trim();

(async () => {
  // MUKEN_URL permite testar o site publicado (ex.: GitHub Pages) em vez do servidor local
  const external = process.env.MUKEN_URL ? process.env.MUKEN_URL.replace(/\/?$/, '/') : null;
  const server = external ? null : await startServer();
  const BASE = external || `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  context.on('page', (pg) => {
    pg.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`));
    pg.on('console', (m) => {
      // ignora apenas o 404 provocado de propósito pelo teste do 404.html
      const intentional = (m.location().url || '').includes('/caminho/que/nao/existe');
      if (m.type() === 'error' && !intentional) consoleErrors.push(`[console] ${m.text()} ${m.location().url || ''}`);
    });
  });
  // A consulta de CEP (ViaCEP) é simulada para o teste não depender da internet
  await context.route('https://viacep.com.br/ws/**', (route) => {
    const cep = route.request().url().match(/ws\/(\d+)/)[1];
    const body = cep === '99999999' ? { erro: true } : { logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP' };
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  });

  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  /** Navega para uma rota; se já estiver nela, força nova renderização. */
  const go = async (hash) => {
    const target = BASE + hash;
    if (page.url() === target) {
      await page.evaluate(() => MK.router.refresh());
    } else {
      await page.goto(target, { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(200);
  };
  /** Lê um resumo de valores (<dl>) como { "Subtotal (3 itens)": 4196, ... } */
  const summary = (scope) => page.$$eval(`${scope} .summary__row, ${scope} .summary__total`, (rows) => rows.map((r) => [
    r.querySelector('dt').textContent.replace(/\s+/g, ' ').trim(),
    r.querySelector('dd').textContent.replace(/\s+/g, ' ').trim(),
  ]));
  const valueOf = (rows, label) => {
    const row = rows.find(([dt]) => dt.startsWith(label));
    if (!row) throw new Error(`Linha "${label}" não encontrada no resumo`);
    return row[1];
  };
  const resetStorage = async () => {
    await go('#/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
  };
  const resultNames = () => page.$$eval('[data-results] .product-card__name a', (els) => els.map((e) => e.textContent.trim()));

  console.log(`\nMUKEN STORE — testes ponta a ponta (${BASE})\n`);
  await resetStorage();

  console.log('Navegação e páginas');
  await test('Página inicial abre com hero e slogan', async () => {
    await go('#/');
    equal(clean(await page.textContent('#hero-title')), 'BEYONDEVERYLIMIT.', 'Slogan do hero');
    assert((await page.title()).includes('MUKEN'), 'Título da aba deve conter MUKEN');
  });
  await test('Seções da home exibem produtos (destaques, lançamentos, mais vendidos)', async () => {
    await page.waitForSelector('[data-home-featured] .product-card');
    equal(await page.$$eval('[data-home-featured] .product-card', (e) => e.length), 4, 'Destaques');
    assert(await page.$$eval('#launches-track .product-card', (e) => e.length) >= 4, 'Lançamentos');
    equal(clean(await page.textContent('.spotlight__name')), 'Void Hoodie', 'Mais vendido #1');
  });
  for (const [hash, h1] of [['#/catalogo', 'Todos os produtos'], ['#/sobre', 'Projetada para ir além do limite.'], ['#/contato', 'Fale com a MUKEN'], ['#/privacidade', 'Política de Privacidade'], ['#/pedidos', 'Meus pedidos'], ['#/favoritos', 'Favoritos'], ['#/carrinho', 'Carrinho']]) {
    await test(`Rota ${hash} renderiza "${h1}"`, async () => {
      await go(hash);
      equal(clean(await page.textContent('h1')), h1, 'Título h1');
    });
  }
  await test('Rota inexistente exibe a página 404 do app', async () => {
    await go('#/rota-inexistente');
    equal(clean(await page.textContent('h1')), 'Você foi além do limite.', '404');
  });
  await test('404.html (GitHub Pages) é servido para caminhos inexistentes', async () => {
    const response = await page.goto(BASE + 'caminho/que/nao/existe', { waitUntil: 'networkidle' });
    equal(response.status(), 404, 'Status HTTP');
    equal(clean(await page.textContent('h1')), 'Você foi além do limite.', 'Conteúdo do 404.html');
  });

  console.log('\nCatálogo, pesquisa e filtros');
  await test('Catálogo lista os 20 produtos após o skeleton', async () => {
    await go('#/catalogo');
    await page.waitForSelector('[data-results] .product-card');
    equal(await page.$$eval('[data-results] .product-card', (e) => e.length), 20, 'Quantidade');
  });
  await test('Pesquisa por nome ignora acentos e maiúsculas ("RELOGIO")', async () => {
    await page.fill('#filter-q', 'RELOGIO');
    await page.waitForTimeout(400);
    const names = await resultNames();
    equal(names.join(','), 'Pulse Watch S', 'Resultado');
  });
  await test('Filtros simultâneos: categoria + promoção + preço máximo', async () => {
    await page.fill('#filter-q', '');
    await page.click('label.check:has(input[value="tecnologia"])');
    await page.click('label.switch:has(input[name="promo"])');
    await page.fill('input[name="max"]', '1000');
    await page.press('input[name="max"]', 'Enter');
    await page.waitForTimeout(400);
    equal((await resultNames()).sort().join(','), 'Keyframe 75,Orbit Buds', 'Resultado combinado');
    assert((await page.evaluate(() => location.hash)).includes('cat=tecnologia'), 'Estado refletido na URL');
  });
  await test('Ordenação por menor preço, maior preço e alfabética', async () => {
    await go('#/catalogo?cat=moda');
    await page.selectOption('#catalog-sort', 'price-asc');
    await page.waitForTimeout(250);
    equal((await resultNames())[0], 'Horizon Tee', 'Menor preço primeiro');
    await page.selectOption('#catalog-sort', 'price-desc');
    await page.waitForTimeout(250);
    equal((await resultNames())[0], 'Strata Runner', 'Maior preço primeiro');
    await page.selectOption('#catalog-sort', 'name-asc');
    await page.waitForTimeout(250);
    const names = await resultNames();
    equal(names.join(','), names.slice().sort((a, b) => a.localeCompare(b, 'pt-BR')).join(','), 'Ordem alfabética');
  });
  await test('Filtro "somente promoções" mostra apenas itens com desconto', async () => {
    await go('#/catalogo?promo=1');
    const ok = await page.evaluate(() => [...document.querySelectorAll('[data-results] .product-card')].every((c) => c.querySelector('.price__old')));
    assert(ok, 'Todos os cards devem ter preço antigo riscado');
  });
  await test('Busca sem resultados mostra estado vazio e permite limpar', async () => {
    await go('#/catalogo?q=xyzabc');
    equal(clean(await page.textContent('.empty-state__title')), 'Nenhum produto encontrado', 'Estado vazio');
    await page.click('.empty-state [data-clear-filters]');
    await page.waitForTimeout(300);
    equal(await page.$$eval('[data-results] .product-card', (e) => e.length), 20, 'Após limpar');
  });
  await test('Sugestões da busca do cabeçalho com teclado', async () => {
    await go('#/');
    await page.click('#header-search-input');
    await page.keyboard.type('hood');
    await page.waitForTimeout(350);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    equal(await page.evaluate(() => location.hash), '#/produto/MK-MOD-001', 'Navegou para o produto sugerido');
  });

  console.log('\nDetalhes do produto');
  await test('Página do produto mostra preço, desconto, estoque e avaliações', async () => {
    await go('#/produto/MK-TEC-001');
    equal(money(await page.textContent('.buy-price .price__current')), 1599, 'Preço promocional');
    assert((await page.textContent('.buy-price')).includes('-16%'), 'Percentual de desconto');
    assert((await page.textContent('.stock-meter')).includes('24 unidades'), 'Estoque');
    await page.click('#tab-reviews');
    assert(await page.isVisible('#panel-reviews .review'), 'Avaliações visíveis');
    equal(await page.$$eval('.related .product-card', (e) => e.length), 4, 'Produtos relacionados');
  });
  await test('Produto inexistente mostra mensagem adequada', async () => {
    await go('#/produto/XYZ');
    equal(clean(await page.textContent('h1')), 'Produto não encontrado', 'Mensagem');
  });
  await test('Visualização rápida abre em modal e fecha com Esc devolvendo o foco', async () => {
    await go('#/catalogo');
    await page.waitForSelector('[data-results] .product-card');
    await page.focus('[data-results] [data-action="quick-view"][data-id="MK-LIF-001"]');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#quick-view[open]');
    equal(clean(await page.textContent('#quick-view-title')), 'Aurora Lamp', 'Produto no modal');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    equal(await page.evaluate(() => document.activeElement.dataset.id), 'MK-LIF-001', 'Foco devolvido');
  });

  console.log('\nCarrinho');
  await resetStorage();
  await test('Adicionar ao carrinho atualiza o contador do cabeçalho', async () => {
    await go('#/catalogo');
    await page.waitForSelector('[data-results] .product-card');
    await page.click('[data-results] [data-action="add-to-cart"][data-id="MK-TEC-001"]');
    await page.waitForTimeout(150);
    equal(await page.textContent('[data-cart-count]'), '1', 'Contador');
  });
  await test('Produto esgotado não pode ser adicionado', async () => {
    assert(await page.$eval('[data-results] [data-action="add-to-cart"][data-id="MK-MOD-003"]', (b) => b.disabled), 'Botão desabilitado');
  });
  await test('Impede quantidade acima do estoque (Grid Desk Mat: 2 unidades)', async () => {
    for (let i = 0; i < 3; i += 1) {
      await page.click('[data-results] [data-action="add-to-cart"][data-id="MK-LIF-005"]');
      await page.waitForTimeout(120);
    }
    equal(await page.evaluate(() => MK.cart.quantityOf('MK-LIF-005')), 2, 'Quantidade limitada');
    await go('#/carrinho');
    await page.fill('[data-cart-qty="MK-LIF-005"]', '9');
    await page.press('[data-cart-qty="MK-LIF-005"]', 'Tab');
    await page.waitForTimeout(200);
    equal(await page.inputValue('[data-cart-qty="MK-LIF-005"]'), '2', 'Campo limitado ao estoque');
  });
  await test('Aumentar, diminuir e cálculo de subtotal, descontos, frete e total', async () => {
    await page.click('.cart-page [data-action="cart-inc"][data-id="MK-TEC-001"]');
    await page.waitForTimeout(200);
    const rows = await summary('.cart-summary');
    // 2 × 1.899 + 2 × 199 = 4.196; descontos 2 × 300 = 600; frete grátis; total 3.596
    equal(money(valueOf(rows, 'Subtotal')), 4196, 'Subtotal');
    equal(money(valueOf(rows, 'Descontos')), 600, 'Descontos');
    equal(valueOf(rows, 'Frete'), 'Grátis', 'Frete grátis acima de R$ 299');
    equal(money(valueOf(rows, 'Total')), 3596, 'Total');
    await page.click('.cart-page [data-action="cart-dec"][data-id="MK-TEC-001"]');
    await page.waitForTimeout(200);
    equal(await page.evaluate(() => MK.cart.count()), 3, 'Após diminuir');
  });
  await test('Cupons: inválido, MUKEN10 e regra de valor mínimo (INFINITO15)', async () => {
    await page.fill('#coupon-input', 'NAOEXISTE');
    await page.click('.coupon-form button[type="submit"]');
    await page.waitForTimeout(150);
    assert((await page.textContent('#coupon-feedback')).includes('inválido'), 'Mensagem de cupom inválido');
    await page.fill('#coupon-input', 'muken10');
    await page.click('.coupon-form button[type="submit"]');
    await page.waitForTimeout(200);
    const totals = await page.evaluate(() => MK.cart.totals());
    equal(totals.couponDiscount, 199.7, 'MUKEN10 = 10% de 1.997,00');
    equal(totals.total, 1797.3, 'Total com cupom');
    const pending = await page.evaluate(() => { MK.cart.remove('MK-TEC-001', { silent: true }); MK.cart.applyCoupon('INFINITO15'); return MK.cart.totals().coupon; });
    equal(pending.valid, false, 'INFINITO15 exige R$ 500');
    await page.evaluate(() => MK.cart.restore({ id: 'MK-TEC-001', qty: 1 }, 0));
  });
  await test('Remover item oferece "Desfazer"', async () => {
    await go('#/carrinho');
    await page.click('.cart-page [data-action="cart-remove"][data-id="MK-LIF-005"]');
    await page.waitForTimeout(250);
    equal(await page.evaluate(() => MK.cart.quantityOf('MK-LIF-005')), 0, 'Removido');
    await page.click('.toast:last-child .toast__action');
    await page.waitForTimeout(250);
    equal(await page.evaluate(() => MK.cart.quantityOf('MK-LIF-005')), 2, 'Restaurado');
  });
  await test('Carrinho persiste no LocalStorage após recarregar', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    equal(await page.textContent('[data-cart-count]'), '3', 'Contador após reload');
    assert(await page.evaluate(() => localStorage.getItem('muken:cart').includes('MK-TEC-001')), 'Chave muken:cart');
  });
  await test('Sincronização do carrinho entre abas', async () => {
    const other = await context.newPage();
    await other.goto(BASE + '#/', { waitUntil: 'networkidle' });
    await other.evaluate(() => MK.cart.add('MK-LIF-004', 1, { silent: true }));
    await page.waitForTimeout(400);
    equal(await page.textContent('[data-cart-count]'), '4', 'Contador na primeira aba');
    await other.close();
  });
  await test('Esvaziar carrinho pede confirmação', async () => {
    await page.click('[data-action="cart-clear"]');
    await page.waitForSelector('#confirm-dialog[open]');
    await page.click('[data-confirm-cancel]');
    await page.waitForTimeout(300);
    equal(await page.evaluate(() => MK.cart.count()), 4, 'Cancelar mantém itens');
    await page.click('[data-action="cart-clear"]');
    await page.click('[data-confirm-ok]');
    await page.waitForTimeout(400);
    equal(clean(await page.textContent('.empty-state__title')), 'Seu carrinho está vazio', 'Estado vazio');
  });

  console.log('\nCheckout e pedidos');
  await resetStorage();
  const fillStep1 = async () => {
    await page.fill('#co-name', 'Ana Souza');
    await page.fill('#co-email', 'ana@exemplo.com');
    await page.fill('#co-phone', '');
    await page.type('#co-phone', '11912345678');
    await page.click('[data-generate-cpf]');
    await page.click('[data-step="1"] [data-next-step]');
    await page.waitForTimeout(250);
  };
  const fillStep2 = async () => {
    await page.fill('#co-cep', '');
    await page.type('#co-cep', '01310100');
    await page.waitForTimeout(900);
    await page.fill('#co-number', '1578');
    await page.click('[data-step="2"] [data-next-step]');
    await page.waitForTimeout(300);
  };
  await test('Checkout com carrinho vazio orienta o usuário', async () => {
    await go('#/checkout');
    equal(clean(await page.textContent('.empty-state__title')), 'Não há itens para finalizar', 'Estado vazio');
  });
  await test('Validação: campos obrigatórios, CPF inválido e máscaras', async () => {
    await page.evaluate(() => { MK.cart.add('MK-TEC-004', 2, { silent: true }); MK.cart.add('MK-ACE-002', 1, { silent: true }); MK.cart.applyCoupon('MUKEN10'); });
    await go('#/checkout');
    await page.click('[data-step="1"] [data-next-step]');
    await page.waitForTimeout(150);
    assert(!(await page.isHidden('[data-error-summary]')), 'Resumo de erros visível');
    equal(await page.getAttribute('#co-name', 'aria-invalid'), 'true', 'aria-invalid no nome');
    await page.type('#co-cpf', '12345678900');
    await page.type('#co-phone', '11912345678');
    await page.click('[data-step="1"] [data-next-step]');
    await page.waitForTimeout(150);
    assert((await page.textContent('#co-cpf-error')).includes('inválido'), 'CPF inválido rejeitado');
    equal(await page.inputValue('#co-cpf'), '123.456.789-00', 'Máscara de CPF');
    equal(await page.inputValue('#co-phone'), '(11) 91234-5678', 'Máscara de telefone');
  });
  await test('CPF de teste gerado é válido e o CEP preenche o endereço', async () => {
    await fillStep1();
    equal(await page.evaluate(() => MK.checkout.isValidCPF(document.querySelector('#co-cpf').value)), true, 'CPF gerado válido');
    await page.type('#co-cep', '01310100');
    await page.waitForTimeout(900);
    equal(await page.inputValue('#co-city'), 'São Paulo', 'Cidade preenchida');
    equal(await page.inputValue('#co-state'), 'SP', 'Estado preenchido');
    await page.fill('#co-number', '1578');
    await page.click('label.option-card:has(input[value="express"])');
    await page.click('[data-step="2"] [data-next-step]');
    await page.waitForTimeout(300);
    assert(await page.isVisible('[data-step="3"]'), 'Etapa 3 visível');
  });
  await test('Cartão de teste recusado exibe erro e não cria pedido', async () => {
    await page.click('label.option-card:has(input[value="card"])');
    await page.click('label.check--radio:has(input[value="declined"])');
    await page.click('.checkout-consents label.check:has(input[name="terms"])');
    await page.click('[data-confirm-order]');
    await page.waitForTimeout(1900);
    assert(!(await page.isHidden('[data-payment-error]')), 'Mensagem de recusa');
    equal(await page.evaluate(() => MK.orders.count()), 0, 'Nenhum pedido criado');
  });
  let firstOrderId = '';
  await test('Cartão aprovado gera pedido, sucesso, baixa de estoque e carrinho vazio', async () => {
    await page.click('label.check--radio:has(input[value="approved-a"])');
    await page.selectOption('#co-installments', '3');
    await page.click('[data-confirm-order]');
    await page.waitForURL(/#\/pedido\//, { timeout: 8000 });
    await page.waitForTimeout(300);
    firstOrderId = clean(await page.textContent('[data-order-number]'));
    assert(/^MK\d{6}-[A-Z2-9]{4}$/.test(firstOrderId), `Número do pedido no formato esperado (${firstOrderId})`);
    const order = await page.evaluate(() => MK.orders.list()[0]);
    // (989 × 2 + 169) = 2.147 − 10% (214,70) + frete expresso 39,90 = 1.972,20
    equal(order.totals.total, 1972.2, 'Total do pedido');
    equal(order.payment.installments, 3, 'Parcelas');
    equal(await page.evaluate(() => MK.cart.count()), 0, 'Carrinho esvaziado');
    equal(await page.evaluate(() => MK.products.stock('MK-TEC-004')), 1, 'Estoque baixado (3 → 1)');
    assert(!order.customer.cpfMasked.match(/^\d{3}\.\d{3}/), 'CPF salvo apenas mascarado');
  });
  await test('PIX simulado: QR ilustrativo, código e desconto de 5%', async () => {
    await page.evaluate(() => MK.cart.add('MK-LIF-002', 2, { silent: true }));
    await go('#/checkout');
    await fillStep1();
    await fillStep2();
    await page.click('.checkout-consents label.check:has(input[name="terms"])');
    await page.click('[data-confirm-order]');
    await page.waitForURL(/#\/pedido\//, { timeout: 8000 });
    await page.waitForTimeout(300);
    assert(await page.isVisible('.pix-qr'), 'QR Code ilustrativo');
    const order = await page.evaluate(() => MK.orders.list()[0]);
    // 2 × 219 = 438; PIX 5% = 21,90; frete grátis (≥ 299) => 416,10
    equal(order.totals.pixDiscount, 21.9, 'Desconto PIX');
    equal(order.totals.total, 416.1, 'Total PIX');
  });
  await test('Boleto demonstrativo com linha digitável e vencimento', async () => {
    await page.evaluate(() => MK.cart.add('MK-ACE-002', 1, { silent: true }));
    await go('#/checkout');
    await fillStep1();
    await fillStep2();
    await page.click('label.option-card:has(input[value="boleto"])');
    await page.click('.checkout-consents label.check:has(input[name="terms"])');
    await page.click('[data-confirm-order]');
    await page.waitForURL(/#\/pedido\//, { timeout: 8000 });
    await page.waitForTimeout(300);
    equal(MK_ONLY_DIGITS(await page.textContent('.boleto-box code')).length, 47, 'Linha digitável com 47 dígitos');
    const order = await page.evaluate(() => MK.orders.list()[0]);
    // 169 + frete padrão 24,90 = 193,90
    equal(order.totals.total, 193.9, 'Total com frete padrão');
  });
  await test('Histórico lista os pedidos com número, data, itens, total, pagamento e status', async () => {
    await go('#/pedidos');
    equal(await page.$$eval('.order-card', (e) => e.length), 3, 'Quantidade de pedidos');
    const text = clean(await page.textContent('.orders-list'));
    assert(text.includes(firstOrderId), 'Número do primeiro pedido');
    assert(text.includes('Boleto') && text.includes('PIX') && text.includes('Cartão'), 'Formas de pagamento');
    assert(await page.$$eval('[data-order-status]', (e) => e.every((b) => b.textContent.trim().length > 0)), 'Status');
  });
  await test('"Comprar novamente" respeita o estoque', async () => {
    await page.click(`.order-card[data-order="${firstOrderId}"] .order-card__details summary`);
    await page.click(`.order-card[data-order="${firstOrderId}"] [data-action="order-rebuy"]`);
    await page.waitForTimeout(250);
    equal(await page.evaluate(() => MK.cart.quantityOf('MK-TEC-004')), 1, 'Somente o estoque restante (1)');
  });

  console.log('\nFavoritos, tema e LocalStorage');
  await test('Favoritar, desfazer remoção e listar na página de favoritos', async () => {
    await go('#/catalogo');
    await page.waitForSelector('[data-results] .product-card');
    await page.click('.product-card[data-product-id="MK-TEC-001"] .product-card__fav');
    await page.click('.product-card[data-product-id="MK-LIF-001"] .product-card__fav');
    await page.click('.product-card[data-product-id="MK-LIF-001"] .product-card__fav');
    await page.waitForTimeout(200);
    await page.click('.toast:last-child .toast__action');
    await page.waitForTimeout(200);
    equal(await page.textContent('[data-fav-count]'), '2', 'Contador de favoritos');
    await go('#/favoritos');
    equal(await page.$$eval('[data-favorites-grid] .product-card', (e) => e.length), 2, 'Página de favoritos');
  });
  await test('Favoritos sincronizam entre abas', async () => {
    const other = await context.newPage();
    await other.goto(BASE + '#/produto/MK-MOD-001', { waitUntil: 'networkidle' });
    await other.click('.buy-actions .fav-toggle');
    await page.waitForTimeout(400);
    equal(await page.$$eval('[data-favorites-grid] .product-card', (e) => e.length), 3, 'Atualizou na outra aba');
    await other.close();
  });
  await test('Tema claro/escuro: escuro é o padrão e a escolha persiste', async () => {
    await page.evaluate(() => localStorage.removeItem('muken:theme'));
    await page.reload({ waitUntil: 'networkidle' });
    equal(await page.getAttribute('html', 'data-theme'), 'dark', 'Padrão escuro');
    await page.click('.site-header .theme-toggle');
    await page.reload({ waitUntil: 'networkidle' });
    equal(await page.getAttribute('html', 'data-theme'), 'light', 'Tema claro persistido');
    await page.click('.site-header .theme-toggle');
  });
  await test('Contato: validação e envio simulado com protocolo', async () => {
    await go('#/contato');
    await page.click('[data-contact-form] button[type="submit"]');
    equal(await page.getAttribute('#ct-email', 'aria-invalid'), 'true', 'Erro de e-mail');
    await page.fill('#ct-name', 'Bruno Lima');
    await page.fill('#ct-email', 'bruno@exemplo.com');
    await page.selectOption('#ct-subject', { index: 1 });
    await page.fill('#ct-message', 'Mensagem de teste com mais de vinte caracteres.');
    await page.click('[data-contact-form] label.check');
    await page.click('[data-contact-form] button[type="submit"]');
    await page.waitForSelector('.contact-success', { timeout: 4000 });
    assert(/ATD-[A-Z2-9]{6}/.test(await page.textContent('.contact-success')), 'Protocolo gerado');
  });
  await test('Privacidade: apagar todos os dados limpa o LocalStorage', async () => {
    await go('#/privacidade');
    await page.click('[data-delete-all]');
    await page.click('[data-confirm-ok]');
    await page.waitForTimeout(1800);
    equal(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('muken:')).length), 0, 'Sem chaves muken:');
  });

  console.log('\nResponsividade e acessibilidade');
  await test('Sem rolagem horizontal em 320, 768 e 1280 px', async () => {
    const problems = [];
    for (const hash of ['#/', '#/catalogo', '#/produto/MK-TEC-001', '#/carrinho', '#/sobre', '#/contato']) {
      for (const width of [320, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await go(hash);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        if (overflow) problems.push(`${hash}@${width}`);
      }
    }
    await page.setViewportSize({ width: 1366, height: 900 });
    equal(problems.join(', '), '', 'Páginas com rolagem horizontal');
  });
  let axeSource = null;
  try { axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); } catch (e) { /* opcional */ }
  if (axeSource) {
    await test('axe-core (WCAG 2.1 A/AA) sem violações nas páginas principais', async () => {
      const found = [];
      for (const hash of ['#/', '#/catalogo', '#/produto/MK-TEC-001', '#/sobre', '#/contato', '#/privacidade']) {
        await go(hash);
        await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-visible')));
        await page.waitForTimeout(900);
        await page.addScriptTag({ content: axeSource });
        const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map((v) => v.id));
        if (violations.length) found.push(`${hash}: ${violations.join(', ')}`);
      }
      equal(found.join(' | '), '', 'Violações');
    });
  } else {
    console.log('  – axe-core não instalado: auditoria de acessibilidade ignorada');
  }

  await test('Nenhum erro de JavaScript no console durante os testes', async () => {
    equal(consoleErrors.join(' | '), '', 'Erros no console');
  });

  await browser.close();
  if (server) server.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\nResultado: ${results.length - failed.length} de ${results.length} testes passaram.`);
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

function MK_ONLY_DIGITS(text) {
  return String(text).replace(/\D/g, '');
}
