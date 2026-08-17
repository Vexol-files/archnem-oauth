// /api/user.js
export default async function handler(req, res) {
  try {
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(/token=([^;]+)/);
    const access_token = match ? decodeURIComponent(match[1]) : null;

    if (!access_token) return res.status(401).json({ error: "Missing session. Please log in." });

    if (process.env.BOT_TOKEN && access_token === process.env.BOT_TOKEN) {
      console.error("Security: received BOT_TOKEN as access_token");
      return res.status(400).json({ error: "Invalid token" });
    }

    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (userResp.status !== 200) {
      const body = await userResp.text();
      console.error("user fetch failed:", userResp.status, body);
      return res.status(401).json({ error: "Invalid session or token expired" });
    }

    const userData = await userResp.json();

    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) {
      console.error("Server misconfiguration: missing GUILD_ID or BOT_TOKEN");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

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
