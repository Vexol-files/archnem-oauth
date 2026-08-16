export default async function handler(req, res) {
  try {
    const access_token = req.query.access_token;
    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token" });
    }

    // 1) Pobierz usera z Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userData = await userResponse.json();

    if (!userData || !userData.id) {
      return res.status(400).json({
        error: "Invalid access_token or failed to fetch user",
        debug: { userStatus: userResponse.status, userBody: userData }
      });
    }

    // 2) Pobierz członka serwera (role) używając tokena bota
    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) {
      return res.status(500).json({
        error: "Server misconfiguration: missing GUILD_ID or BOT_TOKEN",
        debug: { GUILD_ID: !!process.env.GUILD_ID, BOT_TOKEN: !!process.env.BOT_TOKEN }
      });
    }

    const guildMemberResponse = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`,
      {
        headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
      }
    );

    let guildMemberBody = null;
    try {
      guildMemberBody = await guildMemberResponse.json();
    } catch (e) {
      guildMemberBody = { parseError: true, message: e.message };
    }

    if (guildMemberResponse.status !== 200) {
      return res.status(200).json({
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar,
        email: userData.email ?? null,
        age: 18,
        premium: false,
        roles: [],
        debug: {
          guildStatus: guildMemberResponse.status,
          guildBody: guildMemberBody
        }
      });
    }

    // 3) Zwróć normalny JSON
    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      email: userData.email ?? null,
      age: 18,
      premium: false,
      roles: guildMemberBody.roles || []
    });

  } catch (err) {
    console.error("user.js error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}
