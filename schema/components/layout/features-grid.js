// features grid component - icon + text grid layout
export const featuresGrid = {
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
                gap: 2rem;
                margin: 1.875rem auto 0;
                max-width: 500px;
                padding: 0 1rem;
                }
                
                .feature-item {
                display: flex;
                align-items: center;
                gap: 0.9375rem;
                font-size: 1rem;
                justify-content: center;
                }
                
                .feature-icon {
                width: 2.25rem;
                height: 2.25rem;
                border-radius: 50%;
                flex-shrink: 0;
                }
                
                .feature-icon.blue { background: #007AFF; }
                .feature-icon.green { background: #34C759; }
                .feature-icon.orange { background: #FF9500; }
                .feature-icon.pink { background: #FF2D92; }
                
                @media (min-width: 768px) {
                .features-grid {
                  gap: 2rem;
                  padding: 0 2rem;
                }
                }
                `,
  js: ``
};