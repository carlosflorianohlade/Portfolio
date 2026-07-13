DROP DATABASE IF EXISTS portfolio_db;

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
    'Atlas',
    'Dashboard editoriale per trasformare dati complessi in decisioni immediate.',
    'Atlas è un progetto dimostrativo dedicato alla visualizzazione di indicatori, attività e obiettivi. L''interfaccia privilegia chiarezza, gerarchia e rapidità di consultazione.',
    'Web app',
    'HTML, CSS Grid, JavaScript, Fetch API',
    'assets/images/project-atlas.svg',
    '#',
    '#',
    2026,
    1,
    'Organizzare molte informazioni senza sovraccaricare l''utente.',
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
    0,
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
  ),
  (
    'Uniform Coloring',
    'Risolutore IA per il dominio dell''Uniform Coloring.',
    'Combina la visione artificiale (OpenCV + CNN) per interpretare griglie scritte a mano e algoritmi di ricerca (A*) per trovare il percorso ottimo',
    'Machine Learning - AI',
    'Python, OpenCV, TensorFlow',
    'assets/images/cnn.png',
    '#',
    'https://github.com/carlosflorianohlade/Uniform-Coloring',
    2025,
    1,
    'Riconoscere automaticamente una griglia di Uniform Coloring disegnata a mano tramite CNN, e confrontare diversi algoritmi di ricerca (UCS, Greedy, A*) per trovarne la soluzione a costo minimo.',
    'Pipeline in due fasi: una CNN (addestrata su EMNIST, con OpenCV per il rilevamento della griglia) digitalizza l''immagine disegnata a mano; il problema viene poi risolto come ricerca nello spazio degli stati, confrontando UCS, Greedy e A* con euristica ammissibile per garantire l''ottimalità.'
  ),
  (
    'Sistema Distribuito con JWT e TCC',
    'Sistema distribuito basato su microservizi per la gestione di ordini tramite il protocollo TCC',
    'Tramite un coordinatore si gestiscono tre diversi microservizi (inventory - payment - shipping) per gestire le fasi di un ordine tramite il pattern TCC (Try-Confirm/Cancel)',
    'Distributed System',
    'Python, Docker Compose',
    'assets/images/progetto_backend.png',
    '#',
    'https://github.com/carlosflorianohlade/Distributed-System-with-JWT-TCC',
    2026,
    1,
    'Garantire la coerenza di una transazione distribuita su più microservizi indipendenti (inventario, pagamento, spedizione) senza un database condiviso, gestendo fallimenti parziali, prenotazioni con scadenza configurabile e il rischio che una richiesta di conferma o annullamento vada persa o arrivi in ritardo.',
    'Il coordinatore (order-service) implementa il pattern Try-Confirm/Cancel: ogni partecipante riserva provvisoriamente una risorsa nella fase Try, e solo dopo il consenso di tutti e tre i servizi la transazione viene confermata con Confirm, altrimenti compensata con Cancel su chi aveva già riservato. Per evitare prenotazioni bloccate all''infinito in caso di crash, ogni partecipante applica una TTL configurabile con scadenza lazy (controllata a ogni richiesta successiva, senza scheduler in background). Il coordinatore persiste il log delle decisioni per poter recuperare transazioni incomplete dopo un riavvio, mentre Confirm e Cancel sono resi idempotenti per tollerare i retry senza effetti collaterali. L''autenticazione tra client e coordinatore avviene tramite JWT emesso da un servizio dedicato, e l''intero sistema è containerizzato con Docker Compose.'
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