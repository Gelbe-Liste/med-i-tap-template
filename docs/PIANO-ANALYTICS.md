# Piano Analytics – med.i.tap Zielstand 08.10.2026 (Mapping v1.2)

## Klassifikation

- `page_type`: `med.i.tap`
- `article_category`: `Content Hub` als neutraler Template-Pagetype; in Kundenprojekten ausschließlich Werte aus der Vidal-Liste „Pagetypes / Templates“ verwenden.
- `de_page_category`: im Mastertemplate `Content Hub` als Content Type; Specialty projektspezifisch aus der Vidal-Liste ergänzen.
- `is_PAP`: `1`
- `visitor_type`: `Not logged`

## Acquisition / UTM

Die frühere Custom-Property `entry_point` wurde entfernt. NFC-, QR- und Direct-Link-Attribution wird über die bereits in Piano vorhandenen Dimensionen **UTM Medium**, **UTM Source** und **UTM Campaign** abgebildet. Die konkrete Wertelogik wird zentral mit Vidal Analytics/Marketing festgelegt.

## Product Properties

`product_*` wird im Template nicht redaktionell befüllt. Diese Properties dürfen nur bei einer Pharmindex-API-Verknüpfung mit exakt den von MMI gelieferten Werten gesendet werden. `box_names` ist Medibox-spezifisch und wird nicht verwendet.

## Events

med.i.tap verwendet keine neuen Custom Events für den MVP: `page.display`, `click.action` und `pop_in.display`.

## Deployment

Tracking bleibt mit `VITE_PIANO_ENABLED=false` deaktiviert. Aktivierung erst nach Data-Model-, Privacy-/Essential- und Staging-QA. Site: `640794`, Collection Domain: `https://rwwnhth.pa-cd.com`.
