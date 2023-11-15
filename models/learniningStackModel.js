const db = require("../db");
const {
  InternalServerError,
  NotFoundError,
} = require("../errors/customErrors");

const addCardToUserProgress = async (user_id, card_id, initial_status) => {
  try {
    const insertProgressQuery = `
        INSERT INTO learning_stack (user_id, card_id, status)
        VALUES ($1, $2, $3)
        RETURNING progress_id;`;
    const progressValues = [user_id, card_id, initial_status];

    const result = await db.query(insertProgressQuery, progressValues);

    if (!result.rows[0]) {
      throw new Error("User progress not added to database.");
    }

    return result.rows[0];
  } catch (error) {
    console.log(error);
    throw new InternalServerError(
      `Database error: cannot add user progress. ${error}`
    );
  }
};

const getDueCardsForUser = async (user_id, max_cards) => {
  try {
    const query = `
    SELECT 
      ls.progress_id, 
      ls.status, 
      c.front_content, 
      c.back_content
    FROM 
      learning_stack AS ls
    INNER JOIN 
      cards AS c ON ls.card_id = c.card_id
    WHERE 
      ls.user_id = $1 
      AND ls.next_review_at <= NOW()
    ORDER BY 
      ls.next_review_at ASC
    LIMIT $2;
    `;
    const values = [user_id, max_cards];
    const { rows } = await db.query(query, values);
    return rows; // Gibt die Liste der fälligen Karteikarten für den gegebenen Benutzer zurück
  } catch (error) {
    throw new InternalServerError(
      `Database error: cannot retrieve due cards for user with ID ${user_id}.`
    );
  }
};

const updateCard = async (progress_id, status, next_review_at) => {
  try {
    const query = `
        UPDATE learning_stack
        SET 
          status = $2, 
          last_reviewed_at = NOW(), 
          next_review_at = $3, 
          review_count = review_count + 1,
          updated_at = NOW()
        WHERE progress_id = $1
        RETURNING *;
      `;
    const values = [progress_id, status, next_review_at];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      throw new NotFoundError(
        `No user progress found with the given progress_id: ${progress_id}.`
      );
    }

    return rows[0].progress_id; // Gibt den aktualisierten user_progress Eintrag zurück
  } catch (error) {
    if (!error.statusCode) {
      throw new InternalServerError(
        `Database error: cannot update user progress for progress_id ${progress_id}.`
      );
    }
    throw error;
  }
};

const getCardsClosestToReview = async (user_id, limit) => {
  try {
    const query = `
      SELECT 
        ls.progress_id, 
        ls.status, 
        c.front_content, 
        c.back_content
      FROM 
        learning_stack AS ls
      INNER JOIN 
        cards AS c ON ls.card_id = c.card_id
      WHERE 
        ls.user_id = $1 
        AND ls.next_review_at >= NOW()  
      ORDER BY 
        ls.next_review_at ASC          
      LIMIT $2;
    `;
    const values = [user_id, limit];
    const { rows } = await db.query(query, values);
    return rows;
  } catch (error) {
    throw new InternalServerError("Database error: cannot retrieve cards closest to review.");
  }
};





module.exports = {
  addCardToUserProgress,
  getDueCardsForUser,
  updateCard,
  getCardsClosestToReview
};
