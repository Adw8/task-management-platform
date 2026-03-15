/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createType('task_status', ['todo', 'in_progress', 'done']);
  pgm.createType('task_priority', ['low', 'medium', 'high']);

  pgm.createTable('tasks', {
    id: { type: 'serial', primaryKey: true },
    title: { type: 'text', notNull: true },
    description: { type: 'text', notNull: false },
    status: { type: 'task_status', notNull: true, default: 'todo' },
    priority: { type: 'task_priority', notNull: true, default: 'medium' },
    due_date: { type: 'timestamptz', notNull: false },
    tags: { type: 'text[]', notNull: true, default: pgm.func("'{}'::text[]") },
    assigned_to: {
      type: 'integer',
      notNull: false,
      references: '"users"',
      onDelete: 'SET NULL',
    },
    created_by: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    deleted_at: { type: 'timestamptz', notNull: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // Per-user task queries: filter by creator + status, sort by date
  pgm.addIndex('tasks', ['created_by', 'status', 'created_at']);
  // Per-user assigned task queries: same pattern
  pgm.addIndex('tasks', ['assigned_to', 'status', 'created_at']);
  // Global status + due_date sorting
  pgm.addIndex('tasks', ['status', 'due_date']);

  // Partial index — almost all queries filter deleted_at IS NULL
  pgm.sql(`CREATE INDEX tasks_active_idx ON tasks (created_at DESC) WHERE deleted_at IS NULL;`);

  // GIN index for tag array containment queries (@>)
  pgm.addIndex('tasks', 'tags', { method: 'gin' });

  // GIN index for full-text search on title + description
  pgm.sql(`
    CREATE INDEX tasks_search_idx ON tasks
    USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('tasks');
  pgm.dropType('task_priority');
  pgm.dropType('task_status');
};
