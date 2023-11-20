const db = require("../db");
const {
  InternalServerError,
  NotFoundError,
} = require("../errors/customErrors");

const getDecksByUserId = async (user_id) => {
  try {
    const query = `
    SELECT
      d.deck_id,
      d.name,
      u.username AS owner_username, 
      COUNT(c.card_id)::int AS total_card_count,
      COUNT(ls.card_id)::int AS learning_stack_count,
      SUM(CASE WHEN ls.next_review_at <= NOW() THEN 1 ELSE 0 END)::int AS due_cards_count,
      SUM(CASE WHEN ls.status BETWEEN 1 AND 4 THEN 1 ELSE 0 END)::int AS bad_status_count,
      SUM(CASE WHEN ls.status BETWEEN 5 AND 7 THEN 1 ELSE 0 END)::int AS mid_status_count,
      SUM(CASE WHEN ls.status BETWEEN 8 AND 10 THEN 1 ELSE 0 END)::int AS good_status_count,
      TO_CHAR(d.created_at, 'DD TMMonth YYYY') AS created_at,
      (ds.shared_with_user_id IS NOT NULL) AS is_shared,
      COALESCE(uds.is_active, NULL) AS is_active 
    FROM 
      decks d
    INNER JOIN 
      users u ON d.user_id = u.user_id  
    LEFT JOIN 
      cards c ON d.deck_id = c.deck_id
    LEFT JOIN 
      learning_stack ls ON c.card_id = ls.card_id
    LEFT JOIN
      deck_shares ds ON d.deck_id = ds.deck_id AND ds.shared_with_user_id = $1
    LEFT JOIN
      user_deck_status uds ON d.deck_id = uds.deck_id AND uds.user_id = $1
    WHERE 
      d.user_id = $1 OR ds.shared_with_user_id = $1
    GROUP BY 
      d.deck_id, u.username, ds.shared_with_user_id, uds.is_active
    ORDER BY 
      d.created_at;
    `;
    const values = [user_id];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      throw new NotFoundError(
        `No decks found for user with ID ${user_id}.`
      );
    }

    return rows; 
  } catch (error) {
    console.log(error)
    throw new InternalServerError(
      `Database error: cannot retrieve decks for user with ID ${user_id}. ${error}`
    );
  }
};


  const getDeckPermissions = async (deckId, userId) => {
    try {
      const query = `
        SELECT 
          d.user_id = $2 as is_owner,
          ds.permission_level
        FROM 
          decks d
        LEFT JOIN 
          deck_shares ds ON d.deck_id = ds.deck_id AND ds.shared_with_user_id = $2
        WHERE 
          d.deck_id = $1;
      `;
      const values = [deckId, userId];
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      throw new InternalServerError("Database error: cannot retrieve deck permissions.");
    }
  };

  const updateUserDeckStatus = async (userId, deckId, isActive) => {
    try {
      const query = `
        UPDATE user_deck_status
        SET is_active = $3
        WHERE user_id = $1 AND deck_id = $2
        RETURNING *;
      `;
      const values = [userId, deckId, isActive];
      const result = await db.query(query, values);
  
      if (result.rows.length === 0) {
        throw new NotFoundError("Deck status entry not found.");
      }
  
      return result.rows[0];
    } catch (error) {
      console.log(error)
      throw new InternalServerError("Database error: cannot update deck status.");
    }
  };
  



module.exports = {
  getDecksByUserId,
  getDeckPermissions,
  updateUserDeckStatus
};
