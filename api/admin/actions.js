export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

    const { type, userId, roleId, dmMessage } = req.body;

    if (!userId)
      return res.status(400).json({ error: "Missing userId" });

    let message = "";

    // GIVE ROLE
    if (type === "giveRole") {
      await fetch(
        `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userId}/roles/${roleId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
        }
      );
      message = `Role ${roleId} added to ${userId}`;
    }

    // REMOVE ROLE
    if (type === "removeRole") {
      await fetch(
        `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userId}/roles/${roleId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
        }
      );
      message = `Role ${roleId} removed from ${userId}`;
    }

    // KICK
    if (type === "kick") {
      await fetch(
        `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
        }
      );
      message = `User ${userId} kicked`;
    }

    // BAN
    if (type === "ban") {
      await fetch(
        `https://discord.com/api/guilds/${process.env.GUILD_ID}/bans/${userId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
        }
      );
      message = `User ${userId} banned`;
    }

    // DM — custom message
    if (type === "dm") {
      const channelResp = await fetch(
        `https://discord.com/api/users/@me/channels`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${process.env.BOT_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ recipient_id: userId })
        }
      );

      const dmChannel = await channelResp.json();

      await fetch(
        `https://discord.com/api/channels/${dmChannel.id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${process.env.BOT_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            content: dmMessage || "Admin sent you a message."
          })
        }
      );

      message = `DM sent to ${userId}`;
    }

    return res.status(200).json({ ok: true, message });

  } catch (err) {
    return res.status(500).json({ error: "admin_action_error", details: String(err) });
  }
}
