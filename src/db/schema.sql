BEGIN;

-- 1. Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    next_task_number INTEGER NOT NULL DEFAULT 1
        CHECK (next_task_number >= 1),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cycle_length TEXT NOT NULL DEFAULT 'default'
        CHECK (cycle_length IN ('default', 'custom', 'nocycle')),
    starting_day TEXT NOT NULL,
    auto_cycle BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 2. Users

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    is_google BOOLEAN NOT NULL DEFAULT FALSE,
    google_id TEXT UNIQUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT users_auth_method_check CHECK (
        (
            is_google = FALSE
            AND password IS NOT NULL
            AND google_id IS NULL
        )
        OR
        (
            is_google = TRUE
            AND password IS NULL
            AND google_id IS NOT NULL
        )
    )
);


-- 3. Project Members
CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member'
        CHECK (role IN ('member', 'admin')),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE (project_id, user_id)
);

-- 4. Stages
CREATE TABLE IF NOT EXISTS stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 5. Project Stages
CREATE TABLE IF NOT EXISTS project_stages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL
        REFERENCES stages(id) ON DELETE RESTRICT,
    "order" INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE (project_id, stage_id),
    UNIQUE (project_id, "order")
);

-- 6. Types
CREATE TABLE IF NOT EXISTS types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 7. Project Types
CREATE TABLE IF NOT EXISTS project_types (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,
    type_id TEXT NOT NULL
        REFERENCES types(id) ON DELETE RESTRICT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE (project_id, type_id)
);

-- 8. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    type_id TEXT NOT NULL
        REFERENCES types(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    assignee_ids TEXT[] NOT NULL DEFAULT '{}',
    due_date DATE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_backlog BOOLEAN NOT NULL DEFAULT TRUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE (project_id, key)
);

-- 9. Cycles
CREATE TABLE IF NOT EXISTS cycles (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CHECK (end_date >= start_date),
    UNIQUE (project_id, id)
);

-- 10. Task Cycles
-- stage_id references a project-specific stage.
CREATE TABLE IF NOT EXISTS task_cycles (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL
        REFERENCES tasks(id) ON DELETE CASCADE,
    cycle_id TEXT NOT NULL
        REFERENCES cycles(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL
        REFERENCES project_stages(id) ON DELETE RESTRICT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE (task_id, cycle_id)
);

-- Indexes for relationships and common lookups.
CREATE INDEX IF NOT EXISTS idx_project_members_user_id
    ON project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_project_stages_order
    ON project_stages(project_id, "order");

CREATE INDEX IF NOT EXISTS idx_project_types_project_id
    ON project_types(project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id
    ON tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_backlog
    ON tasks(project_id, is_backlog);

CREATE INDEX IF NOT EXISTS idx_tasks_type_id
    ON tasks(type_id);

CREATE INDEX IF NOT EXISTS idx_cycles_project_dates
    ON cycles(project_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_task_cycles_task_id
    ON task_cycles(task_id);

CREATE INDEX IF NOT EXISTS idx_task_cycles_cycle_id
    ON task_cycles(cycle_id);

CREATE INDEX IF NOT EXISTS idx_task_cycles_cycle_task
    ON task_cycles(cycle_id, task_id);

COMMIT;
