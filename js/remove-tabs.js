(() => {
  const LIBRARIES = {
    "7a2175bccb1f1a94152cbd2b2bae8f6d": { hideTabs: [0, 2, 3] }, // Filme: Tab-Indizes
    "43cfe12fe7d9d8d21251e0964e0232e2": { hideAll: true }, // Serien
  };

  const STYLE_ID = "jf-tab-hider";
  let current = null;

  function parentIdFromHash() {
    const q = location.hash.split("?")[1];
    if (!q) return null;
    const p = new URLSearchParams(q);
    return p.get("topParentId") || p.get("parentId") || p.get("id");
  }

  function apply() {
    const id = parentIdFromHash();
    const cfg = LIBRARIES[id];
    const key = cfg ? id : "none";
    if (key === current) return; // nichts geändert -> raus
    current = key;

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    if (!cfg) {
      style.textContent = "";
      return;
    }

    if (cfg.hideAll) {
      style.textContent = ".headerTabs { display: none !important; }";
      return;
    }

    style.textContent =
      cfg.hideTabs
        .map((i) => `.emby-tabs-slider .emby-tab-button:nth-child(${i + 1})`)
        .join(",") + " { display: none !important; }";
  }

  let t = null;
  const schedule = () => {
    clearTimeout(t);
    t = setTimeout(apply, 100);
  };

  window.addEventListener("hashchange", schedule);
  new MutationObserver(schedule).observe(document.body, { childList: true });
  apply();
})();
