# Gelbe Liste NFC Hub Template

Mobile-first React/Vite Template für NFC- oder QR-basierte Microsites im Look & Feel des Fachportals Gelbe Liste.

## Start

```bash
npm install
npm run dev
```

## Deployment

Für Vercel oder Netlify:

- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite

## Inhalte bearbeiten

Die Inhalte werden zentral in `src/content.ts` gepflegt:

- Startseiten-Titel und Intro: `hubConfig`
- Module / Kacheln: `modules`
- Farben pro Kachel und Unterseite: `theme.card`, `theme.page`, `theme.accent`
- Ziel-Links: `cta.href`
- Kontakt: `hubConfig.contact`
- Legal Links: `hubConfig.legal`

## Neue Kachel hinzufügen

In `src/content.ts` einen weiteren Block im Array `modules` ergänzen. Jede Kachel benötigt:

- `id`
- `eyebrow`
- `title`
- `subtitle`
- `badge`
- `theme`
- `screens`

## PDFs und Bilder

Downloads oder Bilder in `public/downloads/` ablegen und im CTA verlinken, zum Beispiel:

```ts
cta: {
  label: "PDF öffnen",
  href: "/downloads/dateiname.pdf",
  download: true
}
```

## Tracking

Die Funktion `trackEvent` in `src/App.tsx` protokolliert aktuell nur in der Konsole. Dort kann später Piano Analytics, Matomo oder GA4 angebunden werden.


## PWA / Installation

Das Template ist als installierbare Progressive Web App vorbereitet:

- `public/manifest.webmanifest` definiert App-Name, Start-URL, Farben und Icons.
- `display: "standalone"` startet die installierte Anwendung ohne normale Browser-Navigation.
- `public/sw.js` wird in `src/main.tsx` registriert.
- Auf Android sowie in Chromium-basierten Desktop-Browsern nutzt der Button den nativen Installationsdialog, sofern verfügbar.
- Auf iOS/iPadOS zeigt der Button die Schritte „Teilen“ → „Zum Home-Bildschirm“ → „Hinzufügen“.
- Ist die App bereits im Standalone-Modus geöffnet, wird der Installationsbutton automatisch ausgeblendet.

Für Kundenprojekte sollten App-Name, `short_name`, Beschreibung und Icons im Manifest angepasst werden.


## Android / Samsung Internet

Auf neueren Android-Versionen kann Samsung Internet bei der PWA-Installation eine irreführende Google-Play-Protect-Warnung anzeigen ("für eine ältere Android-Version entwickelt"). Das betrifft den von Samsung Internet erzeugten WebAPK-Wrapper und nicht den Web-Inhalt der med.i.tap-Anwendung.

Das Template erkennt Samsung Internet deshalb und löst dort **nicht** den nativen PWA-Installationsdialog aus. Stattdessen öffnet der Installationsbutton die aktuelle Anwendung in Google Chrome. Dort kann die PWA regulär als App installiert und anschließend im `standalone`-Modus ohne normale Browserleiste gestartet werden.
