// /api/bot/sendMessage.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

    const cookie = req.headers.cookie || "";
    const match = cookie.match(/token=([^;]+)/);
    const access_token = match ? decodeURIComponent(match[1]) : null;

    if (!access_token)
      return res.status(401).json({ error: "Missing session token" });

    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userData = await userResp.json();

    const memberResp = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`,
      { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
    );

    if (!memberResp.ok)
      return res.status(403).json({ error: "Not in guild" });

    const member = await memberResp.json();

    if (!member.roles.includes(process.env.OWNER_ROLE_ID))
      return res.status(403).json({ error: "Missing owner role" });

    const { channelId, content, mentionUserId, mentionRoleId, mentionEveryone, mentionHere } = req.body;

    if (!channelId || !content)
      return res.status(400).json({ error: "Missing channelId or content" });

    const mentions = [];

    if (mentionEveryone) mentions.push("@everyone");
    if (mentionHere) mentions.push("@here");
    if (mentionUserId) mentions.push(`<@${mentionUserId}>`);
    if (mentionRoleId) mentions.push(`<@&${mentionRoleId}>`);

    const finalContent = (mentions.length ? mentions.join(" ") + " " : "") + content;

    const msgResp = await fetch(
      `https://discord.com/api/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${process.env.BOT_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: finalContent })
      }
    );

    const msgData = await msgResp.json();

    if (!msgResp.ok)
      return res.status(msgResp.status).json({ error: "discord_error", body: msgData });

    return res.status(200).json({ ok: true, messageId: msgData.id });

  } catch (err) {
    return res.status(500).json({ error: "server_error", details: String(err) });
  }
}
