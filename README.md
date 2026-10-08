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

## Piano Analytics Tracking

Das Template v16 enthält eine zentrale Piano-Analytics-Schicht in `src/tracking/piano.ts`. Stand 08.10.2026 / Mapping v1.2: `page_type="med.i.tap"`; `article_category` stammt aus der Vidal-Pagetype-Liste und `de_page_category` aus Specialty + Content Type. Die frühere Custom-Property `entry_point` ist entfernt; Acquisition läuft über die vorhandenen Piano-Dimensionen UTM Medium, UTM Source und UTM Campaign. `is_PAP=1` wird persistent gesetzt. Die fachlichen Interaktionen werden auf `page.display`, `click.action` und `pop_in.display` gemappt.

Die Piano-Konfiguration wird über `.env` bzw. Vercel Environment Variables gesteuert. Im Mastertemplate ist `VITE_PIANO_ENABLED=false`, damit lokale Entwicklung und Preview-Deployments nicht ungeprüft in die Produktivdaten laufen. Für den produktiven Betrieb nach Data-Model-/Datenschutzfreigabe auf `true` setzen.

Details: `docs/PIANO-ANALYTICS.md`.


## PWA / Direktzugriff

Das Template ist als Progressive Web App vorbereitet. In der sichtbaren Nutzerkommunikation wird bewusst nicht von einer „App-Installation“ gesprochen. Stattdessen wird der Nutzen als **Direktzugriff auf dem Home-Bildschirm** beschrieben:

- `public/manifest.webmanifest` definiert Name, Start-URL, Farben und Icons.
- `display: "standalone"` öffnet den gespeicherten Direktzugriff ohne normale Browser-Navigation.
- `public/sw.js` wird in `src/main.tsx` registriert.
- Auf Android sowie in Chromium-basierten Desktop-Browsern nutzt der Button technisch den nativen PWA-Dialog, sofern verfügbar; sichtbar heißt der Button **„Auf Home-Bildschirm speichern“**.
- Auf iOS/iPadOS lautet die Nutzerführung **„Zum Home-Bildschirm hinzufügen“**.
- Ist die Anwendung bereits im Standalone-Modus geöffnet, wird der Speicher-Button automatisch ausgeblendet.

Für Kundenprojekte sollten Name, `short_name`, Beschreibung und Icons im Manifest angepasst werden.


## Android / Samsung Internet

Auf neueren Android-Versionen kann Samsung Internet beim technischen PWA-Vorgang eine irreführende Google-Play-Protect-Warnung anzeigen ("für eine ältere Android-Version entwickelt"). Das betrifft den von Samsung Internet erzeugten WebAPK-Wrapper und nicht den Web-Inhalt der med.i.tap-Anwendung.

Das Template erkennt Samsung Internet deshalb und löst dort **nicht** den nativen PWA-Dialog aus. Der Button heißt **„In Google Chrome öffnen“** und adressiert Chrome über einen Android-Intent mit dem Paket `com.android.chrome`. Ein Rücksprung auf dieselbe Seite wurde bewusst als Fallback entfernt, damit keine Schleife mit Samsung Internet entsteht. Falls Android dennoch eine Browserauswahl zeigt, weist die Oberfläche ausdrücklich darauf hin, **Google Chrome** auszuwählen.

