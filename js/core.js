(() => {
  if (window.JFHome) return;

  const SHAPES = {
    portrait: {
      cls: "overflowPortraitCard",
      padder: "cardPadder-overflowPortrait",
      w: 220,
      h: 330,
      imgType: "Primary",
    },
    backdrop: {
      cls: "overflowBackdropCard",
      padder: "cardPadder-overflowBackdrop",
      w: 400,
      h: 225,
      imgType: "Backdrop",
    },
  };

  const FIELDS = "PrimaryImageAspectRatio,ProductionYear,ChildCount";
  const IMAGES = "Primary,Backdrop,Thumb";

  function imgUrl(i, s) {
    if (s.imgType === "Backdrop" && i.BackdropImageTags?.length)
      return ApiClient.getImageUrl(i.Id, {
        type: "Backdrop",
        index: 0,
        fillWidth: s.w,
        fillHeight: s.h,
        quality: 96,
        tag: i.BackdropImageTags[0],
      });
    if (s.imgType === "Backdrop" && i.ImageTags?.Thumb)
      return ApiClient.getImageUrl(i.Id, {
        type: "Thumb",
        fillWidth: s.w,
        fillHeight: s.h,
        quality: 96,
        tag: i.ImageTags.Thumb,
      });
    return ApiClient.getImageUrl(i.Id, {
      type: "Primary",
      fillWidth: s.w,
      fillHeight: s.h,
      quality: 96,
      tag: i.ImageTags?.Primary,
    });
  }

  const card = (i, sid, s) => `
<div data-isfolder="${!!i.IsFolder}" data-serverid="${sid}" data-id="${i.Id}"
     data-type="${i.Type}" data-mediatype="${i.MediaType || "Unknown"}" data-context="home"
     class="card ${s.cls} card-hoverable ${i.IsFolder ? "groupedCard " : ""}card-withuserdata">
  <div class="cardBox cardBox-bottompadded">
    <div class="cardScalable">
      <div class="cardPadder ${s.padder} lazy-hidden-children">
        <span class="cardImageIcon material-icons tv" aria-hidden="true"></span>
      </div>
      <a href="#/details?id=${i.Id}&serverId=${sid}" data-action="link"
         class="cardImageContainer coveredImage cardContent itemAction"
         aria-label="${i.Name}" role="img"
         style="background-image:url('${imgUrl(i, s)}')">
        ${i.ChildCount ? `<div class="cardIndicators"><div class="countIndicator indicator">${i.ChildCount}</div></div>` : ""}
      </a>
      <div class="cardOverlayContainer itemAction" data-action="link">
        <button is="paper-icon-button-light" class="cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light cardOverlayFab-primary" data-action="resume" title="Abspielen">
          <span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover play_arrow" aria-hidden="true"></span>
        </button>
        <div class="cardOverlayButton-br flex">
          <button is="emby-playstatebutton" type="button" data-action="none"
                  class="cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light emby-button"
                  data-id="${i.Id}" data-serverid="${sid}" data-itemtype="${i.Type}"
                  data-played="${!!i.UserData?.Played}" title="Markiere als &quot;gesehen&quot;">
            <span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover check playstatebutton-icon-${i.UserData?.Played ? "played" : "unplayed"}" aria-hidden="true"></span>
          </button>
          <button is="emby-ratingbutton" type="button" data-action="none"
                  class="cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light emby-button"
                  data-id="${i.Id}" data-serverid="${sid}" data-itemtype="${i.Type}"
                  data-likes="${i.UserData?.Likes ?? ""}" data-isfavorite="${!!i.UserData?.IsFavorite}"
                  title="Zu Favoriten hinzufügen">
            <span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover favorite" aria-hidden="true"></span>
          </button>
          <button is="paper-icon-button-light" class="cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light" data-action="menu" title="Mehr">
            <span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover more_vert" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </div>
    <div class="cardText cardTextCentered cardText-first"><bdi>
      <a href="#/details?id=${i.Id}&serverId=${sid}" data-id="${i.Id}" data-serverid="${sid}"
         data-type="${i.Type}" data-isfolder="${!!i.IsFolder}" data-action="link"
         class="itemAction textActionButton" title="${i.Name}">${i.Name}</a>
    </bdi></div>
    <div class="cardText cardTextCentered cardText-secondary"><bdi>${i.ProductionYear ?? ""}</bdi></div>
  </div>
</div>`;

  async function renderRow(home, row, providerId) {
    if (!row?.items?.length || !home.isConnected) return;
    const sid = ApiClient.serverId();
    const s = SHAPES[row.shape] || SHAPES.portrait;

    const sec = document.createElement("div");
    sec.className = "verticalSection emby-scroller-container customJfRow";
    sec.dataset.rowTitle = row.title;
    sec.dataset.providerId = providerId;
    home.appendChild(sec);

    sec.innerHTML = `
<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">
  <a is="emby-linkbutton" href="${row.href || "#"}"
     class="more button-flat button-flat-mini sectionTitleTextButton emby-button">
    <h2 class="sectionTitle sectionTitle-cards">${row.title}</h2>
    <span class="material-icons chevron_right" aria-hidden="true"></span>
  </a>
</div>
<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale emby-scroller"
     data-centerfocus="true" data-scroll-mode-x="custom">
  <div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">
    ${row.items.map((i) => card(i, sid, s)).join("")}
  </div>
</div>`;

    const scroller = sec.querySelector(".emby-scroller");
    for (let n = 0; n < 60; n++) {
      if (typeof scroller.addScrollEventListener === "function") {
        scroller.insertAdjacentHTML(
          "beforebegin",
          '<div is="emby-scrollbuttons" class="emby-scrollbuttons padded-right"></div>',
        );
        break;
      }
      await new Promise((r) => requestAnimationFrame(r));
    }
  }

  // ── Provider-Registry ──────────────────────────────────────────
  const providers = [];
  let nextProviderId = 0;
  function add(fn, order = 100) {
    providers.push({ fn, order, id: nextProviderId++ });
    providers.sort((a, b) => a.order - b.order);
  }

  // Helfer für die Feature-Skripte
  const helpers = {
    uid: () => ApiClient.getCurrentUserId(),
    sid: () => ApiClient.serverId(),
    FIELDS,
    IMAGES,
    async items(query) {
      return ApiClient.getItems(ApiClient.getCurrentUserId(), {
        Recursive: true,
        ImageTypeLimit: 1,
        EnableImageTypes: IMAGES,
        Fields: FIELDS,
        ...query,
      });
    },
    async views() {
      const r = await ApiClient.getUserViews({}, ApiClient.getCurrentUserId());
      return r.Items;
    },
    async viewId(collectionType) {
      const v = await helpers.views();
      return v.find((x) => x.CollectionType === collectionType)?.Id;
    },
    _genreMapPromise: null,
    async genreId(name) {
      // Promise selbst cachen, nicht erst das Ergebnis: sonst lösen mehrere
      // parallele genreId()-Aufrufe (z.B. aus genres.js) je einen eigenen
      // Genres-Request aus, solange der erste noch läuft.
      helpers._genreMapPromise ??= ApiClient.getJSON(
        ApiClient.getUrl("Genres", {
          userId: ApiClient.getCurrentUserId(),
          Recursive: true,
          EnableImages: false,
        }),
      ).then((r) => new Map(r.Items.map((g) => [g.Name.toLowerCase(), g.Id])));
      const map = await helpers._genreMapPromise;
      return map.get(name.toLowerCase());
    },
    shuffle(a) {
      const r = a.slice();
      for (let i = r.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [r[i], r[j]] = [r[j], r[i]];
      }
      return r;
    },
  };

  // ── Lauf-Steuerung ─────────────────────────────────────────────
  let busy = false,
    timer = null;

  async function run() {
    if (busy) return;
    if (!location.hash.startsWith("#/home")) return;
    const home = document.querySelector(".homeSectionsContainer:not(.hide)");
    if (!home) return;

    // Pro Provider am DOM prüfen, nicht an einem Flag: Provider ohne eigene
    // Reihe(n) im DOM werden erneut versucht (z.B. nach einem transienten
    // Fehler), Provider mit Reihe(n) übersprungen. Nach dem Leeren des
    // Containers (Haus-Icon-Klick, Container bleibt aber erhalten) sind
    // automatisch alle Tags weg -> alles läuft sauber neu an.
    const pending = providers.filter(
      (p) => !home.querySelector(`.customJfRow[data-provider-id="${p.id}"]`),
    );
    if (!pending.length) return; // alle Provider haben schon Reihen im DOM

    busy = true;
    try {
      // Alle offenen Provider parallel abfragen (unabhängige API-Calls),
      // die Reihen aber weiterhin sequenziell in Provider-Reihenfolge rendern.
      const results = await Promise.all(
        pending.map((p) =>
          p.fn(helpers).catch((e) => {
            console.warn(
              "[JFHome] Provider-Fehler, wird beim nächsten Lauf erneut versucht:",
              e,
            );
            return [];
          }),
        ),
      );
      if (!home.isConnected) return; // Seite wurde neu gebaut
      for (let i = 0; i < pending.length; i++) {
        for (const row of [].concat(results[i] || []))
          await renderRow(home, row, pending[i].id);
      }
    } finally {
      busy = false;
    }
  }

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, 80);
  };
  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("hashchange", schedule);

  window.JFHome = { add, helpers, renderRow, SHAPES };

  // Skripte, die vor dem Core geladen wurden, nachziehen
  (window.JFHomeQueue || []).forEach(([fn, order]) => add(fn, order));
  window.JFHomeQueue = { push: ([fn, order]) => add(fn, order) };
  schedule();
})();
