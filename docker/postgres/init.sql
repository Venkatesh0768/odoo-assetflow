-- ============================================================
-- AssetFlow – PostgreSQL initial schema
-- This file is mounted into the Postgres container's
-- /docker-entrypoint-initdb.d/ folder.  It runs ONCE when
-- the data volume is first created.
-- ============================================================

-- Extension: uuid generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 001  users ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'employee'
                             CHECK (role IN ('admin','asset_manager','department_head','employee')),
  employee_id   VARCHAR(20)  UNIQUE,
  department_id UUID,
  phone         VARCHAR(30),
  avatar_url    TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── 002  refresh_tokens ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ─── 003  departments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  parent_id   UUID         REFERENCES departments(id),
  head_id     UUID         REFERENCES users(id),
  status      VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Late FK: users.department_id → departments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_department_id'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_department_id
      FOREIGN KEY (department_id) REFERENCES departments(id);
  END IF;
END;
$$;

-- ─── 004  asset_categories ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_categories (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL UNIQUE,
  description   TEXT,
  custom_fields JSONB        NOT NULL DEFAULT '[]',
  status        VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── 005  asset tag sequence ──────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START 1;

-- ─── 006  assets ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag        VARCHAR(20)  NOT NULL UNIQUE,
  name             VARCHAR(200) NOT NULL,
  category_id      UUID         REFERENCES asset_categories(id),
  serial_number    VARCHAR(100),
  acquisition_date DATE,
  acquisition_cost NUMERIC(12,2),
  condition        VARCHAR(20)  NOT NULL DEFAULT 'good'
                                CHECK (condition IN ('excellent','good','fair','poor')),
  status           VARCHAR(30)  NOT NULL DEFAULT 'available'
                                CHECK (status IN ('available','allocated','reserved',
                                                  'under_maintenance','lost','retired','disposed')),
  location         VARCHAR(200),
  department_id    UUID         REFERENCES departments(id),
  is_bookable      BOOLEAN      NOT NULL DEFAULT false,
  photo_url        TEXT,
  documents_url    TEXT,
  custom_fields    JSONB        NOT NULL DEFAULT '{}',
  notes            TEXT,
  created_by       UUID         REFERENCES users(id),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assets_status      ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_department  ON assets(department_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_tag   ON assets(asset_tag);

-- ─── 007  allocations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allocations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id             UUID        NOT NULL REFERENCES assets(id),
  allocated_to_user    UUID        REFERENCES users(id),
  allocated_to_dept    UUID        REFERENCES departments(id),
  allocated_by         UUID        NOT NULL REFERENCES users(id),
  expected_return_date DATE,
  actual_return_date   DATE,
  status               VARCHAR(20) NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active','returned','overdue')),
  condition_on_return  VARCHAR(20),
  return_notes         TEXT,
  is_overdue           BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_allocations_asset_id ON allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_allocations_user     ON allocations(allocated_to_user);
CREATE INDEX IF NOT EXISTS idx_allocations_status   ON allocations(status);

-- ─── 008  transfer_requests ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfer_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id         UUID        NOT NULL REFERENCES assets(id),
  from_user        UUID        REFERENCES users(id),
  to_user          UUID        REFERENCES users(id),
  to_dept          UUID        REFERENCES departments(id),
  requested_by     UUID        NOT NULL REFERENCES users(id),
  approved_by      UUID        REFERENCES users(id),
  reason           TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'requested'
                               CHECK (status IN ('requested','approved','rejected','completed')),
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transfers_asset_id ON transfer_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status   ON transfer_requests(status);

-- ─── 009  bookings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id            UUID        NOT NULL REFERENCES assets(id),
  booked_by           UUID        NOT NULL REFERENCES users(id),
  department_id       UUID        REFERENCES departments(id),
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  purpose             TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'upcoming'
                                  CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  cancelled_by        UUID        REFERENCES users(id),
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_booking_times CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_bookings_asset_id  ON bookings(asset_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booked_by ON bookings(booked_by);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_times     ON bookings(start_time, end_time);

-- ─── 010  maintenance_requests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          UUID        NOT NULL REFERENCES assets(id),
  raised_by         UUID        NOT NULL REFERENCES users(id),
  approved_by       UUID        REFERENCES users(id),
  technician_id     UUID        REFERENCES users(id),
  issue_description TEXT        NOT NULL,
  priority          VARCHAR(20) NOT NULL DEFAULT 'medium'
                                CHECK (priority IN ('low','medium','high','critical')),
  status            VARCHAR(30) NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','approved','rejected',
                                                  'technician_assigned','in_progress','resolved')),
  photo_url         TEXT,
  resolution_notes  TEXT,
  rejection_reason  TEXT,
  estimated_cost    NUMERIC(10,2),
  actual_cost       NUMERIC(10,2),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_asset_id ON maintenance_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status   ON maintenance_requests(status);

-- ─── 011  audit_cycles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_cycles (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title               VARCHAR(200) NOT NULL,
  scope_type          VARCHAR(20)  CHECK (scope_type IN ('department','location','all')),
  scope_department_id UUID         REFERENCES departments(id),
  scope_location      VARCHAR(200),
  start_date          DATE         NOT NULL,
  end_date            DATE         NOT NULL,
  status              VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  created_by          UUID         NOT NULL REFERENCES users(id),
  closed_by           UUID         REFERENCES users(id),
  closed_at           TIMESTAMPTZ,
  total_assets        INT          NOT NULL DEFAULT 0,
  verified_count      INT          NOT NULL DEFAULT 0,
  missing_count       INT          NOT NULL DEFAULT 0,
  damaged_count       INT          NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── 012  audit_auditors ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_auditors (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_cycle_id UUID        NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
  auditor_id     UUID        NOT NULL REFERENCES users(id),
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(audit_cycle_id, auditor_id)
);

-- ─── 013  audit_items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_cycle_id      UUID        NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
  asset_id            UUID        NOT NULL REFERENCES assets(id),
  expected_location   VARCHAR(200),
  verification_status VARCHAR(20) DEFAULT 'pending'
                                  CHECK (verification_status IN ('pending','verified','missing','damaged')),
  auditor_id          UUID        REFERENCES users(id),
  notes               TEXT,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_items_cycle ON audit_items(audit_cycle_id);
CREATE INDEX IF NOT EXISTS idx_audit_items_asset ON audit_items(asset_id);

-- ─── 014  notifications ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           VARCHAR(50)  NOT NULL,
  title          VARCHAR(200) NOT NULL,
  message        TEXT         NOT NULL,
  reference_type VARCHAR(50),
  reference_id   UUID,
  is_read        BOOLEAN      NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ─── 015  activity_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  description TEXT,
  metadata    JSONB        NOT NULL DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id     ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at  ON activity_logs(created_at DESC);

-- ─── 016  updated_at trigger ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','departments','asset_categories','assets','allocations',
    'transfer_requests','bookings','maintenance_requests','audit_cycles'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
           BEFORE UPDATE ON %I
           FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END;
$$;
