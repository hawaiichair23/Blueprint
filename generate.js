import fs from 'fs';
import path from 'path';
import blueprints from './schema/index.js';

// Function to extract expected parameters from component code
function extractExpectedParams(component) {
  const expectedParams = new Set();
  
  // Convert component to string to search for params usage
  const componentStr = component.html?.toString() || '';
  
  // Find all params.something patterns
  const paramMatches = componentStr.match(/params\.(\w+)/g);
  if (paramMatches) {
    paramMatches.forEach(match => {
      const paramName = match.replace('params.', '');
      expectedParams.add(paramName);
    });
  }
  
  return Array.from(expectedParams);
}

// Function to validate parameters
function validateParams(componentName, passedParams, expectedParams) {
  const unknownParams = Object.keys(passedParams).filter(param => !expectedParams.includes(param));
  
  if (unknownParams.length > 0) {
    console.log(`⚠️  Warning: Unknown parameters for '${componentName}': ${unknownParams.join(', ')}`);
    console.log(`   Available parameters: ${expectedParams.join(', ')}`);
  }
}

// Function to parse parameters from a line
function parseParams(line) {
  const parts = line.split(';').map(part => part.trim());
  const base = parts[0]; // e.g., "blueprint:auth/login+dashboard"
  const params = {};

  parts.slice(1).forEach(param => {
    if (param.includes('=')) {
      const [key, value] = param.split('=');
      let cleanValue = value.trim();

      // Handle arrays like security=[csrf,state_verification]
      if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
        params[key.trim()] = cleanValue.slice(1, -1).split(',').map(v => v.trim());
      } else {
        // Remove surrounding quotes if they exist
        if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
          (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
          cleanValue = cleanValue.slice(1, -1);
        }
        params[key.trim()] = cleanValue;
      }
    }
  });

  return { base, params };
}

const blueprint = fs.readFileSync('blueprint.txt', 'utf-8');
const lines = blueprint.split('\n').filter(line => line.trim()).map(line => line.trim());

// Get page name from page: directive or default to 'app'
const pageLine = lines.find(line => line.startsWith('page:'));
const pageName = pageLine ? pageLine.split(':')[1]?.trim().replace(';', '') : 'app';
const outputName = pageName || 'app';

if (pageLine) {
    console.log(`📄 Page found: "${pageName}"`);
} else {
    console.log(`📄 No page: directive found, defaulting to: "app"`);
}

console.log('Blueprint lines found:');
lines.forEach((line, i) => console.log(`${i}: "${line}"`));

console.log('\nAvailable components:');
Object.keys(blueprints.components).forEach(key => console.log(`"${key}"`));

console.log('\nAvailable flows:');
Object.keys(blueprints.flows).forEach(key => console.log(`"${key}"`));

let html = '';
let css = '';
let js = '';
let blueprintParams = {};

// Find blueprint first
const blueprintLine = lines.find(line => line.startsWith('blueprint:'));
console.log(`\nFound blueprint line: "${blueprintLine}"`);

if (blueprintLine) {
  const { base, params } = parseParams(blueprintLine);
  // Add the output name from page: directive to the params
  params.output = outputName;
  blueprintParams = params; // Store for later use
  console.log(`Parsed base: "${base}"`, `Params:`, params);

  // Try exact match first, then base match
  let foundBlueprint = blueprints.blueprints[blueprintLine] || blueprints.blueprints[base];

  if (foundBlueprint) {
    // Handle both function and object-based HTML
    const htmlTemplate = typeof foundBlueprint.html === 'function'
      ? foundBlueprint.html(params)
      : foundBlueprint.html;

    html += htmlTemplate.start;
    // Check if css is a function (for dynamic theming) or string
    if (typeof foundBlueprint.css === 'function') {
      css += foundBlueprint.css(params);
    } else {
      css += foundBlueprint.css;
    }
    js += foundBlueprint.js;
    console.log('✅ Blueprint found and added with params:', params);
  } else {
    console.log('❌ Blueprint not found for base:', base);
  }
} else {
  console.log('❌ No blueprint line found');
}

// Add components
lines.forEach(line => {
  const { base, params } = parseParams(line);

  // Merge blueprint theme as fallback, but let component params override
  const mergedParams = { 
    theme: blueprintParams.theme, // blueprint theme as default
    ...params // component params override blueprint params
  };

  // Try exact match first, then base match
  if (blueprints.components[line] || blueprints.components[base]) {
    const component = blueprints.components[line] || blueprints.components[base];

    // Validate parameters
    const expectedParams = extractExpectedParams(component);
    validateParams(base, mergedParams, expectedParams);

    // Check if html is a function that needs params
    if (typeof component.html === 'function') {
      html += component.html(mergedParams);
    } else {
      html += component.html || '';
    }

    css += component.css || '';
    js += component.js || '';
    
    console.log(`✅ Component added: ${base}`, mergedParams ? `with params: ${JSON.stringify(mergedParams)}` : '');
  }

  if (blueprints.flows[line] || blueprints.flows[base]) {
    const flow = blueprints.flows[line] || blueprints.flows[base];
    js += flow.js || '';
    console.log(`✅ Flow added: ${base}`, params ? `with params: ${JSON.stringify(params)}` : '');
  }
});

// Close blueprint
if (blueprintLine) {
  const { base } = parseParams(blueprintLine);
  const foundBlueprint = blueprints.blueprints[blueprintLine] || blueprints.blueprints[base];
  if (foundBlueprint) {
    const htmlTemplate = typeof foundBlueprint.html === 'function'
      ? foundBlueprint.html(blueprintParams)
      : foundBlueprint.html;

    html += htmlTemplate.end;
  }
}

// Ensure sandbox directory exists
const sandboxDir = './sandbox';
if (!fs.existsSync(sandboxDir)) {
  fs.mkdirSync(sandboxDir, { recursive: true });
}

const files = [
  { content: html, path: path.join(sandboxDir, `${outputName}.html`) },
  { content: css, path: path.join(sandboxDir, `${outputName}.css`) },
  { content: js, path: path.join(sandboxDir, `${outputName}.js`) }
];
console.log('🎉 Blueprint compilation complete!');

files.forEach(file => {
  fs.writeFileSync(file.path, file.content);
  console.log(`Generated ${file.path}`);
});
