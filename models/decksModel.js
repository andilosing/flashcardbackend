const db = require("../db");
const {
  InternalServerError,
  NotFoundError,
  UnauthorizedError
} = require("../errors/customErrors");

const getDecksByUserId = async (user_id) => {
  try {
    const query = `
    SELECT
        d.deck_id,
        d.name,
        u.username AS owner_username,
        (d.user_id = $1) AS is_owner,  -- Hinzufügen der is_owner-Spalte
        COUNT(DISTINCT c.card_id)::int AS total_card_count,
        COUNT(DISTINCT CASE WHEN ls.user_id = $1 THEN ls.card_id ELSE NULL END)::int AS learning_stack_count,
        SUM(CASE WHEN ls.next_review_at <= NOW() AND ls.user_id = $1 THEN 1 ELSE 0 END)::int AS due_cards_count,
        SUM(CASE WHEN ls.status BETWEEN 1 AND 4 AND ls.user_id = $1 THEN 1 ELSE 0 END)::int AS bad_status_count,
        SUM(CASE WHEN ls.status BETWEEN 5 AND 7 AND ls.user_id = $1 THEN 1 ELSE 0 END)::int AS mid_status_count,
        SUM(CASE WHEN ls.status BETWEEN 8 AND 10 AND ls.user_id = $1 THEN 1 ELSE 0 END)::int AS good_status_count,
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
    console.log(error);
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

  const createDeck = async (userId, deckName) => {
    try {
        await db.query('BEGIN'); // Beginnen einer Transaktion

        const deckQuery = `
            INSERT INTO decks (name, user_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const deckValues = [deckName, userId];
        const deckResult = await db.query(deckQuery, deckValues);
        const newDeck = deckResult.rows[0];

        const statusQuery = `
            INSERT INTO user_deck_status (user_id, deck_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const statusValues = [userId, newDeck.deck_id];
        const statusResult = await db.query(statusQuery, statusValues);
        const newUserDeckStatus = statusResult.rows[0];

        await db.query('COMMIT'); // Bestätigen der Transaktion

        return {
            deck: newDeck,
            userDeckStatus: newUserDeckStatus
        };
    } catch (error) {
        await db.query('ROLLBACK'); // Rollback im Fehlerfall
        console.error("Error creating new deck:", error);
        throw new InternalServerError("Database error: cannot create new deck.");
    }
};

const getDeckShares = async (deck_id, user_id) => {
  try {
    // Überprüfen, ob der Benutzer der Besitzer des Decks ist
    const ownerCheckQuery = `SELECT user_id FROM decks WHERE deck_id = $1;`;
    const ownerCheckResult = await db.query(ownerCheckQuery, [deck_id]);
    const owner = ownerCheckResult.rows[0]?.user_id;

    if (owner !== user_id) {
      throw new UnauthorizedError("Nur der Besitzer des Decks kann die geteilten Informationen abrufen.");
    }

    // Abfrage der Informationen aus der deck_shares Tabelle
    const query = `
        SELECT 
          ds.share_id, 
          u.username AS shared_with_username, 
          ds.permission_level,
          ds.shared_at
        FROM 
          deck_shares ds 
        JOIN 
          users u ON ds.shared_with_user_id = u.user_id 
        WHERE 
          ds.deck_id = $1
        ORDER BY 
          u.username ASC; 
    `;
    const values = [deck_id];
    const { rows } = await db.query(query, values);

    return rows;
  } catch (error) {
    console.error(`Database error: cannot retrieve shares for deck with ID ${deck_id}.`, error);
    throw error;
  }
};

const updateSharePermission = async (shareId, newPermissionLevel) => {
  try {

    const query = `
      UPDATE deck_shares
      SET permission_level = $1
      WHERE share_id = $2
      RETURNING *;
    `;
    const values = [newPermissionLevel, shareId];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new InternalServerError("Share permission not updated.");
    }
    return result.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const checkUserAuthorizationForShare = async (userId, shareId) => {
  try {
    const query = `
      SELECT ds.deck_id
      FROM deck_shares ds
      JOIN decks d ON ds.deck_id = d.deck_id
      WHERE ds.share_id = $1 AND d.user_id = $2;
    `;
    const values = [shareId, userId];
    const result = await db.query(query, values);

    return result.rows.length > 0;
  } catch (error) {
    console.error(error);
    throw error;
  }
};






  



module.exports = {
  getDecksByUserId,
  getDeckPermissions,
  updateUserDeckStatus,
  createDeck,
  getDeckShares,
  updateSharePermission,
  checkUserAuthorizationForShare
}
