const db = require("../db");
const { InternalServerError } = require("../errors/customErrors");

// Funktion, um den letzten "viewed" Zeitpunkt zu erhalten
const getLastViewedAt = async (userId) => {
  try {
    const query = `
      SELECT notifications_viewed_at FROM user_notifications_checks
      WHERE user_id = $1;
    `;
    const { rows } = await db.query(query, [userId]);
    return rows[0]?.notifications_viewed_at;
  } catch (error) {
    throw new InternalServerError("Database error: cannot retrieve last viewed time.");
  }
};


const updateLastViewedAt = async (userId) => {
  try {
    const query = `
      UPDATE user_notifications_checks
      SET notifications_viewed_at = CURRENT_TIMESTAMP
      WHERE user_id = $1;
    `;
    await db.query(query, [userId]);
  } catch (error) {
    throw new InternalServerError("Database error: cannot update last viewed time.");
  }
};

const updateLastLoadedAt = async (userId) => {
  try {
    const query = `
      UPDATE user_notifications_checks
      SET notifications_loaded_at = CURRENT_TIMESTAMP
      WHERE user_id = $1;
    `;
    await db.query(query, [userId]);
  } catch (error) {
    throw new InternalServerError("Database error: cannot update last loaded time.");
  }
};


const createInitialUserNotificationCheck = async (userId) => {
  try {
    const query = `
      INSERT INTO user_notifications_checks (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING;
    `;
    await db.query(query, [userId]);
  } catch (error) {
    console.log(error)
    throw new InternalServerError("Database error: cannot create initial user notification check.");
  }
};

module.exports = {
  getLastViewedAt,
  updateLastViewedAt,
  updateLastLoadedAt,
  createInitialUserNotificationCheck,
};
