(() => {
  // "Kürzlich hinzugefügt in <Bibliothek>"-Reihen erkennen: Jellyfin verlinkt
  // ihren "mehr"-Pfeil auf den Vorschläge-Tab der jeweiligen Bibliotheksseite
  // ("...?topParentId=...&tab=1"). Sprachunabhängig, anders als der Titeltext.
  const css = document.createElement("style");
  css.textContent = `
    .homeSectionsContainer .verticalSection:has(.sectionTitleContainer a[href$="&tab=1"]) {
      display: none !important;
    }`;
  document.head.appendChild(css);
})();
