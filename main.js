/**************************************************************
 * main.js
 * - MES-AI-A 詳細ビュー
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
  return x.toFixed(2) + " kg";
};

/* =========================
   DOM refs
========================= */
const metricsPoolZone = $("#metricsPoolZone");
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

/* graph toggles */
const graphToggleKeepa = $("#graphToggleKeepa");
const graphToggleMes = $("#graphToggleMes");

/* =========================
   State
========================= */
const STORAGE_KEY = "MES_METRICS_LAYOUT_V2";
const STORAGE_SORT_KEY = "MES_SORT_RULES_V1";

const cardState = new Map(); // asin -> {el, data, chart}
const cart = new Map(); // asin -> {qty, price, cost}

const METRICS = [
  // center
  { key: "価格", label: "価格（$）", type: "center", valueKey: "販売額（ドル）" },
  { key: "ランキング", label: "ランキング", type: "center", valueKey: "ランキング" },
  { key: "セラー数", label: "セラー数", type: "center", valueKey: "セラー数" },
  { key: "レビュー", label: "レビュー", type: "center", valueKey: "レビュー評価" },

  // info
  { key: "品名", label: "品名", type: "info", valueKey: "品名" },
  { key: "ブランド", label: "ブランド", type: "info", valueKey: "ブランド" },
  { key: "親カテゴリ", label: "親カテゴリ", type: "info", valueKey: "親カテゴリ" },
  { key: "サブカテゴリ", label: "サブカテゴリ", type: "info", valueKey: "サブカテゴリ" },
  { key: "注意事項", label: "注意事項", type: "info", valueKey: "注意事項（警告系）" },

  // table
  { key: "ASIN", label: "ASIN", type: "table", valueKey: "ASIN" },
  { key: "商品画像", label: "商品画像", type: "table", valueKey: "商品画像" },
  { key: "品名2", label: "品名", type: "table", valueKey: "品名" },
  { key: "親カテゴリ2", label: "親カテゴリ", type: "table", valueKey: "親カテゴリ" },
  { key: "サブカテゴリ2", label: "サブカテゴリ", type: "table", valueKey: "サブカテゴリ" },
  { key: "ブランド2", label: "ブランド", type: "table", valueKey: "ブランド" },
  { key: "レビュー評価2", label: "レビュー評価", type: "table", valueKey: "レビュー評価" },
  { key: "注意事項2", label: "注意事項", type: "table", valueKey: "注意事項（警告系）" },
];

const DEFAULT_LAYOUT = {
  pool: [
    "価格",
    "ランキング",
    "セラー数",
    "レビュー",
    "品名",
    "ブランド",
    "親カテゴリ",
    "サブカテゴリ",
    "注意事項",
  ],
  info: [],
  center: [],
  table: [],
  hidden: [],
};

let layoutState = loadLayoutState();
let sortRules = loadSortRules();

/* =========================
   init
========================= */
initMetricsBar();
initCatalog();
renderSortControls();
updateHeaderStatus();
updateCartSummary();

/* =========================
   Catalog
========================= */
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

/* =========================
   Header status
========================= */
function updateHeaderStatus() {
  const count = cardState.size;
  const cartCount = cart.size;
  let items = 0;
  cart.forEach((v) => (items += v.qty || 0));
  headerStatus.textContent = `表示中: ${count}件 / カート: ${cartCount}件（合計数量 ${items}）`;
}

/* =========================
   Metrics bar
========================= */
function initMetricsBar() {
  metricsCollapseBtn.addEventListener("click", () => {
    document.body.classList.toggle("metrics-collapsed");
    metricsCollapseBtn.textContent = document.body.classList.contains("metrics-collapsed")
      ? "展開する"
      : "折りたたむ";
  });

  resetBtn.addEventListener("click", () => {
    layoutState = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    saveLayoutState(layoutState);
    renderMetricsBar();
    rerenderAllCards();
  });

  clearCardsBtn.addEventListener("click", () => {
    for (const [asin, st] of cardState.entries()) {
      if (st.chart) st.chart.destroy();
      st.el.remove();
    }
    cardState.clear();
    emptyState.style.display = "block";
    updateHeaderStatus();
  });

  clearCartBtn.addEventListener("click", () => {
    cart.clear();
    updateCartSummary();
    updateHeaderStatus();
  });

  renderMetricsBar();
}

function renderMetricsBar() {
  metricsPoolZone.innerHTML = "";
  zoneInfo.innerHTML = "";
  zoneCenter.innerHTML = "";
  zoneTable.innerHTML = "";
  zoneHidden.innerHTML = "";

  // ensure missing go to pool
  const all = new Set(Object.values(layoutState).flat());
  METRICS.forEach((m) => {
    if (!all.has(m.key)) layoutState.pool.push(m.key);
  });

  const zoneMap = {
    pool: metricsPoolZone,
    info: zoneInfo,
    center: zoneCenter,
    table: zoneTable,
    hidden: zoneHidden,
  };

  ["pool", "info", "center", "table", "hidden"].forEach((zone) => {
    layoutState[zone].forEach((key) => {
      const m = METRICS.find((x) => x.key === key);
      if (!m) return;

      const node = document.createElement("div");
      node.className = "metric-pill";
      node.draggable = true;
      node.dataset.metricKey = m.key;
      node.textContent = m.label;

      node.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", m.key);
        node.classList.add("dragging");
      });
      node.addEventListener("dragend", () => node.classList.remove("dragging"));

      zoneMap[zone].appendChild(node);
    });
  });

  // drops
  Object.entries(zoneMap).forEach(([zoneName, zoneEl]) => {
    zoneEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      zoneEl.classList.add("dragover");
    });
    zoneEl.addEventListener("dragleave", () => zoneEl.classList.remove("dragover"));
    zoneEl.addEventListener("drop", (e) => {
      e.preventDefault();
      zoneEl.classList.remove("dragover");

      const key = e.dataTransfer.getData("text/plain");
      moveMetricToZone(key, zoneName);
    });
  });
}

function moveMetricToZone(metricKey, zoneName) {
  Object.keys(layoutState).forEach((z) => {
    layoutState[z] = layoutState[z].filter((k) => k !== metricKey);
  });
  layoutState[zoneName].push(metricKey);
  saveLayoutState(layoutState);
  renderMetricsBar();
  rerenderAllCards();
}

function rerenderAllCards() {
  for (const [asin, st] of cardState.entries()) {
    // remove old
    if (st.chart) st.chart.destroy();
    st.el.remove();

    // new
    const card = createProductCard(asin, st.data);
    itemsContainer.appendChild(card);
    cardState.set(asin, { el: card, data: st.data, chart: card.__chart || null });
  }
  updateHeaderStatus();
}

/* =========================
   Sort
========================= */
function loadSortRules() {
  try {
    const raw = localStorage.getItem(STORAGE_SORT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => x && typeof x.metricKey === "string" && (x.dir === "asc" || x.dir === "desc"));
  } catch (e) {
    return [];
  }
}

function saveSortRules(rules) {
  try {
    localStorage.setItem(STORAGE_SORT_KEY, JSON.stringify(rules || []));
  } catch (e) {}
}

addSortRuleBtn.addEventListener("click", () => {
  sortRules.push({ metricKey: "ランキング", dir: "asc" });
  saveSortRules(sortRules);
  renderSortControls();
});

applySortBtn.addEventListener("click", () => {
  applySortToCards();
});

clearSortBtn.addEventListener("click", () => {
  sortRules = [];
  saveSortRules(sortRules);
  renderSortControls();
});

function renderSortControls() {
  sortControls.innerHTML = "";
  if (sortRules.length === 0) {
    const p = document.createElement("div");
    p.className = "sort-empty";
    p.textContent = "未設定（条件を追加してソートできます）";
    sortControls.appendChild(p);
    return;
  }

  sortRules.forEach((rule, idx) => {
    const row = document.createElement("div");
    row.className = "sort-row";

    const select = document.createElement("select");
    METRICS.filter((m) => m.type === "center").forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.key;
      opt.textContent = m.label;
      if (m.key === rule.metricKey) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => {
      sortRules[idx].metricKey = select.value;
      saveSortRules(sortRules);
    });

    const dir = document.createElement("select");
    [
      { v: "asc", t: "昇順" },
      { v: "desc", t: "降順" },
    ].forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.v;
      opt.textContent = d.t;
      if (d.v === rule.dir) opt.selected = true;
      dir.appendChild(opt);
    });
    dir.addEventListener("change", () => {
      sortRules[idx].dir = dir.value;
      saveSortRules(sortRules);
    });

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "削除";
    del.addEventListener("click", () => {
      sortRules.splice(idx, 1);
      saveSortRules(sortRules);
      renderSortControls();
    });

    row.appendChild(select);
    row.appendChild(dir);
    row.appendChild(del);
    sortControls.appendChild(row);
  });
}

function applySortToCards() {
  if (sortRules.length === 0) return;

  const arr = Array.from(cardState.entries()).map(([asin, st]) => ({ asin, data: st.data, el: st.el, chart: st.chart }));

  arr.sort((a, b) => {
    for (const rule of sortRules) {
      const m = METRICS.find((x) => x.key === rule.metricKey);
      if (!m) continue;

      const va = normalizeSortValue(a.data[m.valueKey]);
      const vb = normalizeSortValue(b.data[m.valueKey]);

      if (va < vb) return rule.dir === "asc" ? -1 : 1;
      if (va > vb) return rule.dir === "asc" ? 1 : -1;
    }
    return 0;
  });

  itemsContainer.innerHTML = "";
  arr.forEach(({ asin, data }) => {
    const st = cardState.get(asin);
    if (!st) return;
    if (st.chart) st.chart.destroy();
    const card = createProductCard(asin, data);
    itemsContainer.appendChild(card);
    cardState.set(asin, { el: card, data, chart: card.__chart || null });
  });
  updateHeaderStatus();
}

function normalizeSortValue(v) {
  if (v == null) return Infinity;
  const s = String(v);
  const n = parseFloat(s.replace(/[^\d.\-]/g, ""));
  if (!Number.isNaN(n)) return n;
  return s;
}

/* =========================
   Storage: layout
========================= */
function loadLayoutState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    ["pool", "info", "center", "table", "hidden"].forEach((k) => {
      if (!Array.isArray(obj[k])) obj[k] = [];
    });
    return obj;
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
  }
}

function saveLayoutState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

/* =========================
   Cart summary
========================= */
function updateCartSummary() {
  let totalCost = 0;
  let totalRevenue = 0;
  let asinCount = cart.size;
  let itemCount = 0;

  cart.forEach((v) => {
    const qty = Number(v.qty || 0);
    const price = Number(v.price || 0);
    const cost = Number(v.cost || 0);
    itemCount += qty;
    totalRevenue += qty * price;
    totalCost += qty * cost;
  });

  const profit = totalRevenue * FX_RATE - totalCost;

  cartTotalCost.textContent = fmtJPY(totalCost);
  cartTotalRevenue.textContent = "$" + totalRevenue.toFixed(2);
  cartTotalProfit.textContent = fmtJPY(profit);
  cartAsinCount.textContent = asinCount;
  cartItemCount.textContent = itemCount;
}

/* =========================
   UI render helpers
========================= */
function formatValue(v) {
  if (v == null) return "－";
  const s = String(v);
  if (s.trim() === "") return "－";
  return s;
}

function renderInfoGrid(gridEl, infoMetrics, data) {
  if (!gridEl) return;
  gridEl.innerHTML = "";
  infoMetrics.forEach((m) => {
    const k = document.createElement("div");
    k.className = "k";
    k.textContent = m.label;

    const v = document.createElement("div");
    v.className = "v";
    v.textContent = formatValue(data[m.valueKey]);

    gridEl.appendChild(k);
    gridEl.appendChild(v);
  });
}

/* =========================
   Fake chart data builder
========================= */
function buildFakeChartData(asin, data) {
  // 180日・10日刻みラベル
  const labels = [];
  for (let i = 180; i >= 0; i -= 10) {
    labels.push(`${i}d`);
  }
  labels.reverse();

  const basePrice = Math.max(10, num(data["販売額（ドル）"]) || 29.99);
  const baseRank = Math.max(1, num(data["ランキング"]) || 50000);
  const baseSellers = Math.max(1, num(data["セラー数"]) || 5);

  // 疑似乱数 (asin依存)
  let seed = 0;
  for (let i = 0; i < asin.length; i++) seed += asin.charCodeAt(i) * (i + 1);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const prices = [];
  const ranks = [];
  const sellers = [];

  let p = basePrice;
  let r = baseRank;
  let s = baseSellers;

  for (let i = 0; i < labels.length; i++) {
    // price drift
    p = p + (rand() - 0.5) * 1.2;
    p = Math.max(5, Math.min(200, p));

    // rank drift (lower is better)
    r = r + (rand() - 0.5) * baseRank * 0.08;
    r = Math.max(50, Math.min(500000, r));

    // sellers drift
    s = s + (rand() - 0.45) * 1.2;
    s = Math.max(1, Math.min(60, s));

    prices.push(Number(p.toFixed(2)));
    ranks.push(Math.round(r));
    sellers.push(Math.round(s));
  }

  return {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "価格（$）",
          data: prices,
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
          yAxisID: "yPrice",
        },
        {
          label: "ランキング",
          data: ranks,
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
          yAxisID: "yRank",
        },
        {
          label: "セラー数",
          data: sellers,
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
          yAxisID: "ySeller",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          ticks: { maxRotation: 0, autoSkip: true },
          grid: { display: false },
        },
        yPrice: {
          position: "left",
          grid: { display: false },
        },
        yRank: {
          position: "right",
          reverse: true,
          grid: { display: false },
        },
        ySeller: {
          position: "right",
          grid: { display: false },
        },
      },
    },
  };
}

/* =========================
   Create product card
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
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <span class="memo-badge js-memoBadge" aria-hidden="true"></span>
        <button class="memo-btn js-memoBtn" type="button" title="メモ" aria-label="メモを開く">📝</button>
        <button class="remove" type="button">この行を削除</button>
      </div>

      <div class="layout3-grid">
        <div class="l3-image l3-block">
          <div class="head">商品画像</div>
          <div class="image-box">
            <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
          </div>
        </div>

        <div class="l3-infoA l3-block">
          <div class="head">商品情報①</div>
          <div class="info-grid js-infoGridA"></div>
        </div>

        <div class="l3-infoB l3-block">
          <div class="head">商品情報②</div>
          <div class="info-grid js-infoGridB"></div>
        </div>

        <div class="l3-center l3-block">
          <div class="head">主要項目</div>
          <div class="center-list js-center"></div>
        </div>

        <div class="l3-buy">
          <div class="buy-title">数量</div>
          <select class="js-qty">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>

          <div class="buy-title">販売価格（$）</div>
          <input class="js-price" type="number" step="0.01" placeholder="例: 39.99" />

          <div class="buy-title">仕入れ額（￥）</div>
          <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

          <button class="cart-btn js-addCart" type="button">カートに入れる</button>
        </div>

        <div class="l3-graph l3-block">
          <div class="head">グラフ（180日）</div>

          <div class="graph-options js-graphOptions">
            <label><input type="checkbox" class="js-chkDS" checked />《需要＆供給》</label>
            <label><input type="checkbox" class="js-chkSP" />《供給＆価格》</label>
          </div>

          <div class="graph-body">
            <div class="canvas-wrap js-mesWrap">
              <canvas class="js-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="l3-detail l3-block">
          <div class="head">その他項目</div>
          <div class="detail-scroll">
            <table class="detail-table js-detailTable">
              <thead><tr></tr></thead>
              <tbody><tr></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (isFourthLayout) {
    card.innerHTML = `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <span class="memo-badge js-memoBadge" aria-hidden="true"></span>
        <button class="memo-btn js-memoBtn" type="button" title="メモ" aria-label="メモを開く">📝</button>
        <button class="remove" type="button">この行を削除</button>
      </div>

      <div class="layout4-grid">
        <div class="l4-image l4-block">
          <div class="head">商品画像</div>
          <div class="image-box">
            <img src="${data["商品画像"] || ""}" alt="商品画像" onerror="this.style.display='none';" />
          </div>
        </div>

        <div class="l4-info l4-block">
          <div class="head">商品情報</div>
          <div class="info-grid js-infoGrid"></div>
        </div>

        <div class="l4-center l4-block">
          <div class="head">主要項目</div>
          <div class="center-cards js-centerCards"></div>
        </div>

        <div class="l4-buy l4-block">
          <div class="head">カート</div>
          <div class="buy-inner">
            <div class="buy-title">数量</div>
            <select class="js-qty">
              <option value="1" selected>1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>

            <div class="buy-title">販売価格（$）</div>
            <input class="js-price" type="number" step="0.01" placeholder="例: 39.99" />

            <div class="buy-title">仕入れ額（￥）</div>
            <input class="js-cost" type="number" step="1" placeholder="例: 3700" />

            <button class="cart-btn js-addCart" type="button">カートに入れる</button>
          </div>
        </div>

        <div class="l4-keepa l4-block">
          <div class="head">keepaグラフ</div>
          <div class="keepa-mini">
            <iframe class="js-keepaFrame" src="" loading="lazy"></iframe>
          </div>
        </div>

        <div class="l4-mes l4-block">
          <div class="head">需要供給グラフ（180日）</div>

          <div class="graph-options js-graphOptions" style="margin-bottom:10px;">
            <label><input type="checkbox" class="js-chkDS" checked />《需要＆供給》</label>
            <label><input type="checkbox" class="js-chkSP" />《供給＆価格》</label>
          </div>

          <div class="graph-body">
            <div class="canvas-wrap js-mesWrap">
              <canvas class="js-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="l4-detail l4-block">
          <div class="head">その他項目</div>
          <div class="detail-scroll">
            <table class="detail-table js-detailTable">
              <thead><tr></tr></thead>
              <tbody><tr></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (isAltLayout) {
    card.innerHTML = `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <span class="memo-badge js-memoBadge" aria-hidden="true"></span>
        <button class="memo-btn js-memoBtn" type="button" title="メモ" aria-label="メモを開く">📝</button>
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
          <input class="js-price" type="number" step="0.01" placeholder="例: 39.99" />

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
    `;
  } else {
    card.innerHTML = `
      <div class="card-top">
        <div class="title">ASIN: ${asin}</div>
        <span class="memo-badge js-memoBadge" aria-hidden="true"></span>
        <button class="memo-btn js-memoBtn" type="button" title="メモ" aria-label="メモを開く">📝</button>
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
              <input class="js-price" type="number" step="0.01" placeholder="例: 39.99" />

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

            <div class="keepa-wrap js-keepaWrap">
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

  // memo
  const memoBtn = card.querySelector(".js-memoBtn");
  const memoBadge = card.querySelector(".js-memoBadge");
  if (memoBtn && memoBadge) {
    const saved = loadAsinMemo(asin);
    applyMemoBadge(memoBadge, saved);
    memoBtn.addEventListener("click", () => openMemoModal(asin, memoBadge));
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
  const qtySel = card.querySelector(".js-qty");
  const priceInput = card.querySelector(".js-price");
  const costInput = card.querySelector(".js-cost");

  // default values
  if (data["販売額（ドル）"]) {
    const v = num(data["販売額（ドル）"]);
    if (v) priceInput.value = v;
  }
  if (data["仕入れ額（円）"]) {
    const v = num(data["仕入れ額（円）"]);
    if (v) costInput.value = v;
  }

  // cart
  card.querySelector(".js-addCart").addEventListener("click", () => {
    const qty = Number(qtySel.value || 0);
    const price = num(priceInput.value);
    const cost = num(costInput.value);
    cart.set(asin, { qty, price, cost });
    updateCartSummary();
    updateHeaderStatus();
  });

  // fill info/center/table
  const infoKeys = layoutState.info;
  const centerKeys = layoutState.center;
  const tableKeys = layoutState.table;

  if (isThirdLayout) {
    const gridA = card.querySelector(".js-infoGridA");
    const gridB = card.querySelector(".js-infoGridB");
    const infoMetrics = infoKeys.map((k) => METRICS.find((m) => m.key === k)).filter(Boolean);
    const half = Math.ceil(infoMetrics.length / 2);
    renderInfoGrid(gridA, infoMetrics.slice(0, half), data);
    renderInfoGrid(gridB, infoMetrics.slice(half), data);
  } else {
    const infoGrid = card.querySelector(".js-infoGrid");
    if (infoGrid) {
      const infoMetrics = infoKeys.map((k) => METRICS.find((m) => m.key === k)).filter(Boolean);
      renderInfoGrid(infoGrid, infoMetrics, data);
    }
  }

  if (isFourthLayout) {
    const centerCards = card.querySelector(".js-centerCards");
    if (centerCards) {
      const centerMetrics = centerKeys.map((k) => METRICS.find((m) => m.key === k)).filter(Boolean);
      centerCards.innerHTML = "";
      centerMetrics.forEach((m) => {
        const v = data[m.valueKey] ?? "";
        const div = document.createElement("div");
        div.className = "center-card";
        div.innerHTML = `<span>${m.label}</span><b>${formatValue(v)}</b>`;
        centerCards.appendChild(div);
      });
    }
  } else {
    const centerWrap = card.querySelector(".js-center");
    if (centerWrap) {
      const centerMetrics = centerKeys.map((k) => METRICS.find((m) => m.key === k)).filter(Boolean);
      centerWrap.innerHTML = "";
      centerMetrics.forEach((m) => {
        const v = data[m.valueKey] ?? "";
        const row = document.createElement("div");
        row.className = "center-row";
        row.innerHTML = `<span>${m.label}</span><b>${formatValue(v)}</b>`;
        centerWrap.appendChild(row);
      });
    }
  }

  const table = card.querySelector(".js-detailTable");
  if (table) {
    const headRow = table.querySelector("thead tr");
    const bodyRow = table.querySelector("tbody tr");
    headRow.innerHTML = "";
    bodyRow.innerHTML = "";

    const tableMetrics = tableKeys.map((k) => METRICS.find((m) => m.key === k)).filter(Boolean);
    tableMetrics.forEach((m) => {
      const th = document.createElement("th");
      th.textContent = m.label;
      headRow.appendChild(th);

      const td = document.createElement("td");
      td.textContent = formatValue(data[m.valueKey]);
      bodyRow.appendChild(td);
    });
  }

  // graph
  const canvas = card.querySelector(".js-chart");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const chartConfig = buildFakeChartData(asin, data);
    const chart = new Chart(ctx, chartConfig);
    card.__chart = chart;

    const chkDS = card.querySelector(".js-chkDS");
    const chkSP = card.querySelector(".js-chkSP");

    function applyVisibility() {
      const showDS = chkDS ? chkDS.checked : true;
      const showSP = chkSP ? chkSP.checked : false;

      // dataset order: 0 price, 1 rank, 2 sellers
      chart.data.datasets[0].hidden = showDS && !showSP ? true : false;
      chart.data.datasets[1].hidden = showSP && !showDS ? true : false;
      chart.data.datasets[2].hidden = !(showDS || showSP);

      if (showDS && showSP) {
        chart.data.datasets[0].hidden = false;
        chart.data.datasets[1].hidden = false;
        chart.data.datasets[2].hidden = false;
      }
      chart.update();
    }

    if (chkDS) chkDS.addEventListener("change", applyVisibility);
    if (chkSP) chkSP.addEventListener("change", applyVisibility);
    applyVisibility();
  }

  // keepa (default layout only toggle buttons)
  const keepaFrame = card.querySelector(".js-keepaFrame");
  if (keepaFrame) {
    keepaFrame.src = `https://keepa.com/#!product/1-${asin}`;

    const keepaWrap = card.querySelector(".js-keepaWrap");
    const mesWrap = card.querySelector(".js-mesWrap");

    const btnMes = card.querySelector(".js-btnMes");
    const btnKeepa = card.querySelector(".js-btnKeepa");
    const graphOptions = card.querySelector(".js-graphOptions");

    function setMode(mode) {
      if (!btnMes || !btnKeepa) return;
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

/* =========================
   ASINメモ（localStorage）
   - ASINごとに「絵文字マーク」と「メモ本文」を保存
   - ASIN横には絵文字（or 📝）だけ表示
   - 📝ボタンでモーダル表示
========================= */
const MEMO_STORAGE_PREFIX = "MES_ASIN_MEMO__";
let __memoOverlay = null;

function loadAsinMemo(asin) {
  try {
    const raw = localStorage.getItem(MEMO_STORAGE_PREFIX + asin);
    if (!raw) return { emoji: "", text: "" };
    const obj = JSON.parse(raw);
    return {
      emoji: typeof obj.emoji === "string" ? obj.emoji : "",
      text: typeof obj.text === "string" ? obj.text : "",
    };
  } catch (e) {
    return { emoji: "", text: "" };
  }
}

function saveAsinMemo(asin, memo) {
  try {
    localStorage.setItem(
      MEMO_STORAGE_PREFIX + asin,
      JSON.stringify(memo || { emoji: "", text: "" })
    );
  } catch (e) {}
}

function clearAsinMemo(asin) {
  try {
    localStorage.removeItem(MEMO_STORAGE_PREFIX + asin);
  } catch (e) {}
}

function applyMemoBadge(badgeEl, memo) {
  if (!badgeEl) return;
  const hasText = memo && typeof memo.text === "string" && memo.text.trim() !== "";
  const emoji = memo && typeof memo.emoji === "string" ? memo.emoji.trim() : "";
  const show = !!(emoji || hasText);

  if (!show) {
    badgeEl.textContent = "";
    badgeEl.style.display = "none";
    return;
  }
  badgeEl.textContent = emoji || "📝";
  badgeEl.style.display = "inline-flex";
}

function ensureMemoOverlay() {
  if (__memoOverlay) return __memoOverlay;

  const overlay = document.createElement("div");
  overlay.className = "memo-overlay";
  overlay.style.display = "none";

  overlay.innerHTML = `
    <div class="memo-panel card" role="dialog" aria-modal="true" aria-label="ASINメモ">
      <div class="memo-head">
        <div class="memo-title">メモ</div>
        <button class="memo-close" type="button" aria-label="閉じる">×</button>
      </div>

      <div class="memo-emoji">
        <div class="memo-emoji-label">マーク</div>
        <div class="memo-emoji-row js-memoEmojiRow"></div>
      </div>

      <div class="memo-body">
        <textarea class="memo-text js-memoText" placeholder="ここにメモを記入…"></textarea>
      </div>

      <div class="memo-actions">
        <button class="memo-clear" type="button">クリア</button>
        <button class="memo-save" type="button">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector(".memo-close");

  function close() {
    overlay.style.display = "none";
    overlay.removeAttribute("data-asin");
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (overlay.style.display !== "none" && e.key === "Escape") close();
  });

  __memoOverlay = { overlay, close };
  return __memoOverlay;
}

function openMemoModal(asin, badgeEl) {
  const { overlay, close } = ensureMemoOverlay();
  const emojiRow = overlay.querySelector(".js-memoEmojiRow");
  const textArea = overlay.querySelector(".js-memoText");
  const saveBtn = overlay.querySelector(".memo-save");
  const clearBtn = overlay.querySelector(".memo-clear");

  const current = loadAsinMemo(asin);
  let selectedEmoji = current.emoji || "";
  textArea.value = current.text || "";

  overlay.setAttribute("data-asin", asin);

  const EMOJIS = ["😈", "👼", "♥️", "👓", "🎯"];
  emojiRow.innerHTML = "";
  const btns = [];

  EMOJIS.forEach((em) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "memo-emoji-btn";
    b.textContent = em;
    if (em === selectedEmoji) b.classList.add("active");
    b.addEventListener("click", () => {
      selectedEmoji = em;
      btns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
    });
    btns.push(b);
    emojiRow.appendChild(b);
  });

  saveBtn.onclick = () => {
    const memo = { emoji: selectedEmoji, text: textArea.value || "" };
    const hasAnything =
      (memo.emoji && memo.emoji.trim() !== "") || (memo.text && memo.text.trim() !== "");
    if (!hasAnything) {
      clearAsinMemo(asin);
      applyMemoBadge(badgeEl, { emoji: "", text: "" });
    } else {
      saveAsinMemo(asin, memo);
      applyMemoBadge(badgeEl, memo);
    }
    close();
  };

  clearBtn.onclick = () => {
    selectedEmoji = "";
    textArea.value = "";
    btns.forEach((x) => x.classList.remove("active"));
    clearAsinMemo(asin);
    applyMemoBadge(badgeEl, { emoji: "", text: "" });
    close();
  };

  overlay.style.display = "flex";
  setTimeout(() => {
    try {
      textArea.focus();
    } catch (e) {}
  }, 0);
}
