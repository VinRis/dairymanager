# Dairy Manager Pro PWA

A high-performance, colorful, and offline-first Progressive Web App designed for dairy and cattle farmers to manage production, finance, and health records efficiently on the go.

## Features
- **Offline First**: Works without internet via Service Workers and IndexedDB.
- **Dynamic Dashboard**: Monthly and Annual production analytics using Chart.js.
- **Full Management**: 
    - Milk production tracking.
    - Financial bookkeeping (Income/Expense).
    - Health event reminders and records.
    - Inventory management.
- **Professional Reporting**: Generate high-quality PDF reports for banks or investors.
- **Data Portability**: Full backup and restore functionality via JSON files.
- **Modern UI**: Light/Dark mode support with glassmorphism design.

## Prerequisites
- Any modern mobile or desktop web browser.
- A static file server (e.g., GitHub Pages, Vercel, or local `npx serve`).

## Installation
1. Clone or download this repository.
2. Host the files on any static web server.
3. Open the URL in your browser.
4. On Mobile: Tap "Add to Home Screen" to install it as a native app.

## How to Run Locally
Using Node.js:
    npx serve .

Or simply open `index.html` in a browser (though some PWA features like Service Workers require a local server to function).

## Configuration
- Navigate to the **Settings** tab to configure your:
    - Farm Name
    - Manager Name
    - Location
    - Preferred Currency
    - UI Theme (Light/Dark)

## Troubleshooting
- **Not Installing**: Ensure you are using HTTPS. Service workers and PWAs require a secure context.
- **Chart Not Loading**: Ensure you have an internet connection for the first load to cache the Chart.js CDN, or download the library and reference it locally.
- **Data missing**: If you clear your browser cache/site data, the IndexedDB storage will be cleared. Always use the **Backup** button on the welcome screen regularly.

## Project Structure
- `index.html`: UI Layout and View containers.
- `app.js`: Application logic and navigation.
- `db.js`: IndexedDB wrapper for local storage.
- `utils.js`: Helpers for PDF, CSV, Charts, and Backup.
- `styles.css`: Glassmorphism and responsive design.
- `manifest.json`: PWA metadata.
- `service-worker.js`: Offline caching logic.
