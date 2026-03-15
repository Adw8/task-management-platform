import type { OpenAPIV3 } from 'openapi-types';

const bearerAuth: OpenAPIV3.SecurityRequirementObject = { bearerAuth: [] };

const TaskStatus: OpenAPIV3.SchemaObject = { type: 'string', enum: ['todo', 'in_progress', 'done'] };
const TaskPriority: OpenAPIV3.SchemaObject = { type: 'string', enum: ['low', 'medium', 'high'] };

const TaskSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id:          { type: 'integer' },
    title:       { type: 'string' },
    description: { type: 'string', nullable: true },
    status:      TaskStatus,
    priority:    TaskPriority,
    due_date:    { type: 'string', format: 'date-time', nullable: true },
    tags:        { type: 'array', items: { type: 'string' } },
    assigned_to: { type: 'integer', nullable: true },
    created_by:  { type: 'integer' },
    created_at:  { type: 'string', format: 'date-time' },
    updated_at:  { type: 'string', format: 'date-time' },
    deleted_at:  { type: 'string', format: 'date-time', nullable: true },
  },
};

const UserSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id:         { type: 'integer' },
    name:       { type: 'string' },
    email:      { type: 'string', format: 'email' },
    created_at: { type: 'string', format: 'date-time' },
  },
};

const CommentSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id:         { type: 'integer' },
    task_id:    { type: 'integer' },
    user_id:    { type: 'integer' },
    user_name:  { type: 'string' },
    body:       { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const FileSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id:            { type: 'integer' },
    original_name: { type: 'string' },
    mime_type:     { type: 'string' },
    size:          { type: 'integer' },
    uploaded_by:   { type: 'string' },
    created_at:    { type: 'string', format: 'date-time' },
  },
};

const ErrorSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: { error: { type: 'string' } },
};

const taskIdParam: OpenAPIV3.ParameterObject = {
  name: 'taskId', in: 'path', required: true, schema: { type: 'integer' },
};
const commentIdParam: OpenAPIV3.ParameterObject = {
  name: 'commentId', in: 'path', required: true, schema: { type: 'integer' },
};
const fileIdParam: OpenAPIV3.ParameterObject = {
  name: 'fileId', in: 'path', required: true, schema: { type: 'integer' },
};

const spec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Task Management API',
    version: '1.0.0',
    description: 'REST API for the task management platform.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local dev' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: { Task: TaskSchema, User: UserSchema, Comment: CommentSchema, File: FileSchema, Error: ErrorSchema },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: { '200': { description: 'Server is up', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' } } } } } } },
      },
    },

    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['name', 'email', 'password'],
                properties: {
                  name:     { type: 'string', minLength: 1, maxLength: 100 },
                  email:    { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Registration successful', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/auth/login': {
      post: {
        summary: 'Login and get a JWT',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },

    '/auth/me': {
      get: {
        summary: 'Get current authenticated user',
        tags: ['Auth'],
        security: [bearerAuth],
        responses: {
          '200': { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/tasks': {
      get: {
        summary: 'List tasks with filtering, sorting, and pagination',
        tags: ['Tasks'],
        security: [bearerAuth],
        parameters: [
          { name: 'status',   in: 'query', schema: TaskStatus },
          { name: 'priority', in: 'query', schema: TaskPriority },
          { name: 'search',   in: 'query', schema: { type: 'string' }, description: 'Full-text search on title and description' },
          { name: 'tags',     in: 'query', schema: { type: 'string' }, description: 'Comma-separated tag list' },
          { name: 'sort_by',  in: 'query', schema: { type: 'string', enum: ['created_at', 'due_date', 'priority'] } },
          { name: 'sort_dir', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',    in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated task list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data:       { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                    pagination: { type: 'object', properties: { total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' }, total_pages: { type: 'integer' } } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a task',
        tags: ['Tasks'],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['title'],
                properties: {
                  title:       { type: 'string', minLength: 1, maxLength: 255 },
                  description: { type: 'string', maxLength: 5000 },
                  status:      TaskStatus,
                  priority:    TaskPriority,
                  due_date:    { type: 'string', format: 'date-time' },
                  tags:        { type: 'array', items: { type: 'string' }, maxItems: 20 },
                  assigned_to: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Task created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/tasks/export': {
      get: {
        summary: 'Export tasks as CSV',
        description: 'Streams a CSV file. Accepts optional filters. Search is intentionally excluded — exports are for bulk data extraction, not search result snapshots.',
        tags: ['Tasks'],
        security: [bearerAuth],
        parameters: [
          { name: 'status',   in: 'query', schema: TaskStatus },
          { name: 'priority', in: 'query', schema: TaskPriority },
          { name: 'tags',     in: 'query', schema: { type: 'string' }, description: 'Comma-separated tag list' },
        ],
        responses: {
          '200': { description: 'CSV file download', content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/tasks/bulk': {
      post: {
        summary: 'Bulk create tasks',
        tags: ['Tasks'],
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['tasks'],
                properties: { tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' }, minItems: 1, maxItems: 100 } },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Tasks created', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Task' } } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/tasks/{taskId}': {
      get: {
        summary: 'Get a task by ID',
        tags: ['Tasks'],
        security: [bearerAuth],
        parameters: [taskIdParam],
        responses: {
          '200': { description: 'Task', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        summary: 'Update a task',
        description: 'Only the creator or assigned user can update.',
        tags: ['Tasks'],
        security: [bearerAuth],
        parameters: [taskIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title:       { type: 'string', minLength: 1, maxLength: 255 },
                  description: { type: 'string', maxLength: 5000, nullable: true },
                  status:      TaskStatus,
                  priority:    TaskPriority,
                  due_date:    { type: 'string', format: 'date-time', nullable: true },
                  tags:        { type: 'array', items: { type: 'string' }, maxItems: 20 },
                  assigned_to: { type: 'integer', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated task', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        summary: 'Soft delete a task',
        description: 'Only the creator can delete.',
        tags: ['Tasks'],
        security: [bearerAuth],
        parameters: [taskIdParam],
        responses: {
          '204': { description: 'Deleted' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
        },
      },
    },

    '/tasks/{taskId}/comments': {
      get: {
        summary: 'List comments for a task',
        tags: ['Comments'],
        security: [bearerAuth],
        parameters: [taskIdParam],
        responses: {
          '200': { description: 'Comments', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Comment' } } } } },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Add a comment to a task',
        tags: ['Comments'],
        security: [bearerAuth],
        parameters: [taskIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['body'], properties: { body: { type: 'string', minLength: 1, maxLength: 5000 } } },
            },
          },
        },
        responses: {
          '201': { description: 'Comment created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/tasks/{taskId}/comments/{commentId}': {
      put: {
        summary: 'Edit a comment',
        description: 'Only the comment author can edit.',
        tags: ['Comments'],
        security: [bearerAuth],
        parameters: [taskIdParam, commentIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['body'], properties: { body: { type: 'string', minLength: 1, maxLength: 5000 } } },
            },
          },
        },
        responses: {
          '200': { description: 'Updated comment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } } },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        summary: 'Delete a comment',
        description: 'Only the comment author can delete.',
        tags: ['Comments'],
        security: [bearerAuth],
        parameters: [taskIdParam, commentIdParam],
        responses: {
          '204': { description: 'Deleted' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
        },
      },
    },

    '/tasks/{taskId}/files': {
      get: {
        summary: 'List files attached to a task',
        tags: ['Files'],
        security: [bearerAuth],
        parameters: [taskIdParam],
        responses: {
          '200': { description: 'File list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/File' } } } } },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Upload files to a task',
        description: 'Accepts up to 10 files. Allowed types: images, PDF, plain text, Word, Excel. Max 10 MB per file.',
        tags: ['Files'],
        security: [bearerAuth],
        parameters: [taskIdParam],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } } },
        },
        responses: {
          '201': { description: 'Uploaded files', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/File' } } } } },
          '400': { description: 'Invalid file type or size' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/tasks/{taskId}/files/{fileId}': {
      get: {
        summary: 'Download a file',
        tags: ['Files'],
        security: [bearerAuth],
        parameters: [taskIdParam, fileIdParam],
        responses: {
          '200': { description: 'File binary', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        summary: 'Delete a file',
        description: 'Only the uploader can delete.',
        tags: ['Files'],
        security: [bearerAuth],
        parameters: [taskIdParam, fileIdParam],
        responses: {
          '204': { description: 'Deleted' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
        },
      },
    },

    '/analytics/overview': {
      get: {
        summary: 'Get workspace task overview stats',
        tags: ['Analytics'],
        security: [bearerAuth],
        responses: {
          '200': {
            description: 'Overview stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total:       { type: 'integer' },
                    by_status:   { type: 'object', properties: { todo: { type: 'integer' }, in_progress: { type: 'integer' }, done: { type: 'integer' } } },
                    by_priority: { type: 'object', properties: { low: { type: 'integer' }, medium: { type: 'integer' }, high: { type: 'integer' } } },
                    overdue:     { type: 'integer' },
                    recent_tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/analytics/trends': {
      get: {
        summary: 'Get daily task creation and completion counts for the last 30 days',
        tags: ['Analytics'],
        security: [bearerAuth],
        responses: {
          '200': {
            description: 'Trend data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    created:   { type: 'array', items: { type: 'object', properties: { date: { type: 'string', format: 'date' }, count: { type: 'integer' } } } },
                    completed: { type: 'array', items: { type: 'object', properties: { date: { type: 'string', format: 'date' }, count: { type: 'integer' } } } },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
};

export default spec;
