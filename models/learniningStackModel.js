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

const getDueCardsForUser = async (user_id, max_cards, reviewCountCriteria) => {
  try {
    let reviewCountFilter = '';
    if (reviewCountCriteria === 'nonZero') {
      reviewCountFilter = 'AND ls.review_count != 0';
    } else if (reviewCountCriteria === 'zero') {
      reviewCountFilter = 'AND ls.review_count = 0';
    }
    
    let query = `
      SELECT 
        ls.progress_id, 
        ls.card_id,
        ls.status, 
        c.front_content, 
        c.back_content,
        ls.review_count
      FROM 
        learning_stack AS ls
      INNER JOIN 
        cards AS c ON ls.card_id = c.card_id
      INNER JOIN
        user_deck_status uds ON c.deck_id = uds.deck_id AND uds.user_id = $1
      WHERE 
        ls.user_id = $1 
        AND ls.next_review_at <= NOW()
        AND ls.is_active = true
        AND uds.is_active = true
        ${reviewCountFilter}
      ORDER BY 
        ls.next_review_at ASC
    `;

   
    if (max_cards !== null) {
      query += ` LIMIT $2`;
      const values = [user_id, max_cards];
      const { rows } = await db.query(query, values);
      return rows;
    } else {
      const { rows } = await db.query(query, [user_id]);
      return rows;
    }
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

const checkCardInLearningStack = async (user_id, card_id) => {
  try {
    const query = `
      SELECT progress_id FROM learning_stack
      WHERE user_id = $1 AND card_id = $2;
    `;
    const { rows } = await db.query(query, [user_id, card_id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log(error);
    throw new InternalServerError("Database error in checkCardInLearningStack");
  }
};


const updateCardActiveStatus = async (user_id, card_id, is_active) => {
  try {
    const query = `
      UPDATE learning_stack
      SET is_active = $3, next_review_at = CASE WHEN $3 = true THEN NOW() ELSE next_review_at END
      WHERE user_id = $1 AND card_id = $2;
    `;
    await db.query(query, [user_id, card_id, is_active]);
  } catch (error) {
    console.log(error);
    throw new InternalServerError("Database error in updateCardActiveStatus");
  }
};


const addCardToLearningStackWithStatus = async (user_id, card_id, is_active) => {
  try {
    const query = `
      INSERT INTO learning_stack (user_id, card_id, status, is_active)
      VALUES ($1, $2, 1, $3)  
    `;
    await db.query(query, [user_id, card_id, is_active]);
  } catch (error) {
    console.log(error);
    throw new InternalServerError("Database error in addCardToLearningStackWithStatus");
  }
};


module.exports = {
  addCardToUserProgress,
  getDueCardsForUser,
  updateCard,
  checkCardInLearningStack,
  updateCardActiveStatus,
  addCardToLearningStackWithStatus
};
