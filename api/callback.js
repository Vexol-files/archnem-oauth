export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code provided");

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
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.status(500).send("Failed to get access token");

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const user = await userRes.json();

  // na start: token sesji = access_token (później można zrobić JWT)
  const sessionToken = tokenData.access_token;

  // przekierowanie na archnem.xo.je z tokenem w URL
  const redirectUrl = `https://archnem.xo.je/panel.html?token=${encodeURIComponent(sessionToken)}`;
  return res.redirect(redirectUrl);
}
