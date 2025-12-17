/**************************************************************
 * main.js
 * MES-AI-A デモ（フロントのみ）
 * - 指標（主要/下段/非表示）は従来通りドラッグでカスタム
 * - ✅商品情報枠もドラッグで表示項目をカスタム可能に拡張
 **************************************************************/

const $ = (sel, root=document) => root.querySelector(sel);
const FX_RATE = 155;

const fmtJPY = (n) => "￥" + Number(n || 0).toLocaleString("ja-JP");
const num = (v) => {
  const x = Number(String(v ?? "").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(x) ? x : 0;
};
const fmtKg = (v) => {
  const x = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  if(!Number.isFinite(x) || x === 0) return "－";
  return x.toFixed(2) + "kg";
};

/* =========================
   指標（従来）
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

const METRIC_BY_ID = Object.fromEntries(METRICS_ALL.map(m => [m.id, m]));

/* =========================
   ✅ 商品情報（新規）
   - ここに追加すれば「商品情報枠」の表示項目に出せる
========================= */
const INFO_FIELDS_ALL = [
  { id:"ブランド", label:"ブランド", kind:"text" },
  { id:"評価", label:"評価", kind:"text", sourceKey:"レビュー評価" },
  { id:"ASIN", label:"ASIN", kind:"computed" },
  { id:"各種ASIN", label:"各種ASIN", kind:"computed" },
  { id:"JAN", label:"JAN", kind:"text" },
  { id:"SKU", label:"SKU", kind:"text" },
  { id:"サイズ", label:"サイズ", kind:"computed" },
  { id:"重量（容積重量）", label:"重量（容積重量）", kind:"computed" },
  { id:"材質", label:"材質", kind:"text" },
  { id:"カテゴリ", label:"カテゴリ", kind:"computed" },
  { id:"注意事項", label:"注意事項", kind:"computedTags" },
];

const INFO_BY_ID = Object.fromEntries(INFO_FIELDS_ALL.map(f => [f.id, f]));

/* =========================
   初期配置（指標）
========================= */
const DEFAULT_ZONES = {
  pool: [
    "複数在庫指数45日分","複数在庫指数60日分","ライバル偏差1","ライバル偏差2","ライバル増加率",
    "在庫数","返品率",
    "販売額（ドル）","入金額（円）","入金額計（円）",
    "仕入れ目安単価","想定送料","送料","関税",
    "粗利益","粗利益率","日本最安値"
  ],
  center: [
    "過去3月FBA最安値","FBA最安値",
    "入金額予測","180日販売数","90日販売数",
    "粗利益率予測","30日販売数","日本最安値","粗利益予測"
  ],
  table: [
    "在庫数","想定送料","返品率","仕入れ目安単価",
    "販売額（ドル）","送料","関税","予測30日販売数","入金額（円）"
  ],
  hidden: []
};

const zoneState = {
  pool: [...DEFAULT_ZONES.pool],
  center: [...DEFAULT_ZONES.center],
  table: [...DEFAULT_ZONES.table],
  hidden: [...DEFAULT_ZONES.hidden],
};

/* =========================
   ✅ 初期配置（商品情報）
========================= */
const DEFAULT_INFO_ZONES = {
  pool: [
    "ブランド","評価","ASIN","各種ASIN","JAN","SKU","サイズ","重量（容積重量）","材質","カテゴリ","注意事項"
  ],
  info: [
    "ブランド","評価","各種ASIN","JAN","SKU","サイズ","重量（容積重量）","カテゴリ","注意事項"
  ],
  hidden: []
};

const infoZoneState = {
  pool: [...DEFAULT_INFO_ZONES.pool],
  info: [...DEFAULT_INFO_ZONES.info],
  hidden: [...DEFAULT_INFO_ZONES.hidden],
};

const cardState = new Map();
const cart = new Map();

/* ===== DOM refs ===== */
const metricsBar = $("#metricsBar");

const metricsPoolZone = $("#metricsPoolZone");
const metricsCenterZone = $("#metricsCenterZone");
const metricsTableZone = $("#metricsTableZone");
const metricsHiddenZone = $("#metricsHiddenZone");

const infoPoolZone = $("#infoPoolZone");
const infoMainZone = $("#infoMainZone");
const infoHiddenZone = $("#infoHiddenZone");

const metricsCollapseBtn = $("#metricsCollapseBtn");
const metricsResetBtn = $("#metricsResetBtn");
const infoResetBtn = $("#infoResetBtn");

const clearCardsBtn = $("#clearCardsBtn");
const clearCartBtn = $("#clearCartBtn");

const asinCatalog = $("#asinCatalog");
const itemsContainer = $("#itemsContainer");
const emptyState = $("#emptyState");
const headerStatus = $("#headerStatus");

const cartTotalCost = $("#cartTotalCost");
const cartTotalRevenue = $("#cartTotalRevenue");
const cartTotalProfit = $("#cartTotalProfit");
const cartAsinCount = $("#cartAsinCount");
const cartItemCount = $("#cartItemCount");

/* sort */
const sortControls = $("#sortControls");
const addSortRuleBtn = $("#addSortRuleBtn");
const applySortBtn = $("#applySortBtn");
const clearSortBtn = $("#clearSortBtn");
let sortRules = [];

/* tabs */
const metricsTabMetrics = $("#metricsTabMetrics");
const metricsTabInfo = $("#metricsTabInfo");
const panelMetrics = $("#panelMetrics");
const panelInfo = $("#panelInfo");

init();

function init(){
  initMetricsBar();
  initCatalog();
  initSortUI();
  initActions();
  updateCartSummary();
  updateHeaderStatus();
}

function initActions(){
  metricsCollapseBtn?.addEventListener("click", () => {
    metricsBar.classList.toggle("collapsed");
    metricsCollapseBtn.textContent = metricsBar.classList.contains("collapsed") ? "展開する" : "折りたたむ";
  });

  metricsResetBtn?.addEventListener("click", () => {
    zoneState.pool = [...DEFAULT_ZONES.pool];
    zoneState.center = [...DEFAULT_ZONES.center];
    zoneState.table = [...DEFAULT_ZONES.table];
    zoneState.hidden = [...DEFAULT_ZONES.hidden];
    renderMetricsZones();
    rerenderAllCards();
  });

  infoResetBtn?.addEventListener("click", () => {
    infoZoneState.pool = [...DEFAULT_INFO_ZONES.pool];
    infoZoneState.info = [...DEFAULT_INFO_ZONES.info];
    infoZoneState.hidden = [...DEFAULT_INFO_ZONES.hidden];
    renderInfoZones();
    rerenderAllCards();
  });

  clearCardsBtn?.addEventListener("click", () => {
    cardState.forEach((v) => {
      if(v.chart) v.chart.destroy();
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

  /* tabs */
  const setTab = (tab) => {
    if(!panelMetrics || !panelInfo) return;
    const isMetrics = tab === "metrics";
    panelMetrics.hidden = !isMetrics;
    panelInfo.hidden = isMetrics;
    metricsTabMetrics?.classList.toggle("active", isMetrics);
    metricsTabInfo?.classList.toggle("active", !isMetrics);
  };
  metricsTabMetrics?.addEventListener("click", () => setTab("metrics"));
  metricsTabInfo?.addEventListener("click", () => setTab("info"));
  setTab("metrics");
}

function initCatalog(){
  const asins = Object.keys(window.ASIN_DATA || {});
  asinCatalog.innerHTML = "";
  asins.forEach(asin => {
    const b = document.createElement("button");
    b.className = "asin-pill";
    b.type = "button";
    b.textContent = asin;
    b.addEventListener("click", () => addOrFocusCard(asin));
    asinCatalog.appendChild(b);
  });
}

function addOrFocusCard(asin){
  const data = (window.ASIN_DATA || {})[asin];
  if(!data) return alert("データがありません: " + asin);

  if(cardState.has(asin)){
    cardState.get(asin).el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const card = createProductCard(asin, data);
  itemsContainer.appendChild(card);

  emptyState.style.display = "none";
  cardState.set(asin, { el: card, data, chart: card.__chart || null });

  updateHeaderStatus();
}

function updateHeaderStatus(){
  const count = cardState.size;
  if(headerStatus){
    headerStatus.textContent = count ? `表示中: ${count} ASIN` : "";
  }
}

/* =========================
   指標プール（従来）
========================= */
function initMetricsBar(){
  renderMetricsZones();
  attachZoneDnD(metricsPoolZone, { zoneKey:"pool", accept:"metric" });
  attachZoneDnD(metricsCenterZone, { zoneKey:"center", accept:"metric" });
  attachZoneDnD(metricsTableZone, { zoneKey:"table", accept:"metric" });
  attachZoneDnD(metricsHiddenZone, { zoneKey:"hidden", accept:"metric" });

  renderInfoZones();
  attachZoneDnD(infoPoolZone, { zoneKey:"pool", accept:"info" });
  attachZoneDnD(infoMainZone, { zoneKey:"info", accept:"info" });
  attachZoneDnD(infoHiddenZone, { zoneKey:"hidden", accept:"info" });
}

function renderMetricsZones(){
  renderMetricZone(metricsPoolZone, zoneState.pool);
  renderMetricZone(metricsCenterZone, zoneState.center);
  renderMetricZone(metricsTableZone, zoneState.table);
  renderMetricZone(metricsHiddenZone, zoneState.hidden);
  refreshSortRuleOptions();
}

function renderMetricZone(zoneEl, list){
  if(!zoneEl) return;
  zoneEl.innerHTML = "";
  list.forEach(id => {
    const m = METRIC_BY_ID[id];
    if(!m) return;

    const pill = document.createElement("div");
    pill.className = "metric-pill";
    pill.draggable = true;
    pill.dataset.metricId = id;
    pill.textContent = m.label;

    pill.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", `metric:${id}`);
      e.dataTransfer.effectAllowed = "move";
    });

    zoneEl.appendChild(pill);
  });
}

function moveMetricToZone(metricId, toZone){
  for(const z of ["pool","center","table","hidden"]){
    const idx = zoneState[z].indexOf(metricId);
    if(idx >= 0) zoneState[z].splice(idx, 1);
  }
  zoneState[toZone].push(metricId);

  renderMetricsZones();
  rerenderAllCards();
}

/* =========================
   ✅ 商品情報プール（新規）
========================= */
function renderInfoZones(){
  renderInfoZone(infoPoolZone, infoZoneState.pool);
  renderInfoZone(infoMainZone, infoZoneState.info);
  renderInfoZone(infoHiddenZone, infoZoneState.hidden);
}

function renderInfoZone(zoneEl, list){
  if(!zoneEl) return;
  zoneEl.innerHTML = "";
  list.forEach(id => {
    const f = INFO_BY_ID[id];
    if(!f) return;

    const pill = document.createElement("div");
    pill.className = "metric-pill info-pill";
    pill.draggable = true;
    pill.dataset.infoId = id;
    pill.textContent = f.label;

    pill.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", `info:${id}`);
      e.dataTransfer.effectAllowed = "move";
    });

    zoneEl.appendChild(pill);
  });
}

function moveInfoToZone(infoId, toZone){
  for(const z of ["pool","info","hidden"]){
    const idx = infoZoneState[z].indexOf(infoId);
    if(idx >= 0) infoZoneState[z].splice(idx, 1);
  }
  infoZoneState[toZone].push(infoId);

  renderInfoZones();
  rerenderAllCards();
}

/* =========================
   DnD 共通
========================= */
function attachZoneDnD(zoneEl, { zoneKey, accept }){
  if(!zoneEl) return;

  zoneEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });
  zoneEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if(!raw) return;

    const [type, id] = raw.split(":");
    if(type !== accept || !id) return;

    if(type === "metric") moveMetricToZone(id, zoneKey);
    if(type === "info") moveInfoToZone(id, zoneKey);
  });
}

/* =========================
   Sort（従来）
========================= */
function initSortUI(){
  sortRules = [];
  renderSortControls();

  addSortRuleBtn?.addEventListener("click", () => {
    sortRules.push({ metricId: zoneState.center[0] || METRICS_ALL[0].id, order: "desc" });
    renderSortControls();
  });

  applySortBtn?.addEventListener("click", () => applySort());

  clearSortBtn?.addEventListener("click", () => {
    sortRules = [];
    renderSortControls();
  });
}

function renderSortControls(){
  if(!sortControls) return;
  sortControls.innerHTML = "";

  sortRules.forEach((r, idx) => {
    const row = document.createElement("div");
    row.className = "sort-row";

    const selMetric = document.createElement("select");
    selMetric.innerHTML = zoneState.center.map(id => {
      const m = METRIC_BY_ID[id];
      return `<option value="${id}" ${id===r.metricId ? "selected":""}>${m?.label || id}</option>`;
    }).join("");
    selMetric.addEventListener("change", () => { r.metricId = selMetric.value; });

    const selOrder = document.createElement("select");
    selOrder.innerHTML = `
      <option value="desc" ${r.order==="desc"?"selected":""}>降順</option>
      <option value="asc" ${r.order==="asc"?"selected":""}>昇順</option>
    `;
    selOrder.addEventListener("change", () => { r.order = selOrder.value; });

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

function refreshSortRuleOptions(){
  sortRules.forEach(r => {
    if(!zoneState.center.includes(r.metricId)){
      r.metricId = zoneState.center[0] || METRICS_ALL[0].id;
    }
  });
  renderSortControls();
}

function applySort(){
  if(sortRules.length === 0) return;

  const entries = Array.from(cardState.entries());
  const score = (data, metricId) => {
    const m = METRIC_BY_ID[metricId];
    if(!m) return -Infinity;
    const v = data[m.sourceKey];
    if(v == null) return -Infinity;
    const n = Number(String(v).trim().replace(/[^\d.\-]/g, ""));
    return Number.isFinite(n) ? n : -Infinity;
  };

  entries.sort((a, b) => {
    const da = a[1].data;
    const db = b[1].data;

    for(const r of sortRules){
      const va = score(da, r.metricId);
      const vb = score(db, r.metricId);
      if(va === vb) continue;
      if(r.order === "asc") return va - vb;
      return vb - va;
    }
    return 0;
  });

  entries.forEach(([_, v]) => itemsContainer.appendChild(v.el));
}

/* =========================
   描画（カード）
========================= */
function buildCenterMetrics(container, data){
  container.innerHTML = "";
  zoneState.center.forEach(id => {
    const m = METRIC_BY_ID[id];
    if(!m) return;
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

function buildDetailTable(tableEl, data){
  const theadRow = tableEl.querySelector("thead tr");
  const tbodyRow = tableEl.querySelector("tbody tr");

  theadRow.innerHTML = "";
  tbodyRow.innerHTML = "";

  zoneState.table.forEach(id => {
    const m = METRIC_BY_ID[id];
    if(!m) return;
    const th = document.createElement("th");
    th.textContent = m.label;
    theadRow.appendChild(th);

    const td = document.createElement("td");
    td.textContent = data[m.sourceKey] ?? "－";
    tbodyRow.appendChild(td);
  });
}

function renderWarningTags(str){
  const s = (str || "").toString();
  const parts = s.split(/[,\s、]+/).map(x => x.trim()).filter(Boolean);
  if(parts.length === 0) return "";

  return parts.map(p => {
    let cls = "tag";
    if(p.includes("輸出不可") || p.includes("出荷禁止")) cls += " danger";
    else if(p.includes("知財")) cls += " info";
    else if(p.includes("大型")) cls += " warn";
    return `<span class="${cls}">${p}</span>`;
  }).join("");
}

function buildInfoGrid(gridEl, { asin, jpAsin, usAsin, size, weight, data }){
  if(!gridEl) return;
  gridEl.innerHTML = "";

  const computed = {
    "ASIN": asin,
    "各種ASIN": `日本: ${jpAsin} / US: ${usAsin}`,
    "サイズ": size,
    "重量（容積重量）": weight,
    "カテゴリ": `${data["親カテゴリ"] || "－"} / ${data["サブカテゴリ"] || "－"}`,
    "注意事項": renderWarningTags(data["注意事項（警告系）"]),
  };

  infoZoneState.info.forEach(id => {
    const f = INFO_BY_ID[id];
    if(!f) return;

    const k = document.createElement("div");
    k.className = "k";
    k.textContent = f.label;

    const v = document.createElement("div");
    v.className = "v";

    if(f.kind === "computedTags"){
      v.classList.add("v-tags");
      v.innerHTML = computed[id] || "－";
    } else if(f.kind === "computed"){
      v.textContent = computed[id] || "－";
    } else {
      const sourceKey = f.sourceKey || f.id;
      v.textContent = data[sourceKey] ?? "－";
    }

    gridEl.appendChild(k);
    gridEl.appendChild(v);
  });
}

function rerenderAllCards(){
  cardState.forEach((v) => {
    const center = v.el.querySelector(".js-center");
    const table = v.el.querySelector(".js-detailTable");
    if(center) buildCenterMetrics(center, v.data);
    if(table) buildDetailTable(table, v.data);

    // ✅商品情報枠
    const infoGrid = v.el.querySelector(".js-infoGrid");
    if(infoGrid){
      const jpAsin = v.data["日本ASIN"] || "－";
      const usAsin = v.data["アメリカASIN"] || v.el.dataset.asin || "－";
      const realW = v.data["重量kg"] ?? v.data["重量（kg）"] ?? v.data["重量"] ?? "";
      const volW  = v.data["容積重量"] ?? "";
      const size  = v.data["サイズ"] || "－";
      const weight = `${fmtKg(realW)}（${fmtKg(volW)}）`;
      buildInfoGrid(infoGrid, { asin: v.el.dataset.asin, jpAsin, usAsin, size, weight, data: v.data });
    }
  });
}

/* =========================
   チャート
========================= */
function renderChart(canvas){
  const labels = Array.from({length: 180}, (_,i)=> `${180-i}日`);
  const rank = labels.map(() => 52000 + (Math.random()-0.5)*8000);
  const sellers = labels.map(() => Math.max(1, Math.round(1 + Math.random()*8)));
  const price = labels.map(() => 22 + (Math.random()-0.5)*8);

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "ランキング", data: rank, yAxisID:"y", tension: .25 },
        { label: "セラー数", data: sellers, yAxisID:"y1", tension: .25 },
        { label: "価格(USD)", data: price, yAxisID:"y2", tension: .25 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: true } },
      scales: {
        y: { position:"left", grid:{} },
        y1: { position:"right", grid:{ drawOnChartArea:false } },
        y2: { position:"right", grid:{ drawOnChartArea:false } },
      }
    }
  });

  return chart;
}

function updateChartVisibility(chart, showDS, showSP){
  chart.data.datasets.forEach(ds => {
    if(ds.label === "ランキング") ds.hidden = !showDS;
    if(ds.label === "セラー数") ds.hidden = !(showDS || showSP);
    if(ds.label === "価格(USD)") ds.hidden = !showSP;
  });
  chart.update();
}

/* =========================
   カート
========================= */
function updateCartSummary(){
  let totalCost = 0;
  let totalRevenueJPY = 0;
  let asinCount = cart.size;
  let itemCount = 0;

  cart.forEach(v => {
    const qty = Math.max(1, Number(v.qty || 1));
    const sellUSD = Number(v.sellUSD || 0);
    const costJPY = Number(v.costJPY || 0);

    itemCount += qty;
    totalCost += costJPY * qty;
    totalRevenueJPY += (sellUSD * FX_RATE) * qty;
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
function createProductCard(asin, data){
  const card = document.createElement("section");
  card.className = "product-card card";
  card.dataset.asin = asin;

  const isAltLayout = document.body.classList.contains("alt-layout");

  const jpAsin = data["日本ASIN"] || "－";
  const usAsin = data["アメリカASIN"] || asin;

  const realW = data["重量kg"] ?? data["重量（kg）"] ?? data["重量"] ?? "";
  const volW  = data["容積重量"] ?? "";

  const size = data["サイズ"] || "－";
  const weight = `${fmtKg(realW)}（${fmtKg(volW)}）`;

  card.innerHTML = isAltLayout ? `
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
          <h3 class="info-title">${data["品名"] || "－"}</h3>
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
  ` : `
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
          <h3 class="info-title">${data["品名"] || "－"}</h3>
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
    if(cart.has(asin)){
      cart.delete(asin);
      updateCartSummary();
    }
    if(card.__chart) card.__chart.destroy();
    card.remove();
    cardState.delete(asin);

    if(cardState.size === 0){
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

  buildCenterMetrics(card.querySelector(".js-center"), data);
  buildDetailTable(card.querySelector(".js-detailTable"), data);
  buildInfoGrid(card.querySelector(".js-infoGrid"), { asin, jpAsin, usAsin, size, weight, data });

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

  // alt-layoutは常時2段表示（keepa上 / mes下）
  if (isAltLayout) {
    if (graphOptions) graphOptions.style.display = "flex";
    if (mesWrap) mesWrap.style.display = "block";
    if (keepaWrap) keepaWrap.style.display = "block";
  } else {
    // 通常レイアウトはタブ切替
    const btnMes = card.querySelector(".js-btnMes");
    const btnKeepa = card.querySelector(".js-btnKeepa");

    function setMode(mode){
      if(mode === "MES"){
        btnMes.classList.add("active");
        btnKeepa.classList.remove("active");
        graphOptions.style.display = "flex";
        mesWrap.style.display = "block";
        keepaWrap.style.display = "none";
      }else{
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
