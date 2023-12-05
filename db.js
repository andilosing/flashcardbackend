const { Client } = require("pg");
require("dotenv").config();

// const db = new Client({
//   host: process.env.DATABASE_HOST,
//   port: process.env.DATABASE_PORT,
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_DB_NAME,
// }); 

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
    await createPreferencesTable();
    await createUserDeckStatusTable();
    await createDeckSharesTable();
    await createRequestsTable();
    await createUserNotificationsChecksTable();
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
                is_active BOOLEAN DEFAULT true,
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
            cards_learned_count INTEGER DEFAULT 1,
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

const createPreferencesTable = async () => {
  try {
    const query = `
          CREATE TABLE IF NOT EXISTS preferences (
            preference_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            max_cards INTEGER DEFAULT 20, 
            daily_learning_goal INTEGER DEFAULT 60, 
            CONSTRAINT fk_user
                FOREIGN KEY(user_id) 
                REFERENCES users(user_id)
                ON DELETE CASCADE
        );
        `;

    await db.query(query);
  } catch (error) {
    console.error("Error creating preferences table:", error);
  }
};

const createUserDeckStatusTable = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS user_deck_status (
      user_id INTEGER NOT NULL,
      deck_id INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT false,
      PRIMARY KEY (user_id, deck_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (deck_id) REFERENCES decks(deck_id) ON DELETE CASCADE
    );
        `;

    await db.query(query);
  } catch (error) {
    console.error("Error creating user deck status table:", error);
  }
};

const createDeckSharesTable = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS deck_shares (
      share_id SERIAL PRIMARY KEY,
      deck_id INTEGER NOT NULL,
      shared_with_user_id INTEGER NOT NULL,
      permission_level VARCHAR(10) NOT NULL CHECK (permission_level IN ('read', 'write')),
      shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_deck
          FOREIGN KEY(deck_id)
          REFERENCES decks(deck_id)
          ON DELETE CASCADE,
      CONSTRAINT fk_user
          FOREIGN KEY(shared_with_user_id)
          REFERENCES users(user_id)
          ON DELETE CASCADE
    );
        `;

    await db.query(query);
  } catch (error) {
    console.error("Error creating deck shares table:", error);
  }
};

const createRequestsTable = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS requests (
      request_id SERIAL PRIMARY KEY,
      request_type VARCHAR(255) NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      additional_data JSON, 
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      responded_at TIMESTAMP,
      CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users (user_id),
      CONSTRAINT fk_receiver FOREIGN KEY (receiver_id) REFERENCES users (user_id)
    );
        `;

    await db.query(query);
  } catch (error) {
    console.error("Error creating requests table:", error);
  }
};


const createUserNotificationsChecksTable = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS user_notifications_checks (
      check_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      notifications_loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notifications_viewed_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
      UNIQUE(user_id) 
    );
        `;

    await db.query(query);
  } catch (error) {
    console.error("Error creating user_notifications_checks table:", error);
  }
};



module.exports = db;
