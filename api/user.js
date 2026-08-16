export default async function handler(req, res) {
  try {
    // Pobierz token z cookie HttpOnly
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(/archnem_token=([^;]+)/);
    const access_token = match ? decodeURIComponent(match[1]) : null;

    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token" });
    }

    // Pobierz usera z Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userData = await userResponse.json();
    if (!userData || !userData.id) {
      return res.status(400).json({ error: "Invalid access_token" });
    }

    // Walidacja ENV
    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) {
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    // Pobierz członka serwera (role) używając tokena bota po stronie serwera
    const guildUrl = `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`;
    const guildResp = await fetch(guildUrl, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });

    if (guildResp.status !== 200) {
      // nie ujawniamy szczegółów bezpieczeństwa, tylko informujemy frontend
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
