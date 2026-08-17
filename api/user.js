// /api/user.js (bezpieczny)
export default async function handler(req, res) {
  try {
    const access_token = req.query.access_token || (req.headers.cookie || "").match(/archnem_token1=([^;]+)/)?.[1];

    if (!access_token) return res.status(400).json({ error: "Missing access_token" });

    // SECURITY: reject if frontend accidentally passed BOT_TOKEN
    if (process.env.BOT_TOKEN && access_token === process.env.BOT_TOKEN) {
      console.error("Security: frontend provided BOT_TOKEN as access_token");
      return res.status(400).json({ error: "Invalid token" });
    }

    // fetch user
    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (userResp.status !== 200) {
      const body = await userResp.text();
      return res.status(400).json({ error: "Invalid access_token", details: body });
    }

    const userData = await userResp.json();

    // ensure env present
    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) {
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    // fetch guild member using BOT_TOKEN (server-side only)
    const guildResp = await fetch(`https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });

    if (guildResp.status !== 200) {
      return res.status(200).json({
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar ?? null,
        roles: []
      });
    }

    const guildBody = await guildResp.json();
    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar ?? null,
      roles: Array.isArray(guildBody.roles) ? guildBody.roles : []
    });
  } catch (err) {
    console.error("user.js error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
