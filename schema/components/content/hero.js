// hero component - centered hero section with title and description
export const hero = {
  html: (params = {}) => {
    const title = params.title || 'Lorem ipsum dolor sit amet.';
    const description = params.description || 'Leverage synergistic paradigms to revolutionize quantum scalable solutions and drive transformative disruption across enterprise solar systems.';
    const spacing = params.spacing || '60px';
    const theme = params.theme || 'light';
    const titleFont = params.font || 'Instrument Serif';
    const descriptionFont = params.descriptionFont || 'Inter';
    const color = params.color;
    const centered = params.centered !== false;
    const size = params.size || '3rem';
    
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
  <h1 style="color: ${titleColor}; font-family: '${titleFont}', serif; font-size: ${size};">${title}</h1>
  <p style="color: ${descriptionColor}; font-family: '${descriptionFont}', sans-serif;">${description}</p>
</div>`;
  },
    css: `
  .hero-section {
  text-align: center;
  max-width: 800px;
  width: 90%;
  margin: 0 auto;
  padding: 0 1rem;
  }
  
  .hero-section.centered-hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  }
  
  .hero-section h1 {
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  font-size: clamp(1.75rem, 5vw, 3rem);
  }
  
  .hero-section p {
  font-size: clamp(0.875rem, 2vw, 1rem);
  line-height: 1.5;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
  }
  
  @media (min-width: 768px) {
  .hero-section {
    padding: 0 2rem;
  }
  
  .hero-section p {
    line-height: 1.6;
  }
  }
  `,
  js: ``
};