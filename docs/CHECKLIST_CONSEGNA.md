# Checklist consegna finale

## Requisiti frontend

- [x] Almeno 4-5 pagine HTML.
- [x] Pagine pubbliche: Home, Profilo, Progetti, Dettaglio progetto, Contatti, 404.
- [x] Pagine admin: login, dashboard, form progetto.
- [x] Unico foglio CSS: `public/style.css`.
- [x] Ogni pagina contiene header, nav, main e footer.
- [x] Layout responsive desktop/tablet/smartphone.
- [x] Menu responsive.
- [x] Tema chiaro/scuro.
- [x] JavaScript vanilla senza framework.
- [x] DOM manipulation.
- [x] Event listener.
- [x] Fetch verso backend.

## Requisiti backend

- [x] Server Node.js.
- [x] Express per routing e middleware.
- [x] API pubbliche.
- [x] API admin.
- [x] Database MySQL.
- [x] Pool MySQL.
- [x] Prepared statement.
- [x] Validazione input server-side.
- [x] Gestione status code.

## Requisiti database

- [x] Tabella `projects`.
- [x] Tabella `skills`.
- [x] Tabella `messages`.
- [x] Tabella `admin_users`.
- [x] Dati iniziali dimostrativi.
- [x] Password admin non in chiaro.

## Requisiti sicurezza

- [x] JWT firmato lato server.
- [x] Cookie `HttpOnly`.
- [x] Cookie `SameSite=Lax`.
- [x] `Secure` attivo in produzione.
- [x] Nessun JWT in `localStorage`.
- [x] Nessun JWT in query string.
- [x] Middleware `requireAdminAuth`.
- [x] Pagine admin protette lato server.
- [x] Prepared statement contro SQL injection.

## Test manuali consigliati

1. Avviare MySQL.
2. Importare `sql/schema.sql`.
3. Eseguire `npm install`.
4. Copiare `.env.example` in `.env`.
5. Avviare `npm start`.
6. Aprire `http://localhost:3000`.
7. Verificare Home e progetti in evidenza.
8. Aprire `projects.html` e provare ricerca, filtro e ordinamento.
9. Aprire il dettaglio di un progetto.
10. Inviare un messaggio dal form contatti.
11. Effettuare login admin.
12. Creare un progetto.
13. Modificare il progetto creato.
14. Eliminare il progetto creato.
15. Eseguire logout.
16. Provare ad aprire direttamente `admin-dashboard.html` senza login: deve reindirizzare al login.

## File da non consegnare

- [ ] `node_modules/`
- [ ] `.env`

## File da consegnare

- [x] `public/`
- [x] `sql/schema.sql`
- [x] `scripts/create-admin.js`
- [x] `docs/`
- [x] `server.js`
- [x] `db.js`
- [x] `package.json`
- [x] `package-lock.json`
- [x] `.env.example`
- [x] `README.md`
- [x] `API_CONTRACT.md`
- [x] `Proposta_Progettuale_Portfolio_Dinamico.pdf`


## Estensione area admin

L'area admin permette anche di gestire le competenze (`skills`) e consultare/eliminare i messaggi (`messages`) ricevuti dal form contatti. Tutte le operazioni sono protette dal middleware JWT.
