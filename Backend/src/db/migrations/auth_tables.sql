-- ============================================================
-- NOUS — Tablas auxiliares para el módulo de autenticación
-- Ejecutar UNA sola vez en nous_db
-- ============================================================

-- ── 1. TOTP secrets para MFA (RF-AU-02) ─────────────────────
CREATE TABLE IF NOT EXISTS usuario_mfa (
    usuario_id  INT          NOT NULL,
    secret      VARCHAR(64)  NOT NULL,
    verified    BOOLEAN      DEFAULT FALSE,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── 2. Tokens de recuperación de contraseña (RF-AU-04) ──────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT          NOT NULL,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME     NOT NULL,
    usado       BOOLEAN      DEFAULT FALSE,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
