CREATE TABLE IF NOT EXISTS dr_api_keys (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  token_prefix VARCHAR(24) NOT NULL,
  scopes JSON NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  revoked_at BIGINT NULL,
  last_used_at BIGINT NULL
) ENGINE=InnoDB;
