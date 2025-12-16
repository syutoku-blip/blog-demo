/* =========================================================
   MES-AI-A main.js - FINAL (UI fix + Tooltip fix + Alt layout)
========================================================= */

/* =========================
   DOM
========================= */
const headerStatus = document.getElementById("headerStatus");
const asinCatalog = document.getElementById("asinCatalog");
const emptyState = document.getElementById("emptyState");
const itemsContainer = document.getElementById("itemsContainer");

const metricsBarEl = document.getElementById("metricsBar");
const metricsCollapseBtn = document.getElementById("metricsCollapseBtn");

const metricsPoolZone = document.getElementById("metricsPoolZone");
const metricsCenterZone = document.getElementById("metricsCenterZone");
const metricsTableZone = document.getElementById("metricsTableZone");
const metricsHiddenZone = document.getElementById("metricsHiddenZone");

const metricsResetBtn = document.getElementById("metricsResetBtn");
const clearCardsBtn = document.getElementById("clearCardsBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const sortControls = document.getElementById("sortControls");
const addSortRuleBtn = document.getElementById("addSortRuleBtn");
const applySortBtn = document.getElementById("applySortBtn");
const clearSortBtn = document.getElementById("clearSortBtn");

/* cart summary */
const cartTotalCostEl = document.getElementById("cartTotalCost");
const cartTotalRevenueEl = document.getElementById("cartTotalRevenue");
const cartTotalProfitEl = document.getElementById("cartTotalProfit");
const cartAsinCountEl = document.getElementById("cartAsinCount");
const cartItemCountEl = document.getElementById("cartItemCount");

/* =========================
   Globals
========================= */
const FX_USDJPY = 150; // 固定（将来UI化OK）

// asin -> { el, data, chart, centerBox, tableEl, keepaFrame, mesWrap, keepaWrap, dsChk, spChk, btnMes, btnKeepa }
const cardState = new Map();

// asin -> { qty, sellUSD, costJPY }
const cart = new Map();

/* =========================
   Utils
========================= */
function yen(n){
  const v = Math.round(Number(n || 0));
  return "￥" + v.toLocaleString("ja-JP");
}
function num(n){
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
function fmtKg(v){
  const s = String(v ?? "").trim();
  if(!s) return "－";
  return s.toLowerCase().includes("kg") ? s : `${s}kg`;
}
function toSortableNumber(value){
  if (value == null) return NaN;
  const s = String(value).trim();
  if (!s) return NaN;
  const cleaned = s
    .replace(/[,￥円$％%]/g, "")
    .replace(/kg/gi, "")
    .replace(/[^\d.+-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}
function createPRNG(seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/* =========================
   Cart summary
========================= */
function updateCartSummary(){
  let totalCost = 0;
  let totalRevenue = 0;
  let asinCount = 0;
  let itemCount = 0;

  cart.forEach((v) => {
    asinCount += 1;
    itemCount += v.qty;
    totalCost += v.qty * v.costJPY;
    totalRevenue += v.qty * v.sellUSD * FX_USDJPY;
  });

  const profit = totalRevenue - totalCost;

  cartTotalCostEl.textContent = yen(totalCost);
  cartTotalRevenueEl.textContent = yen(totalRevenue);
  cartTotalProfitEl.textContent = yen(profit);
  cartAsinCountEl.textContent = `${asinCount}`;
  cartItemCountEl.textContent = `${itemCount}`;
}

/* =========================
   Warning tags
========================= */
function renderWarningTags(rawText) {
  const text = (rawText || "").trim();
  if (!text) return `<span class="v">－</span>`;

  const items = text.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);

  const mapClass = (t) => {
    if (t === "輸出不可") return "w-export";
    if (t === "知財") return "w-ip";
    if (t === "大型") return "w-large";
    if (t === "出荷禁止") return "w-shipban";
    if (t === "承認要") return "w-needok";
    if (t === "バリエーション") return "w-variation";
    return "w-large";
  };

  return items.map(t => `<span class="warning-tag ${mapClass(t)}">${t}</span>`).join("");
}

/* =========================
   Chart data & rendering
========================= */
function getDemandSupplySeries(asin) {
  const rand = createPRNG(asin);
  const days = 180;
  const labels = [];
  const ranking = [];
  const sellers = [];
  const price = [];

  let rank = 60000 * (0.6 + rand() * 0.4);
  let seller = 5 + Math.round(rand() * 5);
  let p = 25 + rand() * 30;

  for (let i = 0; i < days; i++) {
    labels.push(`${days - i}日`);

    rank += (rand() - 0.5) * 4000;
    rank = Math.max(5000, Math.min(80000, rank));

    seller += (rand() - 0.5) * 2;
    seller = Math.max(1, Math.min(25, seller));

    p += (rand() - 0.5) * 2;
    p = Math.max(10, Math.min(80, p));

    ranking.push(Math.round(rank));
    sellers.push(Number(seller.toFixed(1)));
    price.push(Number(p.toFixed(2)));
  }

  return { labels, ranking, sellers, price };
}

function renderChart(canvasEl, asin) {
  const series = getDemandSupplySeries(asin);
  const ctx = canvasEl.getContext("2d");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: series.labels,
      datasets: [
        { label: "ランキング", data: series.ranking, borderWidth: 4, pointRadius: 0, tension: 0.25, borderColor: "#60a5fa", yAxisID: "yRank" },
        { label: "セラー数", data: series.sellers, borderWidth: 4, pointRadius: 0, tension: 0.25, borderColor: "#22c55e", yAxisID: "ySeller" },
        { label: "価格(USD)", data: series.price, borderWidth: 4, pointRadius: 0, tension: 0.25, borderColor: "#f97316", yAxisID: "yPrice" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "top", labels: { font: { size: 10 }, boxWidth: 16, boxHeight: 8, padding: 8 } },
        tooltip: {
          titleFont: { size: 11 },
          bodyFont: { size: 11 },
          callbacks: {
            label: (ctx) => ctx.dataset.yAxisID === "yPrice"
              ? `${ctx.dataset.label}: $${Number(ctx.parsed.y).toFixed(2)}`
              : `${ctx.dataset.label}: ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: { ticks: { font: { size: 10 }, maxTicksLimit: 10 }, grid: { display: false } },
        yRank: { reverse: true, ticks: { font: { size: 10 } }, grid: { color: "rgba(0,0,0,0.05)" } },
        ySeller: { position: "right", ticks: { font: { size: 10 } }, grid: { drawOnChartArea: false } },
        yPrice: { position: "right", offset: true, ticks: { font: { size: 10 } }, grid: { drawOnChartArea: false } }
      }
    }
  });
}

function updateChartVisibility(chart, demandSupplyOn, supplyPriceOn) {
  if(!demandSupplyOn && !supplyPriceOn) demandSupplyOn = true;

  const showRank = demandSupplyOn;
  const showSeller = demandSupplyOn || supplyPriceOn;
  const showPrice = supplyPriceOn;

  chart.data.datasets[0].hidden = !showRank;
  chart.data.datasets[1].hidden = !showSeller;
  chart.data.datasets[2].hidden = !showPrice;
  chart.update();
}

/* =========================
   Metrics pool (DnD)
========================= */
const METRICS_STORAGE_KEY = "MES_AI_METRICS_ZONES_V1";
const SORT_STORAGE_KEY = "MES_AI_SORT_RULES_V1";
const METRICS_COLLAPSE_KEY = "MES_AI_METRICS_COLLAPSED_V1";

let METRICS_COLLAPSED = localStorage.getItem(METRICS_COLLAPSE_KEY) === "1";

const METRICS_ALL = [
  { id: "FBA最安値", label: "FBA最安値", sourceKey: "FBA最安値" },
  { id: "過去3月FBA最安値", label: "過去3ヶ月FBA最安値", sourceKey: "過去3月FBA最安値" },
  { id: "粗利益率予測", label: "粗利益率予測", sourceKey: "粗利益率予測" },
  { id: "入金額予測", label: "入金額予測", sourceKey: "入金額予測" },
  { id: "粗利益予測", label: "粗利益予測（1個）", sourceKey: "粗利益予測" },
  { id: "粗利益", label: "粗利益", sourceKey: "粗利益" },
  { id: "粗利益率", label: "粗利益率", sourceKey: "粗利益率" },

  { id: "予測30日販売数", label: "予測30日販売数", sourceKey: "予測30日販売数" },
  { id: "複数在庫指数45日分", label: "複数在庫指数45日分", sourceKey: "複数在庫指数45日分" },
  { id: "複数在庫指数60日分", label: "複数在庫指数60日分", sourceKey: "複数在庫指数60日分" },
  { id: "ライバル偏差1", label: "ライバル偏差1", sourceKey: "ライバル偏差1" },
  { id: "ライバル偏差2", label: "ライバル偏差2", sourceKey: "ライバル偏差2" },
  { id: "ライバル増加率", label: "ライバル増加率", sourceKey: "ライバル増加率" },

  { id: "日本最安値", label: "日本最安値", sourceKey: "日本最安値" },

  { id: "30日販売数", label: "30日販売数（実績）", sourceKey: "30日販売数" },
  { id: "90日販売数", label: "90日販売数（実績）", sourceKey: "90日販売数" },
  { id: "180日販売数", label: "180日販売数（実績）", sourceKey: "180日販売数" },

  { id: "在庫数", label: "在庫数", sourceKey: "在庫数" },
  { id: "返品率", label: "返品率", sourceKey: "返品率" },
  { id: "販売額（ドル）", label: "販売額（USD）", sourceKey: "販売額（ドル）" },
  { id: "入金額（円）", label: "入金額（円）", sourceKey: "入金額（円）" },
  { id: "入金額計（円）", label: "入金額計（円）", sourceKey: "入金額計（円）" },

  { id: "仕入れ目安単価", label: "仕入れ目安単価", sourceKey: "仕入れ目安単価" },
  { id: "想定送料", label: "想定送料", sourceKey: "想定送料" },
  { id: "送料", label: "送料", sourceKey: "送料" },
  { id: "関税", label: "関税", sourceKey: "関税" }
];

const DEFAULT_ZONES = {
  pool: [
    "日本最安値","90日販売数","180日販売数",
    "入金額計（円）","仕入れ目安単価","想定送料","送料","関税"
  ],
  center: ["FBA最安値","過去3月FBA最安値","粗利益率予測","入金額予測","粗利益予測","予測30日販売数"],
  table: ["30日販売数","在庫数","返品率","販売額（ドル）","入金額（円）"],
  hidden: []
};

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function metricById(id){ return METRICS_ALL.find(m => m.id === id); }

function sanitizeZones(zones){
  const allIds = METRICS_ALL.map(m => m.id);
  const z = { pool:[], center:[], table:[], hidden:[] };

  ["pool","center","table","hidden"].forEach(k => {
    z[k] = Array.isArray(zones?.[k]) ? zones[k].filter(id => allIds.includes(id)) : [];
  });

  const total = z.pool.length + z.center.length + z.table.length + z.hidden.length;
  if (total === 0) return clone(DEFAULT_ZONES);

  const used = new Set([...z.pool, ...z.center, ...z.table, ...z.hidden]);
  allIds.forEach(id => { if (!used.has(id)) z.pool.push(id); });

  const seen = new Set();
  ["pool","center","table","hidden"].forEach(k => {
    z[k] = z[k].filter(id => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  });

  return z;
}

let ZONES = (() => {
  try{
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    if(!raw) return clone(DEFAULT_ZONES);
    return sanitizeZones(JSON.parse(raw));
  }catch{
    return clone(DEFAULT_ZONES);
  }
})();

function saveZones(){
  localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(ZONES));
}
function removeFromAllZones(id){
  ["pool","center","table","hidden"].forEach(z => {
    ZONES[z] = ZONES[z].filter(x => x !== id);
  });
}

function getBeforeIdInZone(containerEl, clientX, clientY){
  const pills = [...containerEl.querySelectorAll(".metric-pill")];
  if(!pills.length) return null;

  let best = null;
  let bestDist = Infinity;

  for(const p of pills){
    const r = p.getBoundingClientRect();
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    const d = Math.hypot(clientX - cx, clientY - cy);
    if(d < bestDist){
      bestDist = d;
      best = p;
    }
  }
  if(!best) return null;

  const r = best.getBoundingClientRect();
  const dropOnLeft = clientX < (r.left + r.right) / 2;
  if(dropOnLeft) return best.dataset.metricId;

  const idx = pills.indexOf(best);
  if(idx >= 0 && idx + 1 < pills.length){
    return pills[idx + 1].dataset.metricId;
  }
  return null;
}

function moveMetric(id, toZone, beforeId){
  removeFromAllZones(id);

  const list = ZONES[toZone];
  if(!beforeId) list.push(id);
  else{
    const idx = list.indexOf(beforeId);
    if(idx === -1) list.push(id);
    else list.splice(idx, 0, id);
  }

  saveZones();
  renderAllZones();
  rerenderAllCards();
  renderSortUI();
}

function renderZone(el, zoneName){
  el.innerHTML = "";
  ZONES[zoneName].forEach(id => {
    const m = metricById(id);
    if(!m) return;

    const pill = document.createElement("div");
    pill.className = "metric-pill";
    pill.textContent = m.label;
    pill.draggable = true;
    pill.dataset.metricId = id;

    pill.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
    });

    el.appendChild(pill);
  });
}

function attachZoneDrop(zoneListEl, zoneName){
  const zoneBox = zoneListEl.parentElement;

  zoneBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  zoneBox.addEventListener("drop", (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if(!draggedId) return;

    const beforeId = getBeforeIdInZone(zoneListEl, e.clientX, e.clientY);
    moveMetric(draggedId, zoneName, beforeId);
  });
}

function renderAllZones(){
  ZONES = sanitizeZones(ZONES);
  renderZone(metricsPoolZone, "pool");
  renderZone(metricsCenterZone, "center");
  renderZone(metricsTableZone, "table");
  renderZone(metricsHiddenZone, "hidden");
}

/* =========================
   Sort
========================= */
let sortRules = [];

function saveSortRules(){
  localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortRules));
}
function loadSortRules(){
  try{
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    sortRules = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(sortRules)) sortRules = [];
  }catch{
    sortRules = [];
  }
}
function getCenterMetricOptions(){
  return ZONES.center
    .map(id => metricById(id))
    .filter(Boolean)
    .map(m => ({ id: m.id, label: m.label, sourceKey: m.sourceKey }));
}

function renderSortUI(){
  const options = getCenterMetricOptions();
  sortControls.innerHTML = "";

  if (!options.length){
    const div = document.createElement("div");
    div.style.fontSize = "12px";
    div.style.color = "#6b7280";
    div.style.fontWeight = "900";
    div.textContent = "真ん中枠に指標がありません。プールから真ん中枠へドラッグするとソートできます。";
    sortControls.appendChild(div);
    return;
  }

  if (!sortRules.length){
    sortRules = [{ metricId: options[0].id, dir: "desc" }];
    saveSortRules();
  }

  sortRules.forEach((rule, idx) => {
    const row = document.createElement("div");
    row.className = "sort-row";

    const sel = document.createElement("select");
    options.forEach(o => {
      const op = document.createElement("option");
      op.value = o.id;
      op.textContent = o.label;
      sel.appendChild(op);
    });
    sel.value = rule.metricId;

    const dir = document.createElement("select");
    dir.innerHTML = `
      <option value="desc">高い順</option>
      <option value="asc">低い順</option>
    `;
    dir.value = rule.dir;

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "削除";
    del.addEventListener("click", () => {
      sortRules.splice(idx, 1);
      saveSortRules();
      renderSortUI();
    });

    sel.addEventListener("change", () => {
      rule.metricId = sel.value;
      saveSortRules();
    });
    dir.addEventListener("change", () => {
      rule.dir = dir.value;
      saveSortRules();
    });

    row.appendChild(sel);
    row.appendChild(dir);
    row.appendChild(del);
    sortControls.appendChild(row);
  });
}

function applyCardSort(){
  if (cardState.size <= 1) return;

  const opts = getCenterMetricOptions();
  const optById = new Map(opts.map(o => [o.id, o]));

  const rules = sortRules
    .map(r => ({ ...r, opt: optById.get(r.metricId) }))
    .filter(r => r.opt);

  if (!rules.length) return;

  const cards = [...cardState.values()];

  cards.sort((A, B) => {
    for (const r of rules){
      const aRaw = A.data?.[r.opt.sourceKey];
      const bRaw = B.data?.[r.opt.sourceKey];

      const a = toSortableNumber(aRaw);
      const b = toSortableNumber(bRaw);

      const aNan = Number.isNaN(a);
      const bNan = Number.isNaN(b);
      if (aNan && bNan) continue;
      if (aNan) return 1;
      if (bNan) return -1;

      if (a === b) continue;
      const diff = (a - b);
      return r.dir === "asc" ? diff : -diff;
    }
    return 0;
  });

  itemsContainer.innerHTML = "";
  cards.forEach(c => itemsContainer.appendChild(c.el));
}

/* =========================
   Center metrics + table builders
========================= */
function buildCenterMetrics(container, data){
  container.innerHTML = "";
  ZONES.center.forEach(metricId => {
    const m = metricById(metricId);
    if(!m) return;

    let raw = (data[m.sourceKey] == null || data[m.sourceKey] === "") ? "－" : data[m.sourceKey];
    let valueHtml = "";

    if(metricId === "日本最安値" && raw !== "－"){
      const a = data["日本最安値_Amazon"] ?? "－";
      const y = data["日本最安値_yahoo"] ?? "－";
      const r = data["日本最安値_楽天"] ?? "－";
      valueHtml = `<span class="has-tip" data-tip="Amazon　${a}\nyahoo　　${y}\n楽天　　　${r}">${raw}</span>`;
    }else{
      valueHtml = String(raw);
    }

    const row = document.createElement("div");
    row.className = "metric-row";
    row.innerHTML = `<div class="label">${m.label}</div><div class="value">${valueHtml}</div>`;
    container.appendChild(row);
  });
}

function buildTableColumnsFromZones(){
  return ZONES.table
    .map(metricId => metricById(metricId))
    .filter(Boolean)
    .map(m => ({ key: m.sourceKey, label: m.label, metricId: m.id }));
}

function buildDetailTable(tableEl, data){
  const cols = buildTableColumnsFromZones();
  const thead = tableEl.querySelector("thead tr");
  const tbody = tableEl.querySelector("tbody tr");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  cols.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col.label;
    thead.appendChild(th);
  });

  cols.forEach(col => {
    const td = document.createElement("td");
    const raw = (data[col.key] == null || data[col.key] === "") ? "－" : data[col.key];

    if(col.metricId === "日本最安値" && raw !== "－"){
      const a = data["日本最安値_Amazon"] ?? "－";
      const y = data["日本最安値_yahoo"] ?? "－";
      const r = data["日本最安値_楽天"] ?? "－";
      td.innerHTML = `<span class="has-tip" data-tip="Amazon　${a}\nyahoo　　${y}\n楽天　　　${r}">${raw}</span>`;
    }else{
      td.textContent = raw;
    }
    tbody.appendChild(td);
  });
}

function rerenderAllCards(){
  cardState.forEach((v) => {
    buildCenterMetrics(v.centerBox, v.data);
    buildDetailTable(v.tableEl, v.data);
  });
}

/* =========================
   Card creation
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

  /* remove */
  card.querySelector(".remove").addEventListener("click", () => {
    const st = cardState.get(asin);
    if (st?.chart) {
      try { st.chart.destroy(); } catch {}
    }
    card.remove();
    cardState.delete(asin);

    // カートからも抜く（表示削除＝仕入れ候補から外す）
    if(cart.has(asin)){
      cart.delete(asin);
      updateCartSummary();
    }

    if(cardState.size === 0){
      emptyState.style.display = "block";
    }
  });

  /* center metrics + table */
  const centerEl = card.querySelector(".js-center");
  const tableEl = card.querySelector(".js-detailTable");
  buildCenterMetrics(centerEl, data);
  buildDetailTable(tableEl, data);

  /* chart */
  const canvas = card.querySelector(".js-chart");
  const chart = renderChart(canvas, asin);

  const dsChk = card.querySelector(".js-chkDS");
  const spChk = card.querySelector(".js-chkSP");

  const onToggle = () => updateChartVisibility(chart, dsChk.checked, spChk.checked);
  dsChk.addEventListener("change", onToggle);
  spChk.addEventListener("change", onToggle);

  /* keepa / mes switch */
  const btnMes = card.querySelector(".js-btnMes");
  const btnKeepa = card.querySelector(".js-btnKeepa");
  const mesWrap = card.querySelector(".js-mesWrap");
  const keepaWrap = card.querySelector(".js-keepaWrap");
  const keepaFrame = card.querySelector(".js-keepaFrame");

  function setTab(mode){
    if(mode === "mes"){
      btnMes.classList.add("active");
      btnKeepa.classList.remove("active");
      mesWrap.style.display = "block";
      keepaWrap.style.display = "none";
      // グラフが再計算されるように
      try { chart.resize(); } catch {}
    }else{
      btnKeepa.classList.add("active");
      btnMes.classList.remove("active");
      mesWrap.style.display = "none";
      keepaWrap.style.display = "block";
      // keepa link
      const link = data["Keepaリンク"] || "";
      // そのまま iframe に突っ込むと CSP で弾かれることがあるので、リンク形式に寄せる
      // ただしユーザー環境で表示できる場合もあるので試す
      keepaFrame.src = link ? link : "about:blank";
    }
  }
  btnMes.addEventListener("click", () => setTab("mes"));
  btnKeepa.addEventListener("click", () => setTab("keepa"));

  /* cart area per card */
  const qtySel = card.querySelector(".js-qty");
  const sellInp = card.querySelector(".js-sell");
  const costInp = card.querySelector(".js-cost");
  const addBtn = card.querySelector(".js-addCart");

  // 初期値（データがあれば）
  // sell: カートボックス価格 or 販売額（ドル）
  const sellRaw = data["カートボックス価格"] || data["販売額（ドル）"] || "";
  const sellNum = toSortableNumber(sellRaw);
  if(Number.isFinite(sellNum) && sellNum > 0) sellInp.value = String(sellNum);

  // cost: 仕入れ目安単価
  const costRaw = data["仕入れ目安単価"] || "";
  const costNum = toSortableNumber(costRaw);
  if(Number.isFinite(costNum) && costNum > 0) costInp.value = String(Math.round(costNum));

  addBtn.addEventListener("click", () => {
    const qty = parseInt(qtySel.value, 10) || 1;
    const sellUSD = num(sellInp.value);
    const costJPY = num(costInp.value);

    cart.set(asin, { qty, sellUSD, costJPY });
    updateCartSummary();

    headerStatus.textContent = `カートに追加: ${asin}`;
    setTimeout(() => {
      if(headerStatus.textContent.startsWith("カートに追加")) headerStatus.textContent = "";
    }, 1200);
  });

  /* store card state */
  cardState.set(asin, {
    el: card,
    data,
    chart,
    centerBox: centerEl,
    tableEl: tableEl,
    keepaFrame,
    mesWrap,
    keepaWrap,
    dsChk,
    spChk,
    btnMes,
    btnKeepa,
  });

  return card;
}

/* =========================
   Tooltip (日本最安値)
========================= */
let tipEl = null;
function ensureTip(){
  if(tipEl) return tipEl;
  tipEl = document.createElement("div");
  tipEl.style.position = "fixed";
  tipEl.style.zIndex = "99999";
  tipEl.style.pointerEvents = "none";
  tipEl.style.background = "rgba(15,23,42,.92)";
  tipEl.style.color = "#fff";
  tipEl.style.padding = "10px 12px";
  tipEl.style.borderRadius = "12px";
  tipEl.style.fontSize = "12px";
  tipEl.style.fontWeight = "900";
  tipEl.style.whiteSpace = "pre";
  tipEl.style.maxWidth = "320px";
  tipEl.style.boxShadow = "0 10px 24px rgba(0,0,0,.18)";
  tipEl.style.display = "none";
  document.body.appendChild(tipEl);
  return tipEl;
}

function showTip(text, x, y){
  const el = ensureTip();
  el.textContent = text;
  el.style.left = `${Math.min(window.innerWidth - 10, x + 12)}px`;
  el.style.top  = `${Math.min(window.innerHeight - 10, y + 12)}px`;
  el.style.display = "block";
}
function hideTip(){
  if(!tipEl) return;
  tipEl.style.display = "none";
}

document.addEventListener("mousemove", (e) => {
  const t = e.target;
  if(!(t instanceof HTMLElement)) return;

  const tip = t.closest?.(".has-tip");
  if(!tip){
    hideTip();
    return;
  }

  const text = tip.dataset.tip || "";
  if(!text){
    hideTip();
    return;
  }
  showTip(text, e.clientX, e.clientY);
});

document.addEventListener("mouseleave", hideTip);

/* =========================
   Catalog
========================= */
function renderAsinCatalog(){
  asinCatalog.innerHTML = "";

  const keys = Object.keys(window.ASIN_DATA || {});
  keys.sort();

  keys.forEach(asin => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "asin-pill";
    btn.textContent = asin;

    btn.addEventListener("click", () => addCard(asin));

    asinCatalog.appendChild(btn);
  });

  headerStatus.textContent = `ASINデータ件数: ${keys.length}`;
}

/* =========================
   Add card
========================= */
function addCard(asin){
  if(cardState.has(asin)){
    // 既にあるなら先頭へ（視認性）
    const st = cardState.get(asin);
    if(st?.el){
      itemsContainer.prepend(st.el);
    }
    emptyState.style.display = cardState.size ? "none" : "block";
    return;
  }

  const data = window.ASIN_DATA?.[asin];
  if(!data){
    headerStatus.textContent = `ASINが見つかりません: ${asin}`;
    return;
  }

  const card = createProductCard(asin, data);
  itemsContainer.prepend(card);
  emptyState.style.display = "none";

  // 追加時にソートルールがあるなら再適用
  applyCardSort();
}

/* =========================
   Control buttons
========================= */
function setCollapsedState(next){
  METRICS_COLLAPSED = !!next;
  localStorage.setItem(METRICS_COLLAPSE_KEY, METRICS_COLLAPSED ? "1" : "0");
  metricsBarEl.classList.toggle("collapsed", METRICS_COLLAPSED);
  metricsCollapseBtn.textContent = METRICS_COLLAPSED ? "開く" : "折りたたむ";
}

function resetMetrics(){
  ZONES = clone(DEFAULT_ZONES);
  saveZones();
  renderAllZones();
  rerenderAllCards();
  renderSortUI();
}

function clearCards(){
  // destroy charts
  cardState.forEach((st) => {
    if(st?.chart){
      try { st.chart.destroy(); } catch {}
    }
  });
  cardState.clear();
  itemsContainer.innerHTML = "";
  emptyState.style.display = "block";
  headerStatus.textContent = "表示カードをクリアしました";
}

function clearCart(){
  cart.clear();
  updateCartSummary();
  headerStatus.textContent = "カートを空にしました";
}

/* =========================
   Sort controls handlers
========================= */
addSortRuleBtn?.addEventListener("click", () => {
  const options = getCenterMetricOptions();
  if(!options.length) return;
  sortRules.push({ metricId: options[0].id, dir: "desc" });
  saveSortRules();
  renderSortUI();
});

applySortBtn?.addEventListener("click", () => {
  applyCardSort();
  headerStatus.textContent = "ソートを適用しました";
  setTimeout(() => { if(headerStatus.textContent === "ソートを適用しました") headerStatus.textContent = ""; }, 1200);
});

clearSortBtn?.addEventListener("click", () => {
  sortRules = [];
  saveSortRules();
  renderSortUI();
  headerStatus.textContent = "ソートを解除しました";
  setTimeout(() => { if(headerStatus.textContent === "ソートを解除しました") headerStatus.textContent = ""; }, 1200);
});

/* =========================
   Boot
========================= */
function bootApp(){
  // metrics collapse
  setCollapsedState(METRICS_COLLAPSED);
  metricsCollapseBtn?.addEventListener("click", () => {
    setCollapsedState(!METRICS_COLLAPSED);
  });

  // render zones and attach drop
  renderAllZones();
  attachZoneDrop(metricsPoolZone, "pool");
  attachZoneDrop(metricsCenterZone, "center");
  attachZoneDrop(metricsTableZone, "table");
  attachZoneDrop(metricsHiddenZone, "hidden");

  // buttons
  metricsResetBtn?.addEventListener("click", resetMetrics);
  clearCardsBtn?.addEventListener("click", clearCards);
  clearCartBtn?.addEventListener("click", clearCart);

  // sort
  loadSortRules();
  renderSortUI();

  // catalog
  renderAsinCatalog();

  // initial cart summary
  updateCartSummary();

  // empty state
  emptyState.style.display = "block";
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootApp);
} else {
  bootApp();
}
