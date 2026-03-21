export const getTrend = (vitals) => {
  if (vitals.length < 2) return "stable";

  // Sort by date to ensure correct trend direction
  const sorted = [...vitals].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  let trend = [];

  if (last.spo2 < first.spo2) trend.push("declining SpO2");
  if (last.temp > first.temp) trend.push("rising temperature");

  if (trend.length === 0) return "stable";

  return trend.join(" & ");
};
