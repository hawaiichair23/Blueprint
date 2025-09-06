// Individual components that can be inserted into blueprints
export const components = {
    'provider:google': {
        html: (params) => `
    <button class="btn glow" id="google-login">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="margin-right: 0.5rem;">
  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>
      ${params.text || 'Continue with Google'}
    </button>`
    },

    'provider:apple': {
        html: (params) => `
    <button class="btn glow">
      <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple logo">
      ${params.text || 'Continue with Apple'}
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
    },

// Nav bar with style parameters


  'nav': {
    html: (params = {}) => {
      const links = params.links || ['Product', 'Pricing', 'Contact'];
      const hrefs = params.hrefs || [];
      
      // Normalize hrefs - add .html if no extension and not a URL/anchor
      const normalizedHrefs = hrefs.map(href => {
        if (!href.includes('.') && !href.startsWith('http') && !href.includes('#')) {
          return href + '.html';
        }
        return href;
      });
      const style = params.style || 'glassmorphism';
      const activeIndex = params.activeIndex || 0;
      const spacing = params.spacing || '30px';
      const theme = params.theme || 'light';
      const font = params.font || 'Inter';
      const defaultTextColor = theme === 'dark' ? '#f7f7f7ff' : '#191919ff';
      const textColor = params.color || defaultTextColor;
      const pillColorGlass = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      const pillColorMinimal = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(20, 45, 142, 0.2)';
      const linksClass = style === 'minimal' ? 'nav-links-minimal' : 'nav-links-glassmorphism';
      const layout = params.layout || 'right';
      let justifyContent;
      switch (layout) {
        case 'center': justifyContent = 'center'; break;
        case 'left': justifyContent = 'flex-start'; break;
        default: justifyContent = 'flex-end'; // right is default
      }

      return `
<div class="nav-container" style="display: flex; justify-content: ${justifyContent}; padding: 0px 40px;">
  <div class="${linksClass}" style="margin: ${spacing} 0; --nav-text-color: ${textColor}; --pill-bg-glass: ${pillColorGlass}; --pill-bg-minimal: ${pillColorMinimal}; font-family: '${font}', sans-serif;">
    ${links.map((link, index) =>
          `<a href="${normalizedHrefs[index] || '#'}" class="${index === activeIndex ? 'active' : ''}">${link}</a>`
        ).join('')}
  </div>
</div>`;
    },
    css: `
/* Glassmorphism style - with container background */
.nav-links-glassmorphism {
  display: inline-flex;
  gap: 14px;
  position: relative;
  background: rgba(61, 61, 61, 0.09);
  padding: 3px 6px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.nav-links-glassmorphism::before {
  content: '';
  position: absolute;
  background: var(--pill-bg-glass, rgba(0, 0, 0, 0.08));
  border-radius: 20px;
  transition: all 0.3s ease;
  z-index: 1;
  height: calc(100% - 12px);
  top: 6px;
  width: var(--pill-width-glass, 60px);
  left: var(--pill-position-glass, 8px);
}

/* Minimal style. no container, just pill */
.nav-links-minimal {
  display: inline-flex;
  gap: 14px;
  position: relative;
}

.nav-links-minimal::before {
  content: '';
  position: absolute;
  background: var(--pill-bg-glass, rgba(0, 0, 0, 0.08));
  border-radius: 20px;
  transition: all 0.3s ease;
  z-index: 1;
  height: calc(100% - 6px);
  top: 3px;
  width: var(--pill-width-minimal, 60px);
  left: var(--pill-position-minimal, 0px);
}

.nav-links-glassmorphism a,
.nav-links-minimal a {
  color: var(--nav-text-color, #f7f7f7ff);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  font-family: inherit;
}

.nav-links-glassmorphism a:hover,
.nav-links-minimal a:hover {
  color: var(--nav-text-color, #f7f7f7ff);
  opacity: 0.8;
}

.nav-links-glassmorphism a.active,
.nav-links-minimal a.active {
  color: var(--nav-text-color, #f7f7f7ff);
}
`,
    js: `
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
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      updatePill();
    });
  });
  
  updatePill();
}

// Animated pill indicator for minimal style
if (document.querySelector('.nav-links-minimal')) {
  const navLinks = document.querySelector('.nav-links-minimal');
  const links = navLinks.querySelectorAll('a');
  
  function updatePill() {
    const activeLink = navLinks.querySelector('a.active');
    if (activeLink) {
      const position = activeLink.offsetLeft;
      const width = activeLink.offsetWidth;
      
      navLinks.style.setProperty('--pill-position-minimal', position + 'px');
      navLinks.style.setProperty('--pill-width-minimal', width + 'px');
    }
  }
  
  links.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      updatePill();
    });
  });
  
  updatePill();
}
`
  },

  'features-grid': {
    html: (params = {}) => {
      const count = params.count || 10;
      const customText = params.text || [];
      const font = params.font || 'Inter';
      const theme = params.theme || 'light';
      const defaultColor = theme === 'dark' ? '#f7f7f7ff' : '#191919ff';
      const textColor = params.color || defaultColor;
      const spacing = params.spacing || '60px';
      const colors = ['blue', 'orange', 'green', 'blue', 'green', 'green', 'pink', 'blue', 'blue', 'pink'];

      const items = [];
      for (let i = 0; i < count; i++) {
        const text = customText[i] || `Feature ${i + 1}`;
        const color = colors[i % colors.length];
        items.push(`
        <div class="feature-item">
          <div class="feature-icon ${color}"></div>
          <span>${text}</span>
        </div>`);
      }

      return `
<div class="features-grid" style="font-family: '${font}', sans-serif; color: ${textColor}; margin-top: ${spacing}; margin-bottom: ${spacing};">
  ${items.join('')}
</div>`;
    },
    css: `
.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin: 30px auto 0;
  max-width: 600px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 16px;
}

.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.feature-icon.blue { background: #007AFF; }
.feature-icon.green { background: #34C759; }
.feature-icon.orange { background: #FF9500; }
.feature-icon.pink { background: #FF2D92; }
`,
    js: ``
  },

  'steps': {
    html: (params = {}) => {
      const count = params.count || 5;
      const customTitles = params.titles || [];
      const customDescriptions = params.descriptions || [];
      const font = params.font || 'Inter';
      const theme = params.theme || 'light';
      const spacing = params.spacing || '60px';

      // Theme defaults
      const themeDefaults = {
        light: {
          titleColor: '#191919ff',
          descriptionColor: '#191919ff',
          lineColor: '#e5e5e5'
        },
        dark: {
          titleColor: '#f7f7f7ff',
          descriptionColor: '#e5e5e5',
          lineColor: '#2a2a2aff'
        }
      };

      const defaults = themeDefaults[theme] || themeDefaults.light;

      // Allow custom overrides
      const titleColor = params.titleColor || defaults.titleColor;
      const descriptionColor = params.descriptionColor || defaults.descriptionColor;
      const lineColor = params.lineColor || defaults.lineColor;

      // Default business-focused content
      const defaultTitles = [
        'Streamline Your Workflow Process',
        'Implement Advanced Security Protocols',
        'Scale Your Operations Efficiently',
        'Optimize Performance and Analytics',
        'Handle massive data at scale with 24 hour uhh yeah',
        'Finalize Your Business Strategy'
      ];

      const defaultDescriptions = [
        'Automate repetitive tasks and eliminate bottlenecks with our intelligent workflow management system designed for modern businesses.',
        'Protect your data with military-grade encryption and multi-factor authentication while maintaining seamless user experience.',
        'Handle increased demand effortlessly with our cloud-native infrastructure that grows with your business needs.',
        'Make data-driven decisions with real-time insights and comprehensive reporting tools that matter to your bottom line.',
        'Enterprise-ready deployment options with 99.9% uptime guarantee, dedicated support, and custom integration capabilities. Master antidisestablishmentarianism in one click.',
        'Execute your strategic vision with confidence using our comprehensive business intelligence and project management suite.'
      ];

      const items = [];
      for (let i = 0; i < count; i++) {
        const title = customTitles[i] || defaultTitles[i % defaultTitles.length];
        const description = customDescriptions[i] || defaultDescriptions[i % defaultDescriptions.length];

        items.push(`
       <div class="step-item">
         <div class="step-number">${i + 1}</div>
         <div class="step-content">
           <h4 style="color: ${titleColor};">${title}</h4>
           <p style="color: ${descriptionColor};">${description}</p>
         </div>
       </div>`);
      }

      return `
<div class="process-steps" style="font-family: '${font}', sans-serif; --line-color: ${lineColor}; margin-top: ${spacing}; margin-bottom: ${spacing};">
 ${items.join('')}
</div>`;
    },
    css: `
.process-steps {
 position: relative;
 max-width: 700px;
 margin: 0 auto;
 text-align: left;
}

.process-steps::before {
 content: '';
 position: absolute;
 left: 18px;
 top: 35px;
 bottom: 35px;
 width: 1px;
 background: repeating-linear-gradient(
   to bottom,
   var(--line-color) 0px,
   var(--line-color) 4px,
   transparent 4px,
   transparent 8px
 );
 z-index: 0;
}

.step-item {
 display: flex;
 gap: 23px;
 margin-bottom: 40px;
 position: relative;
 z-index: 1;
}

.step-item:last-child {
 margin-bottom: 0;
}

.step-number {
 width: 37px;
 height: 37px;
 background: #007AFF;
 border-radius: 50%;
 color: #f7f7f7ff;
 display: flex;
 align-items: center;
 justify-content: center;
 font-weight: 600;
 font-size: 14px;
 flex-shrink: 0;
}

.step-content h4 {
 font-size: 18px;
 font-weight: 600;
 margin: 0 0 8px 0;
}

.step-content p {
 font-size: 15px;
 line-height: 1.4;
 margin: 0;
 text-align: left;
}
`,
    js: ``
  },

  'hero': {
    html: (params = {}) => {
      const title = params.title || 'Lorem ipsum dolor sit amet.';
      const description = params.description || 'Nulla vitae odio quis sem vehicula malesuada et a est. Suspendisse fringilla turpis et eros semper, id elementum quam porttitor.';
      const spacing = params.spacing || '60px';
      const theme = params.theme || 'light';
      const titleFont = params.font || 'Instrument Serif';
      const descriptionFont = params.descriptionFont || 'Inter';
      const color = params.color;
      const centered = params.centered !== false;
      
      const themeColors = {
        light: {
          titleColor: '#191919ff',
          descriptionColor: '#191919ff'
        },
        dark: {
          titleColor: '#f7f7f7ff',
          descriptionColor: '#f7f7f7ff'
        }
      };
      
      const defaultColors = themeColors[theme] || themeColors.light;
      const titleColor = color || defaultColors.titleColor;
      const descriptionColor = color || defaultColors.descriptionColor;
      
      const centerClass = centered ? 'centered-hero' : '';

      return `
<div class="hero-section ${centerClass}" style="margin-top: ${spacing}; margin-bottom: ${spacing};">
  <h1 style="color: ${titleColor}; font-family: '${titleFont}', serif;">${title}</h1>
  <p style="color: ${descriptionColor}; font-family: '${descriptionFont}', sans-serif;">${description}</p>
</div>`;
    },
    css: `
.hero-section {
  text-align: center;
  max-width: 800px;
  width: 90%;
  margin: 0 auto;
}

.hero-section.centered-hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.hero-section h1 {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.hero-section p {
  font-size: 0.9rem;
  line-height: 1.2;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
}
`,
    js: ``
  },

  'project-cards': {
    html: (params = {}) => {
      const count = params.count || 3;
      const titles = params.titles || ['Project Alpha', 'Project Beta', 'Project Gamma'];
      const descriptions = params.descriptions || [
        'A comprehensive solution for modern businesses.',
        'Advanced analytics with real-time insights.',
        'Next-generation platform for scalable growth.'
      ];
      const techStacks = params.tech || ['React • Node.js • MongoDB', 'Python • FastAPI • PostgreSQL', 'Next.js • TypeScript • Tailwind'];
      const statuses = params.status || ['Live', 'Beta', 'Coming Soon'];
      const spacing = params.spacing || '60px';
      const theme = params.theme || 'light';

      // Theme-aware colors
      const themeColors = {
        light: {
          cardBg: 'rgba(0, 0, 0, 0.05)',
          cardBorder: 'rgba(0, 0, 0, 0.1)',
          cardHoverBg: 'rgba(0, 0, 0, 0.08)',
          cardHoverBorder: 'rgba(0, 0, 0, 0.2)',
          titleColor: '#191919ff',
          descColor: '#666666',
          btnSecondaryColor: '#191919ff',
          btnSecondaryBorder: 'rgba(0, 0, 0, 0.2)',
          btnSecondaryHoverBg: 'rgba(0, 0, 0, 0.1)',
          btnSecondaryHoverBorder: 'rgba(0, 0, 0, 0.3)',
          techBorder: 'rgba(0, 0, 0, 0.1)'
        },
        dark: {
          cardBg: 'rgba(255, 255, 255, 0.05)',
          cardBorder: 'rgba(255, 255, 255, 0.1)',
          cardHoverBg: 'rgba(255, 255, 255, 0.08)',
          cardHoverBorder: 'rgba(255, 255, 255, 0.2)',
          titleColor: '#f7f7f7ff',
          descColor: '#e5e5e5',
          btnSecondaryColor: '#f7f7f7ff',
          btnSecondaryBorder: 'rgba(255, 255, 255, 0.2)',
          btnSecondaryHoverBg: 'rgba(255, 255, 255, 0.1)',
          btnSecondaryHoverBorder: 'rgba(255, 255, 255, 0.3)',
          techBorder: 'rgba(255, 255, 255, 0.1)'
        }
      };

      const colors = themeColors[theme] || themeColors.light;

      let cards = '';
      for (let i = 0; i < count; i++) {
        const statusClass = statuses[i]?.toLowerCase().replace(/\s+/g, '-') || 'live';
        cards += `
    <div class="project-card" data-theme="${theme}">
      <div class="project-status ${statusClass}">${statuses[i] || 'Live'}</div>
      <h3 style="color: ${colors.titleColor};">${titles[i] || `Project ${i + 1}`}</h3>
      <p style="color: ${colors.descColor};">${descriptions[i] || 'Project description here.'}</p>
      <div class="tech-stack">${techStacks[i] || 'Tech • Stack • Here'}</div>
      <div class="project-links">
        <a href="#" class="btn-primary">View Project</a>
        <a href="#" class="btn-secondary" style="color: ${colors.btnSecondaryColor};">GitHub</a>
      </div>
    </div>`;
      }

      return `
<div class="projects-section" style="margin-top: ${spacing}; margin-bottom: ${spacing};">
  <div class="projects-grid" data-theme="${theme}">
    ${cards}
  </div>
</div>`;
    },
    css: `
.projects-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

/* Dark theme styles */
.projects-grid[data-theme="dark"] .project-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.projects-grid[data-theme="dark"] .project-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.projects-grid[data-theme="dark"] .tech-stack {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.projects-grid[data-theme="dark"] .btn-secondary {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.projects-grid[data-theme="dark"] .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Light theme styles */
.projects-grid[data-theme="light"] .project-card {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.projects-grid[data-theme="light"] .project-card:hover {
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.04);
}

.projects-grid[data-theme="light"] .tech-stack {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.projects-grid[data-theme="light"] .btn-secondary {
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.projects-grid[data-theme="light"] .btn-secondary:hover {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.3);
}

/* Base card styles */
.project-card {
  border-radius: 16px;
  padding: 30px;
  position: relative;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.project-card:hover {
  transform: translateY(-5px);
}

.project-status {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}

.project-status.live {
  background: rgba(52, 199, 89, 0.2);
  color: #34C759;
  border: 1px solid rgba(52, 199, 89, 0.3);
}

.project-status.beta {
  background: rgba(255, 149, 0, 0.2);
  color: #FF9500;
  border: 1px solid rgba(255, 149, 0, 0.3);
}

.project-status.coming-soon {
  background: rgba(0, 122, 255, 0.2);
  color: #007AFF;
  border: 1px solid rgba(0, 122, 255, 0.3);
}

.project-card h3 {
  font-family: 'Instrument Serif', serif;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.project-card p {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.tech-stack {
  color: #007AFF;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 24px;
  padding: 8px 0;
}

.project-links {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  text-align: center;
  flex: 1;
}

.btn-primary {
  background: #007AFF;
  color: white;
  border: 1px solid #007AFF;
}

.btn-primary:hover {
  background: #0056CC;
  border-color: #0056CC;
}

.btn-secondary {
  background: transparent;
}
`,
    js: ``
  }
};