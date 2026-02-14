export const mockOrders = [
  {
    id: "o1001",
    createdAt: "2026-02-10T14:15:00.000Z",
    status: "paid", // paid | pending | failed | refunded
    paymentMethod: "درگاه آنلاین",
    trackingCode: "TRX-7A21B3",
    items: [
      { type: "program", refId: "p1", title: "چربی‌سوزی ۴ هفته‌ای", qty: 1, price: 890000 },
      { type: "addon", refId: "a1", title: "پشتیبانی یک‌ماهه", qty: 1, price: 190000 },
    ],
    discountPercent: 15,
    note: "کد تخفیف زمستانی اعمال شد.",
  },
  {
    id: "o1002",
    createdAt: "2026-02-08T10:05:00.000Z",
    status: "pending",
    paymentMethod: "درگاه آنلاین",
    trackingCode: "TRX-19KD02",
    items: [{ type: "program", refId: "p2", title: "عضله‌سازی ۸ هفته‌ای", qty: 1, price: 1290000 }],
    discountPercent: 0,
    note: "",
  },
  {
    id: "o1003",
    createdAt: "2026-01-28T18:40:00.000Z",
    status: "failed",
    paymentMethod: "درگاه آنلاین",
    trackingCode: "TRX-FAIL88",
    items: [{ type: "program", refId: "p3", title: "تغذیه اختصاصی ۳۰ روزه", qty: 1, price: 990000 }],
    discountPercent: 10,
    note: "پرداخت ناموفق بود؛ دوباره تلاش کنید.",
  },

  // Duplicate more for pagination demo
  ...Array.from({ length: 10 }).map((_, i) => ({
    id: `o10${10 + i}`,
    createdAt: `2026-01-${String(10 + (i % 20)).padStart(2, "0")}T12:00:00.000Z`,
    status: i % 3 === 0 ? "paid" : i % 3 === 1 ? "pending" : "failed",
    paymentMethod: "درگاه آنلاین",
    trackingCode: `TRX-DEMO-${i + 1}`,
    items: [
      {
        type: "program",
        refId: "p1",
        title: i % 2 === 0 ? "چربی‌سوزی ۴ هفته‌ای" : "آمادگی جسمانی عمومی",
        qty: 1,
        price: i % 2 === 0 ? 890000 : 790000,
      },
    ],
    discountPercent: i % 4 === 0 ? 20 : 0,
    note: "",
  })),
];
