// /api/bot/listChannels.js
export default async function handler(req, res) {
  try {
    // require session cookie and verify owner role (same pattern as other endpoints)
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

    if (!process.env.GUILD_ID || !process.env.BOT_TOKEN) return res.status(500).json({ error: "Server misconfiguration" });

    // fetch member to check roles
    const memberResp = await fetch(`https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${user.id}`, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });
    if (memberResp.status !== 200) return res.status(403).json({ error: "Bot cannot fetch member or lacks permissions" });
    const member = await memberResp.json();

    const allowed = (process.env.OWNER_ROLE_ID || "").split(",").map(s=>s.trim()).filter(Boolean);
    const isOwnerRole = member.roles.some(rid => allowed.includes(rid));
    if (!isOwnerRole) return res.status(403).json({ error: "Not authorized" });

    // fetch channels
    const channelsResp = await fetch(`https://discord.com/api/guilds/${process.env.GUILD_ID}/channels`, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });

    if (!channelsResp.ok) {
      const body = await channelsResp.text();
      console.error("channels fetch failed:", channelsResp.status, body);
      return res.status(500).json({ error: "Failed to fetch channels" });
    }

    const channels = await channelsResp.json(); // array of channel objects

    // build categories map and channels grouped by category
    const categories = [];
    const categoryMap = {};
    const uncategorized = [];

    // first collect categories (type 4 = category)
    channels.forEach(c => {
      if (c.type === 4) {
        categories.push({ id: c.id, name: c.name, position: c.position });
        categoryMap[c.id] = { id: c.id, name: c.name, position: c.position, channels: [] };
      }
    });

    // then assign text/voice channels to categories (type 0 = text, 2 = voice, etc.)
    channels.forEach(c => {
      if (c.type === 0 || c.type === 2 || c.type === 5 || c.type === 13) {
        const parent = c.parent_id;
        const ch = { id: c.id, name: c.name, type: c.type, position: c.position };
        if (parent && categoryMap[parent]) categoryMap[parent].channels.push(ch);
        else uncategorized.push(ch);
      }
    });

    // sort categories and channels by position
    const sortedCategories = Object.values(categoryMap).sort((a,b)=>b.position - a.position);
    sortedCategories.forEach(cat => cat.channels.sort((a,b)=>a.position - b.position)); // ascending within category

    uncategorized.sort((a,b)=>a.position - b.position);

    return res.status(200).json({ categories: sortedCategories, uncategorized });
  } catch (err) {
    console.error("listChannels error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
