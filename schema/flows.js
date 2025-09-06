// Flow interactions that generate JavaScript
export const flows = {
    'flow:email_submit > dashboard': {
        js: `
document.getElementById("email-login").addEventListener("click", function (e) {
    e.preventDefault();
    fadeOut(loginBox, () => fadeIn(dashboard));
});`
    },

    'flow:google_auth > dashboard': {
        js: `// Google auth flow - would redirect to /auth/google in real app`
    },

    'flow:logout > login': {
        js: `
document.getElementById("logout-btn").addEventListener("click", function () {
    fadeOut(dashboard, () => fadeIn(loginBox));
});`
    },

    'flow:page_transition; style=fade': {
        js: `
// Page transition with fade effect
if (document.querySelector('.nav-links-minimal') && document.getElementById('main-content')) {
  const navLinks = document.querySelector('.nav-links-minimal');
  const links = navLinks.querySelectorAll('a');
  const mainContent = document.getElementById('main-content');
  
  // Add CSS for smooth transitions
  const style = document.createElement('style');
  style.textContent = \`
    #main-content {
      transition: opacity 0.3s ease-in-out;
    }
  \`;
  document.head.appendChild(style);
  
  async function loadPage(page) {
    try {
      // Add fade out effect
      mainContent.style.opacity = '0.5';
      
      // Remove previous page's CSS (if any)
      const existingPageCSS = document.querySelector('link[data-page-css]');
      if (existingPageCSS) {
        existingPageCSS.remove();
      }
      
      let content = '';
      
      if (page === 'home') {
        // Home content - uses current page CSS
        content = document.getElementById('main-content').innerHTML;
      } else {
        // Load content from external HTML files
        const response = await fetch(\`\${page}.html\`);
        if (response.ok) {
          const html = await response.text();
          // Extract body content from the loaded HTML
          const bodyMatch = html.match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i);
          content = bodyMatch ? bodyMatch[1] : html;
          
          // Load the corresponding CSS file
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = \`\${page}.css\`;
          cssLink.setAttribute('data-page-css', page);
          document.head.appendChild(cssLink);
          
        } else {
          content = \`<div style="color: #fbfbfbff; text-align: center; margin-top: 100px;">
              <h1 style="font-family: 'Instrument Serif', serif;">Page Not Found</h1>
              <p style="font-family: 'Inter', sans-serif;">The \${page} page is not available yet.</p>
          </div>\`;
        }
      }
      
      // Update content with fade in
      setTimeout(() => {
        mainContent.innerHTML = content;
        mainContent.style.opacity = '1';
      }, 150);
      
    } catch (error) {
      console.error('Error loading page:', error);
      mainContent.innerHTML = \`<div style="color: #fbfbfbff; text-align: center; margin-top: 100px;">
          <h1 style="font-family: 'Instrument Serif', serif;">Error</h1>
          <p style="font-family: 'Inter', sans-serif;">Could not load the \${page} page.</p>
      </div>\`;
      mainContent.style.opacity = '1';
    }
  }
  
  links.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const page = link.getAttribute('data-page');
      
      // Update active nav state
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Load page content
      if (page) {
        loadPage(page);
      }
    });
  });
}`
    }
};