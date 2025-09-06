// Schema Table of Contents - imports all modular schema files
import { blueprints } from './blueprints.js';
import { components } from './components.js';
import { flows } from './flows.js';

export default {
    blueprints,
    components,
    flows
};

// Instructions for AI
`
    File Structure:

    /Blueprint/
    ├── server.js               # MCP server (don't modify directly)
    ├── generate.js             # Compiles blueprints to files
    ├── blueprint.txt           # Blueprint definitions (use write tool with mode=blueprint)
    ├── /schema/
    │   └── index.js           # All component definitions
    └── /sandbox/              # Generated files go here
        ├── *.html
        ├── *.css
        └── *.js

## Available Tools:

**read** - Get content
- {"target": "file", "filename": "blueprint.txt"} - Read any file
- {"target": "blueprints"} - Read schema/syntax reference
- {"target": "generated"} - Read generated HTML output

**write** - Create or modify files
- {"mode": "blueprint", "filename": "blueprint.txt", "content": "..."} - Write blueprint
- {"mode": "overwrite", "filename": "app.js", "content": "..."} - Create/replace file in sandbox
- {"mode": "segment", "filename": "app.js", "old_str": "old", "new_str": "new"} - Update part of file

**execute** - Run operations
- {"command": "generate"} - Compile blueprint.txt to HTML/CSS/JS
- {"command": "list", "directory": "sandbox"} - List files in directory

**search** - Find text within files
- {"filename": "schema/components.js", "query": "theme"} - Basic search
- {"filename": "components.js", "query": "theme", "context": 5} - Search with more context lines
- {"filename": "blueprint.txt", "query": "nav", "max_results": 3} - Limit number of matches
- {"filename": "server.js", "query": "function", "case_sensitive": true} - Case-sensitive search

## Blueprint System Overview

blueprint.txt starts with page:name; then add components and flows.

## Universal parameters that work on almost all components:
- theme=dark/light - Color scheme
- font=Inter/Roboto - Typography
- spacing=60px - Margin top/bottom
- color=#333 - Text color

## Blueprint Syntax Rules:
- No quotes around array items: links=[Product,Pricing,Contact]
- Quotes optional for other params; both theme=dark and theme="dark" work
- Use semicolons to separate parameters, missing semicolons are fine

## File Structure:
- schema/ - Component definitions. Search here, don't modify
- sandbox/ - Generated files and your workspace
- Blueprint/ - root directory with generate.js and blueprint.txt
- blueprint.txt - Your blueprint source

## How generate.js works:
1. Reads blueprint.txt
2. Finds blueprint template, uses its html.start + html.end wrapper
3. Inserts component HTML between start/end
4. Combines all CSS from blueprints and components
5. Combines all JS from flows
6. Outputs results to sandbox/

## Security & File Rules:
- Don't edit schema/ or server.js directly
- Don't place files outside sandbox/
- Use .env files with PLACEHOLDER values for API keys
- If user requests features that are not available in schema/, pick the closest blueprint and manually modify the generated file(s) afterward

## Example blueprint.txt:

page:login;
blueprint:auth/login+dashboard; theme=light;
provider:google; text="Continue with Google";
separator:text; content="OR CONTINUE WITH EMAIL";
form:email; fields=[email,password]; submit="Sign In";
flow:email_submit > dashboard;
flow:logout > login;

## Example 2

page:purple-test;
blueprint:test/blank; background=purple;
nav; links=[Home,Features,About,Contact];
`