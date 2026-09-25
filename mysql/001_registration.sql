-- New DROGS tables only. Does not modify any existing/legacy tables.
CREATE TABLE IF NOT EXISTS dr_settings (
  id TINYINT PRIMARY KEY, current_year INT NOT NULL
) ENGINE=InnoDB;
INSERT IGNORE INTO dr_settings (id, current_year) VALUES (1, 2027);
CREATE TABLE IF NOT EXISTS dr_users (
  id VARCHAR(36) PRIMARY KEY, email VARCHAR(254) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL UNIQUE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dr_profiles (
  id VARCHAR(36) PRIMARY KEY, data JSON NOT NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dr_registrations (
  user_id VARCHAR(36) NOT NULL, registration_year INT NOT NULL,
  photo_key VARCHAR(512), proof_key VARCHAR(512), data JSON NOT NULL,
  PRIMARY KEY (user_id, registration_year)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dr_rosters (
  id VARCHAR(36) PRIMARY KEY, bishop_id VARCHAR(36) NOT NULL, registration_year INT NOT NULL,
  data JSON NOT NULL, INDEX bishop_year (bishop_id, registration_year)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dr_audit (
  id VARCHAR(36) PRIMARY KEY, actor_id VARCHAR(36) NOT NULL, created_at VARCHAR(32) NOT NULL,
  data JSON NOT NULL, INDEX actor_time (actor_id, created_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dr_media (
  object_key VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL, kind VARCHAR(16) NOT NULL, content_type VARCHAR(64) NOT NULL,
  size_bytes INT NOT NULL, created_at BIGINT NOT NULL, INDEX owner_media (owner_id, created_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dr_otp (
  email VARCHAR(254) CHARACTER SET ascii COLLATE ascii_general_ci PRIMARY KEY,
  code_hash CHAR(64) NOT NULL, expires_at BIGINT NOT NULL, attempts INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dr_sessions (
  token_hash CHAR(64) PRIMARY KEY, user_id VARCHAR(36) NOT NULL,
  expires_at BIGINT NOT NULL, INDEX session_expiry (expires_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dr_rate_limits (
  rate_key CHAR(64) PRIMARY KEY, hits INT NOT NULL, expires_at BIGINT NOT NULL,
  INDEX rate_expiry (expires_at)
) ENGINE=InnoDB;
