-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Таблица пробежек
CREATE TABLE runs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    territory VARCHAR(255) NOT NULL,
    distance DECIMAL(10, 2) NOT NULL,
    time INTEGER NOT NULL,
    avg_speed DECIMAL(5, 2),
    avg_pace DECIMAL(5, 2),
    max_speed DECIMAL(5, 2),
    calories INTEGER,
    avg_heart_rate INTEGER,
    heart_rate_zone1 INTEGER,
    heart_rate_zone2 INTEGER,
    heart_rate_zone3 INTEGER,
    heart_rate_zone4 INTEGER,
    heart_rate_zone5 INTEGER,
    positions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ускорения поиска
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_runs_user_id ON runs(user_id);
CREATE INDEX idx_runs_date ON runs(date);