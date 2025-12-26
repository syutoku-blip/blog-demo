/**************************************************************
 * main.js
 * - レイアウト3追加（body.third-layout）
 * - 商品情報は商品情報①/②の上から半分ずつで
 *   商品情報①/商品情報②に分割表示（レイアウト3のみ）
 * - レイアウト4追加（body.fourth-layout）
 *   ・画像 / 商品情報 / 主要項目 / カート / keepa / 需要供給グラフ（大）
 *   ・商品画像はもっと狭く（keepaもそれに合わせる）
 *   ・主要項目の横幅を広げる
 *   ・主要項目（l4-center）の高さを基準にして、
 *     商品情報 / 商品画像の高さを揃える
 * - グラフの切替（需要＆供給 / 供給＆価格 / 両方）
 *************************************************************/

(function () {
  "use strict";

  /* =========================
     定数/ユーティリティ
  ========================= */
  const FX_RATE = 155; // 固定為替（円換算用）
  const STORAGE_KEY_LAYOUT = "mesAIA_metrics_layout_v1";
  const STORAGE_KEY_CART = "mesAIA_cart_v1";

  const fmtJPY = (n) => {
    const v = Number(n || 0);
    return "￥" + v.toLocaleString("ja-JP");
  };
  const fmtUSD = (n) => {
    const v = Number(n || 0);
    return "$" + v.toFixed(2);
  };
  const fmtKg = (n) => {
    const v = Number(n || 0);
    if (!isFinite(v) || v <= 0) return "－";
    return v.toFixed(2) + "kg";
  };
  const safeText = (v) => (v == null ? "" : String(v));
  const parseUSD = (s) => {
    if (s == null) return NaN;
    const m = String(s).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : NaN;
  };

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function loadStorageJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function saveStorageJSON(key, obj) {
    try {
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {}
  }

  /* =========================
     ASINデータ
  ========================= */
  const DATA = window.ASIN_DATA || {};

  /* =========================
     DOM参照
  ========================= */
  const asinCatalog = $("#asinCatalog");
  const itemsContainer = $("#itemsContainer");
  const emptyState = $("#emptyState");
  const headerStatus = $("#headerStatus");

  const metricsPoolZone = $("#metricsPoolZone");
  const metricsInfoZone = $("#metricsInfoZone");
  const metricsCenterZone = $("#metricsCenterZone");
  const metricsTableZone = $("#metricsTableZone");
  const metricsHiddenZone = $("#metricsHiddenZone");

  const resetCurrentBtn = $("#resetCurrentBtn");
  const clearCardsBtn = $("#clearCardsBtn");
  const clearCartBtn = $("#clearCartBtn");

  const metricsCollapseBtn = $("#metricsCollapseBtn");
  const metricsBar = $("#metricsBar");

  const sortControls = $("#sortControls");
  const addSortRuleBtn = $("#addSortRuleBtn");
  const applySortBtn = $("#applySortBtn");
  const clearSortBtn = $("#clearSortBtn");

  const cartSummary = $("#cartSummary");
  const cartTotalCost = $("#cartTotalCost");
  const cartTotalRevenue = $("#cartTotalRevenue");
  const cartTotalProfit = $("#cartTotalProfit");
  const cartAsinCount = $("#cartAsinCount");
  const cartItemCount = $("#cartItemCount");

  const isAlt = document.body.classList.contains("alt-layout");
  const isThird = document.body.classList.contains("third-layout");
  const isFourth = document.body.classList.contains("fourth-layout");

  /* =========================
     指標（項目）候補
  ========================= */
  const METRICS_ALL = [
    { id: "粗利益率予測", label: "粗利益率予測", sourceKey: "粗利益率予測" },
    { id: "入金額予測", label: "入金額予測（円）", sourceKey: "入金額予測" },
    { id: "粗利益予測", label: "粗利益予測（1個）", sourceKey: "粗利益予測" },

    { id: "粗利益", label: "粗利益", sourceKey: "粗利益" },
    { id: "粗利益率", label: "粗利益率", sourceKey: "粗利益率" },

    { id: "販売額（ドル）", label: "販売額（USD）", sourceKey: "販売額（ドル）" },
    { id: "入金額（円）", label: "入金額（円）", sourceKey: "入金額（円）" },
    { id: "入金額計（円）", label: "入金額計（円）", sourceKey: "入金額計（円）" },

    { id: "30日販売数", label: "30日販売数（実績）", sourceKey: "30日販売数" },
    { id: "90日販売数", label: "90日販売数（実績）", sourceKey: "90日販売数" },
    { id: "180日販売数", label: "180日販売数（実績）", sourceKey: "180日販売数" },
    { id: "予測30日販売数", label: "予測30日販売数", sourceKey: "予測30日販売数" },

    { id: "複数在庫指数45日分", label: "複数在庫指数45日分", sourceKey: "複数在庫指数45日分" },
    { id: "複数在庫指数60日分", label: "複数在庫指数60日分", sourceKey: "複数在庫指数60日分" },

    { id: "ライバル偏差1", label: "ライバル偏差1", sourceKey: "ライバル偏差1" },
    { id: "ライバル偏差2", label: "ライバル偏差2", sourceKey: "ライバル偏差2" },
    { id: "ライバル増加率", label: "ライバル増加率", sourceKey: "ライバル増加率" },

    { id: "在庫数", label: "在庫数", sourceKey: "在庫数" },
    { id: "返品率", label: "返品率", sourceKey: "返品率" },

    { id: "日本最安値", label: "日本最安値", sourceKey: "日本最安値" },

    { id: "仕入れ目安単価", label: "仕入れ目安単価", sourceKey: "仕入れ目安単価" },
    { id: "想定送料", label: "想定送料", sourceKey: "想定送料" },
    { id: "送料", label: "送料", sourceKey: "送料" },
    { id: "関税", label: "関税", sourceKey: "関税" }
  ];
  const METRIC_BY_ID = Object.fromEntries(METRICS_ALL.map((m) => [m.id, m]));

  /* =========================
     商品情報（項目）候補
  ========================= */
  const INFO_FIELDS_ALL = [
    { id: "商品名", label: "商品名", kind: "computedTitle" },
    { id: "ブランド", label: "ブランド", kind: "text", sourceKey: "ブランド" },
    { id: "評価", label: "評価", kind: "text", sourceKey: "レビュー評価" },

    { id: "各種ASIN", label: "各種ASIN", kind: "computed" },
    { id: "JAN", label: "JAN", kind: "text", sourceKey: "JAN" },
    { id: "SKU", label: "SKU", kind: "text", sourceKey: "SKU" },

    { id: "サイズ", label: "サイズ", kind: "computed" },
    { id: "重量（容積重量）", label: "重量（容積重量）", kind: "computed" },

    { id: "カテゴリ", label: "カテゴリ", kind: "computedCategory" },
    { id: "注意事項", label: "注意事項", kind: "text", sourceKey: "注意事項（警告系）" }
  ];

  /* =========================
     初期配置
  ========================= */
  const DEFAULT_LAYOUT = {
    pool: [
      "粗利益率予測",
      "入金額予測",
      "粗利益予測",
      "30日販売数",
      "90日販売数",
      "180日販売数",
      "予測30日販売数",
      "複数在庫指数45日分",
      "複数在庫指数60日分",
      "ライバル偏差1",
      "ライバル偏差2",
      "ライバル増加率",
      "在庫数",
      "返品率",
      "日本最安値",
      "仕入れ目安単価",
      "想定送料",
      "送料",
      "関税",
      "粗利益",
      "粗利益率",
      "販売額（ドル）",
      "入金額（円）",
      "入金額計（円）"
    ],
    info: ["商品名", "ブランド", "評価", "各種ASIN", "JAN", "SKU", "サイズ", "重量（容積重量）", "カテゴリ", "注意事項"],
    center: ["粗利益率予測", "粗利益予測", "入金額予測", "仕入れ目安単価", "想定送料", "送料"],
    table: ["粗利益", "粗利益率", "販売額（ドル）", "入金額（円）", "入金額計（円）", "30日販売数", "90日販売数", "180日販売数"],
    hidden: []
  };

  /* =========================
     状態
  ========================= */
  const state = {
    selectedAsins: [],
    layout: loadStorageJSON(STORAGE_KEY_LAYOUT, DEFAULT_LAYOUT),
    sortRules: []
  };

  // カート（ASIN -> {qty, sellUSD, costJPY}）
  const cart = new Map(Object.entries(loadStorageJSON(STORAGE_KEY_CART, {})));

  /* =========================
     ヘッダー表示
  ========================= */
  function setHeaderStatus(msg) {
    if (!headerStatus) return;
    headerStatus.textContent = msg || "";
  }

  /* =========================
     カタログ（左：ASIN一覧）
  ========================= */
  function renderCatalog() {
    if (!asinCatalog) return;
    asinCatalog.innerHTML = "";

    const asins = Object.keys(DATA);
    asins.forEach((asin) => {
      const btn = document.createElement("button");
      btn.className = "asin-item";
      btn.type = "button";
      btn.textContent = asin;
      btn.addEventListener("click", () => addAsinCard(asin));
      asinCatalog.appendChild(btn);
    });
  }

  /* =========================
     配置UI（ドラッグ＆ドロップ）
  ========================= */
  function makeChip(id, text) {
    const el = document.createElement("div");
    el.className = "metric-chip";
    el.draggable = true;
    el.dataset.id = id;
    el.textContent = text;

    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
    });

    return el;
  }

  function allowDrop(zone) {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      zone.classList.add("drop");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drop"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drop");

      const id = e.dataTransfer.getData("text/plain");
      if (!id) return;

      moveMetricToZone(id, zone.id);
      renderLayoutBar();
      renderAllCards();
      persistLayout();
    });
  }

  function persistLayout() {
    saveStorageJSON(STORAGE_KEY_LAYOUT, state.layout);
  }

  function normalizeLayout(layout) {
    // 重複排除 + 不明ID排除
    const validMetricIds = new Set(METRICS_ALL.map((m) => m.id));
    const validInfoIds = new Set(INFO_FIELDS_ALL.map((i) => i.id));

    const allMetricLists = ["pool", "center", "table", "hidden"];
    const allInfoLists = ["info"];

    const used = new Set();
    allMetricLists.forEach((k) => {
      layout[k] = (layout[k] || []).filter((id) => validMetricIds.has(id) && !used.has(id) && (used.add(id), true));
    });

    const usedInfo = new Set();
    allInfoLists.forEach((k) => {
      layout[k] = (layout[k] || []).filter((id) => validInfoIds.has(id) && !usedInfo.has(id) && (usedInfo.add(id), true));
    });

    // 足りない項目はpoolへ戻す
    METRICS_ALL.forEach((m) => {
      if (!used.has(m.id)) layout.pool.push(m.id);
    });
    INFO_FIELDS_ALL.forEach((i) => {
      if (!usedInfo.has(i.id)) layout.info.push(i.id);
    });

    return layout;
  }

  state.layout = normalizeLayout(state.layout);

  function moveMetricToZone(id, zoneId) {
    const map = {
      metricsPoolZone: "pool",
      metricsCenterZone: "center",
      metricsTableZone: "table",
      metricsHiddenZone: "hidden"
    };
    const z = map[zoneId];
    if (!z) return;

    // 全ゾーンから削除
    Object.keys(map).forEach((k) => {
      const kk = map[k];
      state.layout[kk] = (state.layout[kk] || []).filter((x) => x !== id);
    });

    // 追加（末尾）
    state.layout[z].push(id);
  }

  function renderLayoutBar() {
    if (!metricsPoolZone) return;

    metricsPoolZone.innerHTML = "";
    metricsCenterZone.innerHTML = "";
    metricsTableZone.innerHTML = "";
    metricsHiddenZone.innerHTML = "";

    state.layout.pool.forEach((id) => {
      const m = METRIC_BY_ID[id];
      if (!m) return;
      metricsPoolZone.appendChild(makeChip(id, m.label));
    });
    state.layout.center.forEach((id) => {
      const m = METRIC_BY_ID[id];
      if (!m) return;
      metricsCenterZone.appendChild(makeChip(id, m.label));
    });
    state.layout.table.forEach((id) => {
      const m = METRIC_BY_ID[id];
      if (!m) return;
      metricsTableZone.appendChild(makeChip(id, m.label));
    });
    state.layout.hidden.forEach((id) => {
      const m = METRIC_BY_ID[id];
      if (!m) return;
      metricsHiddenZone.appendChild(makeChip(id, m.label));
    });

    // info（商品情報）は別UI（metricsInfoZone）
    if (metricsInfoZone) {
      metricsInfoZone.innerHTML = "";
      state.layout.info.forEach((id) => {
        const f = INFO_FIELDS_ALL.find((x) => x.id === id);
        if (!f) return;
        metricsInfoZone.appendChild(makeChip(id, f.label));
      });

      // 商品情報ゾーンのdrop対応
      metricsInfoZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        metricsInfoZone.classList.add("drop");
      });
      metricsInfoZone.addEventListener("dragleave", () => metricsInfoZone.classList.remove("drop"));
      metricsInfoZone.addEventListener("drop", (e) => {
        e.preventDefault();
        metricsInfoZone.classList.remove("drop");
        const id = e.dataTransfer.getData("text/plain");
        if (!id) return;

        // info系かmetrics系か判定（存在する方へ）
        const isInfo = INFO_FIELDS_ALL.some((x) => x.id === id);
        if (!isInfo) {
          // metricsチップが商品情報に落ちたらpoolへ（安全側）
          moveMetricToZone(id, "metricsPoolZone");
          renderLayoutBar();
          renderAllCards();
          persistLayout();
          return;
        }

        // 既存infoから削除して末尾へ
        ["info"].forEach((k) => (state.layout[k] = (state.layout[k] || []).filter((x) => x !== id)));
        state.layout.info.push(id);

        renderLayoutBar();
        renderAllCards();
        persistLayout();
      });
    }

    // dropを有効化（metrics系）
    allowDrop(metricsPoolZone);
    allowDrop(metricsCenterZone);
    allowDrop(metricsTableZone);
    allowDrop(metricsHiddenZone);
  }

  /* =========================
     ソートUI
  ========================= */
  function getCenterMetricIds() {
    return state.layout.center || [];
  }

  function buildSortControls() {
    if (!sortControls) return;

    sortControls.innerHTML = "";

    const centerIds = getCenterMetricIds();
    if (!centerIds.length) {
      const p = document.createElement("div");
      p.className = "muted";
      p.textContent = "※ 真ん中の枠に指標を配置すると、ここでソート条件として選べます。";
      sortControls.appendChild(p);
      return;
    }

    state.sortRules.forEach((rule, idx) => {
      const row = document.createElement("div");
      row.className = "sort-row";

      const selMetric = document.createElement("select");
      selMetric.className = "sort-sel";
      centerIds.forEach((id) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = (METRIC_BY_ID[id] && METRIC_BY_ID[id].label) || id;
        if (rule.metricId === id) opt.selected = true;
        selMetric.appendChild(opt);
      });
      selMetric.addEventListener("change", () => {
        rule.metricId = selMetric.value;
      });

      const selDir = document.createElement("select");
      selDir.className = "sort-sel";
      [
        { v: "desc", t: "大きい順" },
        { v: "asc", t: "小さい順" }
      ].forEach((x) => {
        const opt = document.createElement("option");
        opt.value = x.v;
        opt.textContent = x.t;
        if (rule.dir === x.v) opt.selected = true;
        selDir.appendChild(opt);
      });
      selDir.addEventListener("change", () => {
        rule.dir = selDir.value;
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "ghost-btn";
      removeBtn.type = "button";
      removeBtn.textContent = "削除";
      removeBtn.addEventListener("click", () => {
        state.sortRules.splice(idx, 1);
        buildSortControls();
      });

      row.appendChild(selMetric);
      row.appendChild(selDir);
      row.appendChild(removeBtn);
      sortControls.appendChild(row);
    });
  }

  function addSortRule() {
    const centerIds = getCenterMetricIds();
    if (!centerIds.length) return;
    state.sortRules.push({ metricId: centerIds[0], dir: "desc" });
    buildSortControls();
  }

  function applySort() {
    if (!state.sortRules.length) return;

    // 現在表示しているカードを並び替え
    const cards = $all(".product-card", itemsContainer);
    const items = cards.map((card) => {
      const asin = card.dataset.asin;
      const data = DATA[asin] || {};
      return { asin, card, data };
    });

    const getMetricValue = (data, metricId) => {
      const def = METRIC_BY_ID[metricId];
      if (!def) return NaN;
      const raw = data[def.sourceKey];
      if (raw == null) return NaN;
      // 数値抽出
      const m = String(raw).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
      return m ? Number(m[0]) : NaN;
    };

    items.sort((a, b) => {
      for (const rule of state.sortRules) {
        const va = getMetricValue(a.data, rule.metricId);
        const vb = getMetricValue(b.data, rule.metricId);

        const na = Number.isFinite(va);
        const nb = Number.isFinite(vb);
        if (!na && !nb) continue;
        if (!na) return 1;
        if (!nb) return -1;

        if (va === vb) continue;
        return rule.dir === "asc" ? va - vb : vb - va;
      }
      return 0;
    });

    // DOMに反映
    items.forEach((it) => itemsContainer.appendChild(it.card));
  }

  function clearSort() {
    state.sortRules = [];
    buildSortControls();
  }

  /* =========================
     カード（商品表示）
  ========================= */
  function addAsinCard(asin) {
    if (!asin || !DATA[asin]) return;

    if (!state.selectedAsins.includes(asin)) {
      state.selectedAsins.push(asin);
    }

    renderAllCards();
  }

  function clearCards() {
    state.selectedAsins = [];
    renderAllCards();
  }

  function clearCart() {
    cart.clear();
    saveStorageJSON(STORAGE_KEY_CART, {});
    updateCartSummary();
    // 入力欄をリセット
    $all(".product-card").forEach((card) => {
      const qty = card.querySelector(".js-qty");
      const sell = card.querySelector(".js-sell");
      const cost = card.querySelector(".js-cost");
      if (qty) qty.value = "1";
      if (sell) sell.value = "";
      if (cost) cost.value = "";
    });
  }

  function buildInfoGrid(container, ctx, data) {
    if (!container) return;
    container.innerHTML = "";
    const list = state.layout.info || [];
    list.forEach((id) => {
      const def = INFO_FIELDS_ALL.find((x) => x.id === id);
      if (!def) return;

      const row = document.createElement("div");
      row.className = "info-row";

      const k = document.createElement("div");
      k.className = "k";
      k.textContent = def.label;

      const v = document.createElement("div");
      v.className = "v";

      if (def.kind === "computedTitle") {
        v.textContent = data["品名"] || data["商品名"] || "－";
      } else if (def.kind === "computed") {
        v.innerHTML =
          `<div class="mini"><span class="tag">US</span> ${safeText(ctx.usAsin)}</div>` +
          `<div class="mini"><span class="tag">JP</span> ${safeText(ctx.jpAsin)}</div>` +
          `<div class="mini"><span class="tag">Base</span> ${safeText(ctx.asin)}</div>`;
      } else if (def.kind === "computedCategory") {
        const p = data["親カテゴリ"] || "－";
        const s = data["サブカテゴリ"] || "－";
        v.textContent = `${p} / ${s}`;
      } else if (def.kind === "computedSize") {
        v.textContent = ctx.size;
      } else if (def.kind === "computedWeight") {
        v.textContent = ctx.weight;
      } else {
        v.textContent = safeText(data[def.sourceKey]) || "－";
      }

      row.appendChild(k);
      row.appendChild(v);
      container.appendChild(row);
    });
  }

  function buildInfoGridSplit(containerA, containerB, ctx, data) {
    // レイアウト3用：商品情報を上から半分ずつに分割して表示
    if (!containerA || !containerB) return;
    containerA.innerHTML = "";
    containerB.innerHTML = "";

    const list = state.layout.info || [];
    const half = Math.ceil(list.length / 2);
    const listA = list.slice(0, half);
    const listB = list.slice(half);

    const build = (container, ids) => {
      ids.forEach((id) => {
        const def = INFO_FIELDS_ALL.find((x) => x.id === id);
        if (!def) return;

        const row = document.createElement("div");
        row.className = "info-row";

        const k = document.createElement("div");
        k.className = "k";
        k.textContent = def.label;

        const v = document.createElement("div");
        v.className = "v";

        if (def.kind === "computedTitle") {
          v.textContent = data["品名"] || data["商品名"] || "－";
        } else if (def.kind === "computed") {
          v.innerHTML =
            `<div class="mini"><span class="tag">US</span> ${safeText(ctx.usAsin)}</div>` +
            `<div class="mini"><span class="tag">JP</span> ${safeText(ctx.jpAsin)}</div>` +
            `<div class="mini"><span class="tag">Base</span> ${safeText(ctx.asin)}</div>`;
        } else if (def.kind === "computedCategory") {
          const p = data["親カテゴリ"] || "－";
          const s = data["サブカテゴリ"] || "－";
          v.textContent = `${p} / ${s}`;
        } else if (def.kind === "computedSize") {
          v.textContent = ctx.size;
        } else if (def.kind === "computedWeight") {
          v.textContent = ctx.weight;
        } else {
          v.textContent = safeText(data[def.sourceKey]) || "－";
        }

        row.appendChild(k);
        row.appendChild(v);
        container.appendChild(row);
      });
    };

    build(containerA, listA);
    build(containerB, listB);
  }

  function buildCenterList(container, ctx, data) {
    if (!container) return;
    container.innerHTML = "";

    const list = state.layout.center || [];
    list.forEach((id) => {
      const m = METRIC_BY_ID[id];
      if (!m) return;

      const row = document.createElement("div");
      row.className = "center-row";

      const k = document.createElement("div");
      k.className = "k";
      k.textContent = m.label;

      const v = document.createElement("div");
      v.className = "v";
      v.textContent = safeText(data[m.sourceKey]) || "－";

      row.appendChild(k);
      row.appendChild(v);
      container.appendChild(row);
    });
  }

  function buildCenterCards(container, ctx, data) {
    // レイアウト4：主要項目をカード表示
    if (!container) return;
    container.innerHTML = "";

    const list = state.layout.center || [];
    list.forEach((id) => {
      const m = METRIC_BY_ID[id];
      if (!m) return;

      const card = document.createElement("div");
      card.className = "center-card";

      const k = document.createElement("div");
      k.className = "label";
      k.textContent = m.label;

      const v = document.createElement("div");
      v.className = "value";
      v.textContent = safeText(data[m.sourceKey]) || "－";

      card.appendChild(k);
      card.appendChild(v);
      container.appendChild(card);
    });
  }

  function buildDetailTable(container, ctx, data) {
    if (!container) return;
    container.innerHTML = "";

    const list = state.layout.table || [];
    list.forEach((id) => {
      const m = METRIC_BY_ID[id];
      if (!m) return;

      const row = document.createElement("div");
      row.className = "detail-row";

      const k = document.createElement("div");
      k.className = "k";
      k.textContent = m.label;

      const v = document.createElement("div");
      v.className = "v";
      v.textContent = safeText(data[m.sourceKey]) || "－";

      row.appendChild(k);
      row.appendChild(v);
      container.appendChild(row);
    });
  }

  function buildKeepaFrame(card, data) {
    const frame = card.querySelector(".js-keepaFrame");
    if (!frame) return;

    // 既存仕様：data["Keepaリンク"] が画像名/URLの場合があるので、
    // iframeに入れるのは「keepaのURLがある場合のみ」。
    // URLでない場合は空にしておく。
    const k = data["Keepaリンク"] || "";
    if (/^https?:\/\//i.test(k)) {
      frame.src = k;
    } else {
      frame.src = "";
    }
  }

  function renderAllCards() {
    if (!itemsContainer) return;

    itemsContainer.innerHTML = "";

    if (!state.selectedAsins.length) {
      if (emptyState) emptyState.style.display = "block";
      setHeaderStatus("");
      updateCartSummary();
      return;
    }
    if (emptyState) emptyState.style.display = "none";

    setHeaderStatus(`表示中: ${state.selectedAsins.length} 件`);

    state.selectedAsins.forEach((asin) => {
      const data = DATA[asin];
      if (!data) return;

      const card = createProductCard(asin, data);
      itemsContainer.appendChild(card);
    });

    // ソート適用（ルールがある場合）
    if (state.sortRules.length) applySort();

    updateCartSummary();
  }

  /* =========================
     チャート
  ========================= */
function renderChart(canvas, seedKey = "") {
  // Keepa風の「それっぽい動き」を作るための擬似データ生成（180日）
  // - 価格：段差（stepped）
  // - ランキング：価格とゆるく相関（良い=数値が小さい）
  // - セラー数：遅れて増減（下段表示）

  const DAYS = 180;

  // --- 乱数（ASINごとに再現性を持たせる） ---
  // 文字列seed → 0..1 の乱数
  let seed = 0;
  const s = String(seedKey || "seed");
  for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) >>> 0;
  const rand = () => {
    // xorshift32
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >> 17; seed >>>= 0;
    seed ^= seed << 5;  seed >>>= 0;
    return (seed >>> 0) / 4294967296;
  };
  const randN = () => {
    // Box-Muller（ざっくり）
    const u = Math.max(1e-9, rand());
    const v = Math.max(1e-9, rand());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  // --- ラベル（直近→過去の順で作っている既存の見た目に合わせる） ---
  const labels = Array.from({ length: DAYS }, (_, i) => `${DAYS - i}日`);

  // --- ベース値（Keepaっぽいレンジ） ---
  // 価格は 15〜120USD あたりで自然に見えるようにしつつ、seedで少しブレる
  const basePrice = 18 + rand() * 55;               // 18〜73
  const baseRank  = 25000 + rand() * 70000;         // 25k〜95k
  let sellers = Math.max(1, Math.min(14, Math.round(4 + rand() * 6))); // 4〜10

  // 需要（0..1）をゆるいランダムウォークにする
  let demand = 0.45 + rand() * 0.25; // 0.45〜0.70

  // 段差用の「現在値」と「保持日数」
  let curPrice = basePrice;
  let holdPrice = 0;

  let curSellers = sellers;
  let holdSellers = 0;

  const price = new Array(DAYS);
  const rank = new Array(DAYS);
  const sellerSeries = new Array(DAYS);

  // ラグ用（セラー反応を遅らせる）
  const priceHist = [];

  for (let t = 0; t < DAYS; t++) {
    // 需要：平均回帰 + ノイズ
    const drift = (0.55 - demand) * 0.03;
    demand = Math.max(0.05, Math.min(0.95, demand + drift + randN() * 0.03));

    // 価格：数日ごとに更新（段差）
    if (holdPrice <= 0) {
      // sellersが多いと値下がり圧力、需要が高いと値上がり圧力
      const supplyPressure = 1 - 0.025 * (curSellers - 6);
      const demandBoost = 1 + 0.22 * (demand - 0.5);

      let next = basePrice * supplyPressure * demandBoost;

      // ランダム要素（過度に暴れない）
      next += randN() * (basePrice * 0.01);

      // 価格レンジ制約
      next = Math.max(8, Math.min(160, next));

      // 2桁のKeepa感（小数2桁）
      curPrice = Math.round(next * 100) / 100;

      // 3〜8日保持
      holdPrice = 3 + Math.floor(rand() * 6);
    } else {
      holdPrice--;
    }

    // セラー：価格が高い / ランクが良い と増えやすい（ラグあり）
    priceHist.push(curPrice);
    if (priceHist.length > 12) priceHist.shift();
    const avgP = priceHist.reduce((a, b) => a + b, 0) / priceHist.length;

    if (holdSellers <= 0) {
      // 価格が高めなら増、低めなら減（じわっと）
      const priceSignal = (avgP - basePrice) / Math.max(1, basePrice); // -..+
      const delta =
        (priceSignal > 0.03 ? 1 : priceSignal < -0.03 ? -1 : 0) +
        (demand > 0.62 ? 1 : demand < 0.42 ? -1 : 0) +
        (rand() < 0.18 ? (rand() < 0.5 ? -1 : 1) : 0);

      curSellers = Math.max(1, Math.min(14, curSellers + delta));

      // 5〜12日保持（Keepaのセラー数っぽく段差）
      holdSellers = 5 + Math.floor(rand() * 8);
    } else {
      holdSellers--;
    }

    // ランキング：需要が上がると改善（数値が小さくなる）
    // 価格が高いほど改善するイメージ + セラー増で少し悪化
    const priceGain = (curPrice - basePrice) / Math.max(1, basePrice);
    let r =
      baseRank * (1.15 - 0.75 * demand) +        // 需要↑で改善
      baseRank * (-0.10 * priceGain) +           // 価格↑で改善（ユーザー要望）
      2500 * (curSellers - 6) +                  // セラー↑で若干悪化
      randN() * (baseRank * 0.04);

    // クリップ
    r = Math.max(1000, Math.min(250000, r));
    // 見た目のギザギザを少し抑える（Keepaは急変もあるが、ここは控えめ）
    rank[t] = Math.round(r);

    price[t] = curPrice;
    sellerSeries[t] = curSellers;
  }

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        // 価格：上段（左）
        {
          label: "価格(USD)",
          data: price,
          yAxisID: "yPrice",
          tension: 0,
          stepped: true,
          pointRadius: 0,
          borderWidth: 2,
          borderColor: "#f97316" // orange
        },
        // ランキング：上段（右）
        {
          label: "ランキング",
          data: rank,
          yAxisID: "yRank",
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 2,
          borderColor: "#22c55e" // green
        },
        // セラー数：下段（右）
        {
          label: "セラー数",
          data: sellerSeries,
          yAxisID: "ySellers",
          tension: 0,
          stepped: true,
          pointRadius: 0,
          borderWidth: 2,
          borderColor: "#a855f7" // purple
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const l = ctx.dataset.label || "";
              const v = ctx.parsed?.y;
              if (l === "価格(USD)") return `${l}: $${Number(v).toFixed(2)}`;
              if (l === "ランキング") return `${l}: #${Number(v).toLocaleString("en-US")}`;
              if (l === "セラー数") return `${l}: ${Number(v)} sellers`;
              return `${l}: ${v}`;
            }
          }
        }
      },
      scales: {
        // 上段：価格（左）
        yPrice: {
          position: "left",
          weight: 3,
          grid: { drawOnChartArea: true },
          ticks: {
            callback: (v) => `$${v}`
          }
        },
        // 上段：ランキング（右）
        yRank: {
          position: "right",
          weight: 3,
          grid: { drawOnChartArea: false },
          ticks: {
            callback: (v) => `#${Number(v).toLocaleString("en-US")}`
          }
        },
        // 下段：セラー数（右）
        ySellers: {
          position: "right",
          weight: 1,
          min: 0,
          max: 14,
          grid: { drawOnChartArea: true },
          ticks: {
            stepSize: 2,
            callback: (v) => `#${v}`
          }
        }
      }
    }
  });

  return chart;
}

  function updateChartVisibility(chart, showDS, showSP) {
    chart.data.datasets.forEach((ds) => {
      if (ds.label === "ランキング") ds.hidden = !showDS;
      if (ds.label === "セラー数") ds.hidden = !(showDS || showSP);
      if (ds.label === "価格(USD)") ds.hidden = !showSP;
    });
    chart.update();
  }

  /* =========================
     カート
  ========================= */
  function updateCartSummary() {
    let totalCost = 0;
    let totalRevenueJPY = 0;
    let asinCount = cart.size;
    let itemCount = 0;

    cart.forEach((v) => {
      const qty = Math.max(1, Number(v.qty || 1));
      const sellUSD = Number(v.sellUSD || 0);
      const costJPY = Number(v.costJPY || 0);

      itemCount += qty;
      totalCost += costJPY * qty;
      totalRevenueJPY += sellUSD * FX_RATE * qty;
    });

    const profit = totalRevenueJPY - totalCost;

    if (cartTotalCost) cartTotalCost.textContent = fmtJPY(totalCost);
    if (cartTotalRevenue) cartTotalRevenue.textContent = fmtJPY(totalRevenueJPY);
    if (cartTotalProfit) cartTotalProfit.textContent = fmtJPY(profit);
    if (cartAsinCount) cartAsinCount.textContent = String(asinCount);
    if (cartItemCount) cartItemCount.textContent = String(itemCount);
  }

  /* =========================
     カード生成
  ========================= */
  function createProductCard(asin, data) {
    const card = document.createElement("section");
    card.className = "product-card card";
    card.dataset.asin = asin;

    const isAltLayout = document.body.classList.contains("alt-layout");
    const isThirdLayout = document.body.classList.contains("third-layout");
    const isFourthLayout = document.body.classList.contains("fourth-layout");

    if (isThirdLayout) {
      card.innerHTML = `
      <div class="layout3-grid">
        <!-- 画像 -->
        <div class="l3-image">
          <div class="head">商品画像</div>
          <div class="image-grid">
            <img class="thumb" src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
            <img class="thumb" src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
            <img class="thumb" src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
            <img class="thumb" src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
          </div>
        </div>

        <!-- 商品情報① -->
        <div class="l3-info l3-block">
          <div class="head">商品情報①</div>
          <div class="info-grid js-infoGridA"></div>
        </div>

        <!-- 商品情報② -->
        <div class="l3-info2 l3-block">
          <div class="head">商品情報②</div>
          <div class="info-grid js-infoGridB"></div>
        </div>

        <!-- 主要項目 -->
        <div class="l3-center l3-block">
          <div class="head">主要項目</div>
          <div class="center-list js-center"></div>
        </div>

        <!-- カート -->
        <div class="l3-buy">
          <div class="buy-title">数量</div>
          <select class="js-qty">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>

          <div class="buy-title" style="margin-top:10px;">販売価格（$）</div>
          <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

          <div class="buy-title" style="margin-top:10px;">仕入れ額（￥）</div>
          <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

          <button class="cart-btn js-addCart" type="button" style="margin-top:12px;">カートに入れる</button>
        </div>

        <!-- keepa -->
        <div class="l3-keepa l3-block">
          <div class="head">keepaグラフ</div>
          <div class="keepa-mini">
            <iframe class="js-keepaFrame" src="" loading="lazy"></iframe>
          </div>
        </div>

        <!-- 需要供給 -->
        <div class="l3-mes l3-block">
          <div class="head">需要供給グラフ（180日）</div>

          <div class="graph-options js-graphOptions" style="margin-bottom:10px;">
            <label><input type="checkbox" class="js-chkDS" checked /> 需要＆供給</label>
            <label style="margin-left:12px;"><input type="checkbox" class="js-chkSP" /> 供給＆価格</label>
          </div>

          <div class="mes-big">
            <canvas class="js-chart"></canvas>
          </div>
        </div>

        <!-- 下段テーブル -->
        <div class="l3-table l3-block">
          <div class="head">詳細データ</div>
          <div class="detail-table js-detailTable"></div>
        </div>
      </div>`;
    } else if (isFourthLayout) {
      // レイアウト4
      const imgSrc = data["商品画像"] || "";
      card.innerHTML = `
      <div class="layout4-grid">

        <!-- 商品画像（細） -->
        <div class="l4-image l4-block">
          <div class="head">商品画像</div>
          <div class="image-grid">
            <img class="thumb main" src="${imgSrc}" alt="商品画像" onerror="this.style.display='none';" />
            <img class="thumb" src="${imgSrc}" alt="商品画像" onerror="this.style.display='none';" />
            <img class="thumb" src="${imgSrc}" alt="商品画像" onerror="this.style.display='none';" />
            <img class="thumb" src="${imgSrc}" alt="商品画像" onerror="this.style.display='none';" />
          </div>
        </div>

        <!-- 商品情報 -->
        <div class="l4-info l4-block">
          <div class="head">商品情報</div>
          <div class="info-grid js-infoGrid"></div>
        </div>

        <!-- 主要項目 -->
        <div class="l4-center l4-block">
          <div class="head">主要項目</div>
          <div class="center-cards js-centerCards"></div>
        </div>

        <!-- カート（右縦） -->
        <div class="l4-buy">
          <div class="buy-title">数量</div>
          <select class="js-qty">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>

          <div class="buy-title" style="margin-top:10px;">販売価格（$）</div>
          <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

          <div class="buy-title" style="margin-top:10px;">仕入れ額（￥）</div>
          <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

          <button class="cart-btn js-addCart" type="button" style="margin-top:12px;">カートに入れる</button>
        </div>

        <!-- keepa（小） -->
        <div class="l4-keepa l4-block">
          <div class="head">keepaグラフ</div>
          <div class="keepa-mini">
            <iframe class="js-keepaFrame" src="" loading="lazy"></iframe>
          </div>
        </div>

        <!-- 需要供給（大） -->
        <div class="l4-mes l4-block">
          <div class="head">需要供給グラフ（180日）</div>

          <div class="graph-options js-graphOptions" style="margin-bottom:10px;">
            <label><input type="checkbox" class="js-chkDS" checked /> 需要＆供給</label>
            <label style="margin-left:12px;"><input type="checkbox" class="js-chkSP" /> 供給＆価格</label>
          </div>

          <div class="mes-big">
            <canvas class="js-chart"></canvas>
          </div>
        </div>

      </div>`;
    } else {
      // 既存（通常/alt）カード
      const imgSrc = data["商品画像"] || "";
      card.innerHTML = `
      <div class="${isAltLayout ? "alt-grid" : "main-grid"}">
        <div class="product-top">
          <div class="product-image">
            <img src="${imgSrc}" alt="商品画像" onerror="this.style.display='none';" />
          </div>

          <div class="product-meta">
            <div class="title">${safeText(data["品名"] || "－")}</div>
            <div class="meta-row">
              <span class="tag">ASIN</span>
              <b>${asin}</b>
            </div>
            <div class="meta-row">
              <span class="tag">Brand</span>
              <b>${safeText(data["ブランド"] || "－")}</b>
            </div>

            <div class="buy-box">
              <div class="buy-title">数量</div>
              <select class="js-qty">
                <option value="1" selected>1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>

              <div class="buy-title" style="margin-top:10px;">販売価格（$）</div>
              <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

              <div class="buy-title" style="margin-top:10px;">仕入れ額（￥）</div>
              <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

              <button class="cart-btn js-addCart" type="button" style="margin-top:12px;">カートに入れる</button>
            </div>
          </div>
        </div>

        <div class="product-body ${isAltLayout ? "graph-body" : ""}">
          <div class="product-info">
            <div class="head">商品情報</div>
            <div class="info-grid js-infoGrid"></div>
          </div>

          <div class="product-center">
            <div class="head">主要項目</div>
            <div class="center-list js-center"></div>
          </div>

          <div class="product-keepa">
            <div class="head">keepaグラフ</div>
            <div class="keepa-mini">
              <iframe class="js-keepaFrame" src="" loading="lazy"></iframe>
            </div>
          </div>

          <div class="product-mes">
            <div class="head">需要供給グラフ（180日）</div>

            <div class="graph-options js-graphOptions" style="margin-bottom:10px;">
              <label><input type="checkbox" class="js-chkDS" checked /> 需要＆供給</label>
              <label style="margin-left:12px;"><input type="checkbox" class="js-chkSP" /> 供給＆価格</label>
            </div>

            <div class="mes-big">
              <canvas class="js-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="product-table">
          <div class="head">詳細データ</div>
          <div class="detail-table js-detailTable"></div>
        </div>
      </div>`;
    }

    const jpAsin = data["日本ASIN"] || "－";
    const usAsin = data["アメリカASIN"] || asin || "－";
    const realW = data["重量kg"] ?? data["重量（kg）"] ?? data["重量"] ?? "";
    const volW = data["容積重量"] ?? "";
    const size = data["サイズ"] || "－";
    const weight = `${fmtKg(realW)}（${fmtKg(volW)}）`;
    const ctx = { asin, jpAsin, usAsin, size, weight, data };

    if (isThirdLayout) {
      buildInfoGridSplit(card.querySelector(".js-infoGridA"), card.querySelector(".js-infoGridB"), ctx, data);
    } else {
      buildInfoGrid(card.querySelector(".js-infoGrid"), ctx, data);
    }

    if (isFourthLayout) {
      buildCenterCards(card.querySelector(".js-centerCards"), ctx, data);
    } else {
      buildCenterList(card.querySelector(".js-center"), ctx, data);
    }
    buildDetailTable(card.querySelector(".js-detailTable"), ctx, data);

    // keepa
    buildKeepaFrame(card, data);

    // chart
    const canvas = card.querySelector(".js-chart");
    const chart = renderChart(canvas, asin);
    card.__chart = chart;

    const chkDS = card.querySelector(".js-chkDS");
    const chkSP = card.querySelector(".js-chkSP");

    const update = () => {
      const showDS = chkDS ? chkDS.checked : true;
      const showSP = chkSP ? chkSP.checked : false;
      updateChartVisibility(chart, showDS, showSP);

      // 両方ONなら「需要＆供給＆価格」の状態
      if (chkDS && chkSP && chkDS.checked && chkSP.checked) {
        // 表示上はそのまま（両方表示）
      }
    };

    if (chkDS) chkDS.addEventListener("change", update);
    if (chkSP) chkSP.addEventListener("change", update);
    update();

    // cart init from saved
    const saved = cart.get(asin);
    const qtyEl = card.querySelector(".js-qty");
    const sellEl = card.querySelector(".js-sell");
    const costEl = card.querySelector(".js-cost");
    if (saved) {
      if (qtyEl) qtyEl.value = String(saved.qty || 1);
      if (sellEl) sellEl.value = String(saved.sellUSD || "");
      if (costEl) costEl.value = String(saved.costJPY || "");
    } else {
      // 初期値：データから推定
      const sell = parseUSD(data["カートボックス価格"]) || parseUSD(data["FBA最安値"]) || parseUSD(data["販売額（ドル）"]) || NaN;
      const cost = (data["仕入れ目安単価"] || "").toString().replace(/,/g, "").match(/\d+/);
      if (sellEl && Number.isFinite(sell)) sellEl.value = String(sell);
      if (costEl && cost) costEl.value = String(Number(cost[0]));
    }

    // add cart
    const addBtn = card.querySelector(".js-addCart");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const qty = Math.max(1, Number(qtyEl ? qtyEl.value : 1));
        const sellUSD = Number(sellEl ? sellEl.value : 0) || 0;
        const costJPY = Number(costEl ? costEl.value : 0) || 0;

        cart.set(asin, { qty, sellUSD, costJPY });
        saveStorageJSON(STORAGE_KEY_CART, Object.fromEntries(cart));
        updateCartSummary();
      });
    }

    return card;
  }

  /* =========================
     初期化：イベント
  ========================= */
  if (resetCurrentBtn) {
    resetCurrentBtn.addEventListener("click", () => {
      state.layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
      state.layout = normalizeLayout(state.layout);
      persistLayout();
      renderLayoutBar();
      buildSortControls();
      renderAllCards();
    });
  }

  if (clearCardsBtn) {
    clearCardsBtn.addEventListener("click", () => clearCards());
  }
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => clearCart());
  }

  if (metricsCollapseBtn && metricsBar) {
    metricsCollapseBtn.addEventListener("click", () => {
      const collapsed = metricsBar.classList.toggle("collapsed");
      metricsCollapseBtn.textContent = collapsed ? "展開する" : "折りたたむ";
    });
  }

  if (addSortRuleBtn) addSortRuleBtn.addEventListener("click", addSortRule);
  if (applySortBtn) applySortBtn.addEventListener("click", applySort);
  if (clearSortBtn) clearSortBtn.addEventListener("click", clearSort);

  /* =========================
     起動
  ========================= */
  renderCatalog();
  renderLayoutBar();
  buildSortControls();
  updateCartSummary();
})();
