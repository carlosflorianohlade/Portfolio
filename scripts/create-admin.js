const crypto = require("crypto");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
require("dotenv").config();

const { pool } = require("../db");

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha256").toString("hex");
}

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    const email = (await rl.question("Email admin: ")).trim().toLowerCase();
    const password = await rl.question("Password admin: ");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Email non valida.");
    }

    if (password.length < 8) {
      throw new Error("La password deve contenere almeno 8 caratteri.");
    }

    const salt = crypto.randomBytes(24).toString("hex");
    const hash = hashPassword(password, salt);

    await pool.execute(
      `INSERT INTO admin_users (email, password_hash, password_salt)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), password_salt = VALUES(password_salt)`,
      [email, hash, salt]
    );

    console.log("Admin creato/aggiornato correttamente.");
  } finally {
    rl.close();
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error("Errore:", error.message);
  try {
    await pool.end();
  } catch {
    // nessuna azione necessaria
  }
  process.exit(1);
});
