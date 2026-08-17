export default async function handler(req, res) {
  try {
    const search = (req.query.search || "").toLowerCase();

    if (!search || search.length < 1)
      return res.status(200).json({ results: [], match: null });

    // pobieramy członków z paginacją (gotowe do 5000+)
    let after = null;
    let allMembers = [];

    while (true) {
      const url = new URL(
        `https://discord.com/api/guilds/${process.env.GUILD_ID}/members`
      );
      url.searchParams.set("limit", "1000");
      if (after) url.searchParams.set("after", after);

      const resp = await fetch(url, {
        headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
      });

      const chunk = await resp.json();
      if (!Array.isArray(chunk) || chunk.length === 0) break;

      allMembers.push(...chunk);
      after = chunk[chunk.length - 1].user.id;

      if (chunk.length < 1000) break;
    }

    // fuzzy search: 1 znak mniej niż pełna nazwa
    const results = allMembers
      .filter(m => {
        const name = m.user.username.toLowerCase();
        const nick = (m.nick || "").toLowerCase();
        return (
          name.includes(search) ||
          nick.includes(search) ||
          name.startsWith(search) ||
          nick.startsWith(search)
        );
      })
      .slice(0, 20) // limit wyników
      .map(m => ({
        id: m.user.id,
        username: m.user.username,
        discriminator: m.user.discriminator,
        nick: m.nick || null
      }));

    return res.status(200).json({
      results,
      match: results.length > 0 ? results[0] : null
    });

  } catch (err) {
    return res.status(500).json({ error: "member_search_error", details: String(err) });
  }
}
