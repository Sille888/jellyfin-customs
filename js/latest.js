(() => {
  const SETTINGS = {
    movies: {
      enabled: true,
      title: "Neueste Filme",
      limit: 13,
      shape: "portrait",
    },
    series: {
      enabled: true,
      title: "Neueste Serien",
      limit: 13,
      shape: "portrait",
    },
    maxAgeDays: null, // z.B. 365 = nur letztes Jahr, null = ohne Grenze
  };

  const SORT = "PremiereDate,ProductionYear,SortName";

  async function build(h, kind, cfg, collectionType, itemType, route) {
    if (!cfg.enabled) return null;
    const parentId = await h.viewId(collectionType);
    if (!parentId) return null;

    const q = {
      ParentId: parentId,
      IncludeItemTypes: itemType,
      Limit: cfg.limit,
      SortBy: SORT,
      SortOrder: "Descending",
    };
    if (SETTINGS.maxAgeDays) {
      const d = new Date(Date.now() - SETTINGS.maxAgeDays * 864e5);
      q.MinPremiereDate = d.toISOString();
    }

    const res = await h.items(q);
    if (!res.Items.length) return null;

    return {
      title: cfg.title,
      shape: cfg.shape,
      items: res.Items,
      href: `#/${route}?topParentId=${parentId}`,
    };
  }

  async function provider(h) {
    const rows = await Promise.all([
      build(h, "movies", SETTINGS.movies, "movies", "Movie", "movies"),
      build(h, "series", SETTINGS.series, "tvshows", "Series", "tv"),
    ]);
    return rows.filter(Boolean);
  }

  (window.JFHome?.add ?? ((f, o) => (window.JFHomeQueue ??= []).push([f, o])))(
    provider,
    100,
  );
})();
