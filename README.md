
## Development Status & Safety Notice

**Blueprint** is a work in progress -- file system access is currently unrestricted, so use at your own risk. Docker sandboxing will be added at a later stage in development for stronger security and resource limits.

**Do not deploy Blueprint in production or use with sensitive information. Local dev only.**

# 📖Blueprint

**Blueprint** is an MCP server for accelerated development with AI. At its core is a simple declarative syntax that allows either the user or the AI assistant to write to a .txt file & run node generate.js to generate files locally. The parser is located in generate.js. It reads the .txt files from **blueprint/**, parses its syntax, extracts the parameters, matches it with components from the **schema/** library, and uses Node.js's `fs.writeFileSync()` to write generated HTML/CSS/JS directly to the filesystem in the sandbox.

**Current Development:**
- Currently Windows-only
- Javascript-specific
- Plans to add React support next
- Adding to component library for common web patterns
- Ideas for backend patterns coming
- Docker support coming along with other OS support

## Dependencies

- **@modelcontextprotocol/sdk** - ^0.6.0
- **acorn** - ^8.15.0
- **acorn-walk** - ^8.3.4
- **chokidar** - ^4.0.3
- **dotenv** - ^17.2.3

## MCP Server

- Runs automatically on port 3002.

## Filesystem Tools

**read** - view files, schema, and generated output. Uses absolute paths or relative path from the base directory.

**write** - writes files in overwrite mode or string replace mode. This will either generate new file or find and replace exact line and column with whitespace normalization to preserve indentation.

**search** - searches using queries, exact line number, or returns whole functions using an AST parser.

**execute** - run the generate.js command, list contents of directories, or list components.

**read_errors** - read browser error logs from the browser formatted nicely.

## Read

**target** (required) - file, index, or generated. File is for finding any file name, index refers to index.js, which is a convenient explanation of Blueprint for the AI, and generated finds the most recently generated HTML file and shows the first 800 characters.

**filename** - filename. Required for using target: file.

## Search
All potential search parameters are false by default and can be left off, except for filename.

**filename** (required)

**query** - text-based search.

**line** - jump to exact line of file.

**context** - lines of context to provide around any given search.

**case_sensitive** - case sensitivity of result.

**max_results** - max results for text-based search. default: 10.

**function_search** - finds and returns complete functions using the Acorn parser.

**list_functions** - lists all functions, classes, and methods in file, no query needed.

**discovery** - This is the AI's tools for exploring the schema library. Returns the component object with html, params, CSS, and JS. If not found, will list all available components by name.

## Execute

**generate** - Compiles blueprint files to HTML/CSS/JS. Without filename parameter, generates all blueprints in **blueprints/** folder. With filename parameter (e.g., "basic-projects.txt"), generates only that specific blueprint file.

**list** - Show files in given directory. Requires directory name.

**list_components** - Show names of all components, flows, and blueprints.

## Read_Errors

Finds the file browser_errors.jsonl in sandbox/ and returns using any combination of categories the AI specifies.

** Available filters: timestamp, page, type, message, source, line, column, stack, url, UserAgent**

## Blueprint Syntax

All features except page: (name) and base blueprint template can be left off.
```
page:basic-projects;

blueprint:test/blank;

hero; title="My Projects";

project-cards;
```

## Print

**prt.js** is an automatic file versioning system that saves backups to the **versions/** folder with **/YYYY-MM-DD/H-MM-SS-AM-filename/** timestamping. It's intended to save directory files safely in an AI-assisted environment where the AI will make mistakes constantly. It runs automatically when the MCP server starts and saves using SHA-256 hashing to avoid duplicates.

## Local Installation

All installation instructions are subject to change in the future as I add Docker and improve the server, and I will do my best to keep up to date with the instructions. For now:

Prerequisites: Node.js (version 16 or higher recommended)
Clone the repository:

```bash
git clone https://github.com/yourusername/Blueprint.git
cd Blueprint
```

**Install dependencies:**
```bash
npm install
```

Verify installation: Run node server.js in the Blueprint directory. If it starts without errors, all is well.

## Setup with Claude

Blueprint currently only works with Claude Desktop until OpenAI stops being bad. 
**Note:** Claude Desktop the app, not Claude in the browser.

1. Locate your Claude Desktop config file:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add Blueprint as an MCP server:

```json
{
  "mcpServers": {
    "blueprint": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\Desktop\\Blueprint\\server.js"]
    }
  }
}
```

3. Replace `C:\\Users\\YourName\\` with your actual Blueprint directory path. This ties the MCP server to Claude Desktop.

4. Restart Claude Desktop. Blueprint will automatically start running on port 3002.

5. Blueprint tools will now be available in your Claude conversations.

**Note:** If testing changes to the MCP server, you will need to completely close Claude Desktop from the system tray. The server Node.js process can get stuck sometimes, so you may need to manually kill it with taskkill /f /im node.exe in Command Prompt before restarting Claude Desktop.

Put the bash commands in code blocks like the JSON:

