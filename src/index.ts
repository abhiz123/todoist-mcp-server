#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoistApi } from "@doist/todoist-api-typescript";

// Define tools
const CREATE_TASK_TOOL: Tool = {
  name: "todoist_create_task",
  description: "Create a new task in Todoist with optional description, due date, priority, section, and parent task support",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The content/title of the task"
      },
      description: {
        type: "string",
        description: "Detailed description of the task (optional)"
      },
      project_id: {
        type: "string",
        description: "ID of the project to add the task to (optional)"
      },
      project_name: {
        type: "string",
        description: "Name of the project to add the task to (e.g., 'Shopping', 'Work') (optional)"
      },
      section_id: {
        type: "string",
        description: "ID of the section to add the task to (optional)"
      },
      section_name: {
        type: "string",
        description: "Name of the section to add the task to (e.g., 'Groceries', 'Meetings') (optional)"
      },
      parent_id: {
        type: "string",
        description: "ID of the parent task to create this as a subtask (optional)"
      },
      parent_task_name: {
        type: "string",
        description: "Name/content of the parent task to create this as a subtask (optional)"
      },
      due_string: {
        type: "string",
        description: "Natural language due date like 'tomorrow', 'next Monday', 'Jan 23' (optional)"
      },
      priority: {
        type: "number",
        description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      }
    },
    required: ["content"]
  }
};

const GET_TASKS_TOOL: Tool = {
  name: "todoist_get_tasks",
  description: "Get a list of tasks from Todoist with various filters including section and parent task",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Filter tasks by project ID (optional)"
      },
      project_name: {
        type: "string",
        description: "Filter tasks by project name (e.g., 'Shopping', 'Work') (optional)"
      },
      section_id: {
        type: "string",
        description: "Filter tasks by section ID (optional)"
      },
      section_name: {
        type: "string",
        description: "Filter tasks by section name (e.g., 'Groceries', 'Meetings') (optional)"
      },
      parent_id: {
        type: "string",
        description: "Filter tasks by parent task ID to get subtasks (optional)"
      },
      parent_task_name: {
        type: "string",
        description: "Filter tasks by parent task name to get subtasks (optional)"
      },
      filter: {
        type: "string",
        description: "Natural language filter like 'today', 'tomorrow', 'next week', 'priority 1', 'overdue' (optional)"
      },
      priority: {
        type: "number",
        description: "Filter by priority level (1-4) (optional)",
        enum: [1, 2, 3, 4]
      },
      limit: {
        type: "number",
        description: "Maximum number of tasks to return (optional)",
        default: 10
      }
    }
  }
};

const GET_PROJECTS_TOOL: Tool = {
  name: "todoist_get_projects",
  description: "Get a list of projects from Todoist with optional filters",
  inputSchema: {
    type: "object",
    properties: {
      filter: {
        type: "string",
        description: "Natural language filter like 'Career planning', 'shopping','work', 'personal growth' (optional)"
      }
    }
  }
};

const UPDATE_TASK_TOOL: Tool = {
  name: "todoist_update_task",
  description: "Update an existing task in Todoist by searching for it by name and then updating it",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and update"
      },
      content: {
        type: "string",
        description: "New content/title for the task (optional)"
      },
      description: {
        type: "string",
        description: "New description for the task (optional)"
      },
      due_string: {
        type: "string",
        description: "New due date in natural language like 'tomorrow', 'next Monday' (optional)"
      },
      priority: {
        type: "number",
        description: "New priority level from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      }
    },
    required: ["task_name"]
  }
};

const DELETE_TASK_TOOL: Tool = {
  name: "todoist_delete_task",
  description: "Delete a task from Todoist by searching for it by name",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and delete"
      }
    },
    required: ["task_name"]
  }
};

const COMPLETE_TASK_TOOL: Tool = {
  name: "todoist_complete_task",
  description: "Mark a task as complete by searching for it by name",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and complete"
      }
    },
    required: ["task_name"]
  }
};

// Server implementation
const server = new Server(
  {
    name: "todoist-mcp-server",
    version: "0.1.2",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Check for API token
const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN!;
if (!TODOIST_API_TOKEN) {
  console.error("Error: TODOIST_API_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize Todoist client
const todoistClient = new TodoistApi(TODOIST_API_TOKEN);

// Type guards for arguments
function isCreateTaskArgs(args: unknown): args is { 
  content: string;
  description?: string;
  due_string?: string;
  priority?: number;
  project_id?: string;
  project_name?: string;
  section_id?: string;
  section_name?: string;
  parent_id?: string;
  parent_task_name?: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "content" in args &&
    typeof (args as { content: string }).content === "string"
  );
}

function isGetTasksArgs(args: unknown): args is { 
  project_id?: string;
  project_name?: string;
  section_id?: string;
  section_name?: string;
  parent_id?: string;
  parent_task_name?: string;
  filter?: string;
  priority?: number;
  limit?: number;
} {
  return (
    typeof args === "object" &&
    args !== null
  );
}

function isGetProjectsArgs(args: unknown): args is {
  filter?: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    (args as any).filter === undefined || typeof (args as any).filter === "string"
  );
}

function isUpdateTaskArgs(args: unknown): args is {
  task_name: string;
  content?: string;
  description?: string;
  due_string?: string;
  priority?: number;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string"
  );
}

function isDeleteTaskArgs(args: unknown): args is {
  task_name: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string"
  );
}

function isCompleteTaskArgs(args: unknown): args is {
  task_name: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string"
  );
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [CREATE_TASK_TOOL, GET_TASKS_TOOL, GET_PROJECTS_TOOL, UPDATE_TASK_TOOL, DELETE_TASK_TOOL, COMPLETE_TASK_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    if (name === "todoist_create_task") {
      if (!isCreateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_task");
      }
      
      let projectId = args.project_id;
      
      // If project_name is provided but not project_id, try to find the project by name
      if (!projectId && args.project_name) {
        try {
          const projects = await todoistClient.getProjects();
          const projectNameLower = args.project_name.toLowerCase();
          const matchingProject = projects.find(project => 
            project.name.toLowerCase().includes(projectNameLower)
          );
          
          if (matchingProject) {
            projectId = matchingProject.id;
          }
        } catch (error) {
          console.error("Error finding project by name:", error);
        }
      }
      
      let sectionId = args.section_id;
      
      // If section_name is provided but not section_id, try to find the section by name
      if (!sectionId && args.section_name && projectId) {
        try {
          const sections = await todoistClient.getSections(projectId);
          const sectionNameLower = args.section_name.toLowerCase();
          const matchingSection = sections.find(section => 
            section.name.toLowerCase().includes(sectionNameLower)
          );
          
          if (matchingSection) {
            sectionId = matchingSection.id;
          }
        } catch (error) {
          console.error("Error finding section by name:", error);
        }
      }
      
      let parentId = args.parent_id;
      
      // If parent_task_name is provided but not parent_id, try to find the parent task by name
      if (!parentId && args.parent_task_name) {
        try {
          const tasks = await todoistClient.getTasks();
          const parentTaskNameLower = args.parent_task_name.toLowerCase();
          const matchingTask = tasks.find(task => 
            task.content.toLowerCase().includes(parentTaskNameLower)
          );
          
          if (matchingTask) {
            parentId = matchingTask.id;
          }
        } catch (error) {
          console.error("Error finding parent task by name:", error);
        }
      }
      
      const task = await todoistClient.addTask({
        content: args.content,
        description: args.description,
        dueString: args.due_string,
        priority: args.priority,
        projectId: projectId,
        sectionId: sectionId,
        parentId: parentId
      });
      
      // Get project name for the response if we have a project ID
      let projectName = "";
      if (projectId) {
        try {
          const project = await todoistClient.getProject(projectId);
          projectName = project.name;
        } catch (error) {
          console.error("Error getting project details:", error);
        }
      }
      
      // Get section name if we have a section ID
      let sectionName = "";
      if (sectionId) {
        try {
          const sections = await todoistClient.getSections(projectId);
          const section = sections.find(s => s.id === sectionId);
          if (section) {
            sectionName = section.name;
          }
        } catch (error) {
          console.error("Error getting section details:", error);
        }
      }
      
      // Get parent task info if we have a parent ID
      let parentTaskName = "";
      if (parentId) {
        try {
          const parentTask = await todoistClient.getTask(parentId);
          if (parentTask) {
            parentTaskName = parentTask.content;
          }
        } catch (error) {
          console.error("Error getting parent task details:", error);
        }
      }
      
      return {
        content: [{ 
          type: "text", 
          text: `Task created:\nTitle: ${task.content}${task.description ? `\nDescription: ${task.description}` : ''}${task.due ? `\nDue: ${task.due.string}` : ''}${task.priority ? `\nPriority: ${task.priority}` : ''}${projectName ? `\nProject: ${projectName}` : ''}${sectionName ? `\nSection: ${sectionName}` : ''}${parentTaskName ? `\nParent Task: ${parentTaskName}` : ''}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_tasks") {
      if (!isGetTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_tasks");
      }
      
      let projectId = args.project_id;
      let projectName = "";
      
      // If project_name is provided but not project_id, try to find the project by name
      if (!projectId && args.project_name) {
        try {
          const projects = await todoistClient.getProjects();
          const projectNameLower = args.project_name.toLowerCase();
          const matchingProject = projects.find(project => 
            project.name.toLowerCase().includes(projectNameLower)
          );
          
          if (matchingProject) {
            projectId = matchingProject.id;
            projectName = matchingProject.name;
          }
        } catch (error) {
          console.error("Error finding project by name:", error);
        }
      }
      
      // Handle section filtering
      let sectionId = args.section_id;
      let sectionName = "";
      
      // If section_name is provided but not section_id, try to find the section by name
      if (!sectionId && args.section_name && projectId) {
        try {
          const sections = await todoistClient.getSections(projectId);
          const sectionNameLower = args.section_name.toLowerCase();
          const matchingSection = sections.find(section => 
            section.name.toLowerCase().includes(sectionNameLower)
          );
          
          if (matchingSection) {
            sectionId = matchingSection.id;
            sectionName = matchingSection.name;
          }
        } catch (error) {
          console.error("Error finding section by name:", error);
        }
      }
      
      // Handle parent task filtering
      let parentId = args.parent_id;
      let parentTaskName = "";
      
      // If parent_task_name is provided but not parent_id, try to find the parent task by name
      if (!parentId && args.parent_task_name) {
        try {
          const allTasks = await todoistClient.getTasks();
          const parentTaskNameLower = args.parent_task_name.toLowerCase();
          const matchingTask = allTasks.find(task => 
            task.content.toLowerCase().includes(parentTaskNameLower)
          );
          
          if (matchingTask) {
            parentId = matchingTask.id;
            parentTaskName = matchingTask.content;
          }
        } catch (error) {
          console.error("Error finding parent task by name:", error);
        }
      }
      
      // Only pass filter if at least one filtering parameter is provided
      const apiParams: any = {};
      if (projectId) {
        apiParams.projectId = projectId;
      }
      if (args.filter) {
        apiParams.filter = args.filter;
      }
      // If no filters provided, default to showing all tasks
      const tasks = await todoistClient.getTasks(Object.keys(apiParams).length > 0 ? apiParams : undefined);

      // Apply additional filters
      let filteredTasks = tasks;
      
      // Filter by priority if specified
      if (args.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === args.priority);
      }
      
      // Filter by section if specified
      if (sectionId) {
        filteredTasks = filteredTasks.filter(task => task.sectionId === sectionId);
      }
      
      // Filter by parent task if specified
      if (parentId) {
        filteredTasks = filteredTasks.filter(task => task.parentId === parentId);
      }
      
      // Apply limit
      if (args.limit && args.limit > 0) {
        filteredTasks = filteredTasks.slice(0, args.limit);
      }
      
      // Get project name if we have a project ID but no name yet
      if (projectId && !projectName) {
        try {
          const project = await todoistClient.getProject(projectId);
          projectName = project.name;
        } catch (error) {
          console.error("Error getting project details:", error);
        }
      }
      
      const taskList = filteredTasks.map(task => 
        `- ${task.content}${task.description ? `\n  Description: ${task.description}` : ''}${task.due ? `\n  Due: ${task.due.string}` : ''}${task.priority ? `\n  Priority: ${task.priority}` : ''}`
      ).join('\n\n');
      
      // Create appropriate header text based on filters
      let headerText = "";
      if (projectName && sectionName) {
        headerText = `Tasks in section "${sectionName}" of project "${projectName}":\n\n`;
      } else if (projectName) {
        headerText = `Tasks in project "${projectName}":\n\n`;
      } else if (parentTaskName) {
        headerText = `Subtasks of "${parentTaskName}":\n\n`;
      }
      
      return {
        content: [{ 
          type: "text", 
          text: filteredTasks.length > 0 ? 
            headerText + taskList : 
            projectName ? 
              `No tasks found in project "${projectName}"` : 
              "No tasks found matching the criteria" 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_projects") {
      if (!isGetProjectsArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_projects");
      }
      
      // Get all projects first
      const projects = await todoistClient.getProjects();
      
      // Filter projects if a filter is provided
      let filteredProjects = projects;
      if (args.filter) {
        const filterLower = args.filter.toLowerCase();
        filteredProjects = projects.filter(project => 
          project.name.toLowerCase().includes(filterLower)
        );
      }
      
      // Format the project list with project IDs for reference
      const projectList = filteredProjects.map(project => 
        `- ${project.name} (ID: ${project.id})`
      ).join('\n\n');
      
      return {
        content: [{ 
          type: "text", 
          text: filteredProjects.length > 0 ? projectList : "No projects found matching the criteria" 
        }],
        isError: false,
      };
    } 

    if (name === "todoist_update_task") {
      if (!isUpdateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_task");
      }

      // First, search for the task
      const tasks = await todoistClient.getTasks();
      const matchingTask = tasks.find(task => 
        task.content.toLowerCase().includes(args.task_name.toLowerCase())
      );

      if (!matchingTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a task matching "${args.task_name}"` 
          }],
          isError: true,
        };
      }

      // Build update data
      const updateData: any = {};
      if (args.content) updateData.content = args.content;
      if (args.description) updateData.description = args.description;
      if (args.due_string) updateData.dueString = args.due_string;
      if (args.priority) updateData.priority = args.priority;

      const updatedTask = await todoistClient.updateTask(matchingTask.id, updateData);
      
      return {
        content: [{ 
          type: "text", 
          text: `Task "${matchingTask.content}" updated:\nNew Title: ${updatedTask.content}${updatedTask.description ? `\nNew Description: ${updatedTask.description}` : ''}${updatedTask.due ? `\nNew Due Date: ${updatedTask.due.string}` : ''}${updatedTask.priority ? `\nNew Priority: ${updatedTask.priority}` : ''}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_delete_task") {
      if (!isDeleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_delete_task");
      }

      // First, search for the task
      const tasks = await todoistClient.getTasks();
      const matchingTask = tasks.find(task => 
        task.content.toLowerCase().includes(args.task_name.toLowerCase())
      );

      if (!matchingTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a task matching "${args.task_name}"` 
          }],
          isError: true,
        };
      }

      // Delete the task
      await todoistClient.deleteTask(matchingTask.id);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully deleted task: "${matchingTask.content}"` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_complete_task") {
      if (!isCompleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_complete_task");
      }

      // First, search for the task
      const tasks = await todoistClient.getTasks();
      const matchingTask = tasks.find(task => 
        task.content.toLowerCase().includes(args.task_name.toLowerCase())
      );

      if (!matchingTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a task matching "${args.task_name}"` 
          }],
          isError: true,
        };
      }

      // Complete the task
      await todoistClient.closeTask(matchingTask.id);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully completed task: "${matchingTask.content}"` 
        }],
        isError: false,
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todoist MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});