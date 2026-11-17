CREATE TABLE users (
  id UUID PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE study_courses (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL, total_lessons INT NOT NULL CHECK(total_lessons BETWEEN 1 AND 10000),
  completed_lessons INT NOT NULL DEFAULT 0 CHECK(completed_lessons>=0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT completed_not_over_total CHECK (completed_lessons <= total_lessons)
);
CREATE INDEX idx_course_owner ON study_courses(user_id);
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  topic VARCHAR(150) NOT NULL, minutes INT NOT NULL CHECK (minutes BETWEEN 1 AND 1440),
  studied_on DATE NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_owner_date ON study_sessions(user_id,studied_on);
CREATE TABLE study_notes (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL, content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE study_goals (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  weekly_minutes INT NOT NULL CHECK(weekly_minutes BETWEEN 1 AND 10080)
);
