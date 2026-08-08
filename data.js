/*
  To show live Google Sheet data after publishing the sheet to the web as CSV,
  paste its CSV export URL below. Until then, the interface uses this demo week.
*/
window.TRACKER_CONFIG = {
  trackerCsvUrl: "https://docs.google.com/spreadsheets/d/1LQrgrwPk7OLaddXiS8VoH01pJZVoosyjKZ0pQMsipEM/gviz/tq?tqx=out:csv&sheet=Calorie%20Tracker",
  settingsCsvUrl: "https://docs.google.com/spreadsheets/d/1LQrgrwPk7OLaddXiS8VoH01pJZVoosyjKZ0pQMsipEM/gviz/tq?tqx=out:csv&sheet=Settings"
};

window.MOTIVATION_QUOTES = [
  "Soft heart, steady habits, unstoppable girl.", "You are allowed to bloom at your own pace.",
  "A little care today becomes a lot of strength tomorrow.", "Your body is your home. Speak to it kindly.",
  "Lovely things take consistency, and so do you.", "She is becoming her own safe place.",
  "Tiny promises to yourself are still promises kept.", "Gentle with yourself, fierce about your dreams.",
  "Every logged day is a love note to future you.", "Pretty, powerful, and patiently in progress.",
  "You do not need perfection to be proud of yourself.", "Strong girls rest, reset, and rise again.",
  "Your pace is valid. Your effort is beautiful.", "Choose care over pressure, every single time.",
  "She believed in small steps, so she kept taking them.", "Nourish your body, honour your energy.",
  "You are not behind. You are building something lasting.", "Romanticise the routine that takes care of you.",
  "A calm mind and a cared-for body look good on you.", "You can be soft and still be so strong.",
  "One thoughtful choice is enough to change the day.", "Your consistency is quietly becoming your superpower.",
  "You deserve habits that feel like love, not punishment.", "The glow-up is in the gentle return to yourself.",
  "Be proud of the girl who keeps showing up.", "This is your reminder: you are doing better than you think."
];

window.DEMO_ENTRIES = [
  { date: "2026-08-08", morning: 402, afternoon: 610, evening: 530, weight: 69.7, maintenance: 1883 },
  { date: "2026-08-09", morning: 360, afternoon: 655, evening: 580, weight: 69.5, maintenance: 1883 },
  { date: "2026-08-10", morning: 405, afternoon: 570, evening: 630, weight: 69.5, maintenance: 1883 },
  { date: "2026-08-11", morning: 380, afternoon: 620, evening: 490, weight: 69.4, maintenance: 1883 },
  { date: "2026-08-12", morning: 430, afternoon: 590, evening: 570, weight: 69.4, maintenance: 1883 },
  { date: "2026-08-13", morning: 390, afternoon: 680, evening: 530, weight: 69.3, maintenance: 1883 },
  { date: "2026-08-14", morning: 350, afternoon: 550, evening: 520, weight: 69.3, maintenance: 1883 }
];

window.parseTrackerCsv = (csv) => {
  const [headers, ...rows] = csv.trim().split(/\r?\n/).map(line => line.split(",").map(cell => cell.replace(/^"|"$/g, "").trim()));
  const col = (name) => headers.findIndex(header => header.toLowerCase() === name.toLowerCase());
  const number = (row, name) => {
    const cell = row[col(name)];
    return cell === undefined || cell === "" ? null : Number(cell);
  };
  const normaliseDate = (date) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const match = date.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
    if (!match) return date;
    const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
    return `${match[3]}-${months[match[2]]}-${match[1]}`;
  };
  return rows.filter(row => row[col("Date")]).map(row => ({
    date: normaliseDate(row[col("Date")]), morning: number(row, "Morning Calories"), afternoon: number(row, "Afternoon Calories"),
    evening: number(row, "Evening Calories"), total: number(row, "Total Calories"), weight: number(row, "Weight (kg)"), maintenance: number(row, "Maintenance Calories"),
    workout: (row[col("Worked Out?")] || "").toLowerCase() === "yes" ? true : (row[col("Worked Out?")] || "").toLowerCase() === "no" ? false : null
  }));
};

window.parseSettingsCsv = (csv) => {
  const rows = csv.trim().split(/\r?\n/).slice(1).map(line => line.split(",").map(cell => cell.replace(/^"|"$/g, "").trim()));
  return Object.fromEntries(rows.filter(row => row[0]).map(([setting, value]) => [setting.toLowerCase(), value]));
};

window.dateAtNoon = (date) => new Date(`${date}T12:00:00`);
window.toIsoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
window.weekStart = (date) => { const day = new Date(date); day.setHours(12, 0, 0, 0); day.setDate(day.getDate() - ((day.getDay() + 6) % 7)); return day; };
window.weekKey = (date) => window.toIsoDate(window.weekStart(date));
window.isFutureDate = (date) => { const today = new Date(); today.setHours(23, 59, 59, 999); return window.dateAtNoon(date) > today; };
window.daysInWeek = (start) => Array.from({ length: 7 }, (_, index) => { const day = new Date(`${start}T12:00:00`); day.setDate(day.getDate() + index); return window.toIsoDate(day); });
window.isCalorieLogged = (entry) => [entry?.morning, entry?.afternoon, entry?.evening, entry?.total].some(value => typeof value === "number" && !Number.isNaN(value));
window.entryTotal = (entry) => entry?.total ?? [entry?.morning, entry?.afternoon, entry?.evening].reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0);
window.isMeaningfulEntry = (entry) => window.isCalorieLogged(entry) || typeof entry?.weight === "number";
window.availableWeekKeys = (entries) => [...new Set(entries.filter(entry => !window.isFutureDate(entry.date) && window.isMeaningfulEntry(entry)).map(entry => window.weekKey(window.dateAtNoon(entry.date))))].sort().reverse();
window.entriesForWeek = (entries, start) => window.daysInWeek(start).filter(date => !window.isFutureDate(date)).map(date => entries.find(entry => entry.date === date) || { date, morning: null, afternoon: null, evening: null, total: null, weight: null, maintenance: null, workout: null, empty: true });

window.getTrackerData = async () => {
  const [trackerResponse, settingsResponse] = await Promise.all([fetch(window.TRACKER_CONFIG.trackerCsvUrl), fetch(window.TRACKER_CONFIG.settingsCsvUrl)]);
  if (!trackerResponse.ok || !settingsResponse.ok) throw new Error("Could not load the tracker.");
  const settings = window.parseSettingsCsv(await settingsResponse.text());
  const target = Number(settings["practical starting calorie target"] || settings["daily calorie target"] || settings["daily target"] || 0);
  return { entries: window.parseTrackerCsv(await trackerResponse.text()), dailyTarget: Number.isFinite(target) ? target : 0, settings };
};
