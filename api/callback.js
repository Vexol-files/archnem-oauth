// /api/callback.js
// Wymiana code -> access_token i redirect do panel.html?access_token=...
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
      // jeśli brak tokena, przekieruj z informacją o błędzie
      return res.redirect("/panel.html?error=token_failed");
    }

    // Przekierowanie z tokenem w URL (flow bez cookie)
    return res.redirect(`/panel.html?access_token=${encodeURIComponent(tokenData.access_token)}`);
  } catch (err) {
    console.error("callback.js error:", err);
    return res.redirect("/panel.html?error=server_error");
  }
}
