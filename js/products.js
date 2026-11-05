/* =====================================================================
   MUKEN STORE — products.js
   Catálogo de produtos FICTÍCIOS (dados) + funções de consulta.
   Cada produto possui: id único, nome, categoria, descrição, preço,
   preço promocional (quando aplicável), imagem, estoque, avaliação
   fictícia e indicador de disponibilidade (`available`).
   As imagens são ilustrações vetoriais originais criadas para a marca.
   ===================================================================== */
(function (MK) {
  'use strict';

  /* ------------------------------------------------------------------
     CATEGORIAS
     ------------------------------------------------------------------ */
  const CATEGORIES = [
    {
      id: 'tecnologia',
      name: 'Tecnologia',
      icon: 'cpu',
      tagline: 'Áudio, wearables e setup',
      description: 'Dispositivos que ampliam seus sentidos: som imersivo, saúde no pulso e um setup sem limites.',
      cover: 'assets/images/products/halo-x.svg',
    },
    {
      id: 'moda',
      name: 'Moda',
      icon: 'shirt',
      tagline: 'Streetwear técnico premium',
      description: 'Peças atemporais com tecidos técnicos, modelagem contemporânea e acabamento impecável.',
      cover: 'assets/images/products/void-hoodie.svg',
    },
    {
      id: 'acessorios',
      name: 'Acessórios',
      icon: 'glasses',
      tagline: 'Detalhes que completam',
      description: 'Os detalhes que definem um estilo — funcionais, duráveis e com a assinatura MUKEN.',
      cover: 'assets/images/products/iris-shades.svg',
    },
    {
      id: 'lifestyle',
      name: 'Lifestyle',
      icon: 'lamp',
      tagline: 'Casa, rotina e foco',
      description: 'Objetos de design para a casa e a rotina: luz, foco e bem-estar todos os dias.',
      cover: 'assets/images/products/aurora-lamp.svg',
    },
  ];

  const IMG = 'assets/images/products/';

  /* ------------------------------------------------------------------
     PRODUTOS (preços em R$; promoPrice = null quando não há promoção)
     ------------------------------------------------------------------ */
  const RAW_PRODUCTS = [
    /* ============================== TECNOLOGIA ============================== */
    {
      id: 'MK-TEC-001',
      name: 'Halo X',
      subtitle: 'Fone over-ear com cancelamento de ruído adaptativo',
      category: 'tecnologia',
      shortDescription: 'Silêncio absoluto, som sem limites. ANC adaptativo, áudio espacial e 40 horas de bateria.',
      description: [
        'O Halo X foi projetado para isolar você do mundo e revelar cada detalhe da música. O cancelamento de ruído adaptativo analisa o ambiente milhares de vezes por segundo e ajusta a intensidade automaticamente — do metrô lotado ao escritório silencioso.',
        'Drivers de 40 mm com diafragma de grafeno reproduzem graves profundos e agudos cristalinos, enquanto o áudio espacial cria um palco sonoro tridimensional. As almofadas em espuma viscoelástica e a tiara em alumínio escovado garantem conforto mesmo em sessões longas.',
        'São 40 horas de autonomia, recarga rápida (10 minutos rendem 5 horas de uso) e conexão multiponto para alternar entre notebook e celular sem interrupções.',
      ],
      highlights: ['Cancelamento de ruído adaptativo', 'Áudio espacial com rastreamento de cabeça', '40 h de bateria com recarga rápida', 'Conexão multiponto Bluetooth 5.4'],
      specs: [
        ['Driver', '40 mm com diafragma de grafeno'],
        ['Bateria', 'Até 40 h (32 h com ANC ligado)'],
        ['Conectividade', 'Bluetooth 5.4 multiponto, USB-C'],
        ['Peso', '254 g'],
        ['Cor', 'Void Black'],
        ['Garantia', '2 anos'],
      ],
      price: 1899.0,
      promoPrice: 1599.0,
      image: `${IMG}halo-x.svg`,
      imageAlt: 'Fone de ouvido over-ear Halo X preto, com detalhes azuis e o símbolo do infinito nas conchas',
      stock: 24,
      rating: 4.9,
      reviewsCount: 312,
      sold: 1840,
      featured: true,
      isNew: false,
      releaseDate: '2025-11-20',
      tags: ['fone', 'headphone', 'audio', 'bluetooth', 'anc', 'cancelamento de ruido', 'musica'],
    },
    {
      id: 'MK-TEC-002',
      name: 'Orbit Buds',
      subtitle: 'Fones true wireless com estojo de carregamento',
      category: 'tecnologia',
      shortDescription: 'Compactos, potentes e com ANC. Até 32 horas de reprodução com o estojo.',
      description: [
        'Os Orbit Buds condensam a assinatura sonora MUKEN em fones de apenas 4,6 g cada. O encaixe ergonômico, com três tamanhos de ponteiras, garante vedação perfeita e conforto para o dia inteiro.',
        'O cancelamento ativo de ruído e o modo ambiente são alternados com um toque. Três microfones por fone e redução de ruído por IA deixam suas chamadas nítidas mesmo no meio da rua.',
        'O estojo em acabamento acetinado tem carregamento sem fio e LED indicador de bateria: 8 horas por carga e até 32 horas no total.',
      ],
      highlights: ['Cancelamento de ruído + modo ambiente', 'Até 32 h com o estojo', 'Resistência à água IPX5', 'Carregamento sem fio'],
      specs: [
        ['Driver', '11 mm dinâmico'],
        ['Bateria', '8 h (fones) + 24 h (estojo)'],
        ['Resistência', 'IPX5 (suor e respingos)'],
        ['Conectividade', 'Bluetooth 5.4, USB-C e carregamento Qi'],
        ['Peso', '4,6 g por fone'],
        ['Garantia', '1 ano'],
      ],
      price: 899.0,
      promoPrice: 749.0,
      image: `${IMG}orbit-buds.svg`,
      imageAlt: 'Estojo aberto dos fones Orbit Buds com os dois fones encaixados e LED azul aceso',
      stock: 40,
      rating: 4.7,
      reviewsCount: 528,
      sold: 2650,
      featured: false,
      isNew: false,
      releaseDate: '2025-08-14',
      tags: ['fone', 'earbuds', 'tws', 'bluetooth', 'sem fio', 'audio'],
    },
    {
      id: 'MK-TEC-003',
      name: 'Pulse Watch S',
      subtitle: 'Smartwatch com tela AMOLED e GPS de dupla frequência',
      category: 'tecnologia',
      shortDescription: 'Saúde, treino e notificações em uma tela AMOLED de 1,9" com caixa em titânio.',
      description: [
        'O Pulse Watch S monitora frequência cardíaca, oxigenação do sangue, sono e níveis de estresse 24 horas por dia, transformando dados em informações claras direto no seu pulso.',
        'Com GPS de dupla frequência, mais de 120 modos de treino e resistência à água de 5 ATM, ele acompanha da corrida matinal ao mergulho no fim de semana. A tela AMOLED de 1,9" com brilho de 2.000 nits é legível até sob sol forte.',
        'A caixa em titânio grau 2 e o vidro de safira deixam o relógio leve e resistente, e a coroa digital permite navegar pelos menus com precisão.',
      ],
      highlights: ['Caixa em titânio e vidro de safira', 'GPS de dupla frequência', 'Até 10 dias de bateria', 'Resistência à água 5 ATM'],
      specs: [
        ['Tela', 'AMOLED 1,9" — 2.000 nits'],
        ['Bateria', 'Até 10 dias (uso típico)'],
        ['Sensores', 'Frequência cardíaca, SpO2, temperatura e acelerômetro'],
        ['Resistência', '5 ATM'],
        ['Material', 'Titânio grau 2 e vidro de safira'],
        ['Garantia', '2 anos'],
      ],
      price: 2299.0,
      promoPrice: null,
      image: `${IMG}pulse-watch.svg`,
      imageAlt: 'Smartwatch Pulse Watch S com caixa metálica, pulseira preta e anéis de atividade azuis e roxos na tela',
      stock: 15,
      rating: 4.8,
      reviewsCount: 204,
      sold: 980,
      featured: false,
      isNew: true,
      releaseDate: '2026-09-02',
      tags: ['relogio', 'smartwatch', 'watch', 'fitness', 'saude', 'gps'],
    },
    {
      id: 'MK-TEC-004',
      name: 'Keyframe 75',
      subtitle: 'Teclado mecânico 75% sem fio',
      category: 'tecnologia',
      shortDescription: 'Switches lineares lubrificados, estrutura em alumínio e conexão tripla.',
      description: [
        'O Keyframe 75 nasceu para quem cria. O layout 75% mantém as teclas de função e as setas em um corpo compacto, liberando espaço na mesa sem abrir mão da produtividade.',
        'Switches lineares pré-lubrificados, montagem em gaxeta e espuma acústica em camadas entregam uma digitação suave e silenciosa. Os keycaps em PBT double-shot não desbotam com o uso.',
        'Conecte até três dispositivos via Bluetooth, 2,4 GHz ou cabo USB-C e alterne entre eles com um atalho. O knob em alumínio controla volume e iluminação.',
      ],
      highlights: ['Switches hot-swap', 'Montagem em gaxeta', 'Conexão tripla', 'Bateria de 4.000 mAh'],
      specs: [
        ['Layout', '75% (84 teclas), padrão ANSI'],
        ['Switches', 'Lineares pré-lubrificados, hot-swap'],
        ['Conectividade', 'Bluetooth 5.1, 2,4 GHz e USB-C'],
        ['Bateria', '4.000 mAh'],
        ['Estrutura', 'Alumínio usinado em CNC'],
        ['Garantia', '1 ano'],
      ],
      price: 1149.0,
      promoPrice: 989.0,
      image: `${IMG}keyframe-75.svg`,
      imageAlt: 'Teclado mecânico Keyframe 75 escuro com teclas de destaque azuis, visto de cima e levemente inclinado',
      stock: 3,
      rating: 4.8,
      reviewsCount: 167,
      sold: 760,
      featured: false,
      isNew: false,
      releaseDate: '2025-10-05',
      tags: ['teclado', 'keyboard', 'mecanico', 'setup', 'gamer', 'escritorio'],
    },
    {
      id: 'MK-TEC-005',
      name: 'Echo Sphere',
      subtitle: 'Caixa de som 360° com anel de luz',
      category: 'tecnologia',
      shortDescription: 'Som 360° que preenche o ambiente e um anel de luz que reage à música.',
      description: [
        'A Echo Sphere distribui o som em todas as direções com um woofer voltado para baixo e três tweeters angulados, criando uma experiência imersiva em qualquer ponto do ambiente.',
        'O anel de luz na base reage ao ritmo da música e pode ser personalizado pelo aplicativo. A malha acústica em tecido técnico dá à peça a presença de um objeto de design.',
        'Resistente a respingos (IPX4), com 20 horas de bateria e pareamento estéreo, ela vai da sala para a varanda sem perder o ritmo.',
      ],
      highlights: ['Som 360°', 'Anel de luz reativo à música', '20 h de bateria', 'Pareamento estéreo'],
      specs: [
        ['Potência', '40 W RMS'],
        ['Bateria', 'Até 20 h'],
        ['Resistência', 'IPX4'],
        ['Conectividade', 'Bluetooth 5.3 e Wi-Fi'],
        ['Dimensões', '16 × 16 × 18 cm'],
        ['Garantia', '1 ano'],
      ],
      price: 1299.0,
      promoPrice: null,
      image: `${IMG}echo-sphere.svg`,
      imageAlt: 'Caixa de som esférica Echo Sphere com malha perfurada escura sobre base com anel de luz azul',
      stock: 18,
      rating: 4.6,
      reviewsCount: 89,
      sold: 410,
      featured: false,
      isNew: true,
      releaseDate: '2026-08-18',
      tags: ['caixa de som', 'speaker', 'som', 'audio', 'bluetooth', 'luz'],
    },

    /* ================================ MODA ================================= */
    {
      id: 'MK-MOD-001',
      name: 'Void Hoodie',
      subtitle: 'Moletom oversized 480 g/m²',
      category: 'moda',
      shortDescription: 'Algodão felpado de 480 g/m², modelagem oversized e capuz estruturado.',
      description: [
        'O Void Hoodie é a peça que define o guarda-roupa MUKEN. O moletom de 480 g/m² em algodão penteado tem toque macio por dentro e estrutura firme por fora, mantendo o caimento lavagem após lavagem.',
        'A modelagem oversized com ombros caídos, o capuz com forro duplo e os punhos canelados criam uma silhueta limpa e contemporânea. O símbolo do infinito é bordado em alto-relevo no peito.',
        'Pré-lavado para evitar encolhimento, com cordões de ponteira metálica e bolso canguru reforçado.',
      ],
      highlights: ['Algodão 480 g/m²', 'Pré-lavado (não encolhe)', 'Bordado em alto-relevo', 'Capuz com forro duplo'],
      specs: [
        ['Composição', '100% algodão penteado'],
        ['Gramatura', '480 g/m²'],
        ['Modelagem', 'Oversized'],
        ['Tamanhos', 'P, M, G e GG'],
        ['Cuidados', 'Lavar do avesso, em água fria'],
        ['Origem', 'Fabricado no Brasil'],
      ],
      price: 449.0,
      promoPrice: 379.0,
      image: `${IMG}void-hoodie.svg`,
      imageAlt: 'Moletom com capuz Void Hoodie preto com cordões metálicos, bolso canguru e símbolo do infinito azul no peito',
      stock: 32,
      rating: 4.9,
      reviewsCount: 402,
      sold: 3120,
      featured: true,
      isNew: false,
      releaseDate: '2025-06-10',
      tags: ['moletom', 'hoodie', 'blusa', 'casaco', 'roupa', 'streetwear', 'preto'],
    },
    {
      id: 'MK-MOD-002',
      name: 'Horizon Tee',
      subtitle: 'Camiseta premium em algodão pima',
      category: 'moda',
      shortDescription: 'Algodão pima peruano, toque sedoso e estampa minimalista de horizonte.',
      description: [
        'A Horizon Tee é feita em algodão pima peruano de fibra longa, conhecido pela maciez e pela durabilidade. O resultado é uma camiseta leve, respirável e com toque sedoso desde o primeiro uso.',
        'A estampa em silk de alta definição traz uma linha de horizonte em gradiente azul — um lembrete discreto de que sempre existe algo além.',
        'Gola ribana reforçada, costuras duplas e modelagem regular, que funciona tanto sozinha quanto em sobreposições.',
      ],
      highlights: ['Algodão pima peruano', 'Gola ribana reforçada', 'Estampa em silk HD', 'Modelagem regular'],
      specs: [
        ['Composição', '100% algodão pima'],
        ['Gramatura', '180 g/m²'],
        ['Modelagem', 'Regular'],
        ['Tamanhos', 'P, M, G e GG'],
        ['Cor', 'Ice White'],
        ['Origem', 'Fabricado no Brasil'],
      ],
      price: 189.0,
      promoPrice: null,
      image: `${IMG}horizon-tee.svg`,
      imageAlt: 'Camiseta branca Horizon Tee com linha horizontal em gradiente azul no peito',
      stock: 60,
      rating: 4.7,
      reviewsCount: 356,
      sold: 2890,
      featured: false,
      isNew: false,
      releaseDate: '2025-05-02',
      tags: ['camiseta', 'tee', 'blusa', 'roupa', 'branca', 'algodao'],
    },
    {
      id: 'MK-MOD-003',
      name: 'Eclipse Shell Jacket',
      subtitle: 'Jaqueta corta-vento técnica — edição limitada',
      category: 'moda',
      shortDescription: 'Corta-vento impermeável com faixas refletivas e zíperes selados.',
      description: [
        'Edição limitada. A Eclipse Shell Jacket protege do vento e da chuva com um tecido técnico de três camadas, impermeável (10.000 mm) e respirável.',
        'Zíperes selados, capuz embutido na gola alta e faixas refletivas 360° garantem segurança e funcionalidade na cidade à noite.',
        'Leve e compactável, ela pode ser dobrada dentro do próprio bolso — perfeita para ter sempre à mão.',
      ],
      highlights: ['Impermeável 10.000 mm', 'Faixas refletivas 360°', 'Zíperes selados', 'Compactável no bolso'],
      specs: [
        ['Composição', '100% poliamida reciclada'],
        ['Impermeabilidade', '10.000 mm'],
        ['Respirabilidade', '8.000 g/m²/24 h'],
        ['Tamanhos', 'P, M, G e GG'],
        ['Cor', 'Deep Navy'],
        ['Garantia', '1 ano'],
      ],
      price: 899.0,
      promoPrice: 719.0,
      image: `${IMG}eclipse-jacket.svg`,
      imageAlt: 'Jaqueta corta-vento Eclipse azul-marinho com zíper central e faixa refletiva horizontal',
      stock: 0,
      rating: 4.8,
      reviewsCount: 122,
      sold: 640,
      featured: false,
      isNew: false,
      releaseDate: '2025-09-12',
      tags: ['jaqueta', 'corta-vento', 'casaco', 'chuva', 'impermeavel', 'roupa'],
    },
    {
      id: 'MK-MOD-004',
      name: 'Strata Runner',
      subtitle: 'Tênis de corrida com entressola em camadas',
      category: 'moda',
      shortDescription: 'Amortecimento em camadas, cabedal em knit respirável e drop de 8 mm.',
      description: [
        'O Strata Runner traduz o conceito de camadas infinitas em amortecimento: três densidades de espuma empilhadas absorvem impacto e devolvem energia a cada passada.',
        'O cabedal em knit engenheirado se adapta ao formato do pé, com zonas de ventilação e reforço no calcanhar. A linha geométrica azul, aplicada por termocolagem, é a assinatura do modelo.',
        'O solado de borracha com padrão multidirecional garante tração em pistas urbanas, molhadas ou secas.',
      ],
      highlights: ['Entressola em 3 camadas', 'Cabedal em knit respirável', 'Drop de 8 mm', '248 g (tamanho 40)'],
      specs: [
        ['Cabedal', 'Knit engenheirado'],
        ['Entressola', 'EVA supercrítico em três camadas'],
        ['Drop', '8 mm'],
        ['Peso', '248 g (tamanho 40)'],
        ['Numeração', '34 ao 44'],
        ['Cor', 'Ice / Electric Blue'],
      ],
      price: 1099.0,
      promoPrice: null,
      image: `${IMG}strata-runner.svg`,
      imageAlt: 'Tênis Strata Runner branco visto de lado, com linha geométrica azul e solado em camadas',
      stock: 12,
      rating: 4.7,
      reviewsCount: 98,
      sold: 520,
      featured: false,
      isNew: true,
      releaseDate: '2026-10-01',
      tags: ['tenis', 'sneaker', 'corrida', 'calcado', 'running', 'branco'],
    },
    {
      id: 'MK-MOD-005',
      name: 'Gravity Cargo',
      subtitle: 'Calça cargo técnica',
      category: 'moda',
      shortDescription: 'Sarja com elastano, bolsos cargo funcionais e barra ajustável.',
      description: [
        'A Gravity Cargo combina a funcionalidade das calças utilitárias com uma modelagem contemporânea. A sarja com 3% de elastano acompanha os movimentos sem deformar.',
        'São seis bolsos — incluindo dois cargo com fechamento silencioso — para organizar o essencial. A barra com cordão permite alternar entre caimento reto e ajustado.',
        'Tratamento repelente à água e cós com elástico interno garantem conforto e praticidade no dia a dia.',
      ],
      highlights: ['Sarja com elastano', '6 bolsos funcionais', 'Barra ajustável', 'Repelente à água'],
      specs: [
        ['Composição', '97% algodão, 3% elastano'],
        ['Modelagem', 'Relaxed'],
        ['Tamanhos', '36 ao 48'],
        ['Cor', 'Graphite'],
        ['Cuidados', 'Lavar à máquina, em água fria'],
        ['Origem', 'Fabricado no Brasil'],
      ],
      price: 529.0,
      promoPrice: 449.0,
      image: `${IMG}gravity-cargo.svg`,
      imageAlt: 'Calça cargo Gravity grafite com bolsos laterais e detalhe azul',
      stock: 20,
      rating: 4.6,
      reviewsCount: 77,
      sold: 450,
      featured: false,
      isNew: false,
      releaseDate: '2025-07-21',
      tags: ['calca', 'cargo', 'roupa', 'streetwear', 'utilitaria'],
    },

    /* ============================== ACESSÓRIOS ============================= */
    {
      id: 'MK-ACE-001',
      name: 'Iris Shades',
      subtitle: 'Óculos de sol polarizados UV400',
      category: 'acessorios',
      shortDescription: 'Lentes polarizadas em gradiente azul-violeta com proteção UV400.',
      description: [
        'Inspirados na íris e na forma como ela filtra a luz, os Iris Shades unem lentes polarizadas de alta definição a uma armação em acetato premium.',
        'O tratamento em gradiente azul-violeta reduz reflexos e realça contrastes, com proteção UV400 total. As dobradiças metálicas de cinco cilindros garantem durabilidade.',
        'Acompanham estojo rígido magnético e flanela de microfibra com o símbolo MUKEN.',
      ],
      highlights: ['Lentes polarizadas UV400', 'Armação em acetato', 'Dobradiças de 5 cilindros', 'Estojo magnético'],
      specs: [
        ['Lentes', 'Policarbonato polarizado, UV400'],
        ['Armação', 'Acetato italiano'],
        ['Medidas', '52-20-145 mm'],
        ['Peso', '31 g'],
        ['Acompanha', 'Estojo rígido e flanela'],
        ['Garantia', '1 ano'],
      ],
      price: 599.0,
      promoPrice: 479.0,
      image: `${IMG}iris-shades.svg`,
      imageAlt: 'Óculos de sol Iris Shades com armação preta e lentes em gradiente azul e violeta',
      stock: 26,
      rating: 4.8,
      reviewsCount: 143,
      sold: 870,
      featured: true,
      isNew: false,
      releaseDate: '2025-10-28',
      tags: ['oculos', 'oculos de sol', 'sunglasses', 'acessorio', 'polarizado'],
    },
    {
      id: 'MK-ACE-002',
      name: 'Orbit Cap',
      subtitle: 'Boné estruturado de 6 gomos',
      category: 'acessorios',
      shortDescription: 'Sarja de algodão, aba curva e símbolo do infinito bordado em 3D.',
      description: [
        'O Orbit Cap tem copa estruturada de seis gomos, aba curva pré-moldada e ajuste traseiro com fivela metálica — o equilíbrio entre o clássico e o contemporâneo.',
        'O símbolo do infinito é bordado em 3D com linha em gradiente azul, e os ilhoses de ventilação são costurados no mesmo tom da copa para um visual monocromático.',
        'A faixa interna absorve o suor e mantém o conforto nos dias quentes.',
      ],
      highlights: ['Bordado em 3D', 'Copa estruturada', 'Fivela metálica', 'Faixa antissuor'],
      specs: [
        ['Composição', '100% algodão (sarja)'],
        ['Tamanho', 'Único ajustável (54 a 60 cm)'],
        ['Aba', 'Curva pré-moldada'],
        ['Fecho', 'Fivela metálica'],
        ['Cor', 'Void Black'],
      ],
      price: 169.0,
      promoPrice: null,
      image: `${IMG}orbit-cap.svg`,
      imageAlt: 'Boné Orbit Cap preto visto de lado, com o símbolo do infinito bordado em azul',
      stock: 45,
      rating: 4.6,
      reviewsCount: 231,
      sold: 1980,
      featured: false,
      isNew: false,
      releaseDate: '2025-04-15',
      tags: ['bone', 'cap', 'chapeu', 'acessorio', 'preto'],
    },
    {
      id: 'MK-ACE-003',
      name: 'Carbon Slim Wallet',
      subtitle: 'Carteira slim em fibra de carbono com bloqueio RFID',
      category: 'acessorios',
      shortDescription: 'Fibra de carbono real, bloqueio RFID e capacidade para até 12 cartões.',
      description: [
        'A Carbon Slim Wallet tem apenas 6 mm de espessura e pesa 28 gramas. As placas em fibra de carbono real são leves e extremamente resistentes.',
        'O sistema de expansão comporta de 1 a 12 cartões sem perder a forma, e a banda metálica externa prende cédulas com firmeza. O bloqueio RFID protege seus cartões por aproximação.',
        'Acabamento fosco que não marca digitais e cantos arredondados para não desgastar o bolso.',
      ],
      highlights: ['Fibra de carbono real', 'Bloqueio RFID', 'De 1 a 12 cartões', 'Apenas 6 mm'],
      specs: [
        ['Material', 'Fibra de carbono 3K e alumínio'],
        ['Capacidade', 'Até 12 cartões'],
        ['Espessura', '6 mm'],
        ['Peso', '28 g'],
        ['Proteção', 'Bloqueio RFID 13,56 MHz'],
        ['Garantia', '2 anos'],
      ],
      price: 289.0,
      promoPrice: null,
      image: `${IMG}carbon-wallet.svg`,
      imageAlt: 'Carteira slim Carbon com textura de fibra de carbono, banda metálica e cartões azul e roxo',
      stock: 4,
      rating: 4.7,
      reviewsCount: 88,
      sold: 690,
      featured: false,
      isNew: false,
      releaseDate: '2025-03-08',
      tags: ['carteira', 'wallet', 'acessorio', 'rfid', 'carbono'],
    },
    {
      id: 'MK-ACE-004',
      name: 'Nexus Pack 20L',
      subtitle: 'Mochila técnica impermeável de 20 litros',
      category: 'acessorios',
      shortDescription: 'Compartimento acolchoado para notebook de 16", tecido impermeável e organização modular.',
      description: [
        'A Nexus Pack foi pensada para quem leva o escritório na bagagem. O compartimento acolchoado e suspenso protege notebooks de até 16" contra impactos.',
        'O tecido em poliéster reciclado com revestimento TPU é impermeável, e os zíperes selados mantêm tudo seco. Bolsos internos modulares organizam cabos, carregadores e acessórios.',
        'Costas ventiladas, alças ergonômicas e etiqueta refletiva com o símbolo MUKEN completam o conjunto.',
      ],
      highlights: ['Notebook de até 16"', 'Tecido impermeável', 'Bolsos modulares', 'Material reciclado'],
      specs: [
        ['Capacidade', '20 litros'],
        ['Material', 'Poliéster reciclado com TPU'],
        ['Notebook', 'Até 16"'],
        ['Dimensões', '46 × 30 × 15 cm'],
        ['Peso', '1,1 kg'],
        ['Garantia', '2 anos'],
      ],
      price: 749.0,
      promoPrice: 649.0,
      image: `${IMG}nexus-pack.svg`,
      imageAlt: 'Mochila Nexus Pack preta com zíper frontal em arco, alças laterais e etiqueta com o símbolo do infinito',
      stock: 14,
      rating: 4.9,
      reviewsCount: 176,
      sold: 1120,
      featured: false,
      isNew: true,
      releaseDate: '2026-07-30',
      tags: ['mochila', 'backpack', 'bolsa', 'notebook', 'viagem', 'acessorio'],
    },
    {
      id: 'MK-ACE-005',
      name: 'Loop Band',
      subtitle: 'Pulseira em aço com fecho magnético',
      category: 'acessorios',
      shortDescription: 'Aço inoxidável escovado e fecho magnético em azul anodizado.',
      description: [
        'A Loop Band é um círculo contínuo — o infinito em sua forma mais simples. O aço inoxidável 316L escovado é hipoalergênico e resistente à oxidação.',
        'O fecho magnético com acabamento em azul anodizado facilita colocar e tirar com uma só mão, mantendo a peça firme no pulso.',
        'Unissex, disponível em dois diâmetros e entregue em embalagem presenteável.',
      ],
      highlights: ['Aço 316L hipoalergênico', 'Fecho magnético', 'Unissex', 'Embalagem para presente'],
      specs: [
        ['Material', 'Aço inoxidável 316L'],
        ['Fecho', 'Magnético, azul anodizado'],
        ['Tamanhos', 'M (17 cm) e G (19 cm)'],
        ['Largura', '6 mm'],
        ['Peso', '18 g'],
        ['Garantia', '1 ano'],
      ],
      price: 249.0,
      promoPrice: null,
      image: `${IMG}loop-band.svg`,
      imageAlt: 'Pulseira Loop Band em aço escovado com fecho magnético azul',
      stock: 30,
      rating: 4.5,
      reviewsCount: 64,
      sold: 380,
      featured: false,
      isNew: true,
      releaseDate: '2026-08-25',
      tags: ['pulseira', 'bracelete', 'joia', 'acessorio', 'aco'],
    },

    /* =============================== LIFESTYLE ============================= */
    {
      id: 'MK-LIF-001',
      name: 'Aurora Lamp',
      subtitle: 'Luminária LED ambiente RGB',
      category: 'lifestyle',
      shortDescription: 'Anel de luz com 16 milhões de cores, cenas dinâmicas e controle por aplicativo.',
      description: [
        'A Aurora Lamp transforma qualquer ambiente com um anel de luz difusa de 40 cm. O LED de alta densidade elimina pontos de luz e cria gradientes suaves, como uma aurora.',
        'Escolha entre 16 milhões de cores, temperaturas de branco de 2.700 K a 6.500 K e cenas dinâmicas que acompanham a música ou o horário do dia. O controle é feito pelo aplicativo, por voz ou pelo botão touch na base.',
        'Base em alumínio usinado e haste minimalista: uma peça de design que também é iluminação funcional para trabalhar ou relaxar.',
      ],
      highlights: ['16 milhões de cores', 'Cenas dinâmicas', 'Controle por app e voz', 'Base em alumínio'],
      specs: [
        ['Diâmetro do anel', '40 cm'],
        ['Potência', '18 W'],
        ['Fluxo luminoso', '1.200 lm'],
        ['Temperatura de cor', '2.700 K a 6.500 K + RGB'],
        ['Conectividade', 'Wi-Fi 2,4 GHz e Bluetooth'],
        ['Garantia', '1 ano'],
      ],
      price: 699.0,
      promoPrice: 559.0,
      image: `${IMG}aurora-lamp.svg`,
      imageAlt: 'Luminária Aurora com anel de luz azul e violeta brilhante sobre haste e base metálica',
      stock: 16,
      rating: 4.8,
      reviewsCount: 190,
      sold: 1450,
      featured: true,
      isNew: false,
      releaseDate: '2025-12-01',
      tags: ['luminaria', 'lampada', 'luz', 'led', 'rgb', 'decoracao', 'casa'],
    },
    {
      id: 'MK-LIF-002',
      name: 'Depth Bottle 750 ml',
      subtitle: 'Garrafa térmica em aço inox',
      category: 'lifestyle',
      shortDescription: 'Parede dupla a vácuo: 24 horas gelado e 12 horas quente.',
      description: [
        'A Depth Bottle mantém bebidas geladas por 24 horas e quentes por 12, graças à parede dupla de aço inoxidável com isolamento a vácuo.',
        'O acabamento em pintura eletrostática fosca não escorrega e não transpira. A tampa em aço com alça integrada é à prova de vazamentos.',
        'Livre de BPA, fácil de limpar e com boca larga para gelo. Sustentável e pensada para durar.',
      ],
      highlights: ['24 h gelado / 12 h quente', 'À prova de vazamentos', 'Livre de BPA', 'Boca larga'],
      specs: [
        ['Capacidade', '750 ml'],
        ['Material', 'Aço inox 18/8 com parede dupla'],
        ['Altura', '27 cm'],
        ['Peso', '390 g'],
        ['Tampa', 'Aço com vedação em silicone'],
        ['Garantia', '1 ano'],
      ],
      price: 219.0,
      promoPrice: null,
      image: `${IMG}depth-bottle.svg`,
      imageAlt: 'Garrafa térmica Depth azul-marinho fosca com tampa metálica e símbolo do infinito',
      stock: 50,
      rating: 4.7,
      reviewsCount: 298,
      sold: 2240,
      featured: false,
      isNew: false,
      releaseDate: '2025-02-14',
      tags: ['garrafa', 'termica', 'squeeze', 'agua', 'copo', 'casa'],
    },
    {
      id: 'MK-LIF-003',
      name: 'Zero Mug',
      subtitle: 'Caneca inteligente com controle de temperatura',
      category: 'lifestyle',
      shortDescription: 'Mantém seu café na temperatura exata, entre 50 °C e 65 °C.',
      description: [
        'Café frio nunca mais. A Zero Mug mantém sua bebida na temperatura escolhida, entre 50 °C e 65 °C, por até 80 minutos fora da base — ou o dia inteiro sobre ela.',
        'O anel de LED indica quando a temperatura ideal foi atingida, e o aplicativo permite salvar preferências para café, chá ou chocolate quente.',
        'Revestimento interno cerâmico que preserva o sabor, corpo em aço inox e base de carregamento por indução.',
      ],
      highlights: ['Temperatura de 50 °C a 65 °C', '80 min de bateria', 'Anel de LED indicador', 'Base por indução'],
      specs: [
        ['Capacidade', '300 ml'],
        ['Temperatura', '50 °C a 65 °C'],
        ['Bateria', 'Até 80 min fora da base'],
        ['Material', 'Aço inox com revestimento cerâmico'],
        ['Conectividade', 'Bluetooth'],
        ['Garantia', '1 ano'],
      ],
      price: 549.0,
      promoPrice: null,
      image: `${IMG}zero-mug.svg`,
      imageAlt: 'Caneca inteligente Zero Mug escura com café, anel de LED azul e base de carregamento',
      stock: 9,
      rating: 4.6,
      reviewsCount: 71,
      sold: 330,
      featured: false,
      isNew: true,
      releaseDate: '2026-09-20',
      tags: ['caneca', 'xicara', 'cafe', 'cha', 'smart', 'casa'],
    },
    {
      id: 'MK-LIF-004',
      name: 'Infinite Notebook A5',
      subtitle: 'Caderno pontilhado de capa rígida',
      category: 'lifestyle',
      shortDescription: '192 páginas pontilhadas em papel de 120 g/m², elástico e fita marcadora.',
      description: [
        'O Infinite Notebook tem 192 páginas pontilhadas em papel pólen de 120 g/m², que não marca o verso e aceita canetas tinteiro, marcadores e lápis.',
        'A capa rígida em linho sintético traz o símbolo do infinito em baixo-relevo. A costura em linha permite abrir o caderno a 180° para desenhar ou escrever sem esforço.',
        'Elástico de fechamento em azul elétrico, fita marcadora violeta e bolso interno para guardar anotações soltas.',
      ],
      highlights: ['Papel de 120 g/m²', 'Abertura de 180°', 'Páginas numeradas', 'Bolso interno'],
      specs: [
        ['Formato', 'A5 (14,8 × 21 cm)'],
        ['Páginas', '192, pontilhadas e numeradas'],
        ['Papel', 'Pólen 120 g/m²'],
        ['Capa', 'Rígida em linho sintético'],
        ['Extras', 'Elástico, fita marcadora e bolso'],
      ],
      price: 129.0,
      promoPrice: 99.0,
      image: `${IMG}infinite-notebook.svg`,
      imageAlt: 'Caderno Infinite azul-marinho com símbolo do infinito em relevo, elástico azul e fita marcadora roxa',
      stock: 70,
      rating: 4.8,
      reviewsCount: 212,
      sold: 1760,
      featured: false,
      isNew: false,
      releaseDate: '2025-01-20',
      tags: ['caderno', 'notebook', 'papelaria', 'agenda', 'bullet journal'],
    },
    {
      id: 'MK-LIF-005',
      name: 'Grid Desk Mat XL',
      subtitle: 'Desk mat em couro vegano com borda iluminada',
      category: 'lifestyle',
      shortDescription: '90 × 40 cm, superfície com grade sutil e borda com LED.',
      description: [
        'O Grid Desk Mat XL organiza o seu setup com uma superfície de 90 × 40 cm em couro vegano de toque aveludado, com grade sutil em baixo-relevo para alinhar teclado, mouse e acessórios.',
        'A borda tem uma fina faixa de LED alimentada por USB-C, que cria um contorno de luz azul sobre a mesa. A base antiderrapante mantém tudo no lugar.',
        'Resistente a respingos e fácil de limpar com um pano úmido.',
      ],
      highlights: ['90 × 40 cm', 'Couro vegano', 'Borda com LED', 'Base antiderrapante'],
      specs: [
        ['Dimensões', '90 × 40 cm'],
        ['Espessura', '3 mm'],
        ['Material', 'Couro vegano (PU) com base em cortiça'],
        ['Iluminação', 'LED na borda, alimentação USB-C'],
        ['Proteção', 'Resistente a respingos'],
      ],
      price: 199.0,
      promoPrice: null,
      image: `${IMG}grid-desk-mat.svg`,
      imageAlt: 'Desk mat Grid escuro em perspectiva, com grade sutil e borda iluminada em azul',
      stock: 2,
      rating: 4.7,
      reviewsCount: 133,
      sold: 870,
      featured: false,
      isNew: true,
      releaseDate: '2026-10-15',
      tags: ['desk mat', 'mousepad', 'mesa', 'setup', 'escritorio', 'led'],
    },
  ];

  /* ------------------------------------------------------------------
     AVALIAÇÕES FICTÍCIAS (geradas de forma determinística por produto)
     ------------------------------------------------------------------ */
  const REVIEWERS = ['Marina S.', 'Lucas T.', 'Beatriz A.', 'Rafael M.', 'Camila R.', 'Thiago L.', 'Ana P.', 'Gustavo N.', 'Juliana F.', 'Pedro H.', 'Larissa C.', 'Felipe O.'];

  const REVIEW_POOL = {
    tecnologia: [
      ['Acabamento impecável', 'A qualidade de construção impressiona. Parece um produto de marca internacional, e a bateria dura muito mais do que eu esperava.'],
      ['Valeu cada centavo', 'Uso todos os dias no trabalho. A conexão é estável e o design chama atenção na mesa.'],
      ['Melhor do que imaginei', 'A configuração foi rápida e o desempenho é excelente. Só senti falta de mais opções de cor.'],
      ['Experiência premium', 'Desde a embalagem até o uso diário, tudo transmite cuidado. Recomendo sem medo.'],
      ['Ótimo custo-benefício', 'Comparei com outras opções e este entregou mais pelo preço. Ficou perfeito no meu setup.'],
    ],
    moda: [
      ['Caimento perfeito', 'O tecido é encorpado e o caimento ficou exatamente como nas fotos. Já lavei várias vezes e continua igual.'],
      ['Virou minha peça favorita', 'Confortável, bonita e combina com tudo. Recebi elogios no primeiro dia de uso.'],
      ['Qualidade acima da média', 'As costuras são reforçadas e o acabamento é muito bem feito. Vale o investimento.'],
      ['Tamanho certinho', 'Segui a tabela de medidas e serviu perfeitamente. A entrega foi rápida.'],
      ['Design minimalista', 'Exatamente o estilo que eu procurava: discreto, moderno e com personalidade.'],
    ],
    acessorios: [
      ['Detalhe que faz diferença', 'Completa qualquer visual. O acabamento é premium e a embalagem é linda.'],
      ['Resistente e elegante', 'Uso diariamente há semanas e não apresenta nenhum desgaste. Muito satisfeito.'],
      ['Presente perfeito', 'Comprei para presentear e a pessoa adorou. A apresentação é impecável.'],
      ['Funcional de verdade', 'Além de bonito, resolve o meu dia a dia. Os materiais são de alta qualidade.'],
      ['Superou as expectativas', 'Leve, bem construído e com um design que não se encontra facilmente.'],
    ],
    lifestyle: [
      ['Transformou meu espaço', 'Deixou o ambiente muito mais bonito e aconchegante. Uso todos os dias.'],
      ['Design e utilidade', 'É raro encontrar algo tão bonito e tão prático ao mesmo tempo. Recomendo.'],
      ['Qualidade excelente', 'Materiais robustos e acabamento caprichado. Dá para ver que foi pensado nos detalhes.'],
      ['Compraria de novo', 'Já indiquei para amigos. Chegou bem embalado e funciona perfeitamente.'],
      ['Faz parte da rotina', 'Virou item indispensável na minha mesa. Simples, bonito e eficiente.'],
    ],
  };

  /** Hash simples e estável de uma string (para escolhas determinísticas). */
  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function buildReviews(product) {
    const pool = REVIEW_POOL[product.category];
    const seed = hash(product.id);
    const release = new Date(`${product.releaseDate}T12:00:00`);
    return [0, 1, 2].map((i) => {
      const [title, text] = pool[(seed + i * 2) % pool.length];
      const date = new Date(release.getTime() + (12 + ((seed >> (i + 2)) % 60) + i * 21) * 86400000);
      return {
        author: REVIEWERS[(seed + i * 5) % REVIEWERS.length],
        rating: i === 2 && product.rating < 4.8 ? 4 : 5,
        title,
        text,
        date: date.toISOString().slice(0, 10),
        verified: i !== 1,
      };
    });
  }

  /** Distribuição percentual das notas (5 a 1 estrelas) coerente com a média. */
  function ratingDistribution(rating) {
    const d = rating - 4.5;
    const p5 = Math.round(62 + d * 70);
    const p4 = Math.round(28 - d * 50);
    const p3 = Math.max(0, Math.round(6 - d * 12.5));
    const p2 = Math.max(0, Math.round(3 - d * 5));
    const p1 = Math.max(0, 100 - p5 - p4 - p3 - p2);
    return [p5, p4, p3, p2, p1];
  }

  /* ------------------------------------------------------------------
     MONTAGEM FINAL (dados imutáveis + campos derivados)
     ------------------------------------------------------------------ */
  const PRODUCTS = RAW_PRODUCTS.map((product) => Object.freeze({
    ...product,
    available: product.stock > 0, // indicador de disponibilidade do cadastro
    reviews: buildReviews(product),
    ratingDistribution: ratingDistribution(product.rating),
  }));

  const byIdMap = new Map(PRODUCTS.map((p) => [p.id, p]));

  /* ------------------------------------------------------------------
     ESTOQUE: vendas simuladas reduzem o estoque disponível
     (persistido no LocalStorage como { [id]: unidadesVendidas })
     ------------------------------------------------------------------ */
  const inventory = {
    soldMap() {
      return MK.storage.read('inventory', {}) || {};
    },
    soldUnits(id) {
      return Number(this.soldMap()[id]) || 0;
    },
    /** Registra a venda de itens de um pedido: [{ id, qty }] */
    registerSale(items) {
      const map = this.soldMap();
      items.forEach(({ id, qty }) => {
        map[id] = (Number(map[id]) || 0) + qty;
      });
      MK.storage.write('inventory', map);
      MK.utils.emit('inventory:change', map);
    },
    reset() {
      MK.storage.remove('inventory');
      MK.utils.emit('inventory:change', {});
    },
  };

  /* ------------------------------------------------------------------
     API DE CONSULTA
     ------------------------------------------------------------------ */
  const LOW_STOCK_LIMIT = 5;
  let cache = null;

  const api = {
    LOW_STOCK_LIMIT,

    all() {
      return PRODUCTS.slice();
    },

    byId(id) {
      return byIdMap.get(id) || null;
    },

    /**
     * Simula o carregamento assíncrono de uma API (permite exibir o
     * skeleton loading). Após o primeiro carregamento, usa o cache.
     */
    load() {
      if (cache) return Promise.resolve(cache);
      return new Promise((resolve) => {
        setTimeout(() => {
          cache = PRODUCTS.slice();
          resolve(cache);
        }, 650);
      });
    },

    isLoaded() {
      return Boolean(cache);
    },

    categories() {
      return CATEGORIES.slice();
    },

    category(id) {
      return CATEGORIES.find((c) => c.id === id) || null;
    },

    categoryName(id) {
      const category = this.category(id);
      return category ? category.name : id;
    },

    byCategory(id) {
      return PRODUCTS.filter((p) => p.category === id);
    },

    countByCategory(id) {
      return this.byCategory(id).length;
    },

    featured(limit = 4) {
      return PRODUCTS.filter((p) => p.featured).slice(0, limit);
    },

    newArrivals(limit = 8) {
      return PRODUCTS.filter((p) => p.isNew)
        .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
        .slice(0, limit);
    },

    bestSellers(limit = 5) {
      return PRODUCTS.slice().sort((a, b) => b.sold - a.sold).slice(0, limit);
    },

    onSale() {
      return PRODUCTS.filter((p) => this.hasPromo(p));
    },

    /** Produtos relacionados: mesma categoria primeiro, depois os mais bem avaliados. */
    related(product, limit = 4) {
      const same = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id);
      const others = PRODUCTS.filter((p) => p.category !== product.category)
        .sort((a, b) => b.rating - a.rating);
      return same.concat(others).slice(0, limit);
    },

    /* ---------- Preço ---------- */
    hasPromo(product) {
      return typeof product.promoPrice === 'number' && product.promoPrice < product.price;
    },

    finalPrice(product) {
      return this.hasPromo(product) ? product.promoPrice : product.price;
    },

    discountPercent(product) {
      if (!this.hasPromo(product)) return 0;
      return Math.round((1 - product.promoPrice / product.price) * 100);
    },

    savings(product) {
      return this.hasPromo(product) ? MK.utils.roundMoney(product.price - product.promoPrice) : 0;
    },

    /** Parcelamento sem juros: até 10x, com parcela mínima de R$ 30. */
    installments(value) {
      const count = Math.max(1, Math.min(10, Math.floor(value / 30)));
      return { count, value: MK.utils.roundMoney(value / count) };
    },

    /* ---------- Estoque e disponibilidade ---------- */
    stock(productOrId) {
      const product = typeof productOrId === 'string' ? this.byId(productOrId) : productOrId;
      if (!product) return 0;
      return Math.max(0, product.stock - inventory.soldUnits(product.id));
    },

    availability(productOrId) {
      const stock = this.stock(productOrId);
      if (stock <= 0) return { code: 'out', label: 'Esgotado', stock: 0 };
      if (stock <= LOW_STOCK_LIMIT) {
        return { code: 'low', label: stock === 1 ? 'Última unidade' : `Últimas ${stock} unidades`, stock };
      }
      return { code: 'in', label: 'Em estoque', stock };
    },

    isAvailable(productOrId) {
      return this.stock(productOrId) > 0;
    },
  };

  MK.products = api;
  MK.inventory = inventory;
})(window.MK = window.MK || {});
