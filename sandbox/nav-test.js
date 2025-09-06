
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

// Animated pill indicator for regular style
if (document.querySelector('.nav-links-regular')) {
  const navLinks = document.querySelector('.nav-links-regular');
  const links = navLinks.querySelectorAll('a');
  
  function updatePill() {
    const activeLink = navLinks.querySelector('a.active');
    if (activeLink) {
      const position = activeLink.offsetLeft;
      const width = activeLink.offsetWidth;
      
      navLinks.style.setProperty('--pill-position-regular', position + 'px');
      navLinks.style.setProperty('--pill-width-regular', width + 'px');
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

// Animated pill indicator for regular style
if (document.querySelector('.nav-links-regular')) {
  const navLinks = document.querySelector('.nav-links-regular');
  const links = navLinks.querySelectorAll('a');
  
  function updatePill() {
    const activeLink = navLinks.querySelector('a.active');
    if (activeLink) {
      const position = activeLink.offsetLeft;
      const width = activeLink.offsetWidth;
      
      navLinks.style.setProperty('--pill-position-regular', position + 'px');
      navLinks.style.setProperty('--pill-width-regular', width + 'px');
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
