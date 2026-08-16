export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ error: "No token" });

  // tu normalnie: weryfikacja tokena, pobranie usera z Discorda / bazy
  // na start: placeholder

  return res.json({
    id: "1234567890",
    username: "ArchnUser",
    discriminator: "0001",
    premium: false
  });
}
