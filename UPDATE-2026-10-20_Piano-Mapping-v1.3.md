# Piano Analytics – Mapping v1.3 (20.10.2026)

Quellbasis: Originalarchiv vom 08.10.2026. Medizinische Inhalte und Layout unangetastet.

- Zentralreferenz: `2026-10-20_Piano_Analytics_Neue-Properties_und_Events_med-i-Produkte_DE_v1.2.docx`
- Änderungen: Sichtbarkeitserkennung/Workflow, saubere interne Navigation, PWA-Installationsstatus, eindeutige globale CTAs sowie Consent-Freigabe-Gate und SDK-Retry.
- `VITE_PIANO_ENABLED=false` bleibt bewusst gesetzt.
- `VITE_PIANO_ESSENTIAL_APPROVED=false`: keine eigene pauschale Essential-Freigabe; Konfiguration erst nach Review ändern.
- Vor Produktivstellung: Data-Model-Registrierung, Consent-/Privacy-Review, Site/Collection-Check, SDK-Live-Test sowie Netzwerk-/Piano-Debugger-Abnahme.

Die Word-Spezifikation ist eine Soll-Definition des Quellcodes; der tatsächliche Piano-Eingang erfordert zwingend einen Test im freigegebenen Zielsystem.

- `VITE_PIANO_CUSTOM_VIDEO_EVENTS=false`: Drei optionale Videoevents bleiben bis zur A/V-Insights-Entscheidung deaktiviert.
