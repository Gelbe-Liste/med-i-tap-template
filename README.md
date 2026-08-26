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
