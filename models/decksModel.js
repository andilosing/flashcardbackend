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
        COUNT(c.card_id)::int AS total_card_count,
        COUNT(ls.card_id)::int AS learning_stack_count,
        SUM(CASE WHEN ls.next_review_at <= NOW() THEN 1 ELSE 0 END)::int AS due_cards_count,
        SUM(CASE WHEN ls.status BETWEEN 1 AND 4 THEN 1 ELSE 0 END)::int AS bad_status_count,
        SUM(CASE WHEN ls.status BETWEEN 5 AND 7 THEN 1 ELSE 0 END)::int AS mid_status_count,
        SUM(CASE WHEN ls.status BETWEEN 8 AND 10 THEN 1 ELSE 0 END)::int AS good_status_count,      
        TO_CHAR(d.created_at, 'DD TMMonth YYYY') AS created_at
      FROM 
        decks d
      LEFT JOIN 
        cards c ON d.deck_id = c.deck_id
      LEFT JOIN 
        learning_stack ls ON c.card_id = ls.card_id
      WHERE 
        d.user_id = $1
      GROUP BY 
        d.deck_id
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
      throw new InternalServerError(
        `Database error: cannot retrieve decks for user with ID ${user_id}. ${error}`
      );
    }
  };
  



module.exports = {
  getDecksByUserId,
};
