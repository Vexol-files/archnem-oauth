export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const cookie = req.headers.cookie || "";
  const match = cookie.match(/archnem_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!userRes.ok) {
    const text = await userRes.text();
    return res.status(401).json({ error: "Invalid token", details: text });
  }

  const user = await userRes.json();

  return res.json({
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar,
    premium: false
  });
}
