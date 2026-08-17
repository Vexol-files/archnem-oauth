export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

    const { channelId, content } = req.body;

    if (!channelId || !content)
      return res.status(400).json({ error: "Missing channelId or content" });

    const resp = await fetch(
      `https://discord.com/api/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${process.env.BOT_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      }
    );

    const data = await resp.json();

    if (!resp.ok)
      return res.status(resp.status).json({ error: "discord_error", body: data });

    return res.status(200).json({ ok: true, messageId: data.id });

  } catch (err) {
    return res.status(500).json({ error: "send_error", details: String(err) });
  }
}
