const $ = (selector) => document.querySelector(selector);
const format = (value) => new Intl.NumberFormat("en-IN").format(Math.round(value));
const dayName = (date) => new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${date}T12:00:00`));
let compactChart, fullChart;

function total(entry) { return entry.total || entry.morning + entry.afternoon + entry.evening; }
function currentWeek(entries) {
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const recordedToToday = entries.filter(entry => new Date(`${entry.date}T12:00:00`) <= today);
  return (recordedToToday.length ? recordedToToday : entries).slice(-7);
}
function chartOptions(expanded = false) {
  return { responsive: true, maintainAspectRatio: false, animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 600 },
    interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#443640", padding: 12, displayColors: false } },
    scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8c7782", font: { size: expanded ? 13 : 11, weight: "600" } } }, y: { display: expanded, suggestedMin: 0, grid: { color: "#f0e4e8" }, border: { display: false }, ticks: { color: "#8c7782", callback: value => `${value} kcal` } } }
  };
}
function makeChart(canvas, entries, expanded) {
  const labels = entries.map(entry => dayName(entry.date));
  const benchmark = window.TRACKER_CONFIG.weeklyBenchmark;
  return new Chart(canvas, { type: "line", data: { labels, datasets: [
    { label: "Intake", data: entries.map(total), borderColor: "#eb789b", backgroundColor: "rgba(235,120,155,.16)", fill: true, borderWidth: 3, pointRadius: expanded ? 4 : 3, pointBackgroundColor: "#fff8f5", pointBorderWidth: 2, tension: .38 },
    { label: "Benchmark", data: entries.map(() => benchmark), borderColor: "#a28bce", borderWidth: 1.5, borderDash: [5, 5], pointRadius: 0 },
    { label: "Maintenance", data: entries.map(entry => entry.maintenance), borderColor: "#d5af55", borderWidth: 1.5, borderDash: [3, 6], pointRadius: 0 }
  ]}, options: chartOptions(expanded) });
}
function populate(entries) {
  const totalIntake = entries.reduce((sum, entry) => sum + total(entry), 0);
  const totalBenchmark = window.TRACKER_CONFIG.weeklyBenchmark * entries.length;
  const totalMaintenance = entries.reduce((sum, entry) => sum + entry.maintenance, 0);
  const difference = totalBenchmark - totalIntake;
  const latest = entries.at(-1);
  const starting = entries[0];
  $("#weekly-total").textContent = format(totalIntake);
  $("#benchmark-total").textContent = format(totalBenchmark);
  $("#maintenance-total").textContent = format(totalMaintenance);
  $("#latest-weight").textContent = latest.weight || "—";
  $("#weight-change").textContent = latest.weight && starting.weight ? `${latest.weight - starting.weight <= 0 ? "↓" : "↑"} ${Math.abs(latest.weight - starting.weight).toFixed(1)} kg this week` : "No change recorded";
  const phrase = difference >= 0 ? `${format(difference)} kcal below your benchmark` : `${format(Math.abs(difference))} kcal above your benchmark`;
  $("#weekly-status").textContent = difference >= 0 ? `${phrase}. You’re doing beautifully. ✦` : `${phrase}. Tomorrow is a fresh start.`;
  $("#weekly-difference").textContent = phrase;
  $("#recap-copy").textContent = difference >= 0 ? "A balanced, thoughtful week. Keep making choices that care for you." : "No judgement, just a little information for the week ahead.";
  $("#chart-summary").textContent = `Weekly intake is ${format(totalIntake)} calories. Your weekly benchmark is ${format(totalBenchmark)} calories.`;
  $("#daily-summary").innerHTML = entries.map(entry => `<tr><th scope="row">${dayName(entry.date)}</th><td>${format(total(entry))} kcal</td><td>${format(window.TRACKER_CONFIG.weeklyBenchmark)} kcal</td></tr>`).join("");
  compactChart = makeChart($("#weekly-chart"), entries, false); fullChart = makeChart($("#expanded-chart"), entries, true);
}
async function init() {
  try { populate(currentWeek(await window.getEntries())); } catch (error) { console.error(error); populate(window.DEMO_ENTRIES); $("#weekly-status").textContent = "Couldn’t load the sheet, so you’re viewing the demo week."; }
  const dialog = $("#chart-dialog");
  [$("#open-chart"), $("#chart-trigger")].forEach(button => button.addEventListener("click", () => dialog.showModal()));
  $("#close-chart").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
}
document.addEventListener("DOMContentLoaded", init);
