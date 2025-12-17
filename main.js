/**************************************************************
 * main.js
 * MES-AI-A デモ（フロントのみ）
 * - ASIN_DATA（asin-data.js）からカード生成
 * - 指標プール（ドラッグ&ドロップ）で真ん中枠/下段テーブルを変更
 * - ソート（真ん中枠の指標）でカード順序入れ替え
 * - カート集計（数量×販売価格/仕入れ）
 * - グラフ（Chart.js）＋ Keepa iframe
 * - alt.html（body.alt-layout）では配置が変わる（2段グラフ）
 **************************************************************/

// =========================
// Utils
// =========================
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const FX_RATE = 155; // 為替（固定）
const fmtJPY = (n) => {
  const x = Number(n || 0);
  return "￥" + x.toLocaleString("ja-JP");
};
const fmtUSD = (n) => {
  const x = Number(n || 0);
  return "$" + x.toFixed(2);
};
const num = (v) => {
  const x = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(x) ? x : 0;
};
const fmtKg = (v) => {
  const x = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  if(!Number.isFinite(x) || x === 0) return "－";
  return x.toFixed(2) + "kg";
};

// =========================
// 指標定義（プール）
// 「：より左」のキー（id/sourceKey）を全て含める
// =========================
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

// =========================
// 初期配置（主要項目 / その他項目）
// =========================
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

// =========================
// 状態
// =========================
const zoneState = {
  pool: [...DEFAULT_ZONES.pool],
  center: [...DEFAULT_ZONES.center],
  table: [...DEFAULT_ZONES.table],
  hidden: [...DEFAULT_ZONES.hidden],
};

const cardState = new Map(); // asin -> { el, data, chart }
const cart = new Map();      // asin -> { qty, sellUSD, costJPY }

// =========================
// DOM
// =========================
const metricsBar = $("#metricsBar");
const metricsPoolZone = $("#metricsPoolZone");
const metricsCenterZone = $("#metricsCenterZone");
const metricsTableZone = $("#metricsTableZone");
const metricsHiddenZone = $("#metricsHiddenZone");

const metricsCollapseBtn = $("#metricsCollapseBtn");
const metricsResetBtn = $("#metricsResetBtn");
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

// sort UI
const sortControls = $("#sortControls");
const addSortRuleBtn = $("#addSortRuleBtn");
const applySortBtn = $("#applySortBtn");
const clearSortBtn = $("#clearSortBtn");

let sortRules = []; // [{ metricId, order }]

// =========================
// Init
// =========================
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
  if(metricsCollapseBtn){
    metricsCollapseBtn.addEventListener("click", () => {
      metricsBar.classList.toggle("collapsed");
      metricsCollapseBtn.textContent = metricsBar.classList.contains("collapsed") ? "展開する" : "折りたたむ";
    });
  }

  if(metricsResetBtn){
    metricsResetBtn.addEventListener("click", () => {
      zoneState.pool = [...DEFAULT_ZONES.pool];
      zoneState.center = [...DEFAULT_ZONES.center];
      zoneState.table = [...DEFAULT_ZONES.table];
      zoneState.hidden = [...DEFAULT_ZONES.hidden];
      renderMetricsZones();
      rerenderAllCards();
    });
  }

  if(clearCardsBtn){
    clearCardsBtn.addEventListener("click", () => {
      // remove all cards
      cardState.forEach((v, asin) => {
        if(v.chart) v.chart.destroy();
        v.el.remove();
      });
      cardState.clear();
      itemsContainer.innerHTML = "";
      emptyState.style.display = "block";
      updateHeaderStatus();
    });
  }

  if(clearCartBtn){
    clearCartBtn.addEventListener("click", () => {
      cart.clear();
      updateCartSummary();
    });
  }
}

// =========================
// Catalog (ASIN list)
// =========================
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

// =========================
// Metrics Bar (Drag & Drop)
// =========================
function initMetricsBar(){
  renderMetricsZones();
  attachZoneDnD(metricsPoolZone, "pool");
  attachZoneDnD(metricsCenterZone, "center");
  attachZoneDnD(metricsTableZone, "table");
  attachZoneDnD(metricsHiddenZone, "hidden");
}

function renderMetricsZones(){
  renderZone(metricsPoolZone, zoneState.pool);
  renderZone(metricsCenterZone, zoneState.center);
  renderZone(metricsTableZone, zoneState.table);
  renderZone(metricsHiddenZone, zoneState.hidden);

  // sort dropdown options refresh
  refreshSortRuleOptions();
}

function renderZone(zoneEl, list){
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
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
    });

    zoneEl.appendChild(pill);
  });
}

function attachZoneDnD(zoneEl, zoneKey){
  zoneEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });
  zoneEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const metricId = e.dataTransfer.getData("text/plain");
    if(!metricId) return;

    moveMetricToZone(metricId, zoneKey);
  });
}

function moveMetricToZone(metricId, toZone){
  // Remove from all zones
  for(const z of ["pool","center","table","hidden"]){
    const idx = zoneState[z].indexOf(metricId);
    if(idx >= 0) zoneState[z].splice(idx, 1);
  }
  // Add to destination at end
  zoneState[toZone].push(metricId);

  renderMetricsZones();
  rerenderAllCards();
}

// =========================
// Sort UI
// =========================
function initSortUI(){
  sortRules = [];
  renderSortControls();

  addSortRuleBtn?.addEventListener("click", () => {
    sortRules.push({ metricId: zoneState.center[0] || METRICS_ALL[0].id, order: "desc" });
    renderSortControls();
  });

  applySortBtn?.addEventListener("click", () => {
    applySort();
  });

  clearSortBtn?.addEventListener("click", () => {
    sortRules = [];
    renderSortControls();
    // restore insertion order? keep DOM order as-is
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
    selMetric.addEventListener("change", () => {
      r.metricId = selMetric.value;
    });

    const selOrder = document.createElement("select");
    selOrder.innerHTML = `
      <option value="desc" ${r.order==="desc"?"selected":""}>降順</option>
      <option value="asc" ${r.order==="asc"?"selected":""}>昇順</option>
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

function refreshSortRuleOptions(){
  // if rule metricId is no longer available in center, fallback
  sortRules.forEach(r => {
    if(!zoneState.center.includes(r.metricId)){
      r.metricId = zoneState.center[0] || METRICS_ALL[0].id;
    }
  });
  renderSortControls();
}

function applySort(){
  if(sortRules.length === 0) return;

  const entries = Array.from(cardState.entries()); // [asin, {el,data,chart}]
  const score = (data, metricId) => {
    const m = METRIC_BY_ID[metricId];
    if(!m) return -Infinity;
    const v = data[m.sourceKey];
    if(v == null) return -Infinity;

    // numeric parse (accept ￥, $, %, commas)
    const s = String(v).trim();
    const n = Number(s.replace(/[^\d.\-]/g, ""));
    if(Number.isFinite(n)) return n;
    return -Infinity;
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

  // reattach in new order
  entries.forEach(([asin, v]) => itemsContainer.appendChild(v.el));
}

// =========================
// Card rendering (center/table)
// =========================
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
  const theadRow = $("thead tr", tableEl);
  const tbodyRow = $("tbody tr", tableEl);

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

// ✅ DOMを拾い直して再描画（参照切れ防止）
function rerenderAllCards(){
  cardState.forEach((v) => {
    const center = v.el.querySelector(".js-center");
    const table = v.el.querySelector(".js-detailTable");
    if (center) buildCenterMetrics(center, v.data);
    if (table) buildDetailTable(table, v.data);
  });
}

// =========================
// Warning tags
// =========================
function renderWarningTags(str){
  const s = (str || "").toString();
  const parts = s.split(/[,\s、]+/).map(x => x.trim()).filter(Boolean);
  if(parts.length === 0) return "";

  return parts.map(p => {
    // quick styling by keywords
    let cls = "tag";
    if(p.includes("輸出不可") || p.includes("出荷禁止")) cls += " danger";
    else if(p.includes("知財")) cls += " info";
    else if(p.includes("大型")) cls += " warn";
    return `<span class="${cls}">${p}</span>`;
  }).join("");
}

// =========================
// Chart
// =========================
function renderChart(canvas, asin){
  const labels = Array.from({length: 180}, (_,i)=> `${180-i}日`);
  // dummy data
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
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: { position:"left", ticks:{}, grid:{} },
        y1: { position:"right", ticks:{}, grid:{ drawOnChartArea:false } },
        y2: { position:"right", ticks:{}, grid:{ drawOnChartArea:false } },
      }
    }
  });

  return chart;
}

function updateChartVisibility(chart, showDS, showSP){
  // showDS = needs & supply (ランキング + セラー数)
  // showSP = supply & price (セラー数 + 価格)
  chart.data.datasets.forEach(ds => {
    if(ds.label === "ランキング") ds.hidden = !showDS;
    if(ds.label === "セラー数") ds.hidden = !(showDS || showSP);
    if(ds.label === "価格(USD)") ds.hidden = !showSP;
  });
  chart.update();
}

// =========================
// Cart summary
// =========================
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

// =========================
// Create product card
// - alt-layout：画像(左上) / 商品情報(左下) / 主要項目(中) / グラフ(中央) / 購入(右)
//   グラフは上下2段（上: MES、下: Keepa）
// - 通常：現行レイアウトのまま（Keepaはタブ切替）
// =========================
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
      <div class="alt-image image-box">
        <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
      </div>

      <div class="alt-info info-box">
        <h3 class="info-title">${data["品名"] || "－"}</h3>

        <div class="info-grid">
          <div class="k">ブランド</div><div class="v">${data["ブランド"] || "－"}</div>
          <div class="k">評価</div><div class="v">${data["レビュー評価"] || "－"}</div>
          <div class="k">ASIN</div><div class="v">${asin}</div>
          <div class="k">各種ASIN</div><div class="v">日本: ${jpAsin} / US: ${usAsin}</div>
          <div class="k">JAN</div><div class="v">${data["JAN"] || "－"}</div>
          <div class="k">SKU</div><div class="v">${data["SKU"] || "－"}</div>
          <div class="k">サイズ</div><div class="v">${size}</div>
          <div class="k">重量（容積重量）</div><div class="v">${weight}</div>
          <div class="k">材質</div><div class="v">${data["材質"] || "－"}</div>
          <div class="k">カテゴリ</div><div class="v">${data["親カテゴリ"] || "－"} / ${data["サブカテゴリ"] || "－"}</div>
          <div class="k">注意事項</div>
          <div class="warning-row">${renderWarningTags(data["注意事項（警告系）"])}</div>
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
          <div class="canvas-wrap js-mesWrap">
            <canvas class="js-chart"></canvas>
          </div>

          <div class="keepa-wrap js-keepaWrap">
            <iframe class="js-keepaFrame" src="" loading="lazy"></iframe>
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
      <!-- LEFT -->
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

          <div class="info-grid">
            <div class="k">ブランド</div><div class="v">${data["ブランド"] || "－"}</div>
            <div class="k">評価</div><div class="v">${data["レビュー評価"] || "－"}</div>
            <div class="k">ASIN</div><div class="v">${asin}</div>
            <div class="k">各種ASIN</div><div class="v">日本: ${jpAsin} / US: ${usAsin}</div>
            <div class="k">JAN</div><div class="v">${data["JAN"] || "－"}</div>
            <div class="k">SKU</div><div class="v">${data["SKU"] || "－"}</div>
            <div class="k">サイズ</div><div class="v">${size}</div>
            <div class="k">重量（容積重量）</div><div class="v">${weight}</div>
            <div class="k">材質</div><div class="v">${data["材質"] || "－"}</div>
            <div class="k">カテゴリ</div><div class="v">${data["親カテゴリ"] || "－"} / ${data["サブカテゴリ"] || "－"}</div>
            <div class="k">注意事項</div>
            <div class="warning-row">${renderWarningTags(data["注意事項（警告系）"])}</div>
          </div>
        </div>
      </div>

      <!-- CENTER -->
      <div class="center-box">
        <div class="center-head">主要項目</div>
        <div class="center-list js-center"></div>
      </div>

      <!-- RIGHT -->
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
    // chart destroy
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

  const centerBox = card.querySelector(".js-center");
  buildCenterMetrics(centerBox, data);

  const tableEl = card.querySelector(".js-detailTable");
  buildDetailTable(tableEl, data);

  const canvas = card.querySelector(".js-chart");
  const chart = renderChart(canvas, asin);
  card.__chart = chart;

  const chkDS = card.querySelector(".js-chkDS");
  const chkSP = card.querySelector(".js-chkSP");
  const refreshVis = () => updateChartVisibility(chart, chkDS.checked, chkSP.checked);
  chkDS.addEventListener("change", refreshVis);
  chkSP.addEventListener("change", refreshVis);
  updateChartVisibility(chart, true, false);

  // keepa表示制御（通常レイアウトはタブ切替 / alt-layoutは上下2段で常時表示）
  const keepaWrap = card.querySelector(".js-keepaWrap");
  const keepaFrame = card.querySelector(".js-keepaFrame");
  const mesWrap = card.querySelector(".js-mesWrap");
  const graphOptions = card.querySelector(".js-graphOptions");

  if (keepaFrame) {
    keepaFrame.src = `https://keepa.com/#!product/1-${asin}`;
  }

  if (!isAltLayout) {
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
  } else {
    // alt-layout：グラフは上(需要供給)＋下(Keepa)の2部構成
    if (graphOptions) graphOptions.style.display = "flex";
    if (mesWrap) mesWrap.style.display = "block";
    if (keepaWrap) keepaWrap.style.display = "block";
  }

  return card;
}
