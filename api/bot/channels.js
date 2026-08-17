// /api/bot/channels.js
export default async function handler(req, res) {
  try {
    const resp = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/channels`,
      { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
    );

    const channels = await resp.json();

    const filtered = channels
      .filter(ch => ch.type !== 4) // bez kategorii
      .filter(ch => ch.name !== "modchannels"); // wywal konkretną kategorię po nazwie

    const mapped = filtered.map(ch => ({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      typeName:
        ch.type === 0 ? "Text" :
        ch.type === 2 ? "Voice" :
        ch.type === 5 ? "Announcement" :
        ch.type === 15 ? "Forum" :
        ch.type === 12 ? "Stage" :
        ch.type === 14 ? "Thread" :
        "Other"
    }));

    return res.status(200).json({ channels: mapped });

  } catch (err) {
    return res.status(500).json({ error: "channel_fetch_error", details: String(err) });
  }
}
