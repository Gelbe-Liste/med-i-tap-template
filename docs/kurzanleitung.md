# Kurzanleitung für neue Projekte

1. ZIP entpacken oder Projekt in StackBlitz/GitHub importieren.
2. `npm install` ausführen.
3. `src/content.ts` öffnen.
4. `hubConfig` auf Kunde, Projekt und Einstiegstext anpassen.
5. Im Array `modules` Kacheln hinzufügen, löschen oder umbenennen.
6. Pro Modul die Farben unter `theme.card`, `theme.page` und `theme.accent` anpassen.
7. Ziel-Links zu gelbe-liste.de oder PDF-Downloads in `cta.href` eintragen.
8. Optional Dateien in `public/downloads/` ablegen.
9. Impressum und Datenschutz in `public/impressum.html` und `public/datenschutz.html` finalisieren.
10. Lokal testen: `npm run dev`.
11. Für Livegang deployen: Vercel/Netlify, Build Command `npm run build`, Output `dist`.
12. Finale URL auf NFC-Tag oder QR-Code schreiben.
