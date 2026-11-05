/* =====================================================================
   MUKEN STORE — storage.js
   Camada de persistência sobre o LocalStorage.
   - Todas as chaves usam o prefixo "muken:" (evita conflitos).
   - Leitura/escrita com JSON seguro (try/catch): dados corrompidos ou
     armazenamento bloqueado nunca quebram a aplicação.
   - Fallback em memória quando o LocalStorage não está disponível
     (ex.: navegação privada restrita) — o site continua funcionando.
   - Sincronização entre abas via evento nativo "storage".
   ===================================================================== */
(function (MK) {
  'use strict';

  const PREFIX = 'muken:';
  const memory = new Map();

  /** Catálogo de chaves usadas pela loja (exibido na Política de Privacidade). */
  const KEYS = {
    cart: { label: 'Carrinho', description: 'Produtos e quantidades adicionados ao carrinho.' },
    coupon: { label: 'Cupom aplicado', description: 'Código do cupom promocional ativo no carrinho.' },
    favorites: { label: 'Favoritos', description: 'Lista de produtos marcados como favoritos.' },
    orders: { label: 'Pedidos', description: 'Histórico de pedidos simulados (itens, valores, pagamento e endereço informado).' },
    inventory: { label: 'Estoque', description: 'Unidades vendidas em pedidos simulados, usadas para atualizar o estoque exibido.' },
    profile: { label: 'Dados de entrega', description: 'Nome, contato e endereço salvos no checkout, somente se você autorizar.' },
    recent: { label: 'Vistos recentemente', description: 'Últimos produtos visualizados, para facilitar a navegação.' },
    theme: { label: 'Tema', description: 'Preferência de tema claro ou escuro.' },
    newsletter: { label: 'Newsletter', description: 'E-mails cadastrados na newsletter (simulada).' },
    messages: { label: 'Mensagens', description: 'Mensagens enviadas pelo formulário de contato (simulado).' },
  };

  /** Detecta se o LocalStorage pode ser usado de fato. */
  const persistent = (() => {
    try {
      const probe = `${PREFIX}__probe__`;
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  })();

  function fullKey(key) {
    return PREFIX + key;
  }

  /**
   * Lê e converte um valor JSON. Retorna `fallback` quando a chave não
   * existe ou o conteúdo é inválido.
   */
  function read(key, fallback = null) {
    try {
      const raw = persistent ? window.localStorage.getItem(fullKey(key)) : memory.get(key);
      if (raw === null || raw === undefined) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null ? fallback : parsed;
    } catch (error) {
      console.warn(`[MUKEN] Dado inválido em "${key}" foi ignorado.`, error);
      return fallback;
    }
  }

  /** Grava um valor serializado em JSON. Retorna `true` em caso de sucesso. */
  function write(key, value) {
    const raw = JSON.stringify(value);
    try {
      if (persistent) {
        window.localStorage.setItem(fullKey(key), raw);
      } else {
        memory.set(key, raw);
      }
      return true;
    } catch (error) {
      // Ex.: cota excedida. Mantém em memória para não perder a sessão.
      memory.set(key, raw);
      console.warn(`[MUKEN] Não foi possível salvar "${key}" no navegador.`, error);
      return false;
    }
  }

  function remove(key) {
    try {
      if (persistent) window.localStorage.removeItem(fullKey(key));
    } catch (error) {
      /* ignora */
    }
    memory.delete(key);
  }

  /** Lista as chaves da MUKEN atualmente gravadas (sem o prefixo). */
  function keys() {
    if (!persistent) return Array.from(memory.keys());
    const list = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX)) list.push(key.slice(PREFIX.length));
    }
    return list;
  }

  /** Tamanho aproximado (em bytes) dos dados da loja no navegador. */
  function usage() {
    return keys().reduce((total, key) => {
      const raw = persistent ? window.localStorage.getItem(fullKey(key)) : memory.get(key);
      return total + (raw ? raw.length * 2 : 0);
    }, 0);
  }

  /** Remove todos os dados da MUKEN deste navegador. */
  function clearAll() {
    keys().forEach(remove);
    memory.clear();
  }

  /**
   * Executa `callback(novoValor)` quando a chave muda em OUTRA aba.
   * (O evento "storage" não dispara na aba que fez a alteração.)
   */
  function subscribe(key, callback) {
    const handler = (event) => {
      if (event.key === fullKey(key) || event.key === null) {
        callback(read(key));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }

  MK.storage = {
    PREFIX,
    KEYS,
    read,
    write,
    remove,
    keys,
    usage,
    clearAll,
    subscribe,
    isPersistent: () => persistent,
  };
})(window.MK = window.MK || {});
