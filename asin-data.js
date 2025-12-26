// asin-data.js
// デモ用のASINデータを格納（現状はダミー）
// 既存の main.js が参照する形式に合わせる

window.ASIN_DATA = [
  {
    asin: "B0A0000001",
    title: "スーパーアクションヒーロー 5体セット",
    brand: "HeroWorks",
    jan: "4900000000001",
    sku: "HW-HERO-SET-5",
    size: "32×26×8",
    weight: "1.10kg（1.20kg）",
    category: "Toys & Games / Action Figures",
    material: "プラスチック / 紙",
    image: "https://images-na.ssl-images-amazon.com/images/I/81mT0oB8p0L._AC_SL1500_.jpg",
    images: [
      "https://images-na.ssl-images-amazon.com/images/I/81mT0oB8p0L._AC_SL1500_.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/81mT0oB8p0L._AC_SL1500_.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/81mT0oB8p0L._AC_SL1500_.jpg",
      "https://images-na.ssl-images-amazon.com/images/I/81mT0oB8p0L._AC_SL1500_.jpg",
    ],

    // metrics for layout4
    profitYen: 1612,
    profitRate: 0.26,
    inYen: 6200,
    sales30: 95,
    forecast30: 110,
    stockDays45: 1.1,

    // chart series (180days dummy)
    graph: (() => {
      const days = Array.from({length:180}, (_,i) => 180-i);
      const rnd = (a,b)=> a + Math.random()*(b-a);
      const rank = days.map(()=> Math.round(rnd(5000, 50000)));
      const sellers = days.map(()=> Math.round(rnd(1, 10)));
      const price = days.map(()=> Math.round(rnd(20, 60)));
      return { days, rank, sellers, price };
    })()
  }
];
