export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  const cookie = req.headers.cookie || "";
  const match = cookie.match(/archnem_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // 1. Dane użytkownika z OAuth2
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!userRes.ok) {
    const text = await userRes.text();
    return res.status(401).json({ error: "Invalid OAuth token", details: text });
  }

  const user = await userRes.json();

  // 2. Wiek konta w dniach (na podstawie snowflake ID)
  // Discord snowflake: (id >> 22) + 1420070400000 = ms od 2015-01-01
  const discordEpoch = 1420070400000;
  const createdMs = (BigInt(user.id) >> 22n) + BigInt(discordEpoch);
  const nowMs = BigInt(Date.now());
  const diffDays = Number((nowMs - createdMs) / (1000n * 60n * 60n * 24n));

  // 3. Role z serwera przez bota
  let roles = [];
  try {
    const guildMemberRes = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${user.id}`,
      {
        headers: {
          Authorization: `Bot ${process.env.BOT_TOKEN}`
        }
      }
    );

    if (guildMemberRes.ok) {
      const guildMember = await guildMemberRes.json();
      roles = Array.isArray(guildMember.roles) ? guildMember.roles : [];
    } else {
      roles = [];
    }
  } catch (e) {
    roles = [];
  }

  // 4. Zwracamy JSON dla panelu
  return res.json({
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar,

    // email tylko jeśli masz scope "email" w OAuth2
    email: user.email || null,

    // wiek konta w dniach
    age: diffDays,

    premium: false,

    roles: roles
  });
}
