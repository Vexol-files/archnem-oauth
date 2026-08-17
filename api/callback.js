export default async function handler(req, res) {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: "missing_code_or_state", code, state });
    }

    const cookie = req.headers.cookie || "";
    const match = cookie.match(/archnem_oauth_state=([^;]+)/);
    const savedState = match ? match[1] : null;

    if (!savedState || savedState !== state) {
      return res.status(400).json({
        error: "invalid_state",
        savedState,
        state
      });
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

    if (!tokenData.access_token) {
      return res.status(400).json({
        error: "token_failed",
        tokenData
      });
    }

    res.setHeader("Set-Cookie", [
      "archnem_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None",
      `token=${encodeURIComponent(tokenData.access_token)}; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=None`
    ]);

    return res.status(200).json({
      success: true,
      tokenPreview: tokenData.access_token.slice(0, 16) + "...",
      state,
      savedState
    });

  } catch (err) {
    return res.status(500).json({ error: "server_error", details: String(err) });
  }
}
