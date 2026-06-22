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
│   ├── PROPOSTA_PROGETTUALE.md
│   ├── RELAZIONE_TECNICA.md
│   └── CHECKLIST_CONSEGNA.md
├── server.js
├── db.js
├── package.json
├── package-lock.json
├── .env.example
├── API_CONTRACT.md
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

Se vuoi usare le credenziali presenti in `.env.example`, entra in MySQL ed esegui:

```sql
CREATE USER IF NOT EXISTS 'portfolio_user'@'localhost' IDENTIFIED BY 'portfolio_pass';
GRANT ALL PRIVILEGES ON portfolio_db.* TO 'portfolio_user'@'localhost';
FLUSH PRIVILEGES;
```

In alternativa puoi usare il tuo utente MySQL modificando il file `.env`.

### 4. Configurare `.env`

Copia il file di esempio:

```bash
cp .env.example .env
```

Poi controlla i valori:

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

Per una consegna reale, cambia `JWT_SECRET` con una stringa lunga e non banale.

### 5. Avviare il server

```bash
npm start
```

Poi apri:

```text
http://localhost:3000
```

## Account admin demo

```text
email: admin@example.com
password: Admin123!
```

La password non e' salvata in chiaro: nel database sono presenti `password_salt` e `password_hash`, generati con il modulo nativo `crypto` di Node.js tramite PBKDF2.

Per creare o aggiornare un admin:

```bash
npm run create-admin
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

## Controllo rapido prima della consegna

```bash
npm run check
npm audit
```

Poi prova manualmente:

1. `http://localhost:3000/api/health`
2. Home e pagina Progetti.
3. Dettaglio progetto da una card.
4. Form contatti.
5. Login admin.
6. Creazione, modifica ed eliminazione progetto.
7. Creazione, modifica ed eliminazione competenza.
8. Invio messaggio dal form contatti, lettura ed eliminazione da area admin.
9. Logout admin.

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

## File da consegnare

Consegna la cartella del progetto senza:

```text
node_modules/
.env
```

Mantieni invece:

```text
public/
sql/
scripts/
docs/
server.js
db.js
package.json
package-lock.json
.env.example
README.md
API_CONTRACT.md
Proposta_Progettuale_Portfolio_Dinamico.pdf
```

## Personalizzazione finale

Nel frontend sono presenti testi e riferimenti segnaposto come `Nome Cognome`, `nome@example.com`, link GitHub/LinkedIn e CV. Prima della consegna definitiva puoi sostituirli con i tuoi dati personali reali. I progetti e le competenze, invece, vengono caricati dal database MySQL tramite API.
