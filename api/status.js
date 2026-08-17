// /api/status.js
export default async function handler(req, res) {
  try {
    const resp = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/channels`,
      { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
    );

    const channels = await resp.json();

    const ids = [
      "1532746207040897155", // free
      "1534247246856458404", // premium
      "1536372284644655165"  // beta
    ];

    const map = {};
    for (const ch of channels) {
      if (!ids.includes(ch.id)) continue;

      const name = ch.name; // np. "Free Status (🔵)"
      const dotMatch = name.match(/🔴|🟢|🟡|🟣|🔵/);
      const dot = dotMatch ? dotMatch[0] : null;

      let state = "Unknown";
      let color = "#6b7280";

      if (dot === "🟢") { state = "Working"; color = "#22c55e"; }
      if (dot === "🟡") { state = "Use at your own risk"; color = "#eab308"; }
      if (dot === "🟣") { state = "Bugged"; color = "#a855f7"; }
      if (dot === "🔵") { state = "Updating"; color = "#3b82f6"; }
      if (dot === "🔴") { state = "Down"; color = "#ef4444"; }

      map[ch.id] = {
        id: ch.id,
        rawName: ch.name,
        dot,
        state,
        color
      };
    }

    return res.status(200).json({ statuses: map });

  } catch (err) {
    return res.status(500).json({ error: "status_fetch_error", details: String(err) });
  }
}
