
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
    