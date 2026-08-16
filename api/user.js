import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { access_token, user } = req.query;

    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token" });
    }

    // 1. Pobierz dane użytkownika z Discord OAuth2
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const userData = await userResponse.json();

    if (!userData.id) {
      return res.status(400).json({ error: "Invalid access_token" });
    }

    // 2. Pobierz członka serwera (role)
    const guildMemberResponse = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`,
      {
        headers: {
          Authorization: `Bot ${process.env.BOT_TOKEN}`
        }
      }
    );

    let guildMember = null;

    if (guildMemberResponse.status === 200) {
      guildMember = await guildMemberResponse.json();
    }

    // 3. Zbuduj JSON dla panelu
    const json = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      email: userData.email ?? null,
      age: 18, // przykładowa wartość
      premium: false, // przykładowa wartość
      roles: guildMember?.roles ?? []
    };

    return res.status(200).json(json);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
