const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { pool, testConnection } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_da_cambiare";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
const COOKIE_NAME = "admin_token";
const PUBLIC_DIR = path.join(__dirname, "public");

if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev_secret_da_cambiare") {
  throw new Error("JWT_SECRET non configurato: imposta una chiave lunga e segreta nel file .env.");
}

app.disable("x-powered-by");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

function sendSuccess(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data });
}

function sendError(res, statusCode, message, details = undefined) {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
}

function isPositiveInteger(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidOptionalUrl(value, { allowRelative = false } = {}) {
  if (!value || value === "#") return true;
  if (allowRelative && /^(assets\/|images\/|\.\/|\/)[\w./%#?=&+-]+$/i.test(value)) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseBoolean(value) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "on";
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha256").toString("hex");
}

function verifyPassword(password, salt, expectedHash) {
  const computedHash = hashPassword(password, salt);
  const computed = Buffer.from(computedHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (computed.length !== expected.length) return false;
  return crypto.timingSafeEqual(computed, expected);
}

function getCookieMaxAgeMs() {
  const match = JWT_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) return 2 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * multipliers[unit];
}

function makeCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getCookieMaxAgeMs(),
    path: "/"
  };
}

function readAdminFromToken(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;

  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.role !== "admin" || !decoded.adminId || !decoded.email) return null;

  return {
    adminId: decoded.adminId,
    email: decoded.email,
    role: decoded.role
  };
}

function requireAdminAuth(req, res, next) {
  try {
    const admin = readAdminFromToken(req);
    if (!admin) return sendError(res, 401, "Accesso negato: login richiesto.");

    req.admin = admin;
    return next();
  } catch {
    return sendError(res, 401, "Sessione non valida o scaduta.");
  }
}

function requireAdminPageAuth(req, res, next) {
  try {
    const admin = readAdminFromToken(req);
    if (!admin) throw new Error("Token mancante o non valido");

    req.admin = admin;
    res.setHeader("Cache-Control", "no-store");
    return next();
  } catch {
    const nextPage = encodeURIComponent(req.originalUrl.replace(/^\//, ""));
    return res.redirect(302, `/admin-login.html?next=${nextPage}`);
  }
}

function normalizeProjectBody(body) {
  const technologies = Array.isArray(body.technologies)
    ? body.technologies.map((item) => cleanString(item)).filter(Boolean).join(", ")
    : cleanString(body.technologies);

  const yearValue = body.year === undefined || body.year === "" ? null : Number(body.year);

  return {
    title: cleanString(body.title),
    short_description: cleanString(body.short_description),
    description: cleanString(body.description),
    category: cleanString(body.category),
    technologies,
    image_url: cleanString(body.image_url),
    project_url: cleanString(body.project_url),
    repository_url: cleanString(body.repository_url),
    year: yearValue,
    featured: parseBoolean(body.featured) ? 1 : 0,
    challenge: cleanString(body.challenge),
    solution: cleanString(body.solution)
  };
}

function validateProject(project) {
  const errors = [];

  if (project.title.length < 2 || project.title.length > 120) {
    errors.push("Il titolo deve contenere tra 2 e 120 caratteri.");
  }
  if (project.short_description.length < 10 || project.short_description.length > 255) {
    errors.push("La descrizione breve deve contenere tra 10 e 255 caratteri.");
  }
  if (project.description.length < 20) {
    errors.push("La descrizione completa deve contenere almeno 20 caratteri.");
  }
  if (project.category.length < 2 || project.category.length > 80) {
    errors.push("La categoria deve contenere tra 2 e 80 caratteri.");
  }
  if (!project.technologies || project.technologies.length > 255) {
    errors.push("Le tecnologie sono obbligatorie e non devono superare 255 caratteri.");
  }
  if (!Number.isInteger(project.year) || project.year < 2000 || project.year > 2100) {
    errors.push("L'anno deve essere compreso tra 2000 e 2100.");
  }
  if (!isValidOptionalUrl(project.image_url, { allowRelative: true })) {
    errors.push("L'URL dell'immagine non è valido.");
  }
  if (!isValidOptionalUrl(project.project_url, { allowRelative: true })) {
    errors.push("L'URL demo non è valido.");
  }
  if (!isValidOptionalUrl(project.repository_url, { allowRelative: true })) {
    errors.push("L'URL del repository non è valido.");
  }

  return errors;
}

function normalizeSkillBody(body) {
  const levelValue = body.level_value === "" ? NaN : Number(body.level_value);

  return {
    name: cleanString(body.name),
    group_name: cleanString(body.group_name),
    level_value: levelValue
  };
}

function validateSkill(skill) {
  const errors = [];

  if (skill.name.length < 2 || skill.name.length > 80) {
    errors.push("Il nome della competenza deve contenere tra 2 e 80 caratteri.");
  }
  if (skill.group_name.length < 2 || skill.group_name.length > 80) {
    errors.push("Il gruppo della competenza deve contenere tra 2 e 80 caratteri.");
  }
  if (!Number.isInteger(skill.level_value) || skill.level_value < 0 || skill.level_value > 100) {
    errors.push("Il livello della competenza deve essere compreso tra 0 e 100.");
  }

  return errors;
}

const projectSelectFields = `
  id,
  title,
  short_description,
  description,
  category,
  technologies,
  image_url,
  project_url,
  repository_url,
  year,
  featured,
  challenge,
  solution,
  created_at,
  updated_at
`;

const skillSelectFields = `
  id,
  name,
  group_name,
  level_value,
  created_at
`;

const messageSelectFields = `
  id,
  name,
  email,
  subject,
  message,
  created_at
`;

app.get([
  "/admin-dashboard.html",
  "/admin-project-form.html",
  "/admin-skills.html",
  "/admin-messages.html"
], requireAdminPageAuth, (req, res) => {
  const fileName = req.path.replace(/^\//, "");
  return res.sendFile(path.join(PUBLIC_DIR, fileName));
});

app.get("/api/health", async (req, res) => {
  try {
    await testConnection();
    return sendSuccess(res, { message: "Server e database operativi" });
  } catch {
    return sendError(res, 500, "Server attivo, ma database non raggiungibile.");
  }
});

app.get("/api/projects", async (req, res) => {
  try {
    const [projects] = await pool.execute(
      `SELECT ${projectSelectFields} FROM projects ORDER BY featured DESC, year DESC, created_at DESC, id DESC`
    );
    return sendSuccess(res, { projects });
  } catch {
    return sendError(res, 500, "Errore durante il caricamento dei progetti.");
  }
});

app.get("/api/projects/:id", async (req, res) => {
  if (!isPositiveInteger(req.params.id)) {
    return sendError(res, 400, "ID progetto non valido.");
  }

  try {
    const [projects] = await pool.execute(
      `SELECT ${projectSelectFields} FROM projects WHERE id = ? LIMIT 1`,
      [Number(req.params.id)]
    );

    if (projects.length === 0) {
      return sendError(res, 404, "Progetto non trovato.");
    }

    return sendSuccess(res, { project: projects[0] });
  } catch {
    return sendError(res, 500, "Errore durante il caricamento del progetto.");
  }
});

app.get("/api/skills", async (req, res) => {
  try {
    const [skills] = await pool.execute(
      `SELECT ${skillSelectFields} FROM skills ORDER BY group_name ASC, level_value DESC, name ASC`
    );
    return sendSuccess(res, { skills });
  } catch {
    return sendError(res, 500, "Errore durante il caricamento delle competenze.");
  }
});

app.post("/api/messages", async (req, res) => {
  const name = cleanString(req.body.name);
  const email = cleanString(req.body.email).toLowerCase();
  const subject = cleanString(req.body.subject);
  const message = cleanString(req.body.message);
  const errors = [];

  if (name.length < 2 || name.length > 120) errors.push("Il nome deve contenere tra 2 e 120 caratteri.");
  if (!email || !isValidEmail(email) || email.length > 160) errors.push("Email non valida.");
  if (subject.length < 3 || subject.length > 160) errors.push("L'oggetto deve contenere tra 3 e 160 caratteri.");
  if (message.length < 20 || message.length > 5000) errors.push("Il messaggio deve contenere tra 20 e 5000 caratteri.");

  if (errors.length > 0) {
    return sendError(res, 400, "Dati del messaggio non validi.", errors);
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
      [name, email, subject, message]
    );

    return sendSuccess(
      res,
      {
        message: "Messaggio inviato correttamente.",
        messageId: result.insertId
      },
      201
    );
  } catch {
    return sendError(res, 500, "Errore durante il salvataggio del messaggio.");
  }
});

app.post("/api/admin/login", async (req, res) => {
  const email = cleanString(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !isValidEmail(email) || !password) {
    return sendError(res, 400, "Email o password non validi.");
  }

  try {
    const [admins] = await pool.execute(
      `SELECT id, email, password_hash, password_salt FROM admin_users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (admins.length === 0) {
      return sendError(res, 401, "Credenziali non valide.");
    }

    const admin = admins[0];
    const ok = verifyPassword(password, admin.password_salt, admin.password_hash);

    if (!ok) {
      return sendError(res, 401, "Credenziali non valide.");
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: "admin"
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie(COOKIE_NAME, token, makeCookieOptions());
    return sendSuccess(res, {
      message: "Login effettuato correttamente.",
      admin: {
        id: admin.id,
        email: admin.email,
        role: "admin"
      }
    });
  } catch {
    return sendError(res, 500, "Errore durante il login.");
  }
});

app.get("/api/admin/me", requireAdminAuth, (req, res) => {
  return sendSuccess(res, { admin: req.admin });
});

app.post("/api/admin/logout", requireAdminAuth, (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return sendSuccess(res, { message: "Logout effettuato correttamente." });
});

app.get("/api/admin/projects", requireAdminAuth, async (req, res) => {
  try {
    const [projects] = await pool.execute(
      `SELECT ${projectSelectFields} FROM projects ORDER BY created_at DESC, id DESC`
    );
    return sendSuccess(res, { projects });
  } catch {
    return sendError(res, 500, "Errore durante il caricamento dei progetti admin.");
  }
});

app.get("/api/admin/projects/:id", requireAdminAuth, async (req, res) => {
  if (!isPositiveInteger(req.params.id)) {
    return sendError(res, 400, "ID progetto non valido.");
  }

  try {
    const [projects] = await pool.execute(
      `SELECT ${projectSelectFields} FROM projects WHERE id = ? LIMIT 1`,
      [Number(req.params.id)]
    );

    if (projects.length === 0) {
      return sendError(res, 404, "Progetto non trovato.");
    }

    return sendSuccess(res, { project: projects[0] });
  } catch {
    return sendError(res, 500, "Errore durante il caricamento del progetto admin.");
  }
});

app.post("/api/admin/projects", requireAdminAuth, async (req, res) => {
  const project = normalizeProjectBody(req.body);
  const errors = validateProject(project);

  if (errors.length > 0) {
    return sendError(res, 400, "Dati progetto non validi.", errors);
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO projects
        (title, short_description, description, category, technologies, image_url, project_url, repository_url, year, featured, challenge, solution)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project.title,
        project.short_description,
        project.description,
        project.category,
        project.technologies,
        project.image_url,
        project.project_url,
        project.repository_url,
        project.year,
        project.featured,
        project.challenge,
        project.solution
      ]
    );

    return sendSuccess(
      res,
      {
        message: "Progetto creato correttamente.",
        projectId: result.insertId
      },
      201
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, 409, "Esiste già un progetto con questo titolo.");
    }
    return sendError(res, 500, "Errore durante la creazione del progetto.");
  }
});

app.put("/api/admin/projects/:id", requireAdminAuth, async (req, res) => {
  if (!isPositiveInteger(req.params.id)) {
    return sendError(res, 400, "ID progetto non valido.");
  }

  const project = normalizeProjectBody(req.body);
  const errors = validateProject(project);

  if (errors.length > 0) {
    return sendError(res, 400, "Dati progetto non validi.", errors);
  }

  try {
    const [result] = await pool.execute(
      `UPDATE projects SET
        title = ?,
        short_description = ?,
        description = ?,
        category = ?,
        technologies = ?,
        image_url = ?,
        project_url = ?,
        repository_url = ?,
        year = ?,
        featured = ?,
        challenge = ?,
        solution = ?
       WHERE id = ?`,
      [
        project.title,
        project.short_description,
        project.description,
        project.category,
        project.technologies,
        project.image_url,
        project.project_url,
        project.repository_url,
        project.year,
        project.featured,
        project.challenge,
        project.solution,
        Number(req.params.id)
      ]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Progetto non trovato.");
    }

    return sendSuccess(res, { message: "Progetto aggiornato correttamente." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, 409, "Esiste già un progetto con questo titolo.");
    }
    return sendError(res, 500, "Errore durante l'aggiornamento del progetto.");
  }
});

app.delete("/api/admin/projects/:id", requireAdminAuth, async (req, res) => {
  if (!isPositiveInteger(req.params.id)) {
    return sendError(res, 400, "ID progetto non valido.");
  }

  try {
    const [result] = await pool.execute(
      `DELETE FROM projects WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Progetto non trovato.");
    }

    return sendSuccess(res, { message: "Progetto eliminato correttamente." });
  } catch {
    return sendError(res, 500, "Errore durante l'eliminazione del progetto.");
  }
});

app.get("/api/admin/skills", requireAdminAuth, async (req, res) => {
  try {
    const [skills] = await pool.execute(
      `SELECT ${skillSelectFields} FROM skills ORDER BY group_name ASC, level_value DESC, name ASC`
    );
    return sendSuccess(res, { skills });
  } catch {
    return sendError(res, 500, "Errore durante il caricamento delle competenze admin.");
  }
});

app.get("/api/admin/skills/:id", requireAdminAuth, async (req, res) => {
  if (!isPositiveInteger(req.params.id)) {
    return sendError(res, 400, "ID competenza non valido.");
  }

  try {
    const [skills] = await pool.execute(
      `SELECT ${skillSelectFields} FROM skills WHERE id = ? LIMIT 1`,
      [Number(req.params.id)]
    );

    if (skills.length === 0) {
      return sendError(res, 404, "Competenza non trovata.");
    }

    return sendSuccess(res, { skill: skills[0] });
  } catch {
    return sendError(res, 500, "Errore durante il caricamento della competenza.");
  }
});

app.post("/api/admin/skills", requireAdminAuth, async (req, res) => {
  const skill = normalizeSkillBody(req.body);
  const errors = validateSkill(skill);

  if (errors.length > 0) {
    return sendError(res, 400, "Dati competenza non validi.", errors);
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO skills (name, group_name, level_value) VALUES (?, ?, ?)`,
      [skill.name, skill.group_name, skill.level_value]
    );

    return sendSuccess(
      res,
      { message: "Competenza creata correttamente.", skillId: result.insertId },
      201
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, 409, "Esiste già una competenza con questo nome nello stesso gruppo.");
    }
    return sendError(res, 500, "Errore durante la creazione della competenza.");
  }
});

app.put("/api/admin/skills/:id", requireAdminAuth, async (req, res) => {
  if (!isPositiveInteger(req.params.id)) {
    return sendError(res, 400, "ID competenza non valido.");
  }

  const skill = normalizeSkillBody(req.body);
  const errors = validateSkill(skill);

  if (errors.length > 0) {
    return sendError(res, 400, "Dati competenza non validi.", errors);
  }

  try {
    const [result] = await pool.execute(
      `UPDATE skills SET name = ?, group_name = ?, level_value = ? WHERE id = ?`,
      [skill.name, skill.group_name, skill.level_value, Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Competenza non trovata.");
    }

    return sendSuccess(res, { message: "Competenza aggiornata correttamente." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, 409, "Esiste già una competenza con questo nome nello stesso gruppo.");
    }
    return sendError(res, 500, "Errore durante l'aggiornamento della competenza.");
  }
});

app.delete("/api/admin/skills/:id", requireAdminAuth, async (req, res) => {
  if (!isPositiveInteger(req.params.id)) {
    return sendError(res, 400, "ID competenza non valido.");
  }

  try {
    const [result] = await pool.execute(
      `DELETE FROM skills WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Competenza non trovata.");
    }

    return sendSuccess(res, { message: "Competenza eliminata correttamente." });
  } catch {
    return sendError(res, 500, "Errore durante l'eliminazione della competenza.");
  }
});

app.get("/api/admin/messages", requireAdminAuth, async (req, res) => {
  try {
    const [messages] = await pool.execute(
      `SELECT ${messageSelectFields} FROM messages ORDER BY created_at DESC, id DESC`
    );
    return sendSuccess(res, { messages });
  } catch {
    return sendError(res, 500, "Errore durante il caricamento dei messaggi.");
  }
});

app.get("/api/admin/messages/:id", requireAdminAuth, async (req, res) => {
  if (!isPositiveInteger(req.params.id)) {
    return sendError(res, 400, "ID messaggio non valido.");
  }

  try {
    const [messages] = await pool.execute(
      `SELECT ${messageSelectFields} FROM messages WHERE id = ? LIMIT 1`,
      [Number(req.params.id)]
    );

    if (messages.length === 0) {
      return sendError(res, 404, "Messaggio non trovato.");
    }

    return sendSuccess(res, { message: messages[0] });
  } catch {
    return sendError(res, 500, "Errore durante il caricamento del messaggio.");
  }
});

app.delete("/api/admin/messages/:id", requireAdminAuth, async (req, res) => {
  if (!isPositiveInteger(req.params.id)) {
    return sendError(res, 400, "ID messaggio non valido.");
  }

  try {
    const [result] = await pool.execute(
      `DELETE FROM messages WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Messaggio non trovato.");
    }

    return sendSuccess(res, { message: "Messaggio eliminato correttamente." });
  } catch {
    return sendError(res, 500, "Errore durante l'eliminazione del messaggio.");
  }
});

app.use("/api", (req, res) => {
  return sendError(res, 404, "API non trovata.");
});

app.use(express.static(PUBLIC_DIR));

app.use((req, res) => {
  const notFoundPath = path.join(PUBLIC_DIR, "404.html");
  res.status(404).sendFile(notFoundPath, (error) => {
    if (error) {
      res.status(404).send("Pagina non trovata");
    }
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  return sendError(res, 500, "Errore interno del server.");
});

async function checkAdminExists() {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM admin_users`
  );
  return rows[0].total > 0;
}

app.listen(PORT, async () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
  try {
    await testConnection();
    console.log("Connessione MySQL riuscita.");

    const hasAdmin = await checkAdminExists();
    if (!hasAdmin) {
      console.warn("");
      console.warn("============================================================");
      console.warn("ATTENZIONE: nessun admin presente nel database.");
      console.warn("Crea il primo admin con:  npm run create-admin");
      console.warn("============================================================");
      console.warn("");
    }
  } catch {
    console.warn("Attenzione: connessione MySQL non riuscita. Controlla .env e sql/schema.sql.");
  }
});
