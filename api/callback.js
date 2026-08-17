// /api/callback.js
export default async function handler(req, res) {
  try {
    const { code, state } = req.query;

    // Missing OAuth parameters
    if (!code || !state) {
      return res.redirect("/panel.html?error=missing_code_or_state");
    }

    // Read state cookie
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/archnem_oauth_state=([^;]+)/);
    const savedState = match ? match[1] : null;

    // State mismatch
    if (!savedState || savedState !== state) {
      res.setHeader("Set-Cookie", "archnem_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None");
      return res.redirect("/panel.html?error=invalid_state");
    }

    // Exchange code for token
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

    if (!tokenData.access_token) {
      res.setHeader("Set-Cookie", "archnem_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None");
      return res.redirect("/panel.html?error=token_failed");
    }

    // Set session cookie
    res.setHeader("Set-Cookie", [
      "archnem_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None",
      `token=${encodeURIComponent(tokenData.access_token)}; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=None`
    ]);

    // Redirect to panel
    return res.redirect("/panel.html");

  } catch (err) {
    console.error("callback error:", err);
    return res.redirect("/panel.html?error=server_error");
  }
}
