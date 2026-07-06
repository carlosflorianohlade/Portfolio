# Proposta progettuale - Portfolio personale dinamico

## 1. Descrizione generale

Il progetto consiste nello sviluppo di un portfolio personale dinamico per presentare profilo, competenze, progetti e contatti. Il sito non e' una semplice raccolta statica di pagine, ma un'applicazione web completa: il frontend comunica con un backend Node.js tramite API REST, mentre i dati principali vengono salvati e letti da un database MySQL.

L'obiettivo e' dimostrare l'uso coordinato delle tecnologie trattate nel corso di Programmazione Web e Mobile: HTML, CSS, JavaScript, Node.js, Express e MySQL. L'area amministrativa consente di gestire i progetti senza modificare manualmente il codice HTML.

## 2. Tecnologie utilizzate

- HTML5 per la struttura semantica delle pagine.
- CSS3 per layout, stile, tema chiaro/scuro e responsive design.
- JavaScript vanilla per DOM, eventi, validazione form, localStorage e richieste `fetch`.
- Node.js per la parte server-side.
- Express per routing, middleware, API e file statici.
- MySQL per persistenza dei dati.
- JWT per autenticazione admin.
- Cookie `HttpOnly` per conservare il token in modo piu' sicuro rispetto a `localStorage`.

Non vengono usati Bootstrap, Tailwind, React, Angular o altri framework non richiesti dal corso.

## 3. Struttura delle pagine

### Pagine pubbliche

- `index.html`: home page con presentazione, call to action e progetti in evidenza.
- `about.html`: profilo personale, percorso e competenze tecniche caricate dinamicamente.
- `projects.html`: elenco progetti con ricerca, filtro categoria e ordinamento.
- `project.html`: dettaglio progetto tramite parametro URL `id`.
- `contact.html`: contatti e form per invio messaggi.
- `404.html`: pagina di errore personalizzata.

### Pagine admin

- `admin-login.html`: accesso dell'amministratore.
- `admin-dashboard.html`: gestione dei progetti presenti nel database.
- `admin-project-form.html`: inserimento o modifica di un progetto.

Ogni pagina contiene `header`, menu di navigazione, `main` e `footer`.

## 4. Design e responsive design

Il design e' minimale, caldo ed elegante. La palette usa colori neutri con un accento caldo. Lo stile privilegia spazio bianco, bordi sottili, card arrotondate e ombre leggere.

Il responsive design e' gestito con media query per desktop, tablet e smartphone. Il menu diventa burger menu sui dispositivi piccoli. I layout principali usano Flexbox e CSS Grid.

## 5. Funzionalita' JavaScript

Il file `public/app.js` gestisce:

- menu responsive;
- tema chiaro/scuro;
- salvataggio preferenza tema in `localStorage`;
- caricamento progetti da `/api/projects`;
- caricamento competenze da `/api/skills`;
- ricerca e filtro dei progetti;
- ordinamento risultati;
- caricamento dettaglio progetto da `/api/projects/:id`;
- validazione form contatti;
- invio messaggi a `/api/messages`;
- login, logout e controllo sessione admin;
- creazione, modifica ed eliminazione progetti dall'area admin.

## 6. Database MySQL

Il database si chiama `portfolio_db` e contiene quattro tabelle:

### `projects`

Contiene i progetti del portfolio.

Campi principali:

```text
id, title, short_description, description, category, technologies,
image_url, project_url, repository_url, year, featured,
challenge, solution, created_at, updated_at
```

### `skills`

Contiene le competenze tecniche.

```text
id, name, group_name, level_value, created_at
```

### `messages`

Contiene i messaggi inviati dal form contatti.

```text
id, name, email, subject, message, created_at
```

### `admin_users`

Contiene l'utente amministratore.

```text
id, email, password_hash, password_salt, created_at, updated_at
```

La password non viene salvata in chiaro.

**Importante:** lo script `sql/schema.sql` non inserisce piu' un account dimostrativo nella tabella `admin_users`. L'admin deve essere creato al primo avvio con `npm run create-admin`, che richiede email e password interattivamente e applica hash PBKDF2 con salt casuale. Se al boot il database non contiene nessun admin, il server stampa un avviso in console che invita a eseguire lo script. La password compare in chiaro sul terminale solo perche' il progetto ha **scopo esclusivamente accademico** e non usa dipendenze esterne per l'input masking; in produzione si consiglia di mascherare l'input o passarlo via variabile d'ambiente.

## 7. Backend Node.js / Express

Il backend e' composto principalmente da:

- `server.js`: configurazione Express, middleware, rotte API pubbliche, rotte API admin, gestione errori.
- `db.js`: creazione del pool MySQL con `mysql2/promise`.
- `sql/schema.sql`: creazione database, tabelle e dati iniziali.

Il server espone le pagine statiche dalla cartella `public/` e le API sotto il prefisso `/api`.

## 8. API pubbliche

```text
GET  /api/health
GET  /api/projects
GET  /api/projects/:id
GET  /api/skills
POST /api/messages
```

Queste rotte permettono di leggere dati pubblici e salvare i messaggi del form contatti.

## 9. API admin con JWT

```text
POST   /api/admin/login
GET    /api/admin/me
POST   /api/admin/logout
GET    /api/admin/projects
GET    /api/admin/projects/:id
POST   /api/admin/projects
PUT    /api/admin/projects/:id
DELETE /api/admin/projects/:id

GET    /api/admin/skills
GET    /api/admin/skills/:id
POST   /api/admin/skills
PUT    /api/admin/skills/:id
DELETE /api/admin/skills/:id

GET    /api/admin/messages
GET    /api/admin/messages/:id
DELETE /api/admin/messages/:id
```

Tutte le rotte admin tranne il login sono protette dal middleware `requireAdminAuth`.

## 10. Flusso login admin

1. L'admin invia email e password dal form.
2. Il backend cerca l'utente nella tabella `admin_users`.
3. La password viene verificata con salt + hash PBKDF2.
4. Il backend crea un JWT firmato con `JWT_SECRET`.
5. Il JWT viene salvato nel cookie `admin_token` con `HttpOnly`.
6. Le API admin leggono il cookie e verificano firma, scadenza e ruolo.
7. Il logout cancella il cookie.

## 11. Sicurezza minima

Il progetto implementa:

- prepared statement MySQL;
- validazione input lato server;
- password admin con salt e hash;
- JWT firmato lato server;
- cookie `HttpOnly` e `SameSite=Lax`;
- nessun token in `localStorage`;
- nessun token in query string;
- protezione server-side delle pagine admin principali;
- status code coerenti;
- gestione centralizzata degli errori principali.

## 12. Conclusione

Il progetto dimostra un'applicazione web completa e coerente con il corso: struttura HTML semantica, CSS responsive, JavaScript per interazione e DOM, comunicazione client-server con `fetch`, backend Express, persistenza MySQL e autenticazione JWT per l'area amministrativa.
