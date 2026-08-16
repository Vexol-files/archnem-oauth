export default function handler(req, res) {
  // Usuń cookie
  res.setHeader(
    "Set-Cookie",
    "archnem_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
  );
  return res.redirect("archnem.xo.je");
}
