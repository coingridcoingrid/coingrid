const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

export default {

  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/") {
      return jsonResponse({
        success: true,
        message: "CoinGrid API Running"
      });
    }

    if (
      url.pathname === "/auth/register" &&
      request.method === "POST"
    ) {
      return register(request, env);
    }

    if (
      url.pathname === "/auth/login" &&
      request.method === "POST"
    ) {
      return login(request, env);
    }

    if (
      url.pathname === "/auth/google" &&
      request.method === "POST"
    ) {
      return googleLogin(request, env);
    }

    if (
      url.pathname === "/auth/verify" &&
      request.method === "GET"
    ) {
      return verifyEmail(request, env);
    }

    return jsonResponse(
      {
        success: false,
        message: "Route Not Found"
      },
      404
    );

  }

};
async function register(request, env) {

  try {

    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password || "";
    const role = body.role || "worker";

    if (!name || !email || !password) {
      return jsonResponse({
        success: false,
        message: "All fields are required."
      }, 400);
    }

    const existingUser = await env.DB
      .prepare("SELECT * FROM users WHERE email=?")
      .bind(email)
      .first();

    if (existingUser) {
      return jsonResponse({
        success: false,
        message: "Email already registered."
      }, 409);
    }

    await env.DB.prepare(`
      INSERT INTO users
      (name,email,password_hash,provider,email_verified)
      VALUES (?,?,?,?,?)
    `)
    .bind(
      name,
      email,
      password,
      "email",
      0
    )
    .run();

    const user = await env.DB
      .prepare("SELECT * FROM users WHERE email=?")
      .bind(email)
      .first();

    if (!user) {
      return jsonResponse({
        success: false,
        message: "Failed to create user."
      }, 500);
    }

    await env.DB.prepare(`
      INSERT INTO accounts
      (user_id,role)
      VALUES (?,?)
    `)
    .bind(
      user.id,
      role
    )
    .run();

    const account = await env.DB
      .prepare(`
        SELECT *
        FROM accounts
        WHERE user_id=?
        AND role=?
      `)
      .bind(
        user.id,
        role
      )
      .first();

    if (!account) {
      return jsonResponse({
        success: false,
        message: "Failed to create account."
      }, 500);
    }

    await env.DB.prepare(`
      INSERT INTO wallets
      (account_id)
      VALUES (?)
    `)
    .bind(account.id)
    .run();

    const token = crypto.randomUUID();

    const expires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    await env.DB.prepare(`
      INSERT INTO email_verifications
      (user_id,token,expires_at)
      VALUES (?,?,?)
    `)
    .bind(
      user.id,
      token,
      expires
    )
    .run();

    await sendVerificationEmail(
      env,
      email,
      name,
      token
    );

    return jsonResponse({
      success: true,
      message: "Registration successful. Please verify your email.",
      role: role
    });

  } catch (error) {

    console.log(error);

    return jsonResponse({
      success: false,
      message: error.message
    }, 500);

  }

      }

async function sendVerificationEmail(
  env,
  email,
  name,
  token
) {

  const verifyUrl =
`https://coingrid-api.coingridcoingrid.workers.dev/auth/verify?token=${token}`;

  try {

    const response = await fetch(
      "https://api.resend.com/emails",
      {

        method: "POST",

        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          from: "CoinGrid <support@nexurity.shop>",

          to: [email],

          subject: "Verify your CoinGrid Account",

          html: `
<!DOCTYPE html>

<html>

<body style="
font-family:Arial,sans-serif;
background:#f5f5f5;
padding:30px;
">

<div style="
max-width:600px;
margin:auto;
background:#ffffff;
padding:40px;
border-radius:15px;
">

<h2 style="color:#0f172a;">
Welcome to CoinGrid
</h2>

<p>
Hello <b>${name}</b>,
</p>

<p>
Thank you for creating your CoinGrid account.
</p>

<p>
Please verify your email address by clicking the button below.
</p>

<p style="margin:35px 0;">

<a
href="${verifyUrl}"
style="
background:#facc15;
color:#000;
padding:14px 28px;
text-decoration:none;
border-radius:8px;
font-weight:bold;
display:inline-block;
">

Verify My Account

</a>

</p>

<p>
This verification link will expire in
<b>24 hours</b>.
</p>

<hr>

<p style="
font-size:13px;
color:#666;
">

If you didn't create this account,
please ignore this email.

</p>

</div>

</body>

</html>
`

        })

      }
    );

    if (!response.ok) {

      const error = await response.text();

      console.log(
        "Resend Error:",
        error
      );

    } else {

      console.log(
        "Verification email sent successfully."
      );

    }

  } catch (error) {

    console.log(
      "Email Error:",
      error.message
    );

  }

        }

async function verifyEmail(request, env) {

  try {

    const url = new URL(request.url);

    const token = url.searchParams.get("token");

    if (!token) {

      return new Response(
`
<h2>Invalid verification link.</h2>
`,
{
headers:{
"Content-Type":"text/html"
}
}
      );

    }

    const verification = await env.DB
    .prepare(`
SELECT *
FROM email_verifications
WHERE token=?
`)
    .bind(token)
    .first();

    if (!verification) {

      return new Response(
`
<h2>Verification link is invalid.</h2>
`,
{
headers:{
"Content-Type":"text/html"
}
}
      );

    }

    if (
      new Date() >
      new Date(verification.expires_at)
    ) {

      return new Response(
`
<h2>Verification link has expired.</h2>
`,
{
headers:{
"Content-Type":"text/html"
}
}
      );

    }

    await env.DB.prepare(`
UPDATE users
SET email_verified=1
WHERE id=?
`)
    .bind(verification.user_id)
    .run();

    await env.DB.prepare(`
DELETE FROM email_verifications
WHERE id=?
`)
    .bind(verification.id)
    .run();

    return new Response(
`
<!DOCTYPE html>

<html>

<head>

<title>CoinGrid</title>

<style>

body{
margin:0;
background:#0f172a;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
font-family:Arial,sans-serif;
color:white;
}

.card{
background:#1e293b;
padding:40px;
border-radius:20px;
text-align:center;
max-width:500px;
width:90%;
}

h1{
color:#22c55e;
}

a{
display:inline-block;
margin-top:25px;
padding:15px 30px;
background:#facc15;
color:#000;
text-decoration:none;
border-radius:10px;
font-weight:bold;
}

</style>

</head>

<body>

<div class="card">

<h1>✅ Email Verified</h1>

<p>
Your CoinGrid account has been verified successfully.
</p>

<p>
You can now login to your account.
</p>

<a href="https://coingridcoingrid.github.io/coingrid/auth/login.html">
Login Now
</a>

</div>

</body>

</html>
`,
{
headers:{
"Content-Type":"text/html"
}
}
    );

  } catch (error) {

    console.log(error);

    return jsonResponse(
      {
        success:false,
        message:error.message
      },
      500
    );

  }

        }

async function login(request, env) {

  try {

    const body = await request.json();

    const email =
      body.email?.trim().toLowerCase();

    const password =
      body.password || "";

    if (!email || !password) {

      return jsonResponse({
        success: false,
        message: "Email and password are required."
      }, 400);

    }

    const user = await env.DB
      .prepare(`
SELECT *
FROM users
WHERE email=?
`)
      .bind(email)
      .first();

    if (!user) {

      return jsonResponse({
        success: false,
        message: "Account not found."
      }, 404);

    }

    if (
      user.provider === "email" &&
      user.password_hash !== password
    ) {

      return jsonResponse({
        success: false,
        message: "Incorrect password."
      }, 401);

    }

    if (
      user.provider === "email" &&
      user.email_verified !== 1
    ) {

      return jsonResponse({
        success: false,
        message: "Please verify your email before logging in."
      }, 403);

    }

    const account = await env.DB
      .prepare(`
SELECT *
FROM accounts
WHERE user_id=?
LIMIT 1
`)
      .bind(user.id)
      .first();

    if (!account) {

      return jsonResponse({
        success: false,
        message: "Account not found."
      }, 404);

    }

    await env.DB.prepare(`
UPDATE accounts
SET last_login=CURRENT_TIMESTAMP
WHERE id=?
`)
    .bind(account.id)
    .run();

    return jsonResponse({

      success: true,

      message: "Login Successful",

      role: account.role,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.email_verified === 1
      }

    });

  } catch (error) {

    console.log(error);

    return jsonResponse({
      success: false,
      message: error.message
    }, 500);

  }

  }

async function googleLogin(request, env) {

  try {

    const body = await request.json();

    const token = body.token;
    const role = body.role || "worker";

    if (!token) {

      return jsonResponse({
        success: false,
        message: "Google token is required."
      }, 400);

    }

    // TODO:
    // Verify Google's ID token here.
    // Replace these demo values with actual Google user data.

    const email = "demo@gmail.com";
    const name = "Demo User";
    const googleId = "google-demo-id";

    let user = await env.DB
      .prepare(`
SELECT *
FROM users
WHERE email=?
`)
      .bind(email)
      .first();

    if (!user) {

      await env.DB.prepare(`
INSERT INTO users
(name,email,google_id,email_verified,provider)
VALUES (?,?,?,?,?)
`)
      .bind(
        name,
        email,
        googleId,
        1,
        "google"
      )
      .run();

      user = await env.DB
        .prepare(`
SELECT *
FROM users
WHERE email=?
`)
        .bind(email)
        .first();

      if (!user) {

        return jsonResponse({
          success: false,
          message: "Failed to create Google user."
        }, 500);

      }

    }

    let account = await env.DB
      .prepare(`
SELECT *
FROM accounts
WHERE user_id=?
AND role=?
`)
      .bind(
        user.id,
        role
      )
      .first();

    if (!account) {

      await env.DB.prepare(`
INSERT INTO accounts
(user_id,role)
VALUES (?,?)
`)
      .bind(
        user.id,
        role
      )
      .run();

      account = await env.DB
        .prepare(`
SELECT *
FROM accounts
WHERE user_id=?
AND role=?
`)
        .bind(
          user.id,
          role
        )
        .first();

      if (!account) {

        return jsonResponse({
          success: false,
          message: "Failed to create account."
        }, 500);

      }

      await env.DB.prepare(`
INSERT INTO wallets
(account_id)
VALUES (?)
`)
      .bind(account.id)
      .run();

    }

    await env.DB.prepare(`
UPDATE accounts
SET last_login=CURRENT_TIMESTAMP
WHERE id=?
`)
    .bind(account.id)
    .run();

    return jsonResponse({

      success: true,

      message: "Google Login Successful",

      role: account.role,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: true
      }

    });

  } catch (error) {

    console.log(error);

    return jsonResponse({
      success: false,
      message: error.message
    }, 500);

  }

        }
