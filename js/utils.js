/* =====================================================================
   MUKEN STORE — utils.js
   Funções utilitárias puras e reutilizáveis: formatação (moeda, datas),
   segurança (escape de HTML), texto (normalização sem acentos), tempo
   (debounce), clipboard e um barramento de eventos simples (pub/sub).
   Todos os módulos são expostos no namespace global `MK`.
   ===================================================================== */
(function (MK) {
  'use strict';

  const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const decimalFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  /** Barramento de eventos baseado em EventTarget (comunicação entre módulos). */
  const bus = new EventTarget();

  const utils = {
    /* ---------- DOM ---------- */
    $(selector, root = document) {
      return root.querySelector(selector);
    },

    $$(selector, root = document) {
      return Array.from(root.querySelectorAll(selector));
    },

    /* ---------- Formatação ---------- */
    /** 1599 -> "R$ 1.599,00" */
    formatPrice(value) {
      return currencyFormatter.format(Number(value) || 0);
    },

    /** 4.8 -> "4,8" */
    formatRating(value) {
      return decimalFormatter.format(Number(value) || 0);
    },

    formatDate(value) {
      return dateFormatter.format(new Date(value));
    },

    formatShortDate(value) {
      return shortDateFormatter.format(new Date(value));
    },

    formatTime(value) {
      return timeFormatter.format(new Date(value));
    },

    formatDateTime(value) {
      return `${shortDateFormatter.format(new Date(value))} às ${timeFormatter.format(new Date(value))}`;
    },

    /** Escolhe singular/plural: pluralize(2, 'item', 'itens') -> "2 itens" */
    pluralize(count, singular, plural) {
      return `${count} ${count === 1 ? singular : plural}`;
    },

    /* ---------- Segurança ---------- */
    /** Escapa texto antes de inseri-lo em templates HTML (evita XSS). */
    escapeHTML(value) {
      return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
    },

    /* ---------- Texto ---------- */
    /** Remove acentos e padroniza caixa: "Relógio Pulse" -> "relogio pulse". */
    normalize(value) {
      return String(value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
    },

    onlyDigits(value) {
      return String(value ?? '').replace(/\D/g, '');
    },

    /** Validação de e-mail prática (formato nome@dominio.ext). */
    isEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? '').trim());
    },

    /* ---------- Números ---------- */
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    /** Arredonda valores monetários para 2 casas, evitando erros de ponto flutuante. */
    roundMoney(value) {
      return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
    },

    randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /* ---------- Tempo ---------- */
    debounce(fn, wait = 200) {
      let timer;
      return function debounced(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /* ---------- Identificadores ---------- */
    /** Código aleatório legível (sem 0/O/1/I para evitar confusão). */
    randomCode(length = 4) {
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < length; i += 1) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      return code;
    },

    /* ---------- Clipboard ---------- */
    async copyToClipboard(text) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (error) {
        /* cai no método alternativo abaixo */
      }
      try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        return ok;
      } catch (error) {
        return false;
      }
    },

    /* ---------- Eventos entre módulos ---------- */
    on(type, handler) {
      const listener = (event) => handler(event.detail);
      bus.addEventListener(type, listener);
      return () => bus.removeEventListener(type, listener);
    },

    emit(type, detail) {
      bus.dispatchEvent(new CustomEvent(type, { detail }));
    },
  };

  MK.utils = utils;

  // Registros compartilhados entre módulos. Ficam aqui porque utils.js é o
  // primeiro script carregado: assim qualquer módulo pode registrar páginas
  // (views) e ações antes de app.js inicializar o roteador.
  MK.views = MK.views || {};
  MK.actions = MK.actions || {};
})(window.MK = window.MK || {});
