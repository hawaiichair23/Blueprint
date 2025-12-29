// Base blueprints that define the overall structure
export const blueprints = {
    'blueprint:test/blank': {
        html: (params = {}) => ({
            start: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=Faustina:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${params.output}.css">
</head>
<body>`,
            end: `
</body>
</html>`
        }),
        css: (params = {}) => {
            const theme = params.theme || 'light';
            
            const themes = {
                light: {
                    background: '#f7f7f7ff' // extremely light gray
                },
                dark: {
                    background: '#101010ff'  // really dark gray
                }
            };
            
            const colors = themes[theme];
            
            return `body { 
                margin: 0;
                background: ${params.background || colors.background}; 
                min-height: 100vh;
            }`;
        },
        js: ``
    },
    
    'blueprint:auth/login+dashboard': {
        html: (params = {}) => ({
            start: `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Login</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${params.output}.css">
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

  <script src="${params.output}.js"></script>
</body>

</html>`
        }),
        css: (params = {}) => {
            const theme = params.theme || 'dark';
            const animations = params.animations || 'fade';
            const layout = params.layout || 'centered';

            const themes = {
                dark: {
                    bodyBg: 'linear-gradient(135deg, #100f17, #17161a)',
                    bodyColor: '#ffffff',
                    cardBg: '#171721',
                    cardBorder: 'rgba(255, 255, 255, 0.05)',
                    accent: '#20b2aa',
                    subtext: '#b0b0c3',
                    inputBg: '#1c1c29',
                    inputColor: '#ffffff',
                    separatorColor: '#6e6a7b',
                    separatorLine: '#2e2e3f',
                    footerColor: '#777777',
                    dashboardBg: '#17161c',
                    dashboardBorder: '#444444',
                    buttonBg: '#1c1b22',
                    buttonHover: '#232227',
                    iconFilter: 'none'
                },
                light: {
                    bodyBg: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                    bodyColor: '#333333',
                    cardBg: '#ffffff',
                    cardBorder: 'rgba(0, 0, 0, 0.1)',
                    accent: '#6c5ce7',
                    subtext: '#6c757d',
                    inputBg: '#f8f9fa',
                    inputColor: '#333333',
                    separatorColor: '#6c757d',
                    separatorLine: '#dee2e6',
                    footerColor: '#6c757d',
                    dashboardBg: '#ffffff',
                    dashboardBorder: '#dee2e6',
                    buttonBg: '#f8f9fa',
                    buttonHover: '#e9ecef',
                    iconFilter: 'invert(1)'
                }
            };

            const colors = themes[theme];

            return `body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
    color: ${colors.bodyColor};
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: ${colors.bodyBg};
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
    background: ${colors.cardBg};
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 0 0 1px ${colors.cardBorder};
    width: 100%;
    max-width: 400px;
}

h2 {
    text-align: center;
    color: ${colors.accent};
    font-weight: 700;
    font-size: 30px;
    font-family: 'Segoe UI';
    margin-bottom: 1.7rem;
}

.subtext {
    text-align: center;
    font-size: 0.95rem;
    color: ${colors.subtext};
    margin-bottom: 1.5rem;
}

.btn {
    width: 100%;
    padding: 0.75rem;
    border-radius: 24px;
    background-color: ${theme === 'dark' ? '#ffffff' : '#000000'};
    border: none;
    font-family: 'Segoe UI';
    font-weight: 500;
    font-size: 16px;
    color: ${theme === 'dark' ? '#000000' : '#ffffff'};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: box-shadow 0.3s ease;
}

.btn:hover {
    box-shadow: 0 0 18px ${theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
}

.btn img {
    margin-right: 0.5rem;
    height: 1rem;
    filter: ${colors.iconFilter};
}

.separator {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 1.5rem 0;
    color: ${colors.separatorColor};
    font-size: 0.7rem;
    font-family: 'Segoe UI';
}

.separator::before,
.separator::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${colors.separatorLine};
    margin: 0 0.5rem;
}

label {
    font-size: 0.85rem;
    display: block;
    margin-bottom: 0.25rem;
}

input {
    width: 94%;
    padding: 0.75rem;
    background: ${colors.inputBg};
    font-family: 'Segoe UI';
    font-size: 14px;
    border: none;
    border-radius: 12px;
    color: ${colors.inputColor};
    margin-bottom: 1rem;
}

.sign-in {
    background: linear-gradient(to right, #5434e2, #5ea2ef);
    color: #ffffff;
}

.footer {
    text-align: center;
    font-size: 0.85rem;
    color: ${colors.footerColor};
    margin-top: 1rem;
}

.footer a {
    color: ${colors.accent};
    text-decoration: none;
}

#dashboard {
    margin-top: 40px;
    padding: 20px;
    border: 1px solid ${colors.dashboardBorder};
    border-radius: 12px;
    background-color: ${colors.dashboardBg};
    color: ${colors.bodyColor};
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
    background-color: ${colors.buttonBg};
    color: ${colors.bodyColor};
    border: 1px solid ${colors.dashboardBorder};
    padding: 10px 20px;
    border-radius: 8px;
    margin-top: 20px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

#dashboard button:hover {
    background-color: ${colors.buttonHover};
}`;
        },
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
};