// /api/bot/checkAuth.js
// Server-side helper: verifies the current session user has the OWNER_ROLE_ID or is in allowed roles.
// Usage: import or fetch this endpoint from other bot endpoints to centralize checks.

export default async function handler(req, res) {
  try {
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(/token=([^;]+)/);
    const access_token = match ? decodeURIComponent(match[1]) : null;
    if (!access_token) return res.status(401).json({ error: "Missing session" });

    // fetch user
    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (userResp.status !== 200) return res.status(401).json({ error: "Invalid session" });
    const user = await userResp.json();

    // fetch guild member
    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) return res.status(500).json({ error: "Server misconfiguration" });
    const memberResp = await fetch(`https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${user.id}`, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });
    if (memberResp.status !== 200) return res.status(403).json({ error: "Bot cannot fetch member or lacks permissions" });
    const member = await memberResp.json();

    // check allowed role(s)
    // configure OWNER_ROLE_ID (or comma-separated list) in ENV
    const allowed = (process.env.OWNER_ROLE_ID || "").split(",").map(s=>s.trim()).filter(Boolean);
    const isOwnerRole = member.roles.some(rid => allowed.includes(rid));
    if (!isOwnerRole) return res.status(403).json({ error: "Not authorized" });

    // authorized: return minimal user info
    return res.status(200).json({ ok: true, id: user.id, username: user.username });
  } catch (err) {
    console.error("checkAuth error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
