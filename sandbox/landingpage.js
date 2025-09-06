document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.nav-links a');
  const navContainer = document.querySelector('.nav-links');
  
  // Handle navigation pill sliding animation
  navLinks.forEach((link, index) => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      this.classList.add('active');
      
      // Get the actual position and width of the clicked link
      const linkRect = this.getBoundingClientRect();
      const containerRect = navContainer.getBoundingClientRect();
      const position = linkRect.left - containerRect.left;
      const width = linkRect.width;
      
      // Move and resize the pill to match the clicked link
      navContainer.style.setProperty('--pill-position', position + 'px');
      navContainer.style.setProperty('--pill-width', width + 'px');
    });
  });
  
  // Set initial position and size for the pill (on Product)
  const firstLink = navLinks[0];
  if (firstLink) {
    const linkRect = firstLink.getBoundingClientRect();
    const containerRect = navContainer.getBoundingClientRect();
    const initialPosition = linkRect.left - containerRect.left;
    const initialWidth = linkRect.width;
    
    navContainer.style.setProperty('--pill-position', initialPosition + 'px');
    navContainer.style.setProperty('--pill-width', initialWidth + 'px');
  }
});