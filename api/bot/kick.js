// /api/bot/kick.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    // authorization (same as above)
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(/token=([^;]+)/);
    const access_token = match ? decodeURIComponent(match[1]) : null;
    if (!access_token) return res.status(401).json({ error: "Missing session" });

    const userResp = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` }});
    if (userResp.status !== 200) return res.status(401).json({ error: "Invalid session" });
    const user = await userResp.json();

    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) return res.status(500).json({ error: "Server misconfiguration" });
    const memberResp = await fetch(`https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${user.id}`, { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }});
    if (memberResp.status !== 200) return res.status(403).json({ error: "Bot cannot fetch member or lacks permissions" });
    const member = await memberResp.json();

    const allowed = (process.env.OWNER_ROLE_ID || "").split(",").map(s=>s.trim()).filter(Boolean);
    const isOwnerRole = member.roles.some(rid => allowed.includes(rid));
    if (!isOwnerRole) return res.status(403).json({ error: "Not authorized" });

    // kick target
    const kickResp = await fetch(`https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });
    if (!kickResp.ok) {
      const body = await kickResp.json().catch(()=>({}));
      console.error("kick failed:", kickResp.status, body);
      return res.status(kickResp.status).json({ error: "Discord API error", details: body });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("kick error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
