# Statische QA und Abnahmeplan – Piano Mapping v1.3 (20.10.2026)

## Lokal geprüft
- Key-/Event-Set gegen das zentrale Data-Model-Arbeitsblatt v1.2
- Syntax mit TypeScript-Parser (69 Source-Dateien, projektübergreifend): 0 Fehler
- Einmaligkeit und Sichtbarkeitsregeln der Kapitel und des Workflows statisch geprüft
- Interne Kapitelziele nur mit `target_chapter_id`, nicht als Hash in `destination_path`
- `VITE_PIANO_ENABLED=false`, `VITE_PIANO_ESSENTIAL_APPROVED=false`, `VITE_PIANO_CUSTOM_VIDEO_EVENTS=false`

## Noch nicht abgeschlossen
- Vollständiger Vite-Build im vorliegenden Offline-Runtime nicht möglich (npm dependencies nicht lokal gecacht)
- Browser-/End-to-End-Test sowie Bestätigung des echten Piano-Dateneingangs ausstehend
- Freigabe durch Vidal Analytics und Datenschutz (Datenmodell, Consent, A/V Insights) ausstehend

## Vor Livegang
1. `npm ci && npm run build` in einer Umgebung mit Zugang zur npm-Registry.
2. Piano Custom Properties / Custom Events inkl. Datenformaten und Wertelisten registrieren.
3. Consent-Konfiguration inklusive `page.display` schriftlich freigeben und mit/ohne Einwilligung testen.
4. Tracking im Staging aktiviert gegen die Netzwerk-Requests und Piano Debugger prüfen.
5. Zwei kurze und zwei lange Kapitel, alle Scroll-Meilensteine, Navigation, CTA, PDF, Video (falls frei), sowie produktspezifische Interaktionen testen.
6. KPI-Rechenregeln, UTM-Werte und Live-Freigabe dokumentieren.
