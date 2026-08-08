const dayFormat = (date) => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
const value = (amount) => new Intl.NumberFormat("en-IN").format(Math.round(amount));
const intake = (entry) => entry.total || entry.morning + entry.afternoon + entry.evening;
async function renderLogs() {
  let entries; try { entries = await window.getEntries(); } catch { entries = window.DEMO_ENTRIES; }
  document.querySelector("#log-list").innerHTML = entries.map((entry, index) => {
    const difference = window.TRACKER_CONFIG.weeklyBenchmark - intake(entry);
    return `<details class="log-card reveal" ${index === entries.length - 1 ? "open" : ""}><summary><span><b>${dayFormat(entry.date)}</b><small>${difference >= 0 ? `${value(difference)} kcal below goal` : `${value(Math.abs(difference))} kcal over goal`}</small></span><strong>${value(intake(entry))}<small> kcal</small></strong></summary><div class="meal-grid"><p>Morning <strong>${value(entry.morning)}</strong></p><p>Afternoon <strong>${value(entry.afternoon)}</strong></p><p>Evening <strong>${value(entry.evening)}</strong></p></div><div class="log-foot"><span>Maintenance: ${value(entry.maintenance)} kcal</span><span>Weight: ${entry.weight || "—"} kg</span></div></details>`;
  }).join("");
}
document.addEventListener("DOMContentLoaded", renderLogs);
