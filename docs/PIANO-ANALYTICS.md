# Piano Analytics – med.i.tap Template v15

Stand: 08.09.2026

## Zielbild

Das Template nutzt für die fachlichen Interaktionen möglichst die bereits vorhandene Vidal-/Gelbe-Liste-Semantik:

- `page.display` für Home, Contact und virtuelle Modul-/Screen-Ansichten
- `click.action` für Modul-, CTA-, PDF-, Contact-, Navigation- und PWA-Interaktionen
- `pop_in.display` für sichtbare Modul-Kacheln und PWA-Hinweise

Für med.i.tap werden im MVP **keine neuen Custom Events** benötigt.

## Bereits vorhandene Properties, die wiederverwendet werden

`page`, `page_url`, `de_page_category`, `de_page_tags`, `product_name`, `product_mol`, `product_titulaire`, `product_ATC_class_code`, `product_ATC_class_name`, `product_UCD10_codes`, `page_type`, `visitor_type`, `article_category`, `pop_in_name`, `pop_in_type`, `click`.

Produkt-Properties werden nur gesetzt, wenn sie projektbezogen in `src/content.ts` gepflegt sind. `user_id`, `occupation`, `speciality_function` und `exercise_mode` werden im anonymen Standalone-Template nicht erzeugt oder abgeleitet.

## Neue Custom Properties für med.i.tap

Vor Produktivsetzung im Piano Data Model validieren/anlegen:

| Key | Typ | Zweck |
| --- | --- | --- |
| `project_id` | STRING | stabile ID des Kunden-/Content-Projekts |
| `module_id` | STRING | stabile ID einer Kachel / eines Inhaltsmoduls |
| `module_title` | STRING | redaktioneller Modultitel |
| `screen_id` | STRING | stabile ID eines Screens im Modul |
| `screen_number` | INTEGER | Screen-Reihenfolge |
| `screen_title` | STRING | sichtbare Screen-Bezeichnung |
| `document_id` | STRING | stabile ID eines Downloads/PDFs |
| `element_id` | STRING | stabile ID eines CTA/Links |
| `destination_path` | STRING | bereinigtes Ziel ohne Query-Parameter |
| `entry_point` | STRING | `nfc_tag`, `qr_code`, `direct_link` bzw. freigegebene Quelle |
| `standalone_mode` | BOOLEAN | Öffnung aus gespeichertem Home-Screen-Direktzugriff |
| `install_outcome` | STRING | Ergebnis des nativen Speicher-/Install-Prompts |
| `trigger_source` | STRING | z. B. `header`, `module_screen`, `install_card` |

## Zentrale Konfiguration

In `.env` / Vercel Environment Variables:

```env
VITE_PIANO_ENABLED=true
VITE_PIANO_SITE_ID=640794
VITE_PIANO_COLLECT_DOMAIN=https://rwwnhth.pa-cd.com
```

Im Mastertemplate bleibt `VITE_PIANO_ENABLED=false`, damit lokale Entwicklungs- und Preview-Aufrufe nicht ungeprüft in die Produktivdaten laufen.

Projektwerte werden in `src/content.ts` gepflegt (`hubConfig.analytics`, Modul-Analytics und CTA-IDs). Das Tracking selbst liegt zentral in `src/tracking/piano.ts`.

## Consent / essential

Die technische Konfiguration spiegelt die vorhandene Gelbe-Liste-Logik (`requireConsent=true`, PA=`essential`). Neue med.i.tap-Properties werden in `pdl.consent_items.PA.properties` technisch vorbereitet. Die Einstufung als `essential` muss vor Livegang von Vidal Analytics/Datenschutz freigegeben sein.

Wichtig: `_pac.cookieDomain = ".gelbe-liste.de"` wird nur gesetzt, wenn die Anwendung tatsächlich auf `gelbe-liste.de` bzw. einer Subdomain läuft. Auf `*.vercel.app` wird diese Cookie-Domain nicht erzwungen.

## QA vor Livegang

1. Neue Properties im Piano Data Model validieren.
2. `VITE_PIANO_ENABLED=true` im produktiven Vercel-Projekt setzen.
3. Tag Inspector / Network prüfen: `page.display`, `click.action`, `pop_in.display`.
4. Home → Modul → Screen → CTA/PDF → Contact testen.
5. `?src=nfc`, `?src=qr` und Direkteinstieg prüfen.
6. PWA-Standalone-Modus auf iOS/Android gegen Browser-Aufruf prüfen.
7. Sicherstellen, dass keine `user_id`, E-Mail, Namen oder frei eingegebenen Daten übertragen werden.
