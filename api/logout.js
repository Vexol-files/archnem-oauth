// /api/logout.js
export default function handler(req, res) {
  // Usuń cookie sesyjne i przekieruj na stronę główną
  res.setHeader("Set-Cookie", "archnem_token1=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0");
  return res.redirect("https://archnem.xo.je");
}
