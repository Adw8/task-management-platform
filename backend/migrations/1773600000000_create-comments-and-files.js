export const shorthands = undefined;

export const up = (pgm) => {
  // Comments
  pgm.createTable('comments', {
    id:         { type: 'serial', primaryKey: true },
    task_id:    { type: 'integer', notNull: true, references: '"tasks"', onDelete: 'CASCADE' },
    user_id:    { type: 'integer', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    body:       { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addIndex('comments', ['task_id', 'created_at']);

  // Files
  pgm.createTable('files', {
    id:           { type: 'serial', primaryKey: true },
    task_id:      { type: 'integer', notNull: true, references: '"tasks"', onDelete: 'CASCADE' },
    uploaded_by:  { type: 'integer', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    filename:     { type: 'text', notNull: true },
    original_name:{ type: 'text', notNull: true },
    mime_type:    { type: 'text', notNull: true },
    size:         { type: 'integer', notNull: true },
    created_at:   { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addIndex('files', 'task_id');
};

export const down = (pgm) => {
  pgm.dropTable('files');
  pgm.dropTable('comments');
};
