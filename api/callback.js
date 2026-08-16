export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.redirect("/panel.html?error=missing_code");

    const params = new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI
    });

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData || !tokenData.access_token) {
      return res.redirect("/panel.html?error=token_failed");
    }

    // ustaw cookie HttpOnly, Secure, SameSite=Strict
    const maxAge = 60 * 60; // 1h
    res.setHeader(
      "Set-Cookie",
      `archnem_token=${encodeURIComponent(tokenData.access_token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
    );

    return res.redirect("/panel.html");
  } catch (err) {
    console.error("callback.js error:", err);
    return res.redirect("/panel.html?error=server_error");
  }
}
