# CLAUDE.md

Kontext für Claude Code in diesem Repo.

## Projekt

Custom-JavaScript für eine Jellyfin-Weboberfläche. Die Skripte werden über das
**JavaScript Injector Plugin** geladen (nicht über einen `index.html`-Patch), und
zwar via kleinem Loader, der die Dateien dieses Repos von jsDelivr nachzieht.

- Jellyfin-Version: **10.11.11**
- Ziel: eigene Genre-Reihen, „Neueste"-Reihen, Sektions-Sortierung und
  Tab-Anpassungen auf der Startseite
- Kein zusätzliches Plugin für Genres — alles clientseitig

## Struktur


Jede Datei ist eine eigenständige IIFE. `01-core.js` stellt `window.JFHome` bereit;
Feature-Skripte registrieren sich mit
`JFHome.add(providerFn, order)` und fallen auf `window.JFHomeQueue` zurück, falls
sie vor dem Core laden. Ein Provider gibt Row-Objekte zurück:

```js
{ title: string, shape: "portrait"|"backdrop", items: Item[], href: string }
```

Niedrigere `order` = weiter oben. Aktuell: latest = 100, genres = 200.

## Fallstricke (teuer erkauft — bitte beachten)

### Custom Elements / webcomponents-Polyfill

Jellyfin nutzt den **v0-Polyfill** (`attachedCallback`, nicht `connectedCallback`).

- `customElements.upgrade()` ist die **native** API und hier wirkungslos bis
  schädlich. Nicht verwenden.
- Der Polyfill upgraded Teilbäume in **Dokumentreihenfolge**. Eine Exception in
  einem `attachedCallback` bricht die gesamte Schleife ab — alles danach im
  Teilbaum bleibt un-upgraded.
- Konkret: `emby-scrollbuttons` ruft im `attachedCallback`
  `addScrollEventListener()` auf dem `emby-scroller` auf. Steht es davor im DOM,
  ist der Scroller noch ein blankes `<div>` → `TypeError` → der nachfolgende
  `emby-itemscontainer` wird nie upgraded → **alle Overlay-Buttons tot**.
- Lösung: Section erst leer in den DOM hängen, dann `innerHTML` setzen (ohne
  Scrollbuttons), dann warten bis `scroller.addScrollEventListener` existiert und
  die Scrollbuttons per `insertAdjacentHTML("beforebegin", …)` nachziehen.

Prüfen, ob ein Container korrekt upgraded ist:

```js
document.querySelectorAll(".customJfRow").forEach(s =>
  console.log(s.dataset.rowTitle,
    typeof s.querySelector(".itemsContainer").notifyRefreshNeeded));
// "function" = ok, "undefined" = Upgrade fehlgeschlagen
```

### Startseite / Lebenszyklus

- Klick auf das **Haus-Icon leert** den `homeSectionsContainer`, behält das
  Element aber. Ein `data-*`-Flag auf dem Container überlebt das und blockiert
  jeden weiteren Lauf. Stattdessen prüfen, ob die eigenen Reihen noch im DOM
  hängen (`home.querySelector(".customJfRow")`).
- **Zurücknavigieren** restauriert die View aus dem Cache — Reihen sind dann noch da.
- Jellyfin hält alte Home-Container versteckt im DOM: immer
  `.homeSectionsContainer:not(.hide)` selektieren.
- MutationObserver **immer debouncen** (~80–150 ms). Ohne Debounce feuert er
  hunderte Male pro Sekunde.
- Nach `await` prüfen, ob `home.isConnected` noch stimmt — die Seite kann
  zwischenzeitlich neu gebaut worden sein.

### Karten-Markup

Die nativen Klassen 1:1 nachbauen, dann kommt das Styling von Jellyfin:

- `cardPadder` + `cardPadder-overflowPortrait` erzeugt die 2:3-Höhe. Ohne ihn
  kollabieren die Karten.
- Overlay-Buttons brauchen korrekte `data-id`, `data-serverid`, `data-itemtype`,
  sonst laufen die delegierten Handler ins Leere.
- Bild-URLs **immer mit `tag`** aus `ImageTags.Primary` bauen, sonst wird der
  serverseitige Thumbnail-Cache umgangen.

### Genre-Namen

Genres sind rohe Metadaten-Strings, **Jellyfin übersetzt sie nicht**. Die
Metadatensprache der Bibliothek entscheidet. Bei gemischt gescannten Bibliotheken
existieren „Komödie" und „Comedy" als getrennte Genres mit eigenen IDs.

Deshalb arbeitet `02-genres.js` mit `aliases`; mehrere Namen werden per `|` an den
`Genres`-Parameter übergeben (ODER-Verknüpfung).

Vorhandene Genres auflisten:

```js
ApiClient.getJSON(ApiClient.getUrl("Genres", {
  userId: ApiClient.getCurrentUserId(), Recursive: true, EnableImages: false
})).then(r => console.table(r.Items.map(g => ({ Name: g.Name, Id: g.Id }))));
```

### Sonstiges

- **Keine** `localStorage`/`sessionStorage`-Annahmen — läuft zwar hier, aber State
  gehört in Modulvariablen.
- Tabs sprachunabhängig über `:nth-child`-Indizes ausblenden, nicht über Labels.
- Ausblenden generell lieber über ein einzelnes injiziertes `<style>` als über
  Inline-Styles auf N Elementen: kein Timing-Problem, kein Reflow pro Element.

## Deployment

Loader im Injector-Feld zieht die Dateien von jsDelivr:

```
https://cdn.jsdelivr.net/gh/<USER>/jellyfin-custom@<REF>/js/<FILE>
```

- `@main` wird **7 Tage** gecached — beim Entwickeln unbrauchbar.
- Produktiv: Git-Tag setzen (`git tag v1.1.0 && git push --tags`) und im Loader
  referenzieren. Unveränderlich, also optimal cachebar.
- Cache leeren: `https://purge.jsdelivr.net/gh/<USER>/jellyfin-custom@main/js/<FILE>`

**Beim Entwickeln:** `raw.githubusercontent.com` lässt sich nicht per
`<script src>` laden (liefert `text/plain` + `nosniff` → Chrome blockt). Stattdessen
`fetch` + `(0, eval)(code + "\n//# sourceURL=" + file)` mit `cache: "no-store"`.

Eigenes Hosting unter `/customs/` auf dem Reverse Proxy wurde versucht und wieder
verworfen — der `location`-Block riss die Site mit `ERR_SSL_UNRECOGNIZED_NAME_ALERT`
ab. Nicht ohne Not erneut probieren.

## Konventionen

- Deutsche Kommentare und UI-Strings
- Konfiguration als Objekt/Array am Dateianfang, klar abgesetzt
- Kein Build-Step, kein Bundler — die Dateien werden so ausgeliefert wie sie sind
- Zielbrowser ist aktuelles Chrome; `?.`, `??=`, `:has()` sind erlaubt