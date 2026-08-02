(() => {
  const css = document.createElement("style");
  css.textContent = `
    .homeSectionsContainer .verticalSection:has(.card[data-type="CollectionFolder"]),
    .homeSectionsContainer .verticalSection:has(.card[data-type="UserView"]) {
      display: none !important;
    }`;
  document.head.appendChild(css);
})();
