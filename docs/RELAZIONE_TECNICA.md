# Relazione tecnica - Portfolio personale dinamico

## Architettura generale

Il progetto segue una separazione chiara tra struttura, presentazione, comportamento e dati:

- HTML: definisce contenuti e struttura semantica delle pagine.
- CSS: definisce palette, layout, responsive design e tema chiaro/scuro.
- JavaScript: gestisce eventi, DOM, fetch e interazioni dinamiche.
- Node.js/Express: gestisce le richieste HTTP e le API.
- MySQL: conserva progetti, competenze, messaggi e admin.

Questa divisione riprende il principio fondamentale secondo cui una pagina web e' composta da struttura e contenuti, rappresentazione visiva e funzionalita' interattive.

## Frontend

### HTML

Le pagine usano tag semantici come:

```text
<header>, <nav>, <main>, <section>, <article>, <footer>
```

Sono presenti attributi utili ad accessibilita' e interazione:

```text
aria-label, aria-live, aria-expanded, aria-current, data-*
```

Gli attributi `data-*` collegano elementi HTML alla logica JavaScript senza usare codice inline.

### CSS

Il file `style.css` e' unico per tutte le pagine. Usa:

- variabili CSS in `:root`;
- palette chiara e scura;
- Flexbox e Grid;
- media query per tablet e smartphone;
- unita' relative e contenitori fluidi;
- stati focus/hover per usabilita'.

### JavaScript

Il file `app.js` e' unico e riconosce la pagina corrente tramite:

```js
document.body.dataset.page
```

La funzione principale e' `initializePage()`, che attiva soltanto il codice necessario per la pagina aperta.

Il frontend usa `fetch()` per comunicare con il server:

```text
GET /api/projects
GET /api/projects/:id
GET /api/skills
POST /api/messages
POST /api/admin/login
```

La funzione `fetchJson()` centralizza richieste, header JSON, credenziali cookie e gestione errori.

## Backend

### Express

Il file `server.js` configura un'app Express con:

- `express.json()` per leggere body JSON;
- `express.urlencoded()` per body form encoded;
- `cookie-parser` per leggere cookie;
- `express.static()` per servire file della cartella `public/`;
- rotte pubbliche e rotte admin;
- middleware di autenticazione;
- gestione 404 per API e pagine.

### Database

Il file `db.js` usa un connection pool MySQL:

```js
mysql.createPool(...)
```

Il pool evita di aprire una nuova connessione per ogni richiesta e permette di gestire piu' richieste concorrenti in modo efficiente.

Le query usano prepared statement con placeholder `?`, ad esempio:

```js
await pool.execute("SELECT * FROM projects WHERE id = ?", [id]);
```

Questo riduce il rischio di SQL injection perche' i dati dell'utente vengono trattati come valori e non come codice SQL.

## Autenticazione admin

L'autenticazione usa JWT perche' permette di firmare un token contenente solo dati non sensibili:

```json
{
  "adminId": 1,
  "email": "email@dominio.it",
  "role": "admin"
}
```

Il token viene salvato in un cookie `HttpOnly`, quindi JavaScript lato client non puo' leggerlo. Questo e' preferibile rispetto a salvare il JWT in `localStorage`.

Il middleware `requireAdminAuth`:

1. legge `req.cookies.admin_token`;
2. verifica il JWT con `jwt.verify()`;
3. controlla che il ruolo sia `admin`;
4. salva i dati in `req.admin`;
5. blocca la richiesta con `401` se manca o non e' valido.

Le pagine `admin-dashboard.html` e `admin-project-form.html` sono protette anche lato server: se il token manca, Express reindirizza verso il login.

### Creazione del primo admin

Il file `sql/schema.sql` **non include piu'** un account amministratore dimostrativo: le credenziali demo sono state rimosse per evitare di committare email e password note nel repository. Il primo admin deve essere creato tramite lo script interattivo `scripts/create-admin.js`, lanciato con `npm run create-admin`.

Lo script:

- chiede email e password all'utente da terminale;
- genera un salt casuale di 24 byte con `crypto.randomBytes`;
- calcola l'hash PBKDF2 con `crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256')`;
- salva email, hash e salt nella tabella `admin_users`;
- se l'email e' gia' presente, aggiorna hash e salt (utile per il reset password).

All'avvio, il server esegue un controllo che conta gli admin presenti in `admin_users`. Se il conteggio e' zero, viene stampato un avviso ben visibile in console con il comando `npm run create-admin` da eseguire.

### Sicurezza dello script create-admin

Lo script mostra la password in chiaro mentre viene digitata. Questa scelta e' **voluta** perche' il progetto ha **solo scopo accademico**:

- non introduce dipendenze esterne come `readline-sync` o `mute-stream`;
- l'input resta limitato al terminale locale di chi esegue lo script;
- l'hash PBKDF2 finale salvato nel database non contiene la password in chiaro.

In un contesto di produzione si consiglia di mascherare l'input con un carattere come `*` oppure di passare la password tramite variabile d'ambiente letta con `process.env`.

## CRUD progetti

La dashboard admin permette di:

- leggere tutti i progetti;
- creare un nuovo progetto;
- modificare un progetto esistente;
- eliminare un progetto.

Le operazioni corrispondono ai metodi HTTP:

```text
GET    lettura
POST   creazione
PUT    modifica
DELETE eliminazione
```

## Validazione

La validazione e' presente su due livelli:

- client-side: migliora l'esperienza utente e mostra errori immediati;
- server-side: e' indispensabile per proteggere il backend e il database.

Il server controlla lunghezza dei testi, formato email, URL opzionali, anno del progetto e presenza dei campi obbligatori.

## Motivazione delle scelte

Il progetto evita framework non necessari per rimanere coerente con gli argomenti del corso e con l'obiettivo didattico: mostrare padronanza delle tecnologie fondamentali del web.

Express viene usato perche' semplifica routing, middleware, file statici e risposte JSON rispetto al modulo HTTP nativo di Node.js.

MySQL viene usato per dimostrare persistenza dei dati e uso corretto dei prepared statement.

JWT viene usato per gestire il login admin in modo stateless, con cookie `HttpOnly` per migliorare la sicurezza rispetto a un token leggibile da JavaScript.
