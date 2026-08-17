// /api/callback.js
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
      console.error("callback: token exchange failed", tokenData);
      return res.redirect("/panel.html?error=token_failed");
    }

    // SECURITY: jeśli token zwrócony przez Discord równa się BOT_TOKEN -> log i abort
    if (process.env.BOT_TOKEN && tokenData.access_token === process.env.BOT_TOKEN) {
      console.error("Security: received token equals BOT_TOKEN — aborting redirect");
      return res.redirect("/panel.html?error=server_security");
    }

    // Najpierw usuń ewentualne stare cookie (bezpieczne)
    res.setHeader("Set-Cookie", [
      // usuń stare cookie
      `archnem_token1=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`,
      // ustaw nowe cookie HttpOnly (access token), krótszy czas życia jeśli chcesz
      `archnem_token1=${encodeURIComponent(tokenData.access_token)}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${60 * 60}`
    ]);

    // Redirect bez tokena w URL
    return res.redirect("/panel.html");
  } catch (err) {
    console.error("callback.js error:", err);
    return res.redirect("/panel.html?error=server_error");
  }
}
