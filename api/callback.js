// /api/callback.js — DEBUG VERSION (no redirect)
export default async function handler(req, res) {
  try {
    const { code, state } = req.query;

    const cookie = req.headers.cookie || "";
    const stateMatch = cookie.match(/archnem_oauth_state=([^;]+)/);
    const savedState = stateMatch ? stateMatch[1] : null;

    // jeśli w ogóle nie ma code/state → pokaż to w JSON
    if (!code || !state) {
      return res.status(400).json({
        step: "initial",
        error: "missing_code_or_state",
        query: { code, state },
        cookie,
        savedState
      });
    }

    // jeśli state się nie zgadza → pokaż dokładnie co przyszło
    if (!savedState || savedState !== state) {
      res.setHeader(
        "Set-Cookie",
        "archnem_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None"
      );

      return res.status(400).json({
        step: "state_check",
        error: "invalid_state",
        query: { code, state },
        cookie,
        savedState
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

    const rawText = await tokenResponse.text();
    let tokenData = {};
    try {
      tokenData = JSON.parse(rawText);
    } catch {
      tokenData = { parse_error: true, raw: rawText };
    }

    if (!tokenData.access_token) {
      return res.status(400).json({
        step: "token_exchange",
        error: "token_failed",
        status: tokenResponse.status,
        body: tokenData
      });
    }

    // ustaw cookie, ale nadal NIE redirectujemy
    res.setHeader("Set-Cookie", [
      "archnem_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None",
      `token=${encodeURIComponent(tokenData.access_token)}; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=None`
    ]);

    return res.status(200).json({
      step: "success",
      message: "callback_ok",
      query: { code, state },
      savedState,
      tokenPreview: tokenData.access_token ? tokenData.access_token.slice(0, 16) + "..." : null
    });

  } catch (err) {
    return res.status(500).json({
      step: "exception",
      error: "server_error",
      details: String(err)
    });
  }
}
