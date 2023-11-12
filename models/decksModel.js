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
          COUNT(c.card_id) AS card_count, 
          TO_CHAR(d.created_at, 'DD TMMonth YYYY') AS created_at
        FROM 
          decks d
        LEFT JOIN 
          cards c ON d.deck_id = c.deck_id
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
