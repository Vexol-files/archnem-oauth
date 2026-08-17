// /api/bot/sendMessage.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    const { channelId, content, allowEveryone = false, mentionUsers = [], mentionRoles = [] } = req.body || {};
    if (!channelId || !content) return res.status(400).json({ error: "Missing channelId or content" });

    // auth (same pattern)
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(/token=([^;]+)/);
    const access_token = match ? decodeURIComponent(match[1]) : null;
    if (!access_token) return res.status(401).json({ error: "Missing session" });

    const userResp = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` }});
    if (userResp.status !== 200) return res.status(401).json({ error: "Invalid session" });
    const user = await userResp.json();

    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) return res.status(500).json({ error: "Server misconfiguration" });
    const memberResp = await fetch(`https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${user.id}`, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });
    if (memberResp.status !== 200) return res.status(403).json({ error: "Bot cannot fetch member or lacks permissions" });
    const member = await memberResp.json();

    const allowed = (process.env.OWNER_ROLE_ID || "").split(",").map(s=>s.trim()).filter(Boolean);
    const isOwnerRole = member.roles.some(rid => allowed.includes(rid));
    if (!isOwnerRole) return res.status(403).json({ error: "Not authorized" });

    // Build allowed_mentions object
    const allowed_mentions = { parse: [], users: [], roles: [] };
    if (allowEveryone) allowed_mentions.parse.push("everyone");
    if (Array.isArray(mentionUsers) && mentionUsers.length) {
      allowed_mentions.users = mentionUsers;
    }
    if (Array.isArray(mentionRoles) && mentionRoles.length) {
      allowed_mentions.roles = mentionRoles;
    }
    // If parse is empty and users/roles empty, default to no mentions (safe)
    if (allowed_mentions.parse.length === 0 && allowed_mentions.users.length === 0 && allowed_mentions.roles.length === 0) {
      // keep allowed_mentions empty to prevent accidental pings
      // Discord accepts allowed_mentions: {} to disable all mentions
    }

    // send message
    const payload = { content };
    if (Object.keys(allowed_mentions).some(k => (Array.isArray(allowed_mentions[k]) ? allowed_mentions[k].length : allowed_mentions[k]))) {
      payload.allowed_mentions = allowed_mentions;
    } else {
      payload.allowed_mentions = {}; // explicitly disable mentions
    }

    const post = await fetch(`https://discord.com/api/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const body = await post.json().catch(()=>({}));
    if (!post.ok) {
      console.error("discord send failed:", post.status, body);
      return res.status(post.status).json({ error: "Discord API error", details: body });
    }

    return res.status(200).json({ ok: true, message: body });
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
