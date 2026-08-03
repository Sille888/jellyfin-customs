(() => {
  const SETTINGS = {
    href: "https://seerr.hawatschi.de/",
    text: "Filme Anfragen",
    icon: "local_movies",
    newTab: true,
  };

  function buildLink() {
    const a = document.createElement("a");
    a.href = SETTINGS.href;
    if (SETTINGS.newTab) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    // Absichtlich ohne is="emby-linkbutton" (Custom-Element-Upgrade-Risiko,
    // siehe CLAUDE.md) und ohne "lnkMediaFolder" (hängt vermutlich an einem
    // internen Klick-Handler für die Mediennavigation). Die reinen
    // CSS-Klassen reichen für die passende Optik in der Sidebar.
    a.className = "navMenuOption emby-button jf-seerr-link";
    a.innerHTML = `
      <span class="material-icons navMenuOptionIcon ${SETTINGS.icon}" aria-hidden="true"></span>
      <span class="navMenuOptionText">${SETTINGS.text}</span>`;
    return a;
  }

  function insert() {
    const slot = document.querySelector(".customMenuOptions");
    if (!slot || slot.querySelector(".jf-seerr-link")) return false;
    slot.appendChild(buildLink());
    return true;
  }

  if (insert()) return;

  // Sidebar existiert evtl. noch nicht beim Skriptstart -> einmalig warten,
  // danach nicht mehr nötig (die Drawer-Struktur wird nicht wie die
  // Home-Sektionen pro Navigation neu aufgebaut).
  const mo = new MutationObserver(() => {
    if (insert()) mo.disconnect();
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
