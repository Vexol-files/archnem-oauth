export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("No code provided");
  }

  // 1. Exchange code → access_token
  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.REDIRECT_URI
  });

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return res.status(500).send("Failed to get access token");
  }

  // 2. Get user info
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`
    }
  });

  const user = await userRes.json();

  // 3. (Optional) Join guild
  // Uncomment if you want auto-join:
  /*
  await fetch(`https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${user.id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bot ${process.env.BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      access_token: tokenData.access_token
    })
  });
  */

  // 4. Redirect back to your site
  return res.redirect("https://archnem.xo.je/index.php");
}
