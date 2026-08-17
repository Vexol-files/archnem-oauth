// TEMP DEBUG - /api/user.js
export default async function handler(req, res) {
  try {
    const debug = true; // debug zawsze włączony tylko tymczasowo

    // 1) Pobierz token z cookie 'token' lub z query jako fallback (tylko do debug)
    const cookieHeader = req.headers.cookie || "";
    const cookieMatch = cookieHeader.match(/token=([^;]+)/);
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
    const queryToken = req.query.access_token || req.query.token || null;
    const access_token = cookieToken || queryToken;

    // 2) Zbierz info o ENV (bez ujawniania wartości)
    const envInfo = {
      CLIENT_ID: !!process.env.CLIENT_ID,
      CLIENT_SECRET: !!process.env.CLIENT_SECRET,
      REDIRECT_URI: !!process.env.REDIRECT_URI,
      GUILD_ID: !!process.env.GUILD_ID,
      BOT_TOKEN: !!process.env.BOT_TOKEN,
      FORCE_URL_TOKEN: process.env.FORCE_URL_TOKEN === "true"
    };

    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token", env: envInfo });
    }

    // 3) Reject if token equals BOT_TOKEN (safety)
    if (process.env.BOT_TOKEN && access_token === process.env.BOT_TOKEN) {
      console.error("Security: provided token equals BOT_TOKEN");
      return res.status(400).json({ error: "Invalid token (bot token provided)", env: envInfo });
    }

    // 4) Fetch /users/@me
    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userText = await userResp.text();
    let userData = null;
    try { userData = JSON.parse(userText); } catch(e) { userData = { raw: userText }; }

    if (userResp.status !== 200) {
      return res.status(400).json({
        error: "Discord /users/@me failed",
        discordStatus: userResp.status,
        discordBody: userData,
        env: envInfo
      });
    }

    // 5) If env missing, return debug info
    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) {
      return res.status(500).json({
        error: "Server misconfiguration",
        missing: { GUILD_ID: !!process.env.GUILD_ID, BOT_TOKEN: !!process.env.BOT_TOKEN },
        user: { id: userData.id, username: userData.username, discriminator: userData.discriminator },
        env: envInfo
      });
    }

    // 6) Fetch guild member
    const guildUrl = `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`;
    const guildResp = await fetch(guildUrl, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });
    const guildText = await guildResp.text();
    let guildBody = null;
    try { guildBody = JSON.parse(guildText); } catch(e) { guildBody = { raw: guildText }; }

    if (guildResp.status !== 200) {
      return res.status(200).json({
        note: "Bot cannot fetch guild member or lacks permissions",
        guildStatus: guildResp.status,
        guildBody,
        user: { id: userData.id, username: userData.username, discriminator: userData.discriminator },
        env: envInfo
      });
    }

    // 7) Success
    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar ?? null,
      roles: Array.isArray(guildBody.roles) ? guildBody.roles : guildBody,
      env: envInfo
    });
  } catch (err) {
    console.error("user debug error:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
}
