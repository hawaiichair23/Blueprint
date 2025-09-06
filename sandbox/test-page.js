
// Animated pill indicator for glassmorphism style
if (document.querySelector('.nav-links-glassmorphism')) {
  const navLinks = document.querySelector('.nav-links-glassmorphism');
  const links = navLinks.querySelectorAll('a');
  
  function updatePill() {
    const activeLink = navLinks.querySelector('a.active');
    if (activeLink) {
      const position = activeLink.offsetLeft;
      const width = activeLink.offsetWidth;
      
      navLinks.style.setProperty('--pill-position-glass', position + 'px');
      navLinks.style.setProperty('--pill-width-glass', width + 'px');
    }
  }
  
  links.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      if (link.getAttribute('href') === '#') {
        e.preventDefault();
      }
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      updatePill();
    });
  });
  
  updatePill();
}

// Animated pill indicator for minimal style with page switching
if (document.querySelector('.nav-links-minimal')) {
  const navLinks = document.querySelector('.nav-links-minimal');
  const links = navLinks.querySelectorAll('a');
  const mainContent = document.getElementById('main-content');
  
  function updatePill() {
    const activeLink = navLinks.querySelector('a.active');
    if (activeLink) {
      const position = activeLink.offsetLeft;
      const width = activeLink.offsetWidth;
      
      navLinks.style.setProperty('--pill-position-minimal', position + 'px');
      navLinks.style.setProperty('--pill-width-minimal', width + 'px');
    }
  }
  
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
        // Home content (original content) - uses test-page.css already loaded
        content = `
<div class="hero-section centered-hero" style="margin-top: 60px; margin-bottom: 60px;">
  <h1 style="color: #fbfbfbff; font-family: 'Instrument Serif', serif;">Welcome to the Test Zone</h1>
  <p style="color: #fbfbfbff; font-family: 'Inter', sans-serif;">This is a beautiful test page you wanted. Veni, vidi, vici! Let's see how everything looks together!</p>
</div>
<div class="features-grid" style="font-family: 'Inter', sans-serif; color: #fbfbfbff; margin-top: 60px; margin-bottom: 60px;">
        <div class="feature-item">
          <div class="feature-icon blue"></div>
          <span>Lightning Fast</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon orange"></div>
          <span>Super Secure</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon green"></div>
          <span>Mobile Ready</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon blue"></div>
          <span>Cloud Native</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon green"></div>
          <span>AI Powered</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon green"></div>
          <span>24/7 Support</span>
        </div>
</div>
<div class="process-steps" style="font-family: 'Inter', sans-serif; --line-color: #2a2a2aff; margin-top: 60px; margin-bottom: 60px;">
       <div class="step-item">
         <div class="step-number">1</div>
         <div class="step-content">
           <h4 style="color: #fbfbfbff;">Get Started</h4>
           <p style="color: #e5e5e5;">Automate repetitive tasks and eliminate bottlenecks with our intelligent workflow management system designed for modern businesses.</p>
         </div>
       </div>
       <div class="step-item">
         <div class="step-number">2</div>
         <div class="step-content">
           <h4 style="color: #fbfbfbff;">Customize Everything</h4>
           <p style="color: #e5e5e5;">Protect your data with military-grade encryption and multi-factor authentication while maintaining seamless user experience.</p>
         </div>
       </div>
       <div class="step-item">
         <div class="step-number">3</div>
         <div class="step-content">
           <h4 style="color: #fbfbfbff;">Launch & Scale</h4>
           <p style="color: #e5e5e5;">Handle increased demand effortlessly with our cloud-native infrastructure that grows with your business needs.</p>
         </div>
       </div>
</div>`;
      } else {
        // Load content from external HTML files
        const response = await fetch(`${page}.html`);
        if (response.ok) {
          const html = await response.text();
          // Extract body content from the loaded HTML
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          content = bodyMatch ? bodyMatch[1] : html;
          
          // Load the corresponding CSS file
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = `${page}.css`;
          cssLink.setAttribute('data-page-css', page);
          document.head.appendChild(cssLink);
          
        } else {
          content = `<div style="color: #fbfbfbff; text-align: center; margin-top: 100px;">
              <h1 style="font-family: 'Instrument Serif', serif;">Page Not Found</h1>
              <p style="font-family: 'Inter', sans-serif;">The ${page} page is not available yet.</p>
          </div>`;
        }
      }
      
      // Update content with fade in
      setTimeout(() => {
        mainContent.innerHTML = content;
        mainContent.style.opacity = '1';
      }, 150);
      
    } catch (error) {
      console.error('Error loading page:', error);
      mainContent.innerHTML = `<div style="color: #fbfbfbff; text-align: center; margin-top: 100px;">
          <h1 style="font-family: 'Instrument Serif', serif;">Error</h1>
          <p style="font-family: 'Inter', sans-serif;">Could not load the ${page} page.</p>
      </div>`;
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
      updatePill();
      
      // Load page content
      if (page) {
        loadPage(page);
      }
    });
  });
  
  updatePill();
}
