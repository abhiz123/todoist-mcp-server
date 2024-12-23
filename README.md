# Todoist MCP Server
[![smithery badge](https://smithery.ai/badge/@abhiz123/todoist-mcp-server)](https://smithery.ai/server/@abhiz123/todoist-mcp-server)

An MCP (Model Context Protocol) server implementation that integrates Claude with Todoist, enabling natural language task management. This server allows Claude to interact with your Todoist tasks using everyday language.

## Features

* **Natural Language Task Management**: Create, update, complete, and delete tasks using everyday language
* **Smart Task Search**: Find tasks using partial name matches
* **Flexible Filtering**: Filter tasks by due date, priority, and other attributes
* **Rich Task Details**: Support for descriptions, due dates, and priority levels
* **Intuitive Error Handling**: Clear feedback for better user experience

## Installation

### Installing via Smithery

To install Todoist MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@abhiz123/todoist-mcp-server):

```bash
npx -y @smithery/cli install @abhiz123/todoist-mcp-server --client claude
```

### Manual Installation
```bash
npm install -g @abhiz123/todoist-mcp-server
```

## Tools

### todoist_create_task
Create new tasks with various attributes:
* Required: content (task title)
* Optional: description, due date, priority level (1-4)
* Example: "Create task 'Team Meeting' with description 'Weekly sync' due tomorrow"

### todoist_get_tasks
Retrieve and filter tasks:
* Filter by due date, priority, or project
* Natural language date filtering
* Optional result limit
* Example: "Show high priority tasks due this week"

### todoist_update_task
Update existing tasks using natural language search:
* Find tasks by partial name match
* Update any task attribute (content, description, due date, priority)
* Example: "Update meeting task to be due next Monday"

### todoist_complete_task
Mark tasks as complete using natural language search:
* Find tasks by partial name match
* Confirm completion status
* Example: "Mark the documentation task as complete"

### todoist_delete_task
Remove tasks using natural language search:
* Find and delete tasks by name
* Confirmation messages
* Example: "Delete the PR review task"

## Setup

### Getting a Todoist API Token
1. Log in to your Todoist account
2. Navigate to Settings → Integrations
3. Find your API token under "Developer"

### Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "todoist": {
      "command": "npx",
      "args": ["-y", "@abhiz123/todoist-mcp-server"],
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

## Example Usage

### Creating Tasks
```
"Create task 'Team Meeting'"
"Add task 'Review PR' due tomorrow at 2pm"
"Create high priority task 'Fix bug' with description 'Critical performance issue'"
```

### Getting Tasks
```
"Show all my tasks"
"List tasks due today"
"Get high priority tasks"
"Show tasks due this week"
```

### Updating Tasks
```
"Update documentation task to be due next week"
"Change priority of bug fix task to urgent"
"Add description to team meeting task"
```

### Completing Tasks
```
"Mark the PR review task as complete"
"Complete the documentation task"
```

### Deleting Tasks
```
"Delete the PR review task"
"Remove meeting prep task"
```

## Development

### Building from source
```bash
# Clone the repository
git clone https://github.com/abhiz123/todoist-mcp-server.git

# Navigate to directory
cd todoist-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Contributing
Contributions are welcome! Feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Issues and Support
If you encounter any issues or need support, please file an issue on the [GitHub repository](https://github.com/abhiz123/todoist-mcp-server/issues).