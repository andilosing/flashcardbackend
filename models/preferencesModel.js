const db = require("../db");
const { InternalServerError } = require("../errors/customErrors");

const getAllPreferences = async (userId) => {
    try {
        const query = `
            SELECT 
                front_cards_count, 
                back_cards_count, 
                average_learning_time_good, 
                average_learning_time_bad, 
                learning_streak_good, 
                learning_streak_bad,
                fetch_all_due_mode 
            FROM preferences
            WHERE user_id = $1;
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0]; 
    } catch (error) {
        console.error('Error retrieving preferences:', error);
        throw new InternalServerError();
    }
};


const updatePreferences = async (userId, preferences) => {
  try {
    const {
      front_cards_count,
      back_cards_count,
      average_learning_time_good,
      average_learning_time_bad,
      learning_streak_good,
      learning_streak_bad,
      fetch_all_due_mode,
    } = preferences;
    const query = `
    UPDATE preferences 
    SET front_cards_count = $2, 
        back_cards_count = $3, 
        average_learning_time_good = $4, 
        average_learning_time_bad = $5, 
        learning_streak_good = $6, 
        learning_streak_bad = $7,
        fetch_all_due_mode = $8
    WHERE user_id = $1
    RETURNING front_cards_count, back_cards_count, average_learning_time_good, average_learning_time_bad, learning_streak_good, learning_streak_bad, fetch_all_due_mode;
`;

    const values = [
      userId,
      front_cards_count,
      back_cards_count,
      average_learning_time_good,
      average_learning_time_bad,
      learning_streak_good,
      learning_streak_bad,
      fetch_all_due_mode
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating preferences:", error);
    throw new InternalServerError();
  }
};

const resetPreferences = async (userId) => {
  try {
    const query = `UPDATE preferences SET
      front_cards_count = DEFAULT,
      back_cards_count = DEFAULT,
      average_learning_time_good = DEFAULT,
      average_learning_time_bad = DEFAULT,
      learning_streak_good = DEFAULT,
      learning_streak_bad = DEFAULT,
      fetch_all_due_mode = DEFAULT
      WHERE user_id = $1
      RETURNING front_cards_count, back_cards_count, average_learning_time_good, average_learning_time_bad, learning_streak_good, learning_streak_bad, fetch_all_due_mode;`;
    const values = [userId];
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error resetting preferences in Model:", error);
    throw new Error("Internal Server Error");
  }
};

module.exports = {
  getAllPreferences,
  updatePreferences,
  resetPreferences,
};
