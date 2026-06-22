-- Schema MySQL per il progetto "Portfolio personale dinamico".
-- Per una reinstallazione completamente pulita si puo' scommentare la riga seguente.
-- DROP DATABASE IF EXISTS portfolio_db;

CREATE DATABASE IF NOT EXISTS portfolio_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE portfolio_db;

CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  short_description VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  technologies VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) DEFAULT '',
  project_url VARCHAR(255) DEFAULT '',
  repository_url VARCHAR(255) DEFAULT '',
  year YEAR NOT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  challenge TEXT,
  solution TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_title (title),
  INDEX idx_projects_category (category),
  INDEX idx_projects_featured (featured),
  INDEX idx_projects_year (year),
  CONSTRAINT chk_projects_featured CHECK (featured IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skills (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  group_name VARCHAR(80) NOT NULL,
  level_value TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skills_group_name_name (group_name, name),
  INDEX idx_skills_group_name (group_name),
  CONSTRAINT chk_skills_level CHECK (level_value BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  subject VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_messages_email (email),
  INDEX idx_messages_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(160) NOT NULL,
  password_hash CHAR(128) NOT NULL,
  password_salt VARCHAR(128) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO projects
  (title, short_description, description, category, technologies, image_url, project_url, repository_url, year, featured, challenge, solution)
VALUES
  (
    'Portfolio personale dinamico',
    'Portfolio responsive con pagine dinamiche, API REST, Node.js e MySQL.',
    'Progetto universitario di Programmazione Web e Mobile: un portfolio personale dinamico con frontend HTML, CSS e JavaScript, backend Node.js, database MySQL e area amministrativa protetta da JWT.',
    'Web',
    'HTML, CSS, JavaScript, Node.js, Express, MySQL, JWT',
    'assets/images/project-portfolio.svg',
    '#',
    '#',
    2026,
    1,
    'Realizzare un sito personale completo, responsive e capace di leggere e salvare dati persistenti senza usare framework vietati.',
    'Separazione tra frontend statico, API REST, database MySQL e area admin protetta tramite cookie HttpOnly con JWT firmato lato server.'
  ),
  (
    'Atlas',
    'Dashboard editoriale per trasformare dati complessi in decisioni immediate.',
    'Atlas è un progetto dimostrativo dedicato alla visualizzazione di indicatori, attività e obiettivi. L’interfaccia privilegia chiarezza, gerarchia e rapidità di consultazione.',
    'Web app',
    'HTML, CSS Grid, JavaScript, Fetch API',
    'assets/images/project-atlas.svg',
    '#',
    '#',
    2026,
    1,
    'Organizzare molte informazioni senza sovraccaricare l’utente.',
    'Una struttura modulare, filtri contestuali e componenti visivi coerenti.'
  ),
  (
    'Lumen',
    'Identità digitale e sito vetrina per uno studio creativo indipendente.',
    'Lumen esplora un linguaggio visivo caldo e minimale. Il progetto combina tipografia editoriale, spaziatura generosa e microinterazioni discrete.',
    'Sito web',
    'HTML semantico, CSS, JavaScript, Responsive design',
    'assets/images/project-lumen.svg',
    '#',
    '#',
    2026,
    1,
    'Comunicare personalità senza sacrificare leggibilità e prestazioni.',
    'Una palette essenziale, componenti leggeri e una gerarchia tipografica forte.'
  ),
  (
    'Officina',
    'Applicazione per organizzare attività, scadenze e note di progetto.',
    'Officina è un concept di productivity tool pensato per piccoli team. Le interazioni sono immediate e ogni vista si adatta al contesto di lavoro.',
    'Web app',
    'JavaScript, Node.js, Express, MySQL',
    'assets/images/project-officina.svg',
    '#',
    '#',
    2025,
    0,
    'Rendere flessibile la gestione delle attività senza aumentare la complessità.',
    'Flussi brevi, filtri combinabili e feedback immediato sulle azioni.'
  ),
  (
    'Archivio',
    'Catalogo digitale per esplorare libri, appunti e risorse formative.',
    'Archivio propone una ricerca veloce, filtri per argomento e pagine di dettaglio costruite dinamicamente a partire dai dati.',
    'Piattaforma',
    'HTML, CSS, JavaScript, MySQL',
    'assets/images/project-archivio.svg',
    '#',
    '#',
    2025,
    0,
    'Permettere di trovare contenuti rilevanti in pochi passaggi.',
    'Ricerca testuale, filtri chiari e risultati aggiornati nel DOM.'
  ),
  (
    'Pulse',
    'Interfaccia per scoprire eventi e gestire prenotazioni in modo semplice.',
    'Pulse organizza eventi, categorie e disponibilità in una griglia dinamica. Il concept include ricerca, ordinamento e una scheda dettagliata per ogni evento.',
    'Piattaforma',
    'JavaScript, REST, Node.js, Database',
    'assets/images/project-pulse.svg',
    '#',
    '#',
    2025,
    0,
    'Presentare molte opzioni mantenendo un percorso chiaro verso la prenotazione.',
    'Filtri combinati, informazioni prioritarie e stati visivi espliciti.'
  )
ON DUPLICATE KEY UPDATE
  short_description = VALUES(short_description),
  description = VALUES(description),
  category = VALUES(category),
  technologies = VALUES(technologies),
  image_url = VALUES(image_url),
  project_url = VALUES(project_url),
  repository_url = VALUES(repository_url),
  year = VALUES(year),
  featured = VALUES(featured),
  challenge = VALUES(challenge),
  solution = VALUES(solution);

INSERT INTO skills (name, group_name, level_value)
VALUES
  ('HTML semantico', 'Frontend', 90),
  ('CSS responsive', 'Frontend', 86),
  ('JavaScript', 'Frontend', 82),
  ('DOM ed eventi', 'Frontend', 80),
  ('Fetch API / AJAX', 'Frontend', 78),
  ('Node.js', 'Backend', 76),
  ('Express', 'Backend', 76),
  ('JWT e cookie HttpOnly', 'Backend', 72),
  ('MySQL', 'Database', 74),
  ('Prepared statement', 'Database', 78),
  ('Git', 'Strumenti', 75),
  ('Linux / terminale', 'Strumenti', 70)
ON DUPLICATE KEY UPDATE
  level_value = VALUES(level_value);

-- Account admin dimostrativo:
-- email: admin@example.com
-- password: Admin123!
-- Hash generato con crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').
INSERT INTO admin_users (email, password_hash, password_salt)
VALUES (
  'admin@example.com',
  '7d27e98b5868f4626c6a2f2e55249f8c9b53cdb3e159dfc5d2341a6ad57dd1e850154a10fe2c17d14bef29f3332213bacd51785e778bf05496b1597302d4e254',
  'portfolio_demo_salt_2026'
)
ON DUPLICATE KEY UPDATE
  email = VALUES(email);
