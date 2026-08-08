# Girl Code Calorie Tracker

A mobile-first static calorie dashboard intended for GitHub Pages.

## Connect the Google Sheet

The browser cannot read a private Google Sheet with the account access used during development. To let a public GitHub Pages site refresh itself, publish the `Calorie Tracker` tab as CSV from Google Sheets: **File → Share → Publish to web → Calorie Tracker → Comma-separated values (.csv)**. Paste the generated URL into `publishedCsvUrl` in `data.js`.

Set `weeklyBenchmark` in `data.js` to the daily benchmark calorie value.

## Publish to GitHub Pages

Push this repository to GitHub, then in **Settings → Pages**, choose **Deploy from a branch**, select `master` (or `main`) and `/ (root)`.
