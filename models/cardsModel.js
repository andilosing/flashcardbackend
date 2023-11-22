const db = require("../db");
const {
  InternalServerError,
  NotFoundError,
  UnauthorizedError
} = require("../errors/customErrors");

const addCard = async (user_id, deck_id, front_content, back_content) => {
  try {
    await checkDeckPermissions(user_id, deck_id);

    const query = `
      INSERT INTO cards (deck_id, front_content, back_content)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
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
      JOIN decks d ON c.deck_id = d.deck_id
      LEFT JOIN learning_stack ls ON c.card_id = ls.card_id AND ls.user_id = $1
      JOIN user_deck_status uds ON d.deck_id = uds.deck_id AND uds.user_id = $1
      WHERE ls.progress_id IS NULL AND uds.is_active = true;
    `;
    const values = [user_id];
    const { rows } = await db.query(query, values);

    return rows; // Gibt die Liste von Karten zurück, die noch nicht in user_progress für den gegebenen Benutzer sind und aus aktiven Decks stammen
  } catch (error) {
    throw new InternalServerError(
      "Database error: cannot retrieve cards not in user progress from active decks."
    );
  }
};





const getCardsForDeck = async (deck_id, user_id) => {
  try {
    const query = `
    SELECT 
      cards.*,
      CASE 
        WHEN ls.card_id IS NOT NULL THEN ls.is_active 
        ELSE NULL 
      END as is_active
    FROM 
      cards
    LEFT JOIN 
      learning_stack ls ON cards.card_id = ls.card_id AND ls.user_id = $2
    LEFT JOIN 
      deck_shares ds ON cards.deck_id = ds.deck_id AND ds.shared_with_user_id = $2
    LEFT JOIN
      decks d ON cards.deck_id = d.deck_id
    WHERE 
      cards.deck_id = $1;
  
    `;
    const values = [deck_id, user_id];
    const { rows } = await db.query(query, values);

    return rows;
  } catch (error) {
    console.log(error)
    throw new InternalServerError(
      "Database error: cannot retrieve cards for deck."
    );
  }
};



const updateCard = async (user_id, card_id, front_content, back_content) => {
  try {
    const deckQuery = `
      SELECT deck_id FROM cards WHERE card_id = $1;
    `;
    const deckResult = await db.query(deckQuery, [card_id]);
    const deckId = deckResult.rows[0]?.deck_id;
    if (!deckId) throw new NotFoundError("Card not found.");

    await checkDeckPermissions(user_id, deckId);


    const query = `
      UPDATE cards
      SET front_content = $2, back_content = $3, updated_at = CURRENT_TIMESTAMP
      WHERE card_id = $1
      RETURNING *;
    `;
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


const deleteCards = async (deckId, cardIds, userId) => {
  try {
    const query = `
      DELETE FROM cards
      WHERE card_id = ANY($1)
        AND deck_id = $2
        AND EXISTS (
          SELECT 1 FROM decks
          WHERE deck_id = $2 AND user_id = $3
        )
      RETURNING *;
    `;
    const values = [cardIds, deckId, userId];
    const { rows } = await db.query(query, values);

    const cardIdsArray = cardIds.slice(1, -1).split(","); 

    if (rows.length !== cardIdsArray.length) {
      throw new NotFoundError(
        "Some cards not found, do not belong to the user, or are not in the specified deck."
      );
    }
  } catch (error) {
    console.log(error);
    if (!error.customError) {
      throw new InternalServerError("Database error: cannot delete cards.");
    }
    throw error;
  }
};

const checkDeckPermissions = async (user_id, deck_id) => {
  const permissionQuery = `
    SELECT 
      (d.user_id = $1) AS is_owner,
      ds.permission_level
    FROM 
      decks d
    LEFT JOIN 
      deck_shares ds ON d.deck_id = ds.deck_id AND ds.shared_with_user_id = $1
    WHERE 
      d.deck_id = $2;
  `;
  const permissionValues = [user_id, deck_id];
  const permissionResult = await db.query(permissionQuery, permissionValues);

  const permission = permissionResult.rows[0];
  if (!permission || (!permission.is_owner && permission.permission_level !== 'write')) {
    throw new UnauthorizedError("Unauthorized to perform action on this deck.");
  }
  return permission;
};

module.exports = {
  addCard,
  getCardsNotInUserProgress,
  getCardsForDeck,
  updateCard,
  deleteCards,
};
