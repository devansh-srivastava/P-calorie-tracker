/*
  To show live Google Sheet data after publishing the sheet to the web as CSV,
  paste its CSV export URL below. Until then, the interface uses this demo week.
*/
window.TRACKER_CONFIG = {
  publishedCsvUrl: "https://docs.google.com/spreadsheets/d/1LQrgrwPk7OLaddXiS8VoH01pJZVoosyjKZ0pQMsipEM/gviz/tq?tqx=out:csv&sheet=Calorie%20Tracker",
  weeklyBenchmark: 1700
};

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
  const number = (row, name) => Number(row[col(name)] || 0);
  const normaliseDate = (date) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const match = date.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
    if (!match) return date;
    const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
    return `${match[3]}-${months[match[2]]}-${match[1]}`;
  };
  return rows.filter(row => row[col("Date")]).map(row => ({
    date: normaliseDate(row[col("Date")]), morning: number(row, "Morning Calories"), afternoon: number(row, "Afternoon Calories"),
    evening: number(row, "Evening Calories"), total: number(row, "Total Calories"), weight: number(row, "Weight (kg)"), maintenance: number(row, "Maintenance Calories")
  }));
};

window.getEntries = async () => {
  if (!window.TRACKER_CONFIG.publishedCsvUrl) return window.DEMO_ENTRIES;
  const response = await fetch(window.TRACKER_CONFIG.publishedCsvUrl);
  if (!response.ok) throw new Error("Could not load the published sheet.");
  return window.parseTrackerCsv(await response.text());
};
