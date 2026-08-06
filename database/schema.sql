-- מערכת לימוד משניות לעילוי נשמת — סכמת בסיס נתונים
-- MySQL / MariaDB, utf8mb4
-- הערה: תמיד לייבא עם charset utf8mb4 (למשל: mysql --default-character-set=utf8mb4 db < schema.sql),
-- אחרת הטקסט העברי/אימוג'ים בטבלת ה-achievements עלולים להישמר במקודד כפול (mojibake).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  streak_count INT UNSIGNED NOT NULL DEFAULT 0,
  longest_streak INT UNSIGNED NOT NULL DEFAULT 0,
  last_study_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tractates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seder VARCHAR(30) NOT NULL,
  seder_he VARCHAR(20) NOT NULL,
  name_he VARCHAR(60) NOT NULL,
  slug VARCHAR(60) NOT NULL UNIQUE,
  chapter_count INT UNSIGNED NOT NULL,
  mishna_count INT UNSIGNED NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mishnayot (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tractate_id INT UNSIGNED NOT NULL,
  chapter INT UNSIGNED NOT NULL,
  mishna_num INT UNSIGNED NOT NULL,
  text_he MEDIUMTEXT NULL,
  sefaria_ref VARCHAR(100) NOT NULL,
  sort_order INT UNSIGNED NOT NULL,
  FOREIGN KEY (tractate_id) REFERENCES tractates(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_ref (sefaria_ref),
  KEY idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_cycle (
  study_date DATE NOT NULL PRIMARY KEY,
  mishna_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (mishna_id) REFERENCES mishnayot(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  mishna_id INT UNSIGNED NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mishna_id) REFERENCES mishnayot(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_mishna (user_id, mishna_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dedications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name_he VARCHAR(150) NOT NULL,
  passing_date_he VARCHAR(60) NULL,
  dtype ENUM('neshama','refuah') NOT NULL DEFAULT 'neshama',
  notes VARCHAR(255) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS achievements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name_he VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '🏆',
  criteria_type ENUM('streak','total_mishnayot','tractate_complete') NOT NULL,
  criteria_value INT UNSIGNED NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_achievements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  achievement_id INT UNSIGNED NOT NULL,
  earned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_achievement (user_id, achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO achievements (code, name_he, description, icon, criteria_type, criteria_value, sort_order) VALUES
('streak_7', 'שבוע ברציפות', '7 ימי לימוד רצופים', '🔥', 'streak', 7, 1),
('streak_30', 'חודש ברציפות', '30 ימי לימוד רצופים', '🔥', 'streak', 30, 2),
('streak_100', '100 ימים ברציפות', '100 ימי לימוד רצופים', '🔥', 'streak', 100, 3),
('streak_365', 'שנה שלמה', '365 ימי לימוד רצופים', '🔥', 'streak', 365, 4),
('mishnayot_10', '10 משניות', '10 משניות נלמדו', '📖', 'total_mishnayot', 10, 5),
('mishnayot_50', '50 משניות', '50 משניות נלמדו', '📖', 'total_mishnayot', 50, 6),
('mishnayot_100', '100 משניות', '100 משניות נלמדו', '📖', 'total_mishnayot', 100, 7),
('mishnayot_500', '500 משניות', '500 משניות נלמדו', '📖', 'total_mishnayot', 500, 8),
('mishnayot_1000', '1000 משניות', '1000 משניות נלמדו', '📖', 'total_mishnayot', 1000, 9),
('tractate_complete', 'סיום מסכת', 'מסכת שלמה הושלמה', '🎓', 'tractate_complete', 1, 10)
ON DUPLICATE KEY UPDATE name_he=VALUES(name_he), description=VALUES(description), icon=VALUES(icon);
