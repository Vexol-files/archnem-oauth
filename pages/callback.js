export default async function CallbackPage({ query }) {
  return null;
}

export async function getServerSideProps(context) {
  const code = context.query.code;

  if (!code) {
    return {
      redirect: {
        destination: "/panel.html?error=missing_code",
        permanent: false
      }
    };
  }

  // Wymiana CODE → ACCESS TOKEN
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
    return {
      redirect: {
        destination: "/panel.html?error=token_failed",
        permanent: false
      }
    };
  }

  // Przekierowanie do panelu z tokenem
  return {
    redirect: {
      destination: `/panel.html?access_token=${tokenData.access_token}`,
      permanent: false
    }
  };
}
