// nav component - animated navigation bar with glassmorphism and minimal styles
export const nav = {
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
        <div class="nav-container" style="display: flex; justify-content: ${justifyContent};">
        <div class="${linksClass}" style="margin: ${spacing} 0; --nav-text-color: ${textColor}; --pill-bg-glass: ${pillColorGlass}; --pill-bg-minimal: ${pillColorMinimal}; font-family: '${font}', sans-serif;">
        ${links.map((link, index) =>
              `<a href="${normalizedHrefs[index] || '#'}" class="${index === activeIndex ? 'active' : ''}">${link}</a>`
            ).join('')}
        </div>
        </div>`;
        },
        css: `
        .nav-container {
        padding: 0 1rem;
        }
        
        .nav-links-glassmorphism {
        display: inline-flex;
        gap: 0.875rem;
        position: relative;
        background: rgba(61, 61, 61, 0.09);
        padding: 0.1875rem 0.375rem;
        border-radius: 1.25rem;
        backdrop-filter: blur(10px);
        }
        
                                .nav-links-glassmorphism::before {
                  content: '';
                  position: absolute;
                  background: var(--pill-bg-glass, rgba(0, 0, 0, 0.08));
                  border-radius: 1.25rem;
                  z-index: 1;
                  height: calc(100% - 0.75rem);
                  top: 0.375rem;
                  width: var(--pill-width-glass, 3.75rem);
                  left: var(--pill-position-glass, 0.5rem);
                }
                
                .nav-links-glassmorphism.transitions-enabled::before {
                  transition: all 0.3s ease;
                }
        
        .nav-links-minimal {
        display: inline-flex;
        gap: 0.875rem;
        position: relative;
        }
        
                                .nav-links-minimal::before {
                  content: '';
                  position: absolute;
                  background: var(--pill-bg-glass, rgba(0, 0, 0, 0.08));
                  border-radius: 1.25rem;
                  z-index: 1;
                  height: calc(100% - 0.375rem);
                  top: 0.1875rem;
                  width: var(--pill-width-minimal, 3.75rem);
                  left: var(--pill-position-minimal, 0);
                }
                
                .nav-links-minimal.transitions-enabled::before {
                  transition: all 0.3s ease;
                }
        
        .nav-links-glassmorphism a,
        .nav-links-minimal a {
        color: var(--nav-text-color, #f7f7f7ff);
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 1.25rem;
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
    
    // Set initial position immediately
    updatePill();
    
    // Enable transitions after page loads
    window.addEventListener('load', () => {
      navLinks.classList.add('transitions-enabled');
    });
    
    links.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        updatePill();
      });
    });
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
    
    // Set initial position immediately
    updatePill();
    
    // Enable transitions after page loads
    window.addEventListener('load', () => {
      navLinks.classList.add('transitions-enabled');
    });
    
    links.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        updatePill();
      });
    });
    }
    `
};