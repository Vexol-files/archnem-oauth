export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json");

    const cookie = req.headers.cookie || "";
    const match = cookie.match(/token=([^;]+)/);
    const access_token = match ? decodeURIComponent(match[1]) : null;

    if (!access_token) {
      return res.status(401).json({ error: "Missing session token" });
    }

    // Fetch user info
    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!userResp.ok) {
      const body = await userResp.text();
      return res.status(401).json({
        error: "Invalid or expired token",
        discord: body
      });
    }

    const userData = await userResp.json();

    // Fetch guild roles
    const rolesResp = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/roles`,
      { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
    );

    const rolesList = await rolesResp.json();
    const roleMap = {};
    for (const r of rolesList) {
      const hex = r.color ? "#" + r.color.toString(16).padStart(6, "0") : null;
      roleMap[r.id] = { id: r.id, name: r.name, color: hex, position: r.position };
    }

    // Fetch member roles
    const memberResp = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`,
      { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
    );

    let userRoles = [];

    if (memberResp.ok) {
      const member = await memberResp.json();
      userRoles = member.roles
        .map(id => roleMap[id] || { id, name: id, color: null, position: 0 })
        .sort((a, b) => b.position - a.position);
    }

    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      email: userData.email || null,
      roles: userRoles
    });

  } catch (err) {
    return res.status(500).json({
      error: "Internal server error",
      details: String(err)
    });
  }
}
