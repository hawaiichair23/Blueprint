// steps component - numbered process steps with connecting line
export const steps = {
  html: (params = {}) => {
    const count = params.count || 5;
    const customTitles = params.titles || [];
    const customDescriptions = params.descriptions || [];
    const font = params.font || 'Inter';
    const theme = params.theme || 'light';
    const spacing = params.spacing || '60px';

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

    const titleColor = params.titleColor || defaults.titleColor;
    const descriptionColor = params.descriptionColor || defaults.descriptionColor;
    const lineColor = params.lineColor || defaults.lineColor;

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
    padding: 0 1rem;
    }
    
                .process-steps::before {
          content: '';
          position: absolute;
          left: 2.125rem;
          top: 2.1875rem;
          bottom: 2.1875rem;
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
    gap: 1.4375rem;
    margin-bottom: 2.5rem;
    position: relative;
    z-index: 1;
    }
    
    .step-item:last-child {
    margin-bottom: 0;
    }
    
    .step-number {
    width: 2.3125rem;
    height: 2.3125rem;
    background: #007AFF;
    border-radius: 50%;
    color: #f7f7f7ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
    }
    
    .step-content h4 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    }
    
    .step-content p {
    font-size: 0.9375rem;
    line-height: 1.4;
    margin: 0;
    text-align: left;
    }
    
        @media (min-width: 768px) {
      .process-steps {
        padding: 0 2rem;
      }
      
      .process-steps::before {
        left: 3.125rem;
      }
    }
    `,
  js: ``
};