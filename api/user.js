// /api/user.js
export default async function handler(req, res) {
  try {
    // Pobierz access_token: najpierw z query (frontend przesyła), fallback na cookie (jeśli używasz)
    const queryToken = req.query.access_token;
    const cookieHeader = req.headers.cookie || "";
    const cookieMatch = cookieHeader.match(/archnem_token=([^;]+)/);
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
    const access_token = queryToken || cookieToken;

    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token" });
    }

    // Pobierz usera z Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (userResponse.status !== 200) {
      const body = await userResponse.text();
      return res.status(400).json({ error: "Invalid access_token", details: body });
    }

    const userData = await userResponse.json();

    // Sprawdź konfigurację serwera
    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) {
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    // Pobierz role członka serwera używając BOT_TOKEN (tylko po stronie serwera)
    const guildUrl = `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`;
    const guildResp = await fetch(guildUrl, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });

    if (guildResp.status !== 200) {
      // Bot nie widzi członka lub brak uprawnień — zwracamy usera bez ról
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
