// auth flows - login, logout, authentication interactions
export const emailSubmitDashboard = {
  js: `
document.getElementById("email-login").addEventListener("click", function (e) {
    e.preventDefault();
    fadeOut(loginBox, () => fadeIn(dashboard));
});`
};

export const googleAuthDashboard = {
  js: `// Google auth flow - would redirect to /auth/google in real app`
};

export const logoutLogin = {
  js: `
document.getElementById("logout-btn").addEventListener("click", function () {
    fadeOut(dashboard, () => fadeIn(loginBox));
});`
};