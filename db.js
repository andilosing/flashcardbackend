const { Client } = require("pg");
require("dotenv").config();

// const db = new Client({
//   host: process.env.DATABASE_HOST,
//   port: process.env.DATABASE_PORT,
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_DB_NAME,
// });


//testnew
const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect()
  .then(async () => {
    console.log("Connected to PostgreSQL");

    await createUsersTable();
    await createDecksTable();
    await createCardsTable();
    await createLearningStackTable();
    await createLearningSessionsTable();
    await createTokensTable();
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL", err);
  });

const createUsersTable = async () => {
  try {
    const query = `
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL, -- Hier sollte ein gehashtes Passwort gespeichert werden
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login_at TIMESTAMP, -- Hält das Datum des letzten Logins fest
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

    await db.query(query);
  } catch (error) {
    console.error(
      "Error creating users table with last login tracking:",
      error
    );
  }
};

const createTokensTable = async () => {
  try {
      const query = `
          
CREATE TABLE IF NOT EXISTS tokens (
  token_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_user
                FOREIGN KEY(user_id) 
                REFERENCES users(user_id)
                ON DELETE CASCADE
);
      `;

      await db.query(query);
     
  } catch (error) {
    console.error("Error creating tokens table:", error);
  }
};

const createDecksTable = async () => {
  try {
    const query = `
            CREATE TABLE IF NOT EXISTS decks (
                deck_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_user
                    FOREIGN KEY(user_id) 
                    REFERENCES users(user_id)
                    ON DELETE CASCADE
            );
        `;

    await db.query(query);
  } catch (error) {
    console.error("Error creating decks table:", error);
  }
};

const createCardsTable = async () => {
  try {
    const query = `
            CREATE TABLE IF NOT EXISTS cards (
                card_id SERIAL PRIMARY KEY,
                deck_id INTEGER NOT NULL,
                front_content TEXT NOT NULL,
                back_content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_deck
                    FOREIGN KEY(deck_id) 
                    REFERENCES decks(deck_id)
                    ON DELETE CASCADE
            );
        `;

    await db.query(query);
  } catch (error) {
    console.error("Error creating cards table:", error);
  }
};

const createLearningStackTable = async () => {
  try {
    const query = `
            CREATE TABLE IF NOT EXISTS learning_stack (
                progress_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                card_id INTEGER NOT NULL,
                status INTEGER NOT NULL CHECK (status BETWEEN 1 AND 10),
                last_reviewed_at TIMESTAMP,
                next_review_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                review_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_user
                    FOREIGN KEY(user_id) 
                    REFERENCES users(user_id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_card
                    FOREIGN KEY(card_id) 
                    REFERENCES cards(card_id)
                    ON DELETE CASCADE
            );
        `;

    await db.query(query);
  } catch (error) {
    console.error("Error creating user progress table:", error);
  }
};

const createLearningSessionsTable = async () => {
  try {
    const query = `
        CREATE TABLE IF NOT EXISTS learning_sessions (
            session_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            start_learning_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_learning_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            cards_learned_count INTEGER DEFAULT 0,
            CONSTRAINT fk_user
                FOREIGN KEY(user_id) 
                REFERENCES users(user_id)
                ON DELETE CASCADE
        );
        `;

    await db.query(query);
  } catch (error) {
    console.error("Error creating learning sessions table:", error);
  }
};

module.exports = db;

/* 
Um eine Datenbankstruktur für eine Karteikarten-App zu entwerfen, die Ihre Anforderungen erfüllt, können wir ein relationales Datenbankmanagementsystem (RDBMS) wie MySQL, PostgreSQL oder SQLite verwenden. Hier ist ein einfacher Entwurf, der Ihre Bedürfnisse widerspiegelt:

Tabellenstruktur:

Users

user_id (Primary Key, Integer, Auto-Increment)
username (Varchar)
password_hash (Varchar)
email (Varchar)
created_at (Timestamp)
updated_at (Timestamp)
Decks (Stapel)

deck_id (Primary Key, Integer, Auto-Increment)
user_id (Foreign Key, Integer)
title (Varchar)
description (Text)
created_at (Timestamp)
updated_at (Timestamp)
public (Boolean) – um anzugeben, ob der Stapel geteilt ist oder nicht
Cards (Karteikarten)

card_id (Primary Key, Integer, Auto-Increment)
deck_id (Foreign Key, Integer)
front_content (Text)
back_content (Text)
status (Enum ['new', 'learning', 'reviewing', 'known']) – Status der Karteikarte
next_review_at (Timestamp) – Wann die Karteikarte wieder vorgeschlagen wird
created_at (Timestamp)
updated_at (Timestamp)
Deck_Shares (Teilungen der Stapel)

share_id (Primary Key, Integer, Auto-Increment)
deck_id (Foreign Key, Integer)
user_id (Foreign Key, Integer) – ID des Benutzers, mit dem der Stapel geteilt wird
permission_level (Enum ['read', 'write']) – Berechtigungen für den geteilten Nutzer
created_at (Timestamp)
User_Deck (Zuordnungstabelle für Benutzer und Stapel)

user_deck_id (Primary Key, Integer, Auto-Increment)
user_id (Foreign Key, Integer)
deck_id (Foreign Key, Integer)
created_at (Timestamp)

User_Progress (Benutzerfortschritt)
progress_id (Primary Key, Integer, Auto-Increment)
card_id (Foreign Key, Integer) – Verweist auf die Karteikarte
user_id (Foreign Key, Integer) – Verweist auf den Benutzer, der lernt
status (Enum ['new', 'learning', 'reviewing', 'known']) – Aktueller Lernstatus
last_reviewed_at (Timestamp) – Wann die Karte zuletzt überprüft wurde
next_review_at (Timestamp) – Wann die Karte das nächste Mal überprüft werden soll
created_at (Timestamp)
updated_at (Timestamp)

*/
