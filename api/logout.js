// /api/logout.js
export default function handler(req, res) {
  res.setHeader("Set-Cookie", [
    "token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0",
    "archnem_oauth_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0"
  ]);
  return res.redirect("https://archnem.xo.je");
}
