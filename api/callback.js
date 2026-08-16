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

  const sessionToken = tokenData.access_token;

  // zapis tokenu w cookie (domena vercel)
  res.setHeader("Set-Cookie", `archnem_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax`);

  // przekierowanie na panel na Vercel
  return res.redirect("/panel");
}
