const db = require("../db");
const {
  InternalServerError,
  NotFoundError,
} = require("../errors/customErrors");

const startLearningSession = async (user_id) => {
  try {
    const query = `
            INSERT INTO learning_sessions (user_id)
            VALUES ($1)
            RETURNING *`;
    const values = [user_id];
    const { rows } = await db.query(query, values);
    if (!rows[0]) throw new NotFoundError("Learning session not started.");
    return rows[0];
  } catch (error) {
    if (!error.customError) {
      throw new InternalServerError(
        "Database error: cannot start learning session."
      );
    }
    throw error;
  }
};

const getLastLearningSessionForUser = async (user_id) => {
  try {
    const query = `
            SELECT * FROM learning_sessions
            WHERE user_id = $1
            ORDER BY end_learning_at DESC, session_id DESC
            LIMIT 1`;
    const values = [user_id];
    const { rows } = await db.query(query, values);
    return rows[0]; // Gibt die letzte Session des Benutzers zurück, falls vorhanden
  } catch (error) {
    throw new InternalServerError(
      "Database error: cannot retrieve last learning session."
    );
  }
};

const updateLearningSession = async (session_id) => {
  try {
    const query = `
            UPDATE learning_sessions
            SET end_learning_at = CURRENT_TIMESTAMP, cards_learned_count = cards_learned_count + 1
            WHERE session_id = $1
            RETURNING *`;
    const values = [session_id];
    const { rows } = await db.query(query, values);
    if (!rows[0]) throw new NotFoundError("Learning session not updated.");
    return rows[0];
  } catch (error) {
    if (!error.customError) {
      throw new InternalServerError(
        "Database error: cannot update learning session."
      );
    }
    throw error;
  }
};

const getAllLearningSessionsForUser = async (user_id) => {
  try {
    const query = `
      SELECT
        DATE(start_learning_at AT TIME ZONE 'Europe/Berlin') AS session_date,
        FLOOR(SUM(EXTRACT(EPOCH FROM (end_learning_at - start_learning_at))) / 60) AS total_learning_time_minutes,
        SUM(cards_learned_count) AS total_cards_learned
      FROM
        learning_sessions
      WHERE
        user_id = $1
      GROUP BY
        DATE(start_learning_at AT TIME ZONE 'Europe/Berlin')
      ORDER BY
        session_date DESC;
      `;
    const values = [user_id];
    const { rows } = await db.query(query, values);

    return rows; // Gibt eine Liste von Lernsessions pro Tag für den gegebenen Benutzer zurück
  } catch (error) {
    throw new InternalServerError(
      `Database error: cannot retrieve learning sessions for user with ID ${user_id}.`
    );
  }
};

const getLearnedCardsAndTimeSinceDate = async (userId, sinceDate) => {
  try {
    const query = `
      SELECT
        ls.user_id,
        u.username,
        SUM(ls.cards_learned_count) AS total_cards_learned,
        FLOOR(SUM(EXTRACT(EPOCH FROM (ls.end_learning_at - ls.start_learning_at))) / 60) AS total_learning_time_minutes
      FROM
        learning_sessions ls
      JOIN
        users u ON ls.user_id = u.user_id
      WHERE
        ls.user_id != $1 AND
        ls.start_learning_at > $2
      GROUP BY
        ls.user_id, u.username;
    `;
    const values = [userId, sinceDate];
    const { rows } = await db.query(query, values);

    return rows; // Gibt eine Liste von gelernten Karten und Minuten für jeden Benutzer, ausgenommen den eigenen, seit dem angegebenen Datum zurück, inklusive Benutzernamen
  } catch (error) {
    throw new InternalServerError(
      "Database error: cannot retrieve learned cards and time for other users."
    );
  }
};



module.exports = {
  startLearningSession,
  getLastLearningSessionForUser,
  updateLearningSession,
  getAllLearningSessionsForUser,
  getLearnedCardsAndTimeSinceDate
};
