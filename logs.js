const dayFormat = (date) => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(window.dateAtNoon(date));
const compactWeekLabel = (start) => { const days = window.daysInWeek(start).map(window.dateAtNoon); const f = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }); return `${f.format(days[0])} – ${f.format(days[6])}`; };
const value = (amount) => new Intl.NumberFormat("en-IN").format(Math.round(amount));

function renderWeekSelect(keys, selected) {
  const select = document.querySelector("#week-select");
  select.innerHTML = keys.map(key => `<option value="${key}" ${key === selected ? "selected" : ""}>${compactWeekLabel(key)}</option>`).join("");
  select.addEventListener("change", () => { const url = new URL(window.location); url.searchParams.set("week", select.value); window.location.assign(url); });
}

function logCard(entry, dailyTarget, index) {
  const logged = window.isCalorieLogged(entry);
  const meals = [["Morning", entry.morning], ["Afternoon", entry.afternoon], ["Evening", entry.evening]];
  const intake = window.entryTotal(entry);
  const message = !logged ? (typeof entry.weight === "number" ? "Weight recorded · calories not logged" : "Not logged yet") : !dailyTarget ? `${value(intake)} kcal logged` : dailyTarget - intake >= 0 ? `${value(dailyTarget - intake)} kcal below target` : `${value(intake - dailyTarget)} kcal above target`;
  return `<details class="log-card reveal" ${index === 0 ? "open" : ""}><summary><span><b>${dayFormat(entry.date)}</b><small>${message}</small></span><strong>${logged ? value(intake) : "—"}<small>${logged ? " kcal" : ""}</small></strong></summary>${logged ? `<div class="meal-grid">${meals.map(([meal, calories]) => `<p>${meal}<strong>${typeof calories === "number" ? value(calories) : "—"}</strong></p>`).join("")}</div>` : ""}<div class="log-foot"><span>Maintenance: ${typeof entry.maintenance === "number" ? `${value(entry.maintenance)} kcal` : "Not set"}</span><span>Weight: ${typeof entry.weight === "number" ? `${entry.weight} kg` : "Not logged"}</span></div></details>`;
}

async function renderLogs() {
  try {
    const { entries, dailyTarget } = await window.getTrackerData();
    const keys = window.availableWeekKeys(entries);
    const queryWeek = new URLSearchParams(window.location.search).get("week");
    const selected = keys.includes(queryWeek) ? queryWeek : keys[0] || window.weekKey(new Date());
    renderWeekSelect(keys.length ? keys : [selected], selected);
    document.querySelector(".logs-header p:last-child").textContent = `${compactWeekLabel(selected)} · tap a day for its meal-by-meal story.`;
    document.querySelector("#log-list").innerHTML = window.entriesForWeek(entries, selected).map((entry, index) => logCard(entry, dailyTarget, index)).join("");
  } catch (error) { console.error(error); document.querySelector("#log-list").innerHTML = "<p class=\"empty-state\">The tracker could not load right now. Please try again shortly.</p>"; }
}
document.addEventListener("DOMContentLoaded", renderLogs);
