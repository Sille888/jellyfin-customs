(() => {
  const SETTINGS = {
    enabled: true,
    limit: 16,
    shape: "portrait",
    candidatePool: 10, // aus den letzten N gesehenen Titeln wird zufällig einer gewählt
    minItems: 4, // weniger Treffer -> Reihe überspringen (lieber keine Reihe als eine dünne)
  };

  async function provider(h) {
    if (!SETTINGS.enabled) return null;

    const recent = await h.items({
      Filters: "IsPlayed",
      IncludeItemTypes: "Movie,Series",
      SortBy: "DatePlayed",
      SortOrder: "Descending",
      Limit: SETTINGS.candidatePool,
    });
    if (!recent.Items.length) return null;

    // Nicht immer denselben Titel als Aufhänger nehmen, sondern zufällig aus
    // dem Pool der zuletzt gesehenen wählen.
    const source = h.shuffle(recent.Items)[0];

    const similar = await ApiClient.getJSON(
      ApiClient.getUrl(`Items/${source.Id}/Similar`, {
        userId: h.uid(),
        limit: SETTINGS.limit,
        fields: h.FIELDS,
      }),
    );
    if (!similar.Items?.length || similar.Items.length < SETTINGS.minItems)
      return null;

    return {
      title: `Weil du „${source.Name}" gesehen hast`,
      shape: SETTINGS.shape,
      // Der Similar-Endpoint hält "limit" serverseitig nicht zuverlässig ein
      // -> hier zusätzlich clientseitig kappen.
      items: similar.Items.slice(0, SETTINGS.limit),
      href: `#/details?id=${source.Id}&serverId=${h.sid()}`,
    };
  }

  (window.JFHome?.add ?? ((f, o) => (window.JFHomeQueue ??= []).push([f, o])))(
    provider,
    150, // zwischen "Neueste" (100) und Genres (200)
  );
})();
