export default async function handler(req, res) {
  try {
    const access_token = req.query.access_token;

    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token" });
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userData = await userResponse.json();

    if (!userData.id) {
      return res.status(400).json({ error: "Invalid access_token" });
    }

    const guildMemberResponse = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`,
      {
        headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
      }
    );

    const guildMember =
      guildMemberResponse.status === 200
        ? await guildMemberResponse.json()
        : { roles: [] };

    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      email: userData.email ?? null,
      age: 18,
      premium: false,
      roles: guildMember.roles
    });

  } catch (err) {
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}
