const $ = (selector) => document.querySelector(selector);
const format = (value) => new Intl.NumberFormat("en-IN").format(Math.round(value));
const dayName = (date) => new Intl.DateTimeFormat("en", { weekday: "short" }).format(window.dateAtNoon(date));
const weekLabel = (start) => {
  const dates = window.daysInWeek(start).map(window.dateAtNoon);
  const formatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
  return `${formatter.format(dates[0])} – ${formatter.format(dates[6])}`;
};
let compactChart, fullChart, workoutChart;

function chartOptions(expanded = false) {
  return { responsive: true, maintainAspectRatio: false, animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 600 }, interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#443640", padding: 12, displayColors: false } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8c7782", font: { size: expanded ? 13 : 11, weight: "600" } } }, y: { display: expanded, suggestedMin: 0, grid: { color: "#f0e4e8" }, border: { display: false }, ticks: { color: "#8c7782", callback: value => `${value} kcal` } } } };
}

function makeChart(canvas, entries, dailyTarget, expanded) {
  const datasets = [{ label: "Intake", data: entries.map(entry => window.isCalorieLogged(entry) ? window.entryTotal(entry) : null), borderColor: "#eb789b", backgroundColor: "rgba(235,120,155,.16)", fill: true, spanGaps: true, borderWidth: 3, pointRadius: expanded ? 4 : 3, pointBackgroundColor: "#fff8f5", pointBorderWidth: 2, tension: .38 }];
  if (dailyTarget) datasets.push({ label: "Daily target", data: entries.map(() => dailyTarget), borderColor: "#a28bce", borderWidth: 1.5, borderDash: [5, 5], pointRadius: 0 });
  if (entries.some(entry => typeof entry.maintenance === "number")) datasets.push({ label: "Maintenance", data: entries.map(entry => entry.maintenance), borderColor: "#d5af55", borderWidth: 1.5, borderDash: [3, 6], pointRadius: 0 });
  return new Chart(canvas, { type: "line", data: { labels: entries.map(entry => dayName(entry.date)), datasets }, options: chartOptions(expanded) });
}

function makeWorkoutChart(entries) {
  return new Chart($("#workout-chart"), { type: "bar", data: { labels: entries.map(entry => dayName(entry.date)), datasets: [{ label: "Workout", data: entries.map(entry => entry.workout === true ? 1 : entry.workout === false ? 0 : null), backgroundColor: "#a28bce", borderRadius: 9, borderSkipped: false, maxBarThickness: 28 }] }, options: { responsive: true, maintainAspectRatio: false, animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 500 }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => context.raw === 1 ? "Workout done" : "Rest day" } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8c7782", font: { size: 11, weight: "600" } } }, y: { display: false, min: 0, max: 1, grid: { display: false }, border: { display: false } } } } });
}

function setWeekSelector(weekKeys, selected) {
  const select = $("#week-select");
  select.innerHTML = weekKeys.map(key => `<option value="${key}" ${key === selected ? "selected" : ""}>${weekLabel(key)}</option>`).join("");
  select.addEventListener("change", () => { const url = new URL(window.location); url.searchParams.set("week", select.value); window.location.assign(url); });
}

function populate(entries, dailyTarget, selectedWeek, settings) {
  const loggedEntries = entries.filter(window.isCalorieLogged);
  const totalIntake = loggedEntries.reduce((sum, entry) => sum + window.entryTotal(entry), 0);
  const maintenanceValues = entries.map(entry => entry.maintenance).filter(value => typeof value === "number");
  const maintenance = maintenanceValues.length ? Math.round(maintenanceValues.reduce((sum, value) => sum + value, 0) / maintenanceValues.length) : null;
  const latest = [...entries].reverse().find(entry => typeof entry.weight === "number");
  const starting = entries.find(entry => typeof entry.weight === "number");
  const difference = dailyTarget && loggedEntries.length ? dailyTarget * loggedEntries.length - totalIntake : null;
  $("#weekly-total").textContent = format(totalIntake);
  $("#target-total").textContent = dailyTarget ? format(dailyTarget) : "—";
  $("#maintenance-total").textContent = maintenance ? format(maintenance) : "—";
  $("#latest-weight").textContent = latest?.weight ?? settings["current weight (kg)"] ?? "—";
  const goalWeight = Number(settings["goal weight (kg)"] || 0);
  const activeWeight = latest?.weight ?? Number(settings["current weight (kg)"] || 0);
  $("#weight-change").textContent = goalWeight && activeWeight ? `${Math.max(activeWeight - goalWeight, 0).toFixed(1)} kg to your ${goalWeight} kg goal` : latest && starting && latest !== starting ? `${latest.weight - starting.weight <= 0 ? "↓" : "↑"} ${Math.abs(latest.weight - starting.weight).toFixed(1)} kg this week` : "No goal set";
  if (!loggedEntries.length) {
    $("#weekly-status").textContent = "No calorie entries logged for this week yet.";
    $("#weekly-difference").textContent = "Start wherever you are";
    $("#recap-copy").textContent = "Your progress will appear as soon as you log a meal. No pressure, just your pace.";
  } else if (!dailyTarget) {
    $("#weekly-status").textContent = "Your meals are logged. Add a Daily Calorie Target in Settings to see weekly progress.";
    $("#weekly-difference").textContent = `${format(totalIntake)} kcal logged`;
    $("#recap-copy").textContent = `Across ${loggedEntries.length} logged ${loggedEntries.length === 1 ? "day" : "days"}.`;
  } else {
    const phrase = difference >= 0 ? `${format(difference)} kcal below your target` : `${format(Math.abs(difference))} kcal above your target`;
    $("#weekly-status").textContent = `${phrase} across ${loggedEntries.length} logged ${loggedEntries.length === 1 ? "day" : "days"}.`;
    $("#weekly-difference").textContent = phrase;
    $("#recap-copy").textContent = difference >= 0 ? "A thoughtful week so far. Keep listening to what feels good." : "No judgement, just useful information for the days ahead.";
  }
  $("#chart-summary").textContent = `For ${weekLabel(selectedWeek)}, ${loggedEntries.length} days have calorie entries totalling ${format(totalIntake)} calories.${dailyTarget ? ` Daily target is ${format(dailyTarget)} calories.` : ""}`;
  $("#daily-summary").innerHTML = entries.map(entry => `<tr><th scope="row">${dayName(entry.date)}</th><td>${window.isCalorieLogged(entry) ? `${format(window.entryTotal(entry))} kcal` : "Not logged"}</td><td>${dailyTarget ? `${format(dailyTarget)} kcal` : "Not set"}</td></tr>`).join("");
  compactChart?.destroy(); fullChart?.destroy();
  compactChart = makeChart($("#weekly-chart"), entries, dailyTarget, false); fullChart = makeChart($("#expanded-chart"), entries, dailyTarget, true);
  const workouts = entries.filter(entry => entry.workout === true).length;
  const workoutEntries = entries.filter(entry => entry.workout === true || entry.workout === false).length;
  $("#workout-count").textContent = workoutEntries ? `${workouts} of ${workoutEntries} days` : "Not logged yet";
  $("#workout-summary").textContent = workoutEntries ? `${workouts} workouts were logged across ${workoutEntries} recorded days.` : "No workout entries have been logged this week.";
  workoutChart?.destroy(); workoutChart = makeWorkoutChart(entries);
}

async function init() {
  try {
    const { entries, dailyTarget, settings } = await window.getTrackerData();
    const weekKeys = window.availableWeekKeys(entries);
    const queryWeek = new URLSearchParams(window.location.search).get("week");
    const selectedWeek = weekKeys.includes(queryWeek) ? queryWeek : weekKeys[0] || window.weekKey(new Date());
    setWeekSelector(weekKeys.length ? weekKeys : [selectedWeek], selectedWeek);
    populate(window.entriesForWeek(entries, selectedWeek), dailyTarget, selectedWeek, settings);
  } catch (error) { console.error(error); $("#weekly-status").textContent = "The tracker could not load right now. Please try again shortly."; }
  $("#motivation-quote").textContent = window.MOTIVATION_QUOTES[Math.floor(Math.random() * window.MOTIVATION_QUOTES.length)];
  const chartDialog = $("#chart-dialog"), helpDialog = $("#help-dialog");
  [$("#open-chart"), $("#chart-trigger")].forEach(button => button.addEventListener("click", () => chartDialog.showModal()));
  $("#close-chart").addEventListener("click", () => chartDialog.close());
  $("#chart-help").addEventListener("click", () => helpDialog.showModal());
  $("#close-help").addEventListener("click", () => helpDialog.close());
  [chartDialog, helpDialog].forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));
}
document.addEventListener("DOMContentLoaded", init);
