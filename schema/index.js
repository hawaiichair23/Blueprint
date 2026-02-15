// schema table of contents - imports all modular schema files
import { blueprints } from './blueprints.js';
import { components } from './components/index.js';
import { flows } from './flows/index.js';

export default {
    blueprints,
    components,
    flows
};

// Instructions for AI
`
File Structure:

/Blueprint/
├── server.js               # MCP server
├── generate.js             # Compiles blueprints to files using fs.writeFileSync()
├── /blueprints/            # Blueprint .txt files
├── /schema/
│   ├── /components/        # Component definitions organized by category
│   ├── /flows/            # Flow definitions
│   └── blueprints.js      # Blueprint templates
└── /sandbox/              # Generated files output here
    ├── *.html
    ├── *.css
    └── *.js

## MCP Tools:

**read** - View files, schema, and generated output
- target: "file" + filename - Read any file (absolute or relative from BASE_DIR)
- target: "index" - Read this schema documentation
- target: "generated" - Read most recent generated HTML (first 800 chars)

**write** - Create or modify files (unrestricted filesystem access)
- mode: "overwrite" + filename + content - Create/replace entire file
- mode: "segment" + filename + old_str + new_str - Find and replace with whitespace normalization

**search** - Text search, line lookup, or AST parsing
- filename + query - Text search with context
- filename + line - Jump to specific line
- filename + function_search: true + query - Find complete functions using Acorn parser
- filename + list_functions: true - List all functions/classes/methods
- discover: "component-name" - Explore component library (returns code, params, CSS, JS)

**execute** - Run system operations
- command: "generate" - Compile all blueprints or specific file with filename parameter
- command: "list" + directory - List files in sandbox/schema/.
- command: "list_components" - Show all available components/flows/blueprints

**read_errors** - Parse browser error logs
- Returns structured data from sandbox/browser-errors.jsonl
- Filter by page, type, last_n errors

## Blueprint Syntax:

Blueprints are declarative .txt files in /blueprints/ folder:

page:name;
blueprint:template/name; theme=dark;
component; param=value; param2=[array,items];
flow:name;

Rules:
- Semicolons separate parameters (optional at end of line)
- No quotes needed for arrays: links=[Home,About,Contact]
- Quotes optional for strings: both theme=dark and theme="dark" work
- Parameters cascade: blueprint theme applies to all components unless overridden

Universal parameters (work on most components):
- theme=dark/light - Color scheme
- font=Inter/Roboto - Typography
- spacing=60px - Margin top/bottom
- color=#333 - Text color

## How generate.js Works:

1. Reads blueprint .txt file(s) from /blueprints/
2. Parses syntax and extracts parameters (semicolon-separated key=value pairs)
3. Matches components from schema/ library
4. Combines HTML (blueprint template wraps component HTML)
5. Combines CSS from all components
6. Combines JS from flows
7. Uses fs.writeFileSync() to write HTML/CSS/JS to /sandbox/

## Component Discovery:

Use discover tool to explore schema:
- discover: "nav" → Returns nav component code, parameters, CSS, JS
- discover: "accordion" → Component not found, lists all available components

Components are organized in schema/components/ by category (navigation, content, layout, etc.)

## File Rules:

- Generated files go to /sandbox/
- Blueprint .txt files go in /blueprints/
- Filesystem access is currently unrestricted (Docker sandboxing coming)
- Use absolute paths or relative paths from BASE_DIR (Blueprint root directory)

## Example Blueprint:

page:login;
blueprint:auth/login+dashboard; theme=light;
provider:google; text="Continue with Google";
separator:text; content="OR CONTINUE WITH EMAIL";
form:email; fields=[email,password]; submit="Sign In";
flow:email_submit > dashboard;
`