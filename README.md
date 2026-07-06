# Portfolio personale dinamico

Progetto universitario di **Programmazione Web e Mobile**: portfolio personale dinamico realizzato con **HTML, CSS, JavaScript, Node.js, Express, MySQL e JWT**.

Il progetto rispetta l'impostazione richiesta dal corso: frontend senza framework pesanti, unico foglio CSS, pagine HTML semantiche, JavaScript vanilla, backend Node.js con Express, database MySQL e area amministrativa protetta tramite JWT in cookie `HttpOnly`.

## Struttura del progetto

```text
portfolio/
├── public/
│   ├── index.html
│   ├── about.html
│   ├── projects.html
│   ├── project.html
│   ├── contact.html
│   ├── 404.html
│   ├── admin-login.html
│   ├── admin-dashboard.html
│   ├── admin-project-form.html
│   ├── admin-skills.html
│   ├── admin-messages.html
│   ├── style.css
│   ├── app.js
│   └── assets/
├── sql/
│   └── schema.sql
├── scripts/
│   └── create-admin.js
├── docs/
│   ├── RELAZIONE_TECNICA.md
│   └── API_CONTRACT.md
├── server.js
├── db.js
├── package.json
├── package-lock.json
├── .env
└── README.md
```

## Funzionalita' principali

### Area pubblica

- Home con presentazione e progetti in evidenza.
- Pagina profilo con competenze caricate dinamicamente.
- Pagina progetti con ricerca, filtro per categoria, ordinamento e conteggio risultati.
- Pagina dettaglio progetto tramite parametro `project.html?id=...`.
- Pagina contatti con validazione client-side e salvataggio messaggi su MySQL.
- Pagina 404 personalizzata.

### Area admin

- Login admin tramite `POST /api/admin/login`.
- JWT firmato lato server e salvato in cookie `HttpOnly`.
- Dashboard protetta per visualizzare, cercare, modificare ed eliminare progetti.
- Form protetto per creare o modificare progetti.
- Pagina protetta per creare, modificare ed eliminare competenze.
- Pagina protetta per leggere ed eliminare i messaggi ricevuti dal form contatti.
- Rotte admin protette con middleware `requireAdminAuth`.

## Installazione

### 1. Installare le dipendenze

```bash
npm install
```

### 2. Creare il database

Da terminale, nella cartella principale del progetto:

```bash
mysql -u root -p < sql/schema.sql
```

Lo script crea il database `portfolio_db`, le tabelle e alcuni dati dimostrativi.

### 3. Creare l'utente MySQL

Se vuoi usare le credenziali gia' presenti in `.env`, entra in MySQL ed esegui:

```sql
CREATE USER IF NOT EXISTS 'portfolio_user'@'localhost' IDENTIFIED BY 'portfolio_pass';
GRANT ALL PRIVILEGES ON portfolio_db.* TO 'portfolio_user'@'localhost';
FLUSH PRIVILEGES;
```

In alternativa puoi usare il tuo utente MySQL modificando il file `.env`.

### 4. Configurare `.env`

Il file `.env` e' gia' presente nella root del progetto con i valori necessari per l'avvio:

```env
PORT=3000
DB_HOST=localhost
DB_USER=portfolio_user
DB_PASSWORD=portfolio_pass
DB_NAME=portfolio_db
DB_CONNECTION_LIMIT=10
JWT_SECRET=cambia_questa_chiave_con_una_stringa_lunga_e_segreta
JWT_EXPIRES_IN=2h
NODE_ENV=development
```

In questo pacchetto di consegna il file `.env` viene fornito direttamente (anziche' un `.env.example`) per permettere l'avvio immediato del server con `npm start`. Il file e' comunque incluso in `.gitignore`, quindi non verra' mai committato in un repository pubblico.

Per una consegna reale o un deploy in produzione, cambia `JWT_SECRET` con una stringa lunga, casuale e non banale, e modifica le credenziali MySQL con valori sicuri.

### 5. Creare il primo admin (obbligatorio)

Dopo aver importato lo schema, il database e' vuoto per quanto riguarda gli admin: lo script `sql/schema.sql` **non crea piu' account dimostrativi** per evitare di committare credenziali note nel repository.

Creare il proprio admin con:

```bash
npm run create-admin
```

Lo script chiede email e password da terminale. La password viene hashata lato client con PBKDF2 (`crypto.pbkdf2Sync` di Node.js) e salvata insieme a un salt casuale nella tabella `admin_users`. L'admin puo' essere aggiornato rieseguendo lo script con la stessa email.

All'avvio il server controlla se esiste almeno un admin nel database: in caso contrario stampa un avviso ben visibile in console con il comando da eseguire.

### Nota: password visibile in chiaro nel terminale

Lo script `create-admin.js` mostra la password in chiaro mentre viene digitata. Questa scelta e' voluta per un progetto a **solo scopo accademico**: non vengono aggiunte dipendenze esterne (come `readline-sync`) e la password compare solo localmente sul terminale di chi esegue lo script. In un contesto di produzione si consiglia di mascherare l'input con un carattere come `*` o di passare la password tramite variabile d'ambiente.

### 6. Avviare il server

```bash
npm start
```

Poi apri:

```text
http://localhost:3000
```

## Rotte API principali

Pubbliche:

```text
GET  /api/health
GET  /api/projects
GET  /api/projects/:id
GET  /api/skills
POST /api/messages
```

Admin:

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

La documentazione dettagliata e' in `API_CONTRACT.md`.

## Sicurezza implementata

- JWT firmato lato server.
- Cookie `HttpOnly`, `SameSite=Lax`, `Secure` in produzione.
- Nessun JWT in `localStorage`.
- Password admin salvata con salt e hash PBKDF2.
- Prepared statement MySQL tramite `mysql2/promise`.
- Validazione input lato client e lato server.
- Protezione server-side delle pagine admin principali.
- Header HTTP minimi di sicurezza: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- Token non passato in query string.

