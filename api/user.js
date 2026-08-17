// /api/user.js
// Endpoint zwraca dane użytkownika i diagnostykę jeśli ?debug=1
export default async function handler(req, res) {
  try {
    const debug = req.query.debug === "1" || req.query.debug === "true";

    // Pobierz access_token: najpierw z query (frontend przesyła), potem z cookie (fallback)
    const queryToken = req.query.access_token;
    const cookieHeader = req.headers.cookie || "";
    const cookieMatch = cookieHeader.match(/archnem_token=([^;]+)/);
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
    const access_token = queryToken || cookieToken;

    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token" });
    }

    // 1) Pobierz usera z Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userText = await userResponse.text();
    let userData = null;
    try { userData = userText ? JSON.parse(userText) : null; } catch (e) { userData = { raw: userText }; }

    if (userResponse.status !== 200) {
      // Jeśli debug, zwracamy szczegóły odpowiedzi Discorda
      if (debug) {
        return res.status(400).json({
          error: "Invalid access_token or Discord returned error",
          discordStatus: userResponse.status,
          discordBody: userData
        });
      }
      return res.status(400).json({ error: "Invalid access_token" });
    }

    // 2) Sprawdź ENV (bez ujawniania wartości)
    const envOk = {
      CLIENT_ID: !!process.env.CLIENT_ID,
      CLIENT_SECRET: !!process.env.CLIENT_SECRET,
      REDIRECT_URI: !!process.env.REDIRECT_URI,
      GUILD_ID: !!process.env.GUILD_ID,
      BOT_TOKEN: !!process.env.BOT_TOKEN
    };

    if (!envOk.GUILD_ID || !envOk.BOT_TOKEN) {
      if (debug) {
        return res.status(500).json({
          error: "Server misconfiguration",
          missing: {
            GUILD_ID: envOk.GUILD_ID,
            BOT_TOKEN: envOk.BOT_TOKEN
          },
          user: {
            id: userData?.id ?? null,
            username: userData?.username ?? null,
            discriminator: userData?.discriminator ?? null
          }
        });
      }
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    // 3) Pobierz członka serwera (role) używając BOT_TOKEN po stronie serwera
    const guildUrl = `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`;
    const guildResp = await fetch(guildUrl, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });

    const guildText = await guildResp.text();
    let guildBody = null;
    try { guildBody = guildText ? JSON.parse(guildText) : null; } catch (e) { guildBody = { raw: guildText }; }

    // Jeśli bot nie widzi członka, zwracamy usera bez ról (ale w debugu pokażemy status)
    if (guildResp.status !== 200) {
      if (debug) {
        return res.status(200).json({
          note: "Bot cannot fetch guild member or lacks permissions",
          guildStatus: guildResp.status,
          guildBody,
          user: {
            id: userData.id,
            username: userData.username,
            discriminator: userData.discriminator,
            avatar: userData.avatar ?? null
          },
          env: envOk
        });
      }

      return res.status(200).json({
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar ?? null,
        roles: []
      });
    }

    // 4) Normalna odpowiedź (bez debug)
    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar ?? null,
      roles: Array.isArray(guildBody.roles) ? guildBody.roles : []
    });
  } catch (err) {
    console.error("user.js error:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
}
