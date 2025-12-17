/**************************************************************
 * main.js
 * - 上部5枠を共通UIとして使用（タブ切替）
 *   [指標]   プール/商品情報/真ん中/下段/非表示
 *   [商品情報] 同じ5枠を利用（重複不可）
 * - 赤枠の「商品情報カスタマイズ下段UI」は撤去（HTML側）
 * - 商品情報枠は固定項目ゼロ（全部カスタム表示）
 *   デフォルトで指定項目は「真ん中の枠」に配置して表示
 * - 商品情報枠：値が横幅に入りきらない場合は横スクロール（CSS側）
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
   ※固定表示なし。全部カスタム。
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
   指標の初期配置（5枠）
========================= */
const DEFAULT_METRIC_ZONES = {
  pool: [
    "複数在庫指数45日分",
    "複数在庫指数60日分",
    "ライバル偏差1",
    "ライバル偏差2",
    "ライバル増加率",
    "在庫数",
    "返品率",
    "販売額（ドル）",
    "入金額（円）",
    "入金額計（円）",
    "仕入れ目安単価",
    "想定送料",
    "送料",
    "関税",
    "粗利益",
    "粗利益率",
    "日本最安値"
  ],
  info: ["想定送料", "送料", "関税", "ライバル増加率"],
  center: ["過去3月FBA最安値", "FBA最安値", "入金額予測", "180日販売数", "90日販売数", "粗利益率予測", "30日販売数", "日本最安値", "粗利益予測"],
  table: ["在庫数", "想定送料", "返品率", "仕入れ目安単価", "販売額（ドル）", "送料", "関税", "予測30日販売数", "入金額（円）"],
  hidden: []
};

const metricZoneState = {
  pool: [...DEFAULT_METRIC_ZONES.pool],
  info: [...DEFAULT_METRIC_ZONES.info],
  center: [...DEFAULT_METRIC_ZONES.center],
  table: [...DEFAULT_METRIC_ZONES.table],
  hidden: [...DEFAULT_METRIC_ZONES.hidden]
};

/* =========================
   商品情報の初期配置（5枠）
   ✅ デフォルトで指定の項目を最初から設置
   ※固定表示はゼロ
   ※ここでは「真ん中の枠」に最初から並べる
========================= */
const DEFAULT_INFO_ZONES = {
  pool: [], // 初期は空でOK（必要なら他項目を追加していく）
  info: [], // 商品情報枠内の「チップ段」（任意）
  center: [
    "商品名",
    "ブランド",
    "評価",
    "各種ASIN",
    "JAN",
    "SKU",
    "サイズ",
    "重量（容積重量）",
    "カテゴリ",
    "材質"
  ],
  table: ["注意事項"],
  hidden: []
};

const infoZoneState = {
  pool: [...DEFAULT_INFO_ZONES.pool],
  info: [...DEFAULT_INFO_ZONES.info],
  center: [...DEFAULT_INFO_ZONES.center],
  table: [...DEFAULT_INFO_ZONES.table],
  hidden: [...DEFAULT_INFO_ZONES.hidden]
};

const cardState = new Map();
const cart = new Map();

/* ===== DOM refs ===== */
const metricsBar = $("#metricsBar");

/* 上部5枠（共通） */
const zonePool = $("#metricsPoolZone");
const zoneInfo = $("#metricsInfoZone");
const zoneCenter = $("#metricsCenterZone");
const zoneTable = $("#metricsTableZone");
const zoneHidden = $("#metricsHiddenZone");

/* tabs */
const tabMetricBtn = $("#tabMetricBtn");
const tabInfoBtn = $("#tabInfoBtn");

/* buttons */
const metricsCollapseBtn = $("#metricsCollapseBtn");
const resetCurrentBtn = $("#resetCurrentBtn");
const clearCardsBtn = $("#clearCardsBtn");
const clearCartBtn = $("#clearCartBtn");

/* content */
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

/* sort（指標タブのみ有効） */
const sortBar = $("#sortBar");
const sortControls = $("#sortControls");
const addSortRuleBtn = $("#addSortRuleBtn");
const applySortBtn = $("#applySortBtn");
const clearSortBtn = $("#clearSortBtn");
let sortRules = [];

/* mode */
let currentMode = "metric"; // "metric" | "info"

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

  tabMetricBtn?.addEventListener("click", () => {
    currentMode = "metric";
    tabMetricBtn.classList.add("active");
    tabInfoBtn.classList.remove("active");
    renderTopZones();
  });

  tabInfoBtn?.addEventListener("click", () => {
    currentMode = "info";
    tabInfoBtn.classList.add("active");
    tabMetricBtn.classList.remove("active");
    renderTopZones();
  });
}

function initActions() {
  metricsCollapseBtn?.addEventListener("click", () => {
    metricsBar.classList.toggle("collapsed");
    metricsCollapseBtn.textContent = metricsBar.classList.contains("collapsed") ? "展開する" : "折りたたむ";
  });

  resetCurrentBtn?.addEventListener("click", () => {
    if (currentMode === "metric") {
      metricZoneState.pool = [...DEFAULT_METRIC_ZONES.pool];
      metricZoneState.info = [...DEFAULT_METRIC_ZONES.info];
      metricZoneState.center = [...DEFAULT_METRIC_ZONES.center];
      metricZoneState.table = [...DEFAULT_METRIC_ZONES.table];
      metricZoneState.hidden = [...DEFAULT_METRIC_ZONES.hidden];
      sortRules = [];
      renderSortControls();
    } else {
      infoZoneState.pool = [...DEFAULT_INFO_ZONES.pool];
      infoZoneState.info = [...DEFAULT_INFO_ZONES.info];
      infoZoneState.center = [...DEFAULT_INFO_ZONES.center];
      infoZoneState.table = [...DEFAULT_INFO_ZONES.table];
      infoZoneState.hidden = [...DEFAULT_INFO_ZONES.hidden];
    }
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
  if (headerStatus) {
    headerStatus.textContent = count ? `表示中: ${count} ASIN` : "";
  }
}

/* =========================
   上部5枠：レンダリング（モードで切替）
========================= */
function getActiveState() {
  return currentMode === "metric" ? metricZoneState : infoZoneState;
}
function renderTopZones() {
  const st = getActiveState();

  zonePool.innerHTML = "";
  zoneInfo.innerHTML = "";
  zoneCenter.innerHTML = "";
  zoneTable.innerHTML = "";
  zoneHidden.innerHTML = "";

  st.pool.forEach((id) => zonePool.appendChild(makePill(id)));
  st.info.forEach((id) => zoneInfo.appendChild(makePill(id)));
  st.center.forEach((id) => zoneCenter.appendChild(makePill(id)));
  st.table.forEach((id) => zoneTable.appendChild(makePill(id)));
  st.hidden.forEach((id) => zoneHidden.appendChild(makePill(id)));

  // sortは指標タブのみ表示/有効
  if (sortBar) {
    sortBar.style.display = currentMode === "metric" ? "grid" : "none";
  }
  refreshSortRuleOptions();
}

function makePill(id) {
  const pill = document.createElement("div");
  pill.className = "metric-pill";
  pill.draggable = true;

  if (currentMode === "metric") {
    pill.dataset.metricId = id;
    pill.textContent = METRIC_BY_ID[id]?.label || id;

    pill.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", `metric:${id}`);
      e.dataTransfer.effectAllowed = "move";
    });
  } else {
    pill.dataset.infoId = id;
    pill.textContent = INFO_BY_ID[id]?.label || id;

    pill.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", `info:${id}`);
      e.dataTransfer.effectAllowed = "move";
    });
  }

  return pill;
}

/* =========================
   DnD（共通5枠）
   - 現在のタブと同じtypeだけ受け付ける
   - 同一項目の重複不可（どこか1枠のみ）
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
    const [type, id] = raw.split(":");
    if (!type || !id) return;

    // 現在のタブ以外のドロップは無視
    if ((currentMode === "metric" && type !== "metric") || (currentMode === "info" && type !== "info")) {
      return;
    }

    if (type === "metric") moveItemToZone(metricZoneState, id, zoneKey);
    if (type === "info") moveItemToZone(infoZoneState, id, zoneKey);

    renderTopZones();
    rerenderAllCards();
  });
}

function moveItemToZone(stateObj, itemId, toZone) {
  for (const z of ["pool", "info", "center", "table", "hidden"]) {
    const idx = stateObj[z].indexOf(itemId);
    if (idx >= 0) stateObj[z].splice(idx, 1);
  }
  stateObj[toZone].push(itemId);
}

/* =========================
   Sort（指標タブのみ）
========================= */
function initSortUI() {
  sortRules = [];
  renderSortControls();

  addSortRuleBtn?.addEventListener("click", () => {
    sortRules.push({ metricId: metricZoneState.center[0] || METRICS_ALL[0].id, order: "desc" });
    renderSortControls();
  });

  applySortBtn?.addEventListener("click", () => applySort());
  clearSortBtn?.addEventListener("click", () => {
    sortRules = [];
    renderSortControls();
  });
}

function renderSortControls() {
  if (!sortControls) return;
  sortControls.innerHTML = "";

  sortRules.forEach((r, idx) => {
    const row = document.createElement("div");
    row.className = "sort-row";

    const selMetric = document.createElement("select");
    selMetric.innerHTML = metricZoneState.center
      .map((id) => {
        const m = METRIC_BY_ID[id];
        return `<option value="${id}" ${id === r.metricId ? "selected" : ""}>${m?.label || id}</option>`;
      })
      .join("");
    selMetric.addEventListener("change", () => {
      r.metricId = selMetric.value;
    });

    const selOrder = document.createElement("select");
    selOrder.innerHTML = `
      <option value="desc" ${r.order === "desc" ? "selected" : ""}>降順</option>
      <option value="asc" ${r.order === "asc" ? "selected" : ""}>昇順</option>
    `;
    selOrder.addEventListener("change", () => {
      r.order = selOrder.value;
    });

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "削除";
    del.addEventListener("click", () => {
      sortRules.splice(idx, 1);
      renderSortControls();
    });

    row.appendChild(selMetric);
    row.appendChild(selOrder);
    row.appendChild(del);
    sortControls.appendChild(row);
  });
}

function refreshSortRuleOptions() {
  if (currentMode !== "metric") return;

  sortRules.forEach((r) => {
    if (!metricZoneState.center.includes(r.metricId)) {
      r.metricId = metricZoneState.center[0] || METRICS_ALL[0].id;
    }
  });
  renderSortControls();
}

function applySort() {
  if (sortRules.length === 0) return;

  const entries = Array.from(cardState.entries());
  const score = (data, metricId) => {
    const m = METRIC_BY_ID[metricId];
    if (!m) return -Infinity;
    const v = data[m.sourceKey];
    if (v == null) return -Infinity;
    const n = Number(String(v).trim().replace(/[^\d.\-]/g, ""));
    return Number.isFinite(n) ? n : -Infinity;
  };

  entries.sort((a, b) => {
    const da = a[1].data;
    const db = b[1].data;

    for (const r of sortRules) {
      const va = score(da, r.metricId);
      const vb = score(db, r.metricId);
      if (va === vb) continue;
      if (r.order === "asc") return va - vb;
      return vb - va;
    }
    return 0;
  });

  entries.forEach(([_, v]) => itemsContainer.appendChild(v.el));
}

/* =========================
   指標：カード描画
========================= */
function buildCenterMetrics(container, data) {
  container.innerHTML = "";
  metricZoneState.center.forEach((id) => {
    const m = METRIC_BY_ID[id];
    if (!m) return;
    const val = data[m.sourceKey];
    const row = document.createElement("div");
    row.className = "metric-row";
    row.innerHTML = `
      <div class="label">${m.label}</div>
      <div class="value">${val ?? "－"}</div>
    `;
    container.appendChild(row);
  });
}

function buildDetailTable(tableEl, data) {
  const theadRow = tableEl.querySelector("thead tr");
  const tbodyRow = tableEl.querySelector("tbody tr");

  theadRow.innerHTML = "";
  tbodyRow.innerHTML = "";

  metricZoneState.table.forEach((id) => {
    const m = METRIC_BY_ID[id];
    if (!m) return;

    const th = document.createElement("th");
    th.textContent = m.label;
    theadRow.appendChild(th);

    const td = document.createElement("td");
    td.textContent = data[m.sourceKey] ?? "－";
    tbodyRow.appendChild(td);
  });
}

/* ✅ 指標を「商品情報枠」に表示するチップ段 */
function buildInfoMetrics(container, data) {
  if (!container) return;
  container.innerHTML = "";

  if (metricZoneState.info.length === 0) {
    container.style.display = "none";
    return;
  }
  container.style.display = "flex";

  metricZoneState.info.forEach((id) => {
    const m = METRIC_BY_ID[id];
    if (!m) return;

    const chip = document.createElement("div");
    chip.className = "info-metric-chip";
    chip.innerHTML = `
      <div class="k">${m.label}</div>
      <div class="v info-scroll">${data[m.sourceKey] ?? "－"}</div>
    `;
    container.appendChild(chip);
  });
}

/* =========================
   商品情報（値の解決）
========================= */
function renderWarningTags(str) {
  const s = (str || "").toString();
  const parts = s.split(/[,\s、]+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length === 0) return "";

  return parts
    .map((p) => {
      let cls = "tag";
      if (p.includes("輸出不可") || p.includes("出荷禁止")) cls += " danger";
      else if (p.includes("知財")) cls += " info";
      else if (p.includes("大型")) cls += " warn";
      return `<span class="${cls}">${p}</span>`;
    })
    .join("");
}

function resolveInfoValue(id, ctx) {
  const f = INFO_BY_ID[id];
  if (!f) return { type: "text", text: "－" };

  const { asin, jpAsin, usAsin, size, weight, data } = ctx;

  const computed = {
    商品名: data["品名"] || "－",
    各種ASIN: `日本: ${jpAsin} / US: ${usAsin}`,
    サイズ: size,
    "重量（容積重量）": weight,
    カテゴリ: `${data["親カテゴリ"] || "－"} / ${data["サブカテゴリ"] || "－"}`,
    注意事項: renderWarningTags(data["注意事項（警告系）"])
  };

  if (f.kind === "computedTags") {
    return { type: "tags", html: computed[id] || "－" };
  }
  if (f.kind === "computed" || f.kind === "computedTitle") {
    return { type: "text", text: computed[id] || "－" };
  }

  const sourceKey = f.sourceKey || f.id;
  return { type: "text", text: data[sourceKey] ?? "－" };
}

/* 商品情報（真ん中の枠）＝メイン行 */
function buildInfoCenterList(container, ctx) {
  if (!container) return;
  container.innerHTML = "";

  if (infoZoneState.center.length === 0) {
    container.style.display = "none";
    return;
  }
  container.style.display = "grid";

  infoZoneState.center.forEach((id) => {
    const k = document.createElement("div");
    k.className = "k";
    k.textContent = INFO_BY_ID[id]?.label || id;

    const v = document.createElement("div");
    v.className = "v info-scroll";

    const rv = resolveInfoValue(id, ctx);
    if (rv.type === "tags") {
      v.classList.add("v-tags");
      v.innerHTML = rv.html;
    } else {
      v.textContent = rv.text;
    }

    container.appendChild(k);
    container.appendChild(v);
  });
}

/* 商品情報（商品情報）＝チップ段（任意で使う） */
function buildInfoChipFields(container, ctx) {
  if (!container) return;
  container.innerHTML = "";

  if (infoZoneState.info.length === 0) {
    container.style.display = "none";
    return;
  }
  container.style.display = "flex";

  infoZoneState.info.forEach((id) => {
    const chip = document.createElement("div");
    chip.className = "info-field-chip";

    const rv = resolveInfoValue(id, ctx);
    chip.innerHTML = `
      <div class="k">${INFO_BY_ID[id]?.label || id}</div>
      <div class="v info-scroll">${rv.type === "tags" ? "" : (rv.text ?? "－")}</div>
    `;
    if (rv.type === "tags") {
      chip.querySelector(".v").classList.add("v-tags");
      chip.querySelector(".v").innerHTML = rv.html;
    }
    container.appendChild(chip);
  });
}

/* 商品情報（下段テーブル） */
function buildInfoTable(tableEl, ctx) {
  if (!tableEl) return;

  const wrap = tableEl.closest(".info-table-wrap");
  if (infoZoneState.table.length === 0) {
    if (wrap) wrap.style.display = "none";
    return;
  }
  if (wrap) wrap.style.display = "block";

  const theadRow = tableEl.querySelector("thead tr");
  const tbodyRow = tableEl.querySelector("tbody tr");
  theadRow.innerHTML = "";
  tbodyRow.innerHTML = "";

  infoZoneState.table.forEach((id) => {
    const th = document.createElement("th");
    th.textContent = INFO_BY_ID[id]?.label || id;
    theadRow.appendChild(th);

    const td = document.createElement("td");
    td.className = "info-td";
    const rv = resolveInfoValue(id, ctx);

    if (rv.type === "tags") {
      td.classList.add("info-td-tags");
      td.innerHTML = rv.html;
    } else {
      const span = document.createElement("div");
      span.className = "info-td-scroll";
      span.textContent = rv.text;
      td.appendChild(span);
    }

    tbodyRow.appendChild(td);
  });
}

function rerenderAllCards() {
  cardState.forEach((v) => {
    const center = v.el.querySelector(".js-center");
    const table = v.el.querySelector(".js-detailTable");
    if (center) buildCenterMetrics(center, v.data);
    if (table) buildDetailTable(table, v.data);

    // 商品情報 ctx
    const asin = v.el.dataset.asin;
    const jpAsin = v.data["日本ASIN"] || "－";
    const usAsin = v.data["アメリカASIN"] || asin || "－";
    const realW = v.data["重量kg"] ?? v.data["重量（kg）"] ?? v.data["重量"] ?? "";
    const volW = v.data["容積重量"] ?? "";
    const size = v.data["サイズ"] || "－";
    const weight = `${fmtKg(realW)}（${fmtKg(volW)}）`;
    const ctx = { asin, jpAsin, usAsin, size, weight, data: v.data };

    const infoCenter = v.el.querySelector(".js-infoCenter");
    const infoChips = v.el.querySelector(".js-infoChips");
    const infoTable = v.el.querySelector(".js-infoTable");

    if (infoCenter) buildInfoCenterList(infoCenter, ctx);
    if (infoChips) buildInfoChipFields(infoChips, ctx);
    if (infoTable) buildInfoTable(infoTable, ctx);

    // 指標 in 商品情報
    const infoMetrics = v.el.querySelector(".js-infoMetrics");
    if (infoMetrics) buildInfoMetrics(infoMetrics, v.data);
  });
}

/* =========================
   チャート
========================= */
function renderChart(canvas) {
  const labels = Array.from({ length: 180 }, (_, i) => `${180 - i}日`);
  const rank = labels.map(() => 52000 + (Math.random() - 0.5) * 8000);
  const sellers = labels.map(() => Math.max(1, Math.round(1 + Math.random() * 8)));
  const price = labels.map(() => 22 + (Math.random() - 0.5) * 8);

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "ランキング", data: rank, yAxisID: "y", tension: 0.25 },
        { label: "セラー数", data: sellers, yAxisID: "y1", tension: 0.25 },
        { label: "価格(USD)", data: price, yAxisID: "y2", tension: 0.25 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: true } },
      scales: {
        y: { position: "left", grid: {} },
        y1: { position: "right", grid: { drawOnChartArea: false } },
        y2: { position: "right", grid: { drawOnChartArea: false } }
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

  cartTotalCost.textContent = fmtJPY(totalCost);
  cartTotalRevenue.textContent = fmtJPY(totalRevenueJPY);
  cartTotalProfit.textContent = fmtJPY(profit);
  cartAsinCount.textContent = String(asinCount);
  cartItemCount.textContent = String(itemCount);
}

/* =========================
   カード生成
========================= */
function createProductCard(asin, data) {
  const card = document.createElement("section");
  card.className = "product-card card";
  card.dataset.asin = asin;

  const isAltLayout = document.body.classList.contains("alt-layout");

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
          <div class="info-grid js-infoCenter"></div>

          <!-- ✅ 指標(商品情報枠) -->
          <div class="info-metrics js-infoMetrics"></div>

          <!-- ✅ 商品情報(チップ段) 任意 -->
          <div class="info-field-chips js-infoChips"></div>

          <div class="info-table-wrap">
            <div class="info-table-title">商品情報（下段）</div>
            <div class="detail-scroll">
              <table class="detail-table info-table js-infoTable">
                <thead><tr></tr></thead>
                <tbody><tr></tr></tbody>
              </table>
            </div>
          </div>
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
      <div class="detail-head">
        <div class="t">その他項目</div>
      </div>
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
          <div class="info-grid js-infoCenter"></div>

          <!-- ✅ 指標(商品情報枠) -->
          <div class="info-metrics js-infoMetrics"></div>

          <!-- ✅ 商品情報(チップ段) 任意 -->
          <div class="info-field-chips js-infoChips"></div>

          <div class="info-table-wrap">
            <div class="info-table-title">商品情報（下段）</div>
            <div class="detail-scroll">
              <table class="detail-table info-table js-infoTable">
                <thead><tr></tr></thead>
                <tbody><tr></tr></tbody>
              </table>
            </div>
          </div>
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
      <div class="detail-head">
        <div class="t">その他項目</div>
      </div>
      <div class="detail-scroll">
        <table class="detail-table js-detailTable">
          <thead><tr></tr></thead>
          <tbody><tr></tr></tbody>
        </table>
      </div>
    </div>
  `;

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

  card.querySelector(".remove").addEventListener("click", () => {
    if (cart.has(asin)) {
      cart.delete(asin);
      updateCartSummary();
    }
    if (card.__chart) card.__chart.destroy();
    card.remove();
    cardState.delete(asin);

    if (cardState.size === 0) {
      emptyState.style.display = "block";
    }
    updateHeaderStatus();
  });

  card.querySelector(".js-addCart").addEventListener("click", () => {
    const qty = Math.max(1, Number(card.querySelector(".js-qty").value || 1));
    const sellUSD = num(sellInput.value);
    const costJPY = num(costInput.value);

    if (sellUSD <= 0) return alert("販売価格（$）を入力してください");
    if (costJPY <= 0) return alert("仕入れ額（￥）を入力してください");

    cart.set(asin, { qty, sellUSD, costJPY });
    updateCartSummary();
  });

  // 指標
  buildCenterMetrics(card.querySelector(".js-center"), data);
  buildDetailTable(card.querySelector(".js-detailTable"), data);

  // 商品情報 ctx
  const jpAsin = data["日本ASIN"] || "－";
  const usAsin = data["アメリカASIN"] || asin;
  const realW = data["重量kg"] ?? data["重量（kg）"] ?? data["重量"] ?? "";
  const volW = data["容積重量"] ?? "";
  const size = data["サイズ"] || "－";
  const weight = `${fmtKg(realW)}（${fmtKg(volW)}）`;
  const ctx = { asin, jpAsin, usAsin, size, weight, data };

  buildInfoCenterList(card.querySelector(".js-infoCenter"), ctx);
  buildInfoChipFields(card.querySelector(".js-infoChips"), ctx);
  buildInfoTable(card.querySelector(".js-infoTable"), ctx);

  // 指標 in 商品情報
  buildInfoMetrics(card.querySelector(".js-infoMetrics"), data);

  // chart
  const canvas = card.querySelector(".js-chart");
  const chart = renderChart(canvas);
  card.__chart = chart;

  const chkDS = card.querySelector(".js-chkDS");
  const chkSP = card.querySelector(".js-chkSP");
  const refreshVis = () => updateChartVisibility(chart, chkDS.checked, chkSP.checked);
  chkDS.addEventListener("change", refreshVis);
  chkSP.addEventListener("change", refreshVis);
  updateChartVisibility(chart, true, false);

  const keepaWrap = card.querySelector(".js-keepaWrap");
  const keepaFrame = card.querySelector(".js-keepaFrame");
  const mesWrap = card.querySelector(".js-mesWrap");
  const graphOptions = card.querySelector(".js-graphOptions");

  if (keepaFrame) keepaFrame.src = `https://keepa.com/#!product/1-${asin}`;

  if (isAltLayout) {
    if (graphOptions) graphOptions.style.display = "flex";
    if (mesWrap) mesWrap.style.display = "block";
    if (keepaWrap) keepaWrap.style.display = "block";
  } else {
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
