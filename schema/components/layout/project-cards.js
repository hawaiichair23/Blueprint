// project cards component - grid of project showcase cards
export const projectCards = {
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
    const titleColor = params.titleColor || null;
    const descriptionColor = params.descriptionColor || null; 

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
    <h3 style="color: ${titleColor || colors.titleColor};">${titles[i] || `Project ${i + 1}`}</h3>
    <p style="color: ${descriptionColor || colors.descColor};">${descriptions[i] || 'Project description here.'}</p>
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
grid-template-columns: 1fr;
gap: 30px;
margin-top: 40px;
}

@media (min-width: 600px) {
  .projects-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

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
};