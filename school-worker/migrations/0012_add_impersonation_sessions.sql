-- Tracking impersonation sessions for security auditing.
CREATE TABLE ImpersonationSessions (
    id TEXT PRIMARY KEY,
    operator_uid TEXT NOT NULL,
    target_uid TEXT NOT NULL,
    reason TEXT,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME
);
