export default {
    // Base blueprints that define the overall structure
    blueprints: {
        'blueprint:auth/login+dashboard; animations=fade; layout=centered; theme=dark': {
            html: {
                start: `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Login</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="login.css">
</head>

<body>
  <div class="login-box" id="login-box">
    <h2>Welcome Back</h2>
    <div class="subtext">Sign in to your account to continue</div>`,
                end: `    <div class="footer">
      Don't have an account? <a href="#">Sign up</a>
    </div>
  </div>

  <div id="dashboard" class="hidden">
    <h2>Welcome, John Doe</h2>
    <p>You are now logged in. This is your dashboard.</p>
    <button id="logout-btn" class="btn glow">Logout</button>
  </div>

  <script src="login.js"></script>
</body>

</html>`
            },
            css: `body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
    color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #100f17, #17161a);
}

.fade {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.5s ease, visibility 0.5s ease;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.fade.show {
    opacity: 1;
    visibility: visible;
}

.hidden {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none;
}

.login-box,
#dashboard {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: opacity 0.2s ease, visibility 0.2s ease;
    opacity: 1;
    visibility: visible;
}

.login-box {
    background: #171721;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05);
    width: 100%;
    max-width: 400px;
}

h2 {
    text-align: center;
    color: #8a6fff;
    font-weight: 700;
    font-size: 30px;
    font-family: 'Segoe UI';
    margin-bottom: 1.7rem;
}

.subtext {
    text-align: center;
    font-size: 0.95rem;
    color: #b0b0c3;
    margin-bottom: 1.5rem;
}

.btn {
    width: 100%;
    padding: 0.75rem;
    border-radius: 24px;
    background-color: #ffffff;
    border: none;
    font-family: 'Segoe UI';
    font-weight: 500;
    font-size: 16px;
    color: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: box-shadow 0.3s ease;
}

.btn:hover {
    box-shadow: 0 0 18px rgba(255, 255, 255, 0.3);
}

.btn img {
    margin-right: 0.5rem;
    height: 1rem;
}

.separator {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 1.5rem 0;
    color: #6e6a7b;
    font-size: 0.7rem;
    font-family: 'Segoe UI';
}

.separator::before,
.separator::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #2e2e3f;
    margin: 0 0.5rem;
}

label {
    font-size: 0.85rem;
    display: block;
    margin-bottom: 0.25rem;
}

input {
    width: 100%;
    padding: 0.75rem;
    background: #1c1c29;
    font-family: 'Segoe UI';
    font-size: 14px;
    border: none;
    border-radius: 12px;
    color: #ffffff;
    margin-bottom: 1rem;
}

.sign-in {
    background: linear-gradient(to right, #5434e2, #5ea2ef);
    color: #ffffff;
}

.footer {
    text-align: center;
    font-size: 0.85rem;
    color: #777777;
    margin-top: 1rem;
}

.footer a {
    color: #8a6fff;
    text-decoration: none;
}

#dashboard {
    margin-top: 40px;
    padding: 20px;
    border: 1px solid #444444;
    border-radius: 12px;
    background-color: #17161c;
    color: #ffffff;
    text-align: center;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

#dashboard h2 {
    margin-bottom: 10px;
    font-size: 24px;
}

#dashboard button {
    background-color: #1c1b22;
    color: #ffffff;
    border: 1px solid #555555;
    padding: 10px 20px;
    border-radius: 8px;
    margin-top: 20px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

#dashboard button:hover {
    background-color: #232227;
}`,
            js: `const loginBox = document.getElementById("login-box");
const dashboard = document.getElementById("dashboard");

function fadeIn(el) {
    el.classList.remove("hidden");
    el.classList.add("fade");
    void el.offsetWidth;
    el.classList.add("show");
}

function fadeOut(el, callback) {
    el.classList.remove("show");
    setTimeout(() => {
        el.classList.add("hidden");
        el.classList.remove("fade");
        if (callback) callback();
    }, 500); 
}`
        }
    },

    // Individual components that can be inserted
    components: {
        'provider:google; text="Continue with Google"; style=modern; security=[csrf,state_verification,nonce]': {
            html: `
    <button class="btn glow" id="google-login">
      <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo">
      Continue with Google
    </button>`
        },

        'provider:apple; text="Continue with Apple"; style=modern; security=[csrf,state_verification]': {
            html: `
    <button class="btn glow">
      <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple logo">
      Continue with Apple
    </button>`
        },

        'form:email; fields=[email,password]; submit="Sign In"; validation=[required,email_format]': {
            html: `
    <form>
      <label>Email</label>
      <input type="email" placeholder="Enter your email">

      <label>Password</label>
      <input type="password" placeholder="Enter your password">

      <button class="btn sign-in glow" id="email-login">Sign In</button>
    </form>`
        },

        'separator:text; content="OR CONTINUE WITH EMAIL"': {
            html: `
    <div class="separator">OR CONTINUE WITH EMAIL</div>`
        },

    'ui:dashboard; welcome="Welcome, John Doe"; state=hidden; includes=[logout_button]': {
        html: `<!-- Dashboard already included in blueprint html.end, so this can be empty or a comment -->`
        },

        'ui:footer; text="Don\'t have an account?"; link=[text="Sign up",href="#"]': {
            html: `
    <div class="footer">
      Don't have an account? <a href="#">Sign up</a>
    </div>`
        }
    },

    // Flow interactions that generate JavaScript
    flows: {
        'flow:email_submit → dashboard': {
            js: `
document.getElementById("email-login").addEventListener("click", function (e) {
    e.preventDefault();
    fadeOut(loginBox, () => fadeIn(dashboard));
});`
        },

        'flow:google_auth → dashboard': {
            js: `// Google auth flow - would redirect to /auth/google in real app`
        },

        'flow:logout → login': {
            js: `
document.getElementById("logout-btn").addEventListener("click", function () {
    fadeOut(dashboard, () => fadeIn(loginBox));
});`
        }
    },

    // Instructions for AI
    instructions: `
  How to use this blueprint system:
  
  1. Start with a blueprint: that defines the base structure
  2. Add components: provider, form, separator, ui elements get inserted between blueprint start/end
  3. Add flows: define JavaScript interactions between elements
  
  The generate.js reads blueprint.txt and:
  - Finds blueprint, uses its html.start + html.end to wrap everything
  - Finds components, inserts their html between start/end
  - Combines all CSS from blueprints and components
  - Combines all JS from blueprint and flows
  
  Example blueprint.txt:
  blueprint:auth/login+dashboard; animations=fade; layout=centered; theme=dark
  provider:google; text="Continue with Google"; style=modern
  separator:text; content="OR CONTINUE WITH EMAIL"
  form:email; fields=[email,password]; submit="Sign In"
  flow:email_submit → dashboard
  flow:logout → login
  `
};