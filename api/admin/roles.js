export default async function handler(req, res) {
  try {
    const search = (req.query.search || "").toLowerCase();

    if (!search || search.length < 1)
      return res.status(200).json({ results: [], match: null });

    const resp = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/roles`,
      { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
    );

    const roles = await resp.json();

    const results = roles
      .filter(r => r.name.toLowerCase().includes(search))
      .slice(0, 20)
      .map(r => ({
        id: r.id,
        name: r.name,
        color: r.color
      }));

    return res.status(200).json({
      results,
      match: results.length > 0 ? results[0] : null
    });

  } catch (err) {
    return res.status(500).json({ error: "role_search_error", details: String(err) });
  }
}
