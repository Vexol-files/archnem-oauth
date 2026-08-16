// /api/user.js
export default async function handler(req, res) {
  try {
    const access_token = req.query.access_token;

    if (!access_token) {
      return res.status(400).json({
        error: "Missing access_token",
        debug: { note: "Brak parametru access_token w query string" }
      });
    }

    // 1) Pobierz usera z Discord OAuth2
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userStatus = userResponse.status;
    let userBody;
    try {
      userBody = await userResponse.json();
    } catch (e) {
      userBody = { parseError: true, message: e.message };
    }

    if (!userBody || !userBody.id) {
      return res.status(400).json({
        error: "Invalid access_token or failed to fetch user",
        debug: {
          step: "fetch_user",
          userStatus,
          userBody
        }
      });
    }

    // 2) Walidacja ENV
    const missingEnv = {
      GUILD_ID: !process.env.GUILD_ID,
      BOT_TOKEN: !process.env.BOT_TOKEN
    };

    if (missingEnv.GUILD_ID || missingEnv.BOT_TOKEN) {
      return res.status(500).json({
        error: "Server misconfiguration: missing GUILD_ID or BOT_TOKEN",
        debug: { step: "env_check", missingEnv }
      });
    }

    // 3) Pobierz członka serwera (role) używając tokena bota
    const guildUrl = `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userBody.id}`;
    const guildMemberResponse = await fetch(guildUrl, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });

    const guildStatus = guildMemberResponse.status;
    let guildBody;
    try {
      guildBody = await guildMemberResponse.json();
    } catch (e) {
      guildBody = { parseError: true, message: e.message };
    }

    // 4) Jeśli nie 200, zwróć debug z odpowiedzią Discorda
    if (guildStatus !== 200) {
      return res.status(200).json({
        id: userBody.id,
        username: userBody.username,
        discriminator: userBody.discriminator,
        avatar: userBody.avatar,
        email: userBody.email ?? null,
        age: 18,
        premium: false,
        roles: [],
        debug: {
          step: "fetch_guild_member_failed",
          guildUrl,
          guildStatus,
          guildBody,
          note:
            "Sprawdź: GUILD_ID, BOT_TOKEN, czy bot jest na serwerze, Server Members Intent"
        }
      });
    }

    // 5) Normalna odpowiedź z rolami
    return res.status(200).json({
      id: userBody.id,
      username: userBody.username,
      discriminator: userBody.discriminator,
      avatar: userBody.avatar,
      email: userBody.email ?? null,
      age: 18,
      premium: false,
      roles: Array.isArray(guildBody.roles) ? guildBody.roles : [],
      debug: {
        step: "success",
        userStatus,
        guildStatus,
        userBodySummary: {
          id: userBody.id,
          username: userBody.username
        },
        guildBodySummary: {
          rolesCount: Array.isArray(guildBody.roles) ? guildBody.roles.length : 0
        }
      }
    });

  } catch (err) {
    console.error("user.js error:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
      debug: { step: "exception", stack: err.stack }
    });
  }
}
