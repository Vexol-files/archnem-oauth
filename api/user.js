export default async function handler(req, res) {
  try {
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/token=([^;]+)/);
    const access_token = match ? decodeURIComponent(match[1]) : null;

    if (!access_token)
      return res.status(401).json({ error: "Missing session token" });

    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userData = await userResp.json();

    const flags = userData.public_flags || 0;

    const badges = [];
    if (flags & 1) badges.push("Staff");
    if (flags & 2) badges.push("Partner");
    if (flags & 4) badges.push("HypeSquadBravery");
    if (flags & 8) badges.push("HypeSquadBrilliance");
    if (flags & 16) badges.push("HypeSquadBalance");
    if (flags & 64) badges.push("BugHunterLevel1");
    if (flags & 128) badges.push("BugHunterLevel2");
    if (flags & 256) badges.push("EarlySupporter");
    if (flags & 131072) badges.push("VerifiedDeveloper");
    if (flags & 4194304) badges.push("ActiveDeveloper");

    const rolesResp = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/roles`,
      { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
    );

    const rolesList = await rolesResp.json();
    const roleMap = {};
    for (const r of rolesList) {
      const hex = r.color ? "#" + r.color.toString(16).padStart(6, "0") : null;
      roleMap[r.id] = { id:r.id, name:r.name, color:hex, position:r.position };
    }

    const memberResp = await fetch(
      `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userData.id}`,
      { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
    );

    let userRoles = [];
    if (memberResp.ok) {
      const member = await memberResp.json();
      userRoles = member.roles
        .map(id => roleMap[id] || { id, name:id, color:null, position:0 })
        .sort((a,b) => b.position - a.position);
    }

    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      email: userData.email,
      badges,
      roles: userRoles
    });

  } catch (err) {
    return res.status(500).json({ error:"server_error", details:String(err) });
  }
}
