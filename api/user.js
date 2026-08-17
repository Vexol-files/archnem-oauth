// /api/user.js
export default async function handler(req, res) {
  try {
    // read token from HttpOnly cookie named "token"
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(/token=([^;]+)/);
    const access_token = match ? decodeURIComponent(match[1]) : null;

    if (!access_token) {
      return res.status(401).json({ error: "Missing session. Please log in." });
    }

    // safety: reject if someone accidentally provided BOT_TOKEN
    if (process.env.BOT_TOKEN && access_token === process.env.BOT_TOKEN) {
      console.error("Security: received BOT_TOKEN as access_token");
      return res.status(400).json({ error: "Invalid token" });
    }

    // fetch user info from Discord
    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (userResp.status !== 200) {
      const body = await userResp.text();
      console.error("user fetch failed:", userResp.status, body);
      return res.status(401).json({ error: "Invalid session or token expired" });
    }

    const userData = await userResp.json();

    // ensure server env present
    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) {
      console.error("Server misconfiguration: missing GUILD_ID or BOT_TOKEN");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    // 1) Pobierz wszystkie role serwera (id, name, color, position)
    const rolesUrl = `https://discord.com/api/guilds/${process.env.GUILD_ID}/roles`;
    const rolesResp = await fetch(rolesUrl, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });

    let rolesList = [];
    if (rolesResp.status === 200) {
      rolesList = await rolesResp.json(); // array of role objects
    } else {
      console.error("Failed to fetch guild roles:", rolesResp.status, await rolesResp.text());
      // jeśli nie uda się pobrać ról, kontynuujemy — zwrócimy role jako ID
    }

    // build map id -> { id, name, colorHex, position }
    const roleMap = {};
    for (const r of rolesList) {
      const colorInt = r.color || 0;
      const hex = colorInt ? ("#" + colorInt.toString(16).padStart(6, "0")) : null;
      roleMap[r.id] = {
        id: r.id,
        name: r.name,
        color: hex,
        position: typeof r.position === "number" ? r.position : 0
      };
    }

    // 2) Pobierz członka serwera, aby dostać role użytkownika
    const guildMemberUrl = `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`;
    const guildResp = await fetch(guildMemberUrl, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });

    let userRoles = [];
    if (guildResp.status === 200) {
      const guildBody = await guildResp.json();
      const roleIds = Array.isArray(guildBody.roles) ? guildBody.roles : [];

      // map to objects with name, color, position; fallback to id if not found
      userRoles = roleIds.map(rid => {
        if (roleMap[rid]) return roleMap[rid];
        return { id: rid, name: rid, color: null, position: 0 };
      });

      // sort roles by position descending (highest first)
      userRoles.sort((a, b) => (b.position || 0) - (a.position || 0));
    } else {
      // bot cannot fetch member or lacks permissions — return user without roles
      console.error("Bot cannot fetch guild member:", guildResp.status, await guildResp.text());
      userRoles = [];
    }

    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar ?? null,
      roles: userRoles
    });
  } catch (err) {
    console.error("user.js error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
