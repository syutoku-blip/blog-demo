/**************************************************************
 * main.js
 * - レイアウト3追加（body.third-layout）
 * - 商品情報は商品情報枠（zoneState.info）を上から半分ずつで
 *   商品情報①/商品情報②に分割表示（レイアウト3のみ）
 **************************************************************/

const $ = (sel, root = document) => root.querySelector(sel);
const FX_RATE = 155;

const fmtJPY = (n) => "￥" + Number(n || 0).toLocaleString("ja-JP");
const num = (v) => {
  const x = Number(String(v ?? "").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(x) ? x : 0;
};
const fmtKg = (v) => {
  const x = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(x) || x === 0) return "－";
  return x.toFixed(2) + "kg";
};

/* =========================
   指標（候補）
========================= */
const METRICS_ALL = [
  { id: "過去3月FBA最安値", label: "過去3ヶ月FBA最安値", sourceKey: "過去3月FBA最安値" },
  { id: "FBA最安値", label: "FBA最安値", sourceKey: "FBA最安値" },

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

  { id: "カテゴリ", label: "カテゴリ", kind: "computed" },
  { id: "注意事項", label: "注意事項", kind: "computedTags" },
  { id: "材質", label: "材質", kind: "text", sourceKey: "材質" }
];
const INFO_BY_ID = Object.fromEntries(INFO_FIELDS_ALL.map((f) => [f.id, f]));

/* =========================
   token
========================= */
const tokM = (id) => `M:${id}`;
const tokI = (id) => `I:${id}`;

function parseToken(token) {
  const [t, ...rest] = String(token).split(":");
  const id = rest.join(":");
  return { type: t, id };
}
function labelOf(token) {
  const { type, id } = parseToken(token);
  if (type === "M") return METRIC_BY_ID[id]?.label || id;
  if (type === "I") return INFO_BY_ID[id]?.label || id;
  return id;
}

/* =========================
   初期配置
========================= */
const DEFAULT_ZONES = {
  pool: [
    ...METRICS_ALL.map((m) => tokM(m.id)),
    ...INFO_FIELDS_ALL.map((f) => tokI(f.id))
  ],
  info: [
    tokI("商品名"),
    tokI("ブランド"),
    tokI("評価"),
    tokI("各種ASIN"),
    tokI("JAN"),
    tokI("SKU"),
    tokI("サイズ"),
    tokI("重量（容積重量）"),
    tokI("カテゴリ"),
    tokI("注意事項"),
    tokI("材質")
  ],
  center: [
    tokM("過去3月FBA最安値"),
    tokM("FBA最安値"),
    tokM("入金額予測"),
    tokM("180日販売数"),
    tokM("90日販売数"),
    tokM("粗利益率予測"),
    tokM("30日販売数"),
    tokM("日本最安値"),
    tokM("粗利益予測")
  ],
  table: [
    tokM("在庫数"),
    tokM("想定送料"),
    tokM("返品率"),
    tokM("仕入れ目安単価"),
    tokM("販売額（ドル）"),
    tokM("送料"),
    tokM("関税"),
    tokM("予測30日販売数"),
    tokM("入金額（円）")
  ],
  hidden: []
};

function normalizeDefaultZones() {
  const used = new Set([...DEFAULT_ZONES.info, ...DEFAULT_ZONES.center, ...DEFAULT_ZONES.table, ...DEFAULT_ZONES.hidden]);
  DEFAULT_ZONES.pool = DEFAULT_ZONES.pool.filter((t) => !used.has(t));
}
normalizeDefaultZones();

const zoneState = {
  pool: [...DEFAULT_ZONES.pool],
  info: [...DEFAULT_ZONES.info],
  center: [...DEFAULT_ZONES.center],
  table: [...DEFAULT_ZONES.table],
  hidden: [...DEFAULT_ZONES.hidden]
};

const cardState = new Map();
const cart = new Map();

/* ===== DOM refs ===== */
const metricsBar = $("#metricsBar");

const zonePool = $("#metricsPoolZone");
const zoneInfo = $("#metricsInfoZone");
const zoneCenter = $("#metricsCenterZone");
const zoneTable = $("#metricsTableZone");
const zoneHidden = $("#metricsHiddenZone");

/* buttons */
const metricsCollapseBtn = $("#metricsCollapseBtn");
const resetBtn = $("#resetCurrentBtn");
const clearCardsBtn = $("#clearCardsBtn");
const clearCartBtn = $("#clearCartBtn");

/* catalog */
const asinCatalog = $("#asinCatalog");
const itemsContainer = $("#itemsContainer");
const emptyState = $("#emptyState");
const headerStatus = $("#headerStatus");

/* cart */
const cartTotalCost = $("#cartTotalCost");
const cartTotalRevenue = $("#cartTotalRevenue");
const cartTotalProfit = $("#cartTotalProfit");
const cartAsinCount = $("#cartAsinCount");
const cartItemCount = $("#cartItemCount");

/* sort */
const sortBar = $("#sortBar");
const sortControls = $("#sortControls");
const addSortRuleBtn = $("#addSortRuleBtn");
const applySortBtn = $("#applySortBtn");
const clearSortBtn = $("#clearSortBtn");
let sortRules = [];

init();

function init() {
  initPoolUI();
  initCatalog();
  initSortUI();
  initActions();
  updateCartSummary();
  updateHeaderStatus();
  renderTopZones();
}

function initPoolUI() {
  attachZoneDnD(zonePool, { zoneKey: "pool" });
  attachZoneDnD(zoneInfo, { zoneKey: "info" });
  attachZoneDnD(zoneCenter, { zoneKey: "center" });
  attachZoneDnD(zoneTable, { zoneKey: "table" });
  attachZoneDnD(zoneHidden, { zoneKey: "hidden" });
}

function initActions() {
  metricsCollapseBtn?.addEventListener("click", () => {
    metricsBar.classList.toggle("collapsed");
    metricsCollapseBtn.textContent = metricsBar.classList.contains("collapsed") ? "展開する" : "折りたたむ";
  });

  resetBtn?.addEventListener("click", () => {
    zoneState.pool = [...DEFAULT_ZONES.pool];
    zoneState.info = [...DEFAULT_ZONES.info];
    zoneState.center = [...DEFAULT_ZONES.center];
    zoneState.table = [...DEFAULT_ZONES.table];
    zoneState.hidden = [...DEFAULT_ZONES.hidden];

    sortRules = [];
    renderSortControls();
    renderTopZones();
    rerenderAllCards();
  });

  clearCardsBtn?.addEventListener("click", () => {
    cardState.forEach((v) => {
      if (v.chart) v.chart.destroy();
      v.el.remove();
    });
    cardState.clear();
    itemsContainer.innerHTML = "";
    emptyState.style.display = "block";
    updateHeaderStatus();
  });

  clearCartBtn?.addEventListener("click", () => {
    cart.clear();
    updateCartSummary();
  });
}

function initCatalog() {
  const asins = Object.keys(window.ASIN_DATA || {});
  asinCatalog.innerHTML = "";
  asins.forEach((asin) => {
    const b = document.createElement("button");
    b.className = "asin-pill";
    b.type = "button";
    b.textContent = asin;
    b.addEventListener("click", () => addOrFocusCard(asin));
    asinCatalog.appendChild(b);
  });
}

function addOrFocusCard(asin) {
  const data = (window.ASIN_DATA || {})[asin];
  if (!data) return alert("データがありません: " + asin);

  if (cardState.has(asin)) {
    cardState.get(asin).el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const card = createProductCard(asin, data);
  itemsContainer.appendChild(card);

  emptyState.style.display = "none";
  cardState.set(asin, { el: card, data, chart: card.__chart || null });

  updateHeaderStatus();
}

function updateHeaderStatus() {
  const count = cardState.size;
  if (headerStatus) headerStatus.textContent = count ? `表示中: ${count} ASIN` : "";
}

/* =========================
   上部5枠：レンダリング
========================= */
function renderTopZones() {
  zonePool.innerHTML = "";
  zoneInfo.innerHTML = "";
  zoneCenter.innerHTML = "";
  zoneTable.innerHTML = "";
  zoneHidden.innerHTML = "";

  zoneState.pool.forEach((t) => zonePool.appendChild(makePill(t)));
  zoneState.info.forEach((t) => zoneInfo.appendChild(makePill(t)));
  zoneState.center.forEach((t) => zoneCenter.appendChild(makePill(t)));
  zoneState.table.forEach((t) => zoneTable.appendChild(makePill(t)));
  zoneState.hidden.forEach((t) => zoneHidden.appendChild(makePill(t)));

  refreshSortRuleOptions();
}

function makePill(token) {
  const pill = document.createElement("div");
  pill.className = "metric-pill";
  pill.draggable = true;
  pill.dataset.token = token;
  pill.textContent = labelOf(token);

  pill.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", `item:${token}`);
    e.dataTransfer.effectAllowed = "move";
  });

  return pill;
}

/* =========================
   DnD（共通5枠）重複不可
========================= */
function attachZoneDnD(zoneEl, { zoneKey }) {
  if (!zoneEl) return;

  zoneEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  zoneEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    // ★ここだけ修正（tokenに ":" が含まれるため split(":") で壊れる）
    const firstColon = raw.indexOf(":");
    const kind = firstColon >= 0 ? raw.slice(0, firstColon) : raw;
    const token = firstColon >= 0 ? raw.slice(firstColon + 1) : "";

    if (kind !== "item") return;
    if (!token) return;

    // remove from any zone
    for (const k of Object.keys(zoneState)) {
      const idx = zoneState[k].indexOf(token);
      if (idx >= 0) zoneState[k].splice(idx, 1);
    }

    // add to target end
    zoneState[zoneKey].push(token);

    renderTopZones();
    rerenderAllCards();
  });
}

/* =========================
   Sort UI
========================= */
function initSortUI() {
  addSortRuleBtn?.addEventListener("click", () => {
    sortRules.push({ token: zoneState.center[0] || zoneState.table[0] || zoneState.info[0], dir: "desc" });
    renderSortControls();
  });

  applySortBtn?.addEventListener("click", () => {
    applySort();
  });

  clearSortBtn?.addEventListener("click", () => {
    sortRules = [];
    renderSortControls();
  });

  renderSortControls();
}

function refreshSortRuleOptions() {
  // sort rule select の選択肢は、「center」「table」からのみ（指標中心に）
  const allowed = [...zoneState.center, ...zoneState.table];
  sortRules.forEach((r) => {
    if (!allowed.includes(r.token)) r.token = allowed[0] || r.token;
  });
  renderSortControls();
}

function renderSortControls() {
  if (!sortControls) return;

  sortControls.innerHTML = "";

  if (!sortRules.length) {
    sortBar?.classList.add("empty");
  } else {
    sortBar?.classList.remove("empty");
  }

  sortRules.forEach((rule, idx) => {
    const row = document.createElement("div");
    row.className = "sort-row";

    const sel = document.createElement("select");
    sel.className = "sort-field";

    // center + table を候補に
    const allowed = [...zoneState.center, ...zoneState.table];
    allowed.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = labelOf(t);
      if (t === rule.token) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener("change", () => {
      rule.token = sel.value;
    });

    const dir = document.createElement("select");
    dir.className = "sort-dir";
    dir.innerHTML = `
      <option value="desc">降順</option>
      <option value="asc">昇順</option>
    `;
    dir.value = rule.dir;
    dir.addEventListener("change", () => {
      rule.dir = dir.value;
    });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "sort-del";
    del.textContent = "×";
    del.addEventListener("click", () => {
      sortRules.splice(idx, 1);
      renderSortControls();
    });

    row.appendChild(sel);
    row.appendChild(dir);
    row.appendChild(del);
    sortControls.appendChild(row);
  });
}

function applySort() {
  if (!sortRules.length || cardState.size <= 1) return;

  const entries = [...cardState.entries()].map(([asin, obj]) => {
    return { asin, el: obj.el, data: obj.data, keyVals: computeSortKey(obj.data) };
  });

  entries.sort((a, b) => {
    for (const r of sortRules) {
      const av = a.keyVals[r.token] ?? 0;
      const bv = b.keyVals[r.token] ?? 0;
      if (av === bv) continue;
      const d = r.dir === "asc" ? 1 : -1;
      return av > bv ? d : -d;
    }
    return 0;
  });

  // reorder DOM
  entries.forEach((it) => itemsContainer.appendChild(it.el));
}

function computeSortKey(data) {
  const out = {};
  const toks = [...zoneState.center, ...zoneState.table];
  toks.forEach((t) => {
    const { type, id } = parseToken(t);
    if (type !== "M") return;
    const m = METRIC_BY_ID[id];
    if (!m) return;
    out[t] = valueOfMetric(m, data, { data });
  });
  return out;
}

/* =========================
   Cards rerender
========================= */
function rerenderAllCards() {
  cardState.forEach((state) => {
    state.el.querySelectorAll(".js-infoGrid").forEach((n) => (n.innerHTML = ""));
    state.el.querySelectorAll(".js-center").forEach((n) => (n.innerHTML = ""));
    state.el.querySelectorAll(".js-centerCards").forEach((n) => (n.innerHTML = ""));
    state.el.querySelectorAll(".js-detailTable thead tr").forEach((n) => (n.innerHTML = ""));
    state.el.querySelectorAll(".js-detailTable tbody tr").forEach((n) => (n.innerHTML = ""));

    const asin = state.el.dataset.asin;
    const data = state.data;

    // ctx再構築
    const jpAsin = data["日本ASIN"] || "－";
    const usAsin = data["アメリカASIN"] || asin;
    const realW = data["重量kg"] ?? data["重量（kg）"] ?? data["重量"] ?? "";
    const volW = data["容積重量"] ?? "";
    const size = data["サイズ"] || "－";
    const weight = `${fmtKg(realW)}（${fmtKg(volW)}）`;
    const ctx = { asin, jpAsin, usAsin, size, weight, data };

    const isAltLayout = document.body.classList.contains("alt-layout");
    const isThirdLayout = document.body.classList.contains("third-layout");
    const isFourthLayout = document.body.classList.contains("fourth-layout");

    if (isThirdLayout) {
      buildInfoGridSplit(
        state.el.querySelector(".js-infoGridA"),
        state.el.querySelector(".js-infoGridB"),
        ctx,
        data
      );
    } else {
      buildInfoGrid(state.el.querySelector(".js-infoGrid"), ctx, data);
    }

    if (isFourthLayout) {
      buildCenterCards(state.el.querySelector(".js-centerCards"), ctx, data);
    } else {
      buildCenterList(state.el.querySelector(".js-center"), ctx, data);
    }

    buildDetailTable(state.el.querySelector(".js-detailTable"), ctx, data);

    // chart: 切替があれば維持
    if (state.chart) {
      // 既存チャートは破棄して作り直す（表示内容は同じ）
      state.chart.destroy();
    }
    const canvas = state.el.querySelector(".js-chart");
    const chart = renderChart(canvas, data);
    state.el.__chart = chart;
    state.chart = chart;

    const chkDS = state.el.querySelector(".js-chkDS");
    const chkSP = state.el.querySelector(".js-chkSP");
    const ds = chkDS ? chkDS.checked : true;
    const sp = chkSP ? chkSP.checked : false;
    updateChartVisibility(chart, ds, sp);
  });

  updateHeaderStatus();
}

/* =========================
   Cart summary
========================= */
function updateCartSummary() {
  let totalCost = 0;
  let totalRev = 0;
  let totalProfit = 0;
  let asinCount = 0;
  let itemCount = 0;

  cart.forEach((v) => {
    asinCount += 1;
    itemCount += v.qty;
    const revJPY = v.sellUSD * FX_RATE * v.qty;
    const costJPY = v.costJPY * v.qty;
    totalRev += revJPY;
    totalCost += costJPY;
    totalProfit += revJPY - costJPY;
  });

  cartTotalCost.textContent = fmtJPY(Math.round(totalCost));
  cartTotalRevenue.textContent = fmtJPY(Math.round(totalRev));
  cartTotalProfit.textContent = fmtJPY(Math.round(totalProfit));
  cartAsinCount.textContent = asinCount;
  cartItemCount.textContent = itemCount;
}

/* ============================================================
   値の取り出し
============================================================ */
function valueOfMetric(metric, data, ctx) {
  const v = data[metric.sourceKey];
  // %系
  if (String(metric.id).includes("率")) {
    const n = typeof v === "string" ? num(v) : Number(v);
    return n;
  }
  return num(v);
}

function valueOfInfo(field, ctx, data) {
  if (field.kind === "computedTitle") {
    // 商品名は data["商品名"] があればそれ、なければ ASIN
    const t = data["商品名"] || data["タイトル"] || ctx.asin;
    return t || "－";
  }
  if (field.kind === "text") {
    return data[field.sourceKey] ?? "－";
  }
  if (field.kind === "computed") {
    if (field.id === "各種ASIN") {
      const jp = ctx.jpAsin || "－";
      const us = ctx.usAsin || "－";
      return `JP: ${jp} / US: ${us}`;
    }
    if (field.id === "サイズ") {
      return ctx.size || data["サイズ"] || "－";
    }
    if (field.id === "重量（容積重量）") {
      return ctx.weight || "－";
    }
    if (field.id === "カテゴリ") {
      const c = data["カテゴリ"] || data["カテゴリー"] || "－";
      return c;
    }
    return "－";
  }
  if (field.kind === "computedTags") {
    // 注意事項をカンマ区切りで整形
    const t = data["注意事項"] || data["タグ"] || "";
    if (!t) return "－";
    if (Array.isArray(t)) return t.join(" / ");
    return String(t).split(/[,、/]/).map((s) => s.trim()).filter(Boolean).join(" / ") || "－";
  }
  return "－";
}

/* =========================
   Info grid（通常）
========================= */
function buildInfoGrid(gridEl, ctx, data) {
  if (!gridEl) return;
  gridEl.innerHTML = "";
  zoneState.info.forEach((token) => {
    const { type, id } = parseToken(token);
    if (type !== "I") return;

    const f = INFO_BY_ID[id];
    if (!f) return;

    const row = document.createElement("div");
    row.className = "kv";

    const k = document.createElement("div");
    k.className = "k";
    k.textContent = f.label;

    const v = document.createElement("div");
    v.className = "v";
    v.textContent = valueOfInfo(f, ctx, data);

    row.appendChild(k);
    row.appendChild(v);
    gridEl.appendChild(row);
  });
}

/* =========================
   Info grid（レイアウト3：半分ずつ）
========================= */
function buildInfoGridSplit(gridA, gridB, ctx, data) {
  if (!gridA || !gridB) return;
  gridA.innerHTML = "";
  gridB.innerHTML = "";

  const tokens = zoneState.info.filter((t) => parseToken(t).type === "I");
  const half = Math.ceil(tokens.length / 2);
  const a = tokens.slice(0, half);
  const b = tokens.slice(half);

  const render = (gridEl, toks) => {
    toks.forEach((token) => {
      const { id } = parseToken(token);
      const f = INFO_BY_ID[id];
      if (!f) return;

      const row = document.createElement("div");
      row.className = "kv";

      const k = document.createElement("div");
      k.className = "k";
      k.textContent = f.label;

      const v = document.createElement("div");
      v.className = "v";
      v.textContent = valueOfInfo(f, ctx, data);

      row.appendChild(k);
      row.appendChild(v);
      gridEl.appendChild(row);
    });
  };

  render(gridA, a);
  render(gridB, b);
}

/* =========================
   Center list（通常）
========================= */
function buildCenterList(centerEl, ctx, data) {
  if (!centerEl) return;
  centerEl.innerHTML = "";

  zoneState.center.forEach((token) => {
    const { type, id } = parseToken(token);
    if (type !== "M") return;
    const m = METRIC_BY_ID[id];
    if (!m) return;

    const item = document.createElement("div");
    item.className = "center-item";

    const k = document.createElement("div");
    k.className = "k";
    k.textContent = m.label;

    const v = document.createElement("div");
    v.className = "v";

    const val = data[m.sourceKey];
    // 表示整形
    if (String(m.id).includes("率")) {
      v.textContent = (num(val)).toFixed(1) + "%";
    } else if (m.id.includes("販売額（ドル）")) {
      v.textContent = "$" + num(val).toFixed(2);
    } else if (m.id.includes("入金額") || m.id.includes("粗利益") || m.id.includes("最安値") || m.id.includes("送料") || m.id.includes("関税")) {
      v.textContent = fmtJPY(Math.round(num(val)));
    } else {
      v.textContent = String(val ?? "－");
    }

    item.appendChild(k);
    item.appendChild(v);
    centerEl.appendChild(item);
  });
}

/* =========================
   Center cards（レイアウト4）
========================= */
function buildCenterCards(wrapEl, ctx, data) {
  if (!wrapEl) return;
  wrapEl.innerHTML = "";

  zoneState.center.forEach((token) => {
    const { type, id } = parseToken(token);
    if (type !== "M") return;
    const m = METRIC_BY_ID[id];
    if (!m) return;

    const card = document.createElement("div");
    card.className = "center-card";

    const k = document.createElement("div");
    k.className = "k";
    k.textContent = m.label;

    const v = document.createElement("div");
    v.className = "v";

    const val = data[m.sourceKey];

    if (String(m.id).includes("率")) {
      v.textContent = (num(val)).toFixed(1) + "%";
    } else if (m.id.includes("販売額（ドル）")) {
      v.textContent = "$" + num(val).toFixed(2);
    } else if (m.id.includes("入金額") || m.id.includes("粗利益") || m.id.includes("最安値") || m.id.includes("送料") || m.id.includes("関税")) {
      v.textContent = fmtJPY(Math.round(num(val)));
    } else {
      v.textContent = String(val ?? "－");
    }

    card.appendChild(k);
    card.appendChild(v);
    wrapEl.appendChild(card);
  });
}

/* =========================
   Detail table
========================= */
function buildDetailTable(tableEl, ctx, data) {
  if (!tableEl) return;
  const theadRow = tableEl.querySelector("thead tr");
  const tbodyRow = tableEl.querySelector("tbody tr");
  if (!theadRow || !tbodyRow) return;

  theadRow.innerHTML = "";
  tbodyRow.innerHTML = "";

  zoneState.table.forEach((token) => {
    const { type, id } = parseToken(token);
    if (type !== "M") return;
    const m = METRIC_BY_ID[id];
    if (!m) return;

    const th = document.createElement("th");
    th.textContent = m.label;

    const td = document.createElement("td");

    const val = data[m.sourceKey];
    if (String(m.id).includes("率")) {
      td.textContent = (num(val)).toFixed(1) + "%";
    } else if (m.id.includes("販売額（ドル）")) {
      td.textContent = "$" + num(val).toFixed(2);
    } else if (m.id.includes("入金額") || m.id.includes("粗利益") || m.id.includes("最安値") || m.id.includes("送料") || m.id.includes("関税")) {
      td.textContent = fmtJPY(Math.round(num(val)));
    } else {
      td.textContent = String(val ?? "－");
    }

    theadRow.appendChild(th);
    tbodyRow.appendChild(td);
  });
}

/* ============================================================
   Chart（Keepaっぽい挙動）
============================================================ */
function renderChart(canvas, seedData = null) {
  // 180日分：Keepaっぽい「段階的な価格」「右軸のランキング」「下部のセラー数」をそれっぽく再現
  const labels = build180DayLabelsJP();

  // 価格の基準（ASINデータに入っていればそれを使う）
  const basePrice = pickBasePrice(seedData);

  // 初期値
  let rank = randInt(20000, 90000);
  let sellers = randInt(4, 14);

  // Keepaっぽく「価格はしばらく固定 → たまにガクッと変わる」挙動にする
  let price = clamp(basePrice + randn(0, 1.2), 8, 200);
  let holdDays = randInt(3, 8);

  const rankArr = [];
  const sellersArr = [];
  const priceArr = [];

  for (let i = 0; i < labels.length; i++) {
    // セラー数：段階的（増減はゆっくり）
    if (i % randInt(12, 22) === 0 && i !== 0) {
      sellers = clamp(sellers + randInt(-3, 4), 1, 25);
    }
    // 少しだけ日々ブレ
    sellers = clamp(sellers + (Math.random() < 0.25 ? randInt(-1, 1) : 0), 1, 25);

    // 価格：ホールド期間が切れたら更新（ランキングとセラー数の影響を受ける）
    holdDays--;
    if (holdDays <= 0) {
      // ランクが良い(数値が小さい)ほど価格を上げやすい / セラーが多いほど価格を下げやすい
      const rankEffect = (50000 - rank) / 50000; // -1〜+1程度
      const sellerEffect = (sellers - 7) * 0.18;

      const target =
        basePrice +
        rankEffect * 2.6 -
        sellerEffect +
        randn(0, 0.9);

      // Keepaっぽく 0.10〜0.50刻みで丸める（段差を作る）
      const step = Math.random() < 0.7 ? 0.1 : 0.5;
      price = roundTo(clamp(target, Math.max(6, basePrice * 0.6), basePrice * 1.6), step);

      holdDays = randInt(3, 9);
    }

    // ランキング：価格が上がると改善（数値が下がる）しやすい / セラーが多いと悪化しやすい
    // Keepaっぽく「ガタガタだけどトレンドはある」程度に抑える
    const priceDelta = price - basePrice; // +なら値上げ
    const sellerDelta = sellers - 7; // +なら競合多い
    const drift = -priceDelta * 550 + sellerDelta * 420;
    rank = clamp(Math.round(rank + drift + randn(0, 2200)), 2000, 200000);

    rankArr.push(rank);
    sellersArr.push(sellers);
    priceArr.push(price);
  }

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        // Keepaイメージ：緑＝ランキング、オレンジ＝価格、紫＝セラー数
        {
          label: "価格(USD)",
          data: priceArr,
          yAxisID: "yPrice",
          tension: 0,
          stepped: true,
          pointRadius: 0,
          borderWidth: 2,
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.12)"
        },
        {
          label: "ランキング",
          data: rankArr,
          yAxisID: "yRank",
          tension: 0,
          pointRadius: 0,
          borderWidth: 2,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.10)"
        },
        {
          label: "セラー数",
          data: sellersArr,
          yAxisID: "ySeller",
          tension: 0,
          stepped: true,
          pointRadius: 0,
          borderWidth: 2,
          borderColor: "#a855f7",
          backgroundColor: "rgba(168,85,247,0.10)"
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
              const lab = ctx.dataset.label || "";
              const v = ctx.raw;
              if (lab === "ランキング") return `${lab}: #${fmtInt(v)}`;
              if (lab === "セラー数") return `${lab}: ${v}`;
              if (lab === "価格(USD)") return `${lab}: $${Number(v).toFixed(2)}`;
              return `${lab}: ${v}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12
          }
        },
        yPrice: {
          position: "left",
          title: { display: true, text: "Price ($)" },
          grid: { drawOnChartArea: true }
        },
        yRank: {
          position: "right",
          reverse: true, // ランクは小さいほど上なので、Keepaっぽく上下反転
          title: { display: true, text: "Rank (#)" },
          grid: { drawOnChartArea: false }
        },
        ySeller: {
          position: "right",
          title: { display: true, text: "Sellers" },
          min: 0,
          suggestedMax: 25,
          grid: { drawOnChartArea: false }
        }
      }
    }
  });

  return chart;
}

/* ====== チャート用ユーティリティ ====== */
function build180DayLabelsJP() {
  const out = [];
  const today = new Date();
  // 古い→新しい順（Keepaに合わせる）
  for (let i = 179; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    out.push(`${m}月${day}日`);
  }
  return out;
}

function pickBasePrice(seedData) {
  // 優先：カートボックス価格 -> 販売額（ドル）
  const candidates = [];
  if (seedData) {
    const cb = seedData["カートボックス価格"];
    const sell = seedData["販売額（ドル）"];
    if (cb) candidates.push(cb);
    if (sell) candidates.push(sell);
  }
  for (const v of candidates) {
    const n = parseUSD(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 24 + Math.random() * 18; // fallback
}

function parseUSD(v) {
  if (v == null) return NaN;
  const s = String(v).trim();
  const m = s.match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randn(mu = 0, sigma = 1) {
  // Box-Muller
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mu + z * sigma;
}

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

function roundTo(x, step) {
  return Math.round(x / step) * step;
}

function fmtInt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  return x.toLocaleString("en-US");
}

/* ============================================================
   Chart visibility
============================================================ */
function updateChartVisibility(chart, showDS, showSP) {
  if (!chart) return;

  // datasets: [price, rank, sellers]
  // 《需要＆供給》= ランキング + セラー数
  // 《供給＆価格》= セラー数 + 価格
  // 両方ONなら全部
  const showAll = showDS && showSP;

  const dsPrice = chart.data.datasets[0];
  const dsRank = chart.data.datasets[1];
  const dsSeller = chart.data.datasets[2];

  dsPrice.hidden = !(showSP || showAll);
  dsRank.hidden = !(showDS || showAll);
  dsSeller.hidden = !((showDS || showSP) || showAll);

  chart.update();
}

/* ============================================================
   Product card
============================================================ */
function createProductCard(asin, data) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.asin = asin;

  const isAltLayout = document.body.classList.contains("alt-layout");
  const isThirdLayout = document.body.classList.contains("third-layout");
  const isFourthLayout = document.body.classList.contains("fourth-layout");

  if (isThirdLayout) {
    card.innerHTML = `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <button class="remove" type="button">この行を削除</button>
      </div>

      <div class="layout3-grid">
        <div class="l3-left">
          <div class="image-box">
            <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />

            <div class="field">
              <label>数量</label>
              <select class="js-qty">
                <option value="1" selected>1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>

              <label>販売価格（$）</label>
              <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

              <label>仕入れ額（￥）</label>
              <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

              <button class="cart-btn js-addCart" type="button">カートに入れる</button>
            </div>
          </div>
        </div>

        <div class="l3-info">
          <div class="info-box">
            <div class="info-grid split">
              <div class="split-col js-infoGridA"></div>
              <div class="split-col js-infoGridB"></div>
            </div>
          </div>
        </div>

        <div class="l3-center">
          <div class="center-box">
            <div class="center-head">主要項目</div>
            <div class="center-list js-center"></div>
          </div>
        </div>

        <div class="l3-graph">
          <div class="graph-box">
            <div class="graph-head">
              <div class="graph-title">グラフ（180日）</div>
              <div class="switch">
                <button type="button" class="js-btnMes active">MES-AI-A</button>
                <button type="button" class="js-btnKeepa">Keepa</button>
              </div>
            </div>

            <div class="graph-options js-graphOptions">
              <label><input type="checkbox" class="js-chkDS" checked />《需要＆供給》</label>
              <label><input type="checkbox" class="js-chkSP" />《供給＆価格》</label>
            </div>

            <div class="graph-body">
              <div class="canvas-wrap js-mesWrap">
                <canvas class="js-chart"></canvas>
              </div>
              <div class="keepa-wrap js-keepaWrap" style="display:none;">
                <iframe class="js-keepaFrame" src="" loading="lazy"></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-wrap">
        <div class="detail-head"><div class="t">その他項目</div></div>
        <div class="detail-scroll">
          <table class="detail-table js-detailTable">
            <thead><tr></tr></thead>
            <tbody><tr></tr></tbody>
          </table>
        </div>
      </div>
    `;
  } else if (isFourthLayout) {
    card.innerHTML = `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <button class="remove" type="button">この行を削除</button>
      </div>

      <div class="layout4-grid">
        <!-- 商品画像 -->
        <div class="l4-img l4-block">
          <div class="head">商品画像</div>
          <div class="imgbox">
            <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
          </div>
        </div>

        <!-- 商品情報 -->
        <div class="l4-info l4-block">
          <div class="head">商品情報</div>
          <div class="info-grid js-infoGrid"></div>
        </div>

        <!-- 主要項目 -->
        <div class="l4-main l4-block">
          <div class="head">主要項目</div>
          <div class="center-cards js-centerCards"></div>
        </div>

        <!-- buy -->
        <div class="l4-buy l4-block">
          <div class="head">仕入れ設定</div>

          <div style="font-weight:700; margin-top:6px;">数量</div>
          <select class="js-qty">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>

          <div style="font-weight:700; margin-top:10px;">販売価格（$）</div>
          <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

          <div style="font-weight:700; margin-top:10px;">仕入れ額（￥）</div>
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
            <label><input type="checkbox" class="js-chkDS" checked />《需要＆供給》</label>
            <label><input type="checkbox" class="js-chkSP" />《供給＆価格》</label>
          </div>

          <div class="mes-big">
            <canvas class="js-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="detail-wrap">
        <div class="detail-head"><div class="t">その他項目</div></div>
        <div class="detail-scroll">
          <table class="detail-table js-detailTable">
            <thead><tr></tr></thead>
            <tbody><tr></tr></tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    // 既存：alt / 通常
    card.innerHTML = isAltLayout
      ? `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <button class="remove" type="button">この行を削除</button>
      </div>

      <div class="alt-grid">
        <div class="alt-left">
          <div class="alt-image image-box">
            <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
          </div>

          <div class="alt-info info-box">
            <div class="info-grid js-infoGrid"></div>
          </div>
        </div>

        <div class="alt-center center-box">
          <div class="center-head">主要項目</div>
          <div class="center-list js-center"></div>
        </div>

        <div class="alt-graph graph-box">
          <div class="graph-head">
            <div class="graph-title">グラフ（180日）</div>
          </div>

          <div class="graph-options js-graphOptions">
            <label><input type="checkbox" class="js-chkDS" checked />《需要＆供給》</label>
            <label><input type="checkbox" class="js-chkSP" />《供給＆価格》</label>
          </div>

          <div class="graph-body">
            <div class="keepa-wrap js-keepaWrap">
              <iframe class="js-keepaFrame" src="" loading="lazy"></iframe>
            </div>

            <div class="canvas-wrap js-mesWrap">
              <canvas class="js-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="alt-buy buy-box">
          <div class="buy-title">数量</div>
          <select class="js-qty">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>

          <div class="buy-title">販売価格（$）</div>
          <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

          <div class="buy-title">仕入れ額（￥）</div>
          <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

          <button class="cart-btn js-addCart" type="button">カートに入れる</button>
        </div>
      </div>

      <div class="detail-wrap">
        <div class="detail-head"><div class="t">その他項目</div></div>
        <div class="detail-scroll">
          <table class="detail-table js-detailTable">
            <thead><tr></tr></thead>
            <tbody><tr></tr></tbody>
          </table>
        </div>
      </div>
    `
      : `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <button class="remove" type="button">この行を削除</button>
      </div>

      <div class="summary-row">
        <div class="left-wrap">
          <div class="image-box">
            <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />

            <div class="field">
              <label>数量</label>
              <select class="js-qty">
                <option value="1" selected>1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>

              <label>販売価格（$）</label>
              <input class="js-sell" type="number" step="0.01" placeholder="例: 39.99" />

              <label>仕入れ額（￥）</label>
              <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

              <button class="cart-btn js-addCart" type="button">カートに入れる</button>
            </div>
          </div>

          <div class="info-box">
            <div class="info-grid js-infoGrid"></div>
          </div>
        </div>

        <div class="center-box">
          <div class="center-head">主要項目</div>
          <div class="center-list js-center"></div>
        </div>

        <div class="graph-box">
          <div class="graph-head">
            <div class="graph-title">グラフ（180日）</div>
            <div class="switch">
              <button type="button" class="js-btnMes active">MES-AI-A</button>
              <button type="button" class="js-btnKeepa">Keepa</button>
            </div>
          </div>

          <div class="graph-options js-graphOptions">
            <label><input type="checkbox" class="js-chkDS" checked />《需要＆供給》</label>
            <label><input type="checkbox" class="js-chkSP" />《供給＆価格》</label>
          </div>

          <div class="graph-body">
            <div class="canvas-wrap js-mesWrap">
              <canvas class="js-chart"></canvas>
            </div>
            <div class="keepa-wrap js-keepaWrap" style="display:none;">
              <iframe class="js-keepaFrame" src="" loading="lazy"></iframe>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-wrap">
        <div class="detail-head"><div class="t">その他項目</div></div>
        <div class="detail-scroll">
          <table class="detail-table js-detailTable">
            <thead><tr></tr></thead>
            <tbody><tr></tr></tbody>
          </table>
        </div>
      </div>
    `;
  }

  // remove
  card.querySelector(".remove").addEventListener("click", () => {
    if (cart.has(asin)) {
      cart.delete(asin);
      updateCartSummary();
    }
    if (card.__chart) card.__chart.destroy();
    card.remove();
    cardState.delete(asin);

    if (cardState.size === 0) emptyState.style.display = "block";
    updateHeaderStatus();
  });

  // inputs
  const sellInput = card.querySelector(".js-sell");
  const costInput = card.querySelector(".js-cost");

  if (data["販売額（ドル）"]) {
    const s = String(data["販売額（ドル）"]).replace(/[^\d.]/g, "");
    if (s) sellInput.value = s;
  }
  if (data["仕入れ目安単価"]) {
    const c = String(data["仕入れ目安単価"]).replace(/[^\d]/g, "");
    if (c) costInput.value = c;
  }

  card.querySelector(".js-addCart").addEventListener("click", () => {
    const qty = Math.max(1, Number(card.querySelector(".js-qty").value || 1));
    const sellUSD = num(sellInput.value);
    const costJPY = num(costInput.value);

    if (sellUSD <= 0) return alert("販売価格（$）を入力してください");
    if (costJPY <= 0) return alert("仕入れ額（￥）を入力してください");

    cart.set(asin, { qty, sellUSD, costJPY });
    updateCartSummary();
  });

  // ctx
  const jpAsin = data["日本ASIN"] || "－";
  const usAsin = data["アメリカASIN"] || asin;
  const realW = data["重量kg"] ?? data["重量（kg）"] ?? data["重量"] ?? "";
  const volW = data["容積重量"] ?? "";
  const size = data["サイズ"] || "－";
  const weight = `${fmtKg(realW)}（${fmtKg(volW)}）`;
  const ctx = { asin, jpAsin, usAsin, size, weight, data };

  // info
  if (isThirdLayout) {
    buildInfoGridSplit(card.querySelector(".js-infoGridA"), card.querySelector(".js-infoGridB"), ctx, data);
  } else {
    buildInfoGrid(card.querySelector(".js-infoGrid"), ctx, data);
  }

  // center / table
  if (isFourthLayout) {
    buildCenterCards(card.querySelector(".js-centerCards"), ctx, data);
  } else {
    buildCenterList(card.querySelector(".js-center"), ctx, data);
  }
  buildDetailTable(card.querySelector(".js-detailTable"), ctx, data);

  // chart
  const canvas = card.querySelector(".js-chart");
  const chart = renderChart(canvas, data);
  card.__chart = chart;

  const chkDS = card.querySelector(".js-chkDS");
  const chkSP = card.querySelector(".js-chkSP");
  const refreshVis = () => updateChartVisibility(chart, chkDS.checked, chkSP.checked);
  chkDS?.addEventListener("change", refreshVis);
  chkSP?.addEventListener("change", refreshVis);
  updateChartVisibility(chart, true, false);

  // keepa
  const keepaFrame = card.querySelector(".js-keepaFrame");
  if (keepaFrame) keepaFrame.src = `https://keepa.com/#!product/1-${asin}`;

  // 通常レイアウトのみ：トグル維持
  if (!isAltLayout && !isThirdLayout && !isFourthLayout) {
    const keepaWrap = card.querySelector(".js-keepaWrap");
    const mesWrap = card.querySelector(".js-mesWrap");
    const graphOptions = card.querySelector(".js-graphOptions");
    const btnMes = card.querySelector(".js-btnMes");
    const btnKeepa = card.querySelector(".js-btnKeepa");

    function setMode(mode) {
      if (mode === "MES") {
        btnMes.classList.add("active");
        btnKeepa.classList.remove("active");
        graphOptions.style.display = "flex";
        mesWrap.style.display = "block";
        keepaWrap.style.display = "none";
      } else {
        btnKeepa.classList.add("active");
        btnMes.classList.remove("active");
        graphOptions.style.display = "none";
        mesWrap.style.display = "none";
        keepaWrap.style.display = "block";
      }
    }
    btnMes.addEventListener("click", () => setMode("MES"));
    btnKeepa.addEventListener("click", () => setMode("KEEPA"));
    setMode("MES");
  }

  return card;
}
