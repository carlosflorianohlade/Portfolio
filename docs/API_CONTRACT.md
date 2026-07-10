# API Contract - Portfolio personale dinamico

Base URL in locale:

```text
http://localhost:3000
```

Tutte le API restituiscono JSON con campo `success`.

## Convenzioni generali

Risposta positiva:

```json
{
  "success": true
}
```

Risposta di errore:

```json
{
  "success": false,
  "message": "Descrizione dell'errore"
}
```

Quando l'errore riguarda piu' campi, puo' essere presente anche `details`.

## API pubbliche

### GET /api/health

Verifica che server e database siano raggiungibili.

Risposta positiva:

```json
{
  "success": true,
  "message": "Server e database operativi"
}
```

### GET /api/projects

Restituisce tutti i progetti, ordinati dando priorita' ai progetti in evidenza.

```json
{
  "success": true,
  "projects": [
    {
      "id": 1,
      "title": "Portfolio personale dinamico",
      "short_description": "Portfolio responsive con pagine dinamiche, API REST, Node.js e MySQL.",
      "description": "Descrizione completa...",
      "category": "Web",
      "technologies": "HTML, CSS, JavaScript, Node.js, Express, MySQL, JWT",
      "image_url": "assets/images/project-portfolio.svg",
      "project_url": "#",
      "repository_url": "#",
      "year": 2026,
      "featured": 1,
      "challenge": "Sfida progettuale...",
      "solution": "Soluzione adottata..."
    }
  ]
}
```

### GET /api/projects/:id

Restituisce un singolo progetto.

Errori principali:

- `400` se l'ID non e' valido.
- `404` se il progetto non esiste.

### GET /api/skills

Restituisce le competenze tecniche.

```json
{
  "success": true,
  "skills": [
    {
      "id": 1,
      "name": "HTML semantico",
      "group_name": "Frontend",
      "level_value": 90
    }
  ]
}
```

### POST /api/messages

Salva un messaggio inviato dal form contatti.

Body:

```json
{
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "subject": "Collaborazione",
  "message": "Vorrei contattarti per un progetto web."
}
```

Validazioni principali:

- `name`: 2-120 caratteri;
- `email`: formato email valido, massimo 160 caratteri;
- `subject`: 3-160 caratteri;
- `message`: 20-5000 caratteri.

Risposta positiva:

```json
{
  "success": true,
  "message": "Messaggio inviato correttamente.",
  "messageId": 1
}
```

## API admin

> **Nota importante:** al primo avvio del progetto il database non contiene nessun admin. Creare il proprio account con `npm run create-admin` prima di tentare il login. Lo script chiede email e password e salva hash + salt nella tabella `admin_users`. Le credenziali demo storicamente presenti in `schema.sql` sono state rimosse per evitare di committare credenziali note nel repository.

> **Password in chiaro nel terminale:** lo script `create-admin.js` mostra la password mentre viene digitata. La scelta e' deliberata perche' il progetto ha **solo scopo accademico** e mira a ridurre al minimo le dipendenze esterne: in un contesto reale si consiglia di mascherare l'input con `*` o di passare la password tramite variabile d'ambiente.

Il login crea un cookie `admin_token` con:

```text
HttpOnly
SameSite=Lax
Secure solo in produzione
```

Il JWT non viene salvato in `localStorage` e non viene passato in query string.

### POST /api/admin/login

Body:

```json
{
  "email": "email@dominio.it",
  "password": "password-scelta-in-create-admin"
}
```

> Le credenziali mostrate sono solo un esempio. L'account reale deve essere creato con `npm run create-admin`.

Flusso:

1. Il backend cerca l'admin nel database.
2. Verifica password con salt + hash PBKDF2.
3. Crea un JWT firmato con `JWT_SECRET`.
4. Invia il token in cookie `HttpOnly`.

Payload JWT:

```json
{
  "adminId": 1,
  "email": "email@dominio.it",
  "role": "admin"
}
```

### GET /api/admin/me

Richiede cookie JWT valido.

```json
{
  "success": true,
  "admin": {
    "adminId": 1,
    "email": "email@dominio.it",
    "role": "admin"
  }
}
```

### POST /api/admin/logout

Cancella il cookie di autenticazione.

### GET /api/admin/projects

Restituisce tutti i progetti per la dashboard admin.

### GET /api/admin/projects/:id

Restituisce un singolo progetto per precompilare il form admin di modifica.

### POST /api/admin/projects

Crea un progetto.

Campi accettati:

```text
title
short_description
description
category
technologies
image_url
project_url
repository_url
year
featured
challenge
solution
```

`technologies` puo' arrivare come stringa o come array; il backend lo normalizza in stringa separata da virgole.

### PUT /api/admin/projects/:id

Aggiorna un progetto esistente.

### DELETE /api/admin/projects/:id

Elimina un progetto esistente.

### GET /api/admin/skills

Restituisce tutte le competenze per la gestione amministrativa.

### GET /api/admin/skills/:id

Restituisce una singola competenza.

### POST /api/admin/skills

Crea una competenza.

Body:

```json
{
  "name": "JavaScript",
  "group_name": "Frontend",
  "level_value": 85
}
```

### PUT /api/admin/skills/:id

Aggiorna una competenza esistente.

### DELETE /api/admin/skills/:id

Elimina una competenza esistente.

### GET /api/admin/messages

Restituisce i messaggi ricevuti dal form contatti, ordinati dal piu' recente.

### GET /api/admin/messages/:id

Restituisce un singolo messaggio.

### DELETE /api/admin/messages/:id

Elimina un messaggio.

## Status code usati

- `200 OK`: lettura o aggiornamento riuscito.
- `201 Created`: creazione riuscita.
- `400 Bad Request`: input non valido.
- `401 Unauthorized`: login richiesto, credenziali errate o token scaduto.
- `403 Forbidden`: ruolo non autorizzato.
- `404 Not Found`: risorsa non trovata.
- `409 Conflict`: duplicato, per esempio titolo progetto gia' presente.
- `500 Internal Server Error`: errore server o database.

## Pagine admin protette

Le pagine:

```text
/admin-dashboard.html
/admin-project-form.html
```

sono protette anche lato server: se il cookie JWT manca o non e' valido, Express reindirizza a `admin-login.html`.
