const db = require("../db");
const { InternalServerError, NotFoundError } = require("../errors/customErrors");

const addCard = async (deck_id, front_content, back_content) => {
    try {
      const query = `
        INSERT INTO cards (deck_id, front_content, back_content)
        VALUES ($1, $2, $3)
        RETURNING *`;
      const values = [deck_id, front_content, back_content];
      const { rows } = await db.query(query, values);
      if (!rows[0]) throw new NotFoundError("Card not added to database.");
      return rows[0];
    } catch (error) {
      if (!error.customError) {
        throw new InternalServerError("Database error: cannot add card.");
      }
      throw error;
    }
  };

  const getCardsNotInUserProgress = async (user_id) => {
    try {
      const query = `
        SELECT c.*
        FROM cards c
        LEFT JOIN learning_stack up ON c.card_id = up.card_id AND up.user_id = $1
        WHERE up.progress_id IS NULL;
      `;
      const values = [user_id];
      const { rows } = await db.query(query, values);
  
      return rows; // Gibt die Liste von Karten zurück, die noch nicht in user_progress für den gegebenen Benutzer sind
    } catch (error) {
      throw new InternalServerError("Database error: cannot retrieve cards not in user progress.");
    }
  };

  const getCardsForDeck = async (deck_id) => {
    try {
      const query = `
        SELECT *
        FROM cards
        WHERE deck_id = $1
      `;
      const values = [deck_id];
      const { rows } = await db.query(query, values);
  
      return rows; 
    } catch (error) {
      throw new InternalServerError("Database error: cannot retrieve cards for deck.");
    }
  };

  const updateCard = async (card_id, front_content, back_content) => {
    try {
      const query = `
        UPDATE cards
        SET front_content = $2,
            back_content = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE card_id = $1
        RETURNING *`;
      const values = [card_id, front_content, back_content];
      const { rows } = await db.query(query, values);
      if (!rows[0]) throw new NotFoundError("Card not found or not updated.");
      return rows[0];
    } catch (error) {
      if (!error.customError) {
        throw new InternalServerError("Database error: cannot update card.");
      }
      throw error;
    }
  };


  module.exports = {
   addCard,
   getCardsNotInUserProgress,
   getCardsForDeck,
   updateCard
  };
  