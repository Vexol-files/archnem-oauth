// TEMP DEBUG - wklej na chwilę do /api/callback.js
export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: "missing_code" });

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

    // Zwróć debug JSON zamiast redirectu
    return res.status(200).json({
      ok: true,
      tokenResponseStatus: tokenResponse.status,
      tokenDataKeys: Object.keys(tokenData),
      tokenDataSample: {
        access_token_present: !!tokenData.access_token,
        access_token_length: tokenData.access_token ? tokenData.access_token.length : 0
      },
      raw: tokenData
    });
  } catch (err) {
    console.error("callback debug error:", err);
    return res.status(500).json({ error: "server_error", message: err.message });
  }
}
