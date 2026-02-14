export function buildEmptyPlan() {
  return {
    title: "",
    subtitle: "",
    courseName: "",
    featuresText: "",
    planType: "both", // workout | nutrition | both
    price: 0,
    discountPrice: 0,
    durationDays:"",
    discountPercent: 0,
    isPopular: false,
  };
}
