export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  // Pobieramy token z cookie
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/archnem_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // 1. Pobieramy dane użytkownika z Discord OAuth2
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!userRes.ok) {
    const text = await userRes.text();
    return res.status(401).json({ error: "Invalid OAuth token", details: text });
  }

  const user = await userRes.json();

  // 2. Pobieramy członkostwo użytkownika na serwerze (BOT TOKEN)
  const guildMemberRes = await fetch(
    `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${user.id}`,
    {
      headers: {
        Authorization: `Bot ${process.env.BOT_TOKEN}`
      }
    }
  );

  let roles = [];

  if (guildMemberRes.ok) {
    const guildMember = await guildMemberRes.json();
    roles = guildMember.roles || [];
  } else {
    // użytkownik nie jest na serwerze lub bot nie ma uprawnień
    roles = [];
  }

  // 3. Zwracamy pełny JSON dla panelu
  return res.json({
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar,

    // dane dodatkowe (możesz zmienić)
    email: user.email || "brak",
    age: 18,
    premium: false,

    // role z serwera
    roles: roles
  });
}
