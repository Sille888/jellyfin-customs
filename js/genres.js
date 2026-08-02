(() => {
  const SETTINGS = {
    shuffleOrder: true,
    randomHide: true,
    showChance: 0.35,
    maxRows: 10,
    minRows: 5,
  };

  const CONFIG = [
    { genre: "Action", aliases: ["Action"] },
    { genre: "Abenteuer", aliases: ["Abenteuer", "Adventure"] },
    { genre: "Animation", aliases: ["Animation"] },
    { genre: "Komödie", aliases: ["Komödie", "Comedy"] },
    { genre: "Krimi", aliases: ["Krimi", "Crime"] },
    { genre: "Dokumentation", aliases: ["Dokumentation", "Documentary"] },
    { genre: "Drama", aliases: ["Drama"] },
    { genre: "Familie", aliases: ["Familie", "Family"] },
    { genre: "Fantasy", aliases: ["Fantasy"] },
    { genre: "Horror", aliases: ["Horror"] },
    { genre: "Mystery", aliases: ["Mystery"] },
    { genre: "Liebesfilm", aliases: ["Liebesfilm", "Romance"] },
    {
      genre: "Science Fiction",
      aliases: ["Science Fiction", "Sci-Fi & Fantasy"],
    },
    { genre: "Thriller", aliases: ["Thriller"] },
    { genre: "Kriegsfilm", aliases: ["Kriegsfilm", "War", "War & Politics"] },
  ];

  const TYPES = "Movie,Series";
  const DEFAULT_LIMIT = 16;
  const DEFAULT_SHAPE = "portrait";

  function pick(h) {
    let list = SETTINGS.shuffleOrder ? h.shuffle(CONFIG) : CONFIG.slice();
    if (SETTINGS.randomHide) {
      const pinned = list.filter((c) => c.pinned);
      let rest = list.filter(
        (c) => !c.pinned && Math.random() < SETTINGS.showChance,
      );
      const need = (SETTINGS.minRows ?? 0) - (pinned.length + rest.length);
      if (need > 0) {
        const pool = list.filter((c) => !c.pinned && !rest.includes(c));
        rest = rest.concat(h.shuffle(pool).slice(0, need));
      }
      const keep = new Set([...pinned, ...rest]);
      list = list.filter((c) => keep.has(c));
    }
    if (SETTINGS.maxRows) list = list.slice(0, SETTINGS.maxRows);
    return list;
  }

  async function provider(h) {
    // Alle gewählten Genres parallel abfragen statt nacheinander — bei
    // maxRows: 10 sonst zehn sequenzielle Roundtrips. Promise.all erhält
    // die Reihenfolge, die Zeilenreihenfolge bleibt also wie von pick()
    // vorgegeben.
    const rows = await Promise.all(
      pick(h).map(async (cfg) => {
        const names = cfg.aliases ?? [cfg.genre];
        const q = {
          Genres: names.join("|"),
          IncludeItemTypes: TYPES,
          Limit: cfg.limit ?? DEFAULT_LIMIT,
          SortBy: "Random",
        };
        if (cfg.parentId) q.ParentId = cfg.parentId;

        const res = await h.items(q);
        if (!res.Items.length) return null;

        let gid;
        for (const n of names) {
          gid = await h.genreId(n);
          if (gid) break;
        }

        return {
          title: cfg.genre,
          shape: cfg.shape ?? DEFAULT_SHAPE,
          items: res.Items,
          href: gid
            ? `#/list?genreId=${gid}&serverId=${h.sid()}` +
              (cfg.parentId ? `&parentId=${cfg.parentId}` : "")
            : `#/search?query=${encodeURIComponent(cfg.genre)}`,
        };
      }),
    );
    return rows.filter(Boolean);
  }

  (window.JFHome?.add ?? ((f, o) => (window.JFHomeQueue ??= []).push([f, o])))(
    provider,
    200,
  );
})();
