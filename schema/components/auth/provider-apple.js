// provider apple component - apple sign in button
export const providerApple = {
  html: (params) => `
<button class="btn glow">
  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple logo">
  ${params.text || 'Continue with Apple'}
</button>`
};