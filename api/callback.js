// /api/callback.js
export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.redirect("/panel.html?error=missing_code_or_state");

    // verify state cookie
    const cookie = req.headers.cookie || "";
    const stateMatch = cookie.match(/archnem_oauth_state=([^;]+)/);
    const savedState = stateMatch ? stateMatch[1] : null;
    if (!savedState || savedState !== state) {
      res.setHeader("Set-Cookie", "archnem_oauth_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0");
      return res.redirect("/panel.html?error=invalid_state");
    }

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
      res.setHeader("Set-Cookie", "archnem_oauth_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0");
      return res.redirect("/panel.html?error=token_failed");
    }

    // SECURITY: never expose BOT_TOKEN to frontend
    if (process.env.BOT_TOKEN && tokenData.access_token === process.env.BOT_TOKEN) {
      console.error("Security: received token equals BOT_TOKEN — aborting");
      res.setHeader("Set-Cookie", "archnem_oauth_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0");
      return res.redirect("/panel.html?error=server_security");
    }

    // set HttpOnly cookie named "token" and remove state cookie
    res.setHeader("Set-Cookie", [
      "archnem_oauth_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0",
      `token=${encodeURIComponent(tokenData.access_token)}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${60 * 60}`
    ]);

    // redirect to panel on same domain (no token in URL)
    return res.redirect("/panel.html");
  } catch (err) {
    console.error("callback.js error:", err);
    return res.redirect("/panel.html?error=server_error");
  }
}
