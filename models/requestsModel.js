const db = require("../db");
const {
  InternalServerError,
  UnauthorizedError,
} = require("../errors/customErrors");

const addShareDeskRequest = async (
  requestType,
  senderId,
  receiverId,
  additionalData
) => {
  try {
    if (requestType === "SHARE_DECK" && additionalData.deckId) {
      const deckOwnerQuery = `SELECT user_id FROM decks WHERE deck_id = $1;`;
      const deckOwnerResult = await db.query(deckOwnerQuery, [
        additionalData.deckId,
      ]);
      const deckOwner = deckOwnerResult.rows[0]?.user_id;

      if (deckOwner !== senderId) {
        throw new UnauthorizedError("Sender is not the owner of the deck.");
      }
    }

    console.log(additionalData);
    const query = `
      INSERT INTO requests (request_type, sender_id, receiver_id, additional_data)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [
      requestType,
      senderId,
      receiverId,
      JSON.stringify(additionalData),
    ];
    const { rows } = await db.query(query, values);

    if (!rows[0]) {
      throw new InternalServerError(
        "Deck share request not added to database."
      );
    }
    return rows[0];
  } catch (error) {
    console.log(error);
    if (!error.customError) {
      throw new InternalServerError(
        "Database error: cannot add deck share request."
      );
    }
    throw error;
  }
};

const getOpenRequestsForUser = async (userId) => {
  try {
    const query = `
      SELECT 
        r.*, 
        u.username AS sender_username, 
        d.name AS deck_name
      FROM 
        requests r
      JOIN 
        users u ON r.sender_id = u.user_id
      LEFT JOIN 
        decks d ON d.deck_id = (r.additional_data->>'deckId')::int
      WHERE 
        r.receiver_id = $1 
        AND r.status = 'pending'
      ORDER BY 
        r.created_at DESC;
    `;
    const values = [userId];
    const { rows } = await db.query(query, values);

    // Formatieren der Ergebnisse, um sie benutzerfreundlich zu machen
    return rows.map((row) => {
      return {
        ...row,
        sender_username: row.sender_username,
        deck_name: row.deck_name || null, // Falls es keine deckId gibt, wird null zurückgegeben
      };
    });
  } catch (error) {
    console.log(error);
    if (!error.customError) {
      throw new InternalServerError(
        "Database error: cannot retrieve open requests."
      );
    }
    throw error;
  }
};

const getUsersEligibleForShareDeckRequest = async (senderId, deckId) => {
  try {
    const query = `
      SELECT u.user_id, u.username
      FROM users u
      WHERE u.user_id <> $1
        AND NOT EXISTS (
          SELECT 1
          FROM requests r
          WHERE r.receiver_id = u.user_id
            AND r.sender_id = $1
            AND r.request_type = 'SHARE_DECK'
            AND r.status = 'pending'
            AND (r.additional_data->>'deckId')::integer = $2
        )
        AND NOT EXISTS (
          SELECT 1
          FROM deck_shares ds
          WHERE ds.shared_with_user_id = u.user_id
            AND ds.deck_id = $2
        );
    `;
    const values = [senderId, deckId];
    const { rows } = await db.query(query, values);

    return rows;
  } catch (error) {
    console.log(error);
    if (!error.customError) {
      throw new InternalServerError(
        "Database error: cannot retrieve eligible users for share deck request."
      );
    }
    throw error;
  }
};




const getOpenRequestsForDeck = async (deckId, userId) => {
  try {
    // Überprüfen, ob der Benutzer der Besitzer des Decks ist
    const ownerCheckQuery = `SELECT user_id FROM decks WHERE deck_id = $1;`;
    const ownerCheckResult = await db.query(ownerCheckQuery, [deckId]);
    const owner = ownerCheckResult.rows[0]?.user_id;

    if (owner !== userId) {
      throw new UnauthorizedError("Nur der Besitzer des Decks kann die offenen Anfragen einsehen.");
    }

    // Abfrage der offenen Anfragen für das Deck, inklusive des Nutzernamens des Empfängers
    const query = `
      SELECT 
        r.request_id, 
        r.request_type, 
        r.sender_id, 
        sender.username AS sender_username, 
        r.receiver_id, 
        receiver.username AS receiver_username, 
        r.status, 
        r.created_at,
        COALESCE(r.additional_data->>'permissionLevel', 'NONE') AS permission_level
      FROM 
        requests r 
      JOIN 
        users sender ON r.sender_id = sender.user_id
      JOIN
        users receiver ON r.receiver_id = receiver.user_id
      WHERE 
        r.request_type = 'SHARE_DECK' 
        AND r.status = 'pending' 
        AND r.additional_data->>'deckId' = $1::text
      ORDER BY 
        r.created_at DESC;
    `;
    const values = [deckId];
    const { rows } = await db.query(query, values);

    return rows
  } catch (error) {
    console.log(error);
    if (!error.customError) {
      throw new InternalServerError(
        `Database error: cannot retrieve open requests for deck with ID ${deckId}.`
      );
    }
    throw error;
  }
};

const deleteRequest = async (requestId, userId) => {
  try {
      const checkQuery = `SELECT sender_id FROM requests WHERE request_id = $1;`;
      const checkResult = await db.query(checkQuery, [requestId]);
      const senderId = checkResult.rows[0]?.sender_id;

      if (senderId !== userId) {
          throw new UnauthorizedError("Nur der Ersteller der Anfrage kann sie löschen.");
      }

      // Löschen der Anfrage
      const deleteQuery = `DELETE FROM requests WHERE request_id = $1;`;
      await db.query(deleteQuery, [requestId]);
  } catch (error) {
      console.log(error);
      throw error; // Hier sollten Sie einen benutzerdefinierten Fehler werfen oder weiterleiten
  }
};

const handleRequestResponse = async (requestId, userId, action) => {
  try {
    const requestQuery = `SELECT * FROM requests WHERE request_id = $1;`;
    const requestResult = await db.query(requestQuery, [requestId]);
    const request = requestResult.rows[0];

    if (!request) {
      throw new NotFoundError("Request not found.");
    }
    if (request.receiver_id !== userId) {
      throw new UnauthorizedError("User is not authorized to handle this request.");
    }

    await db.query('BEGIN');

    const updateQuery = `
      UPDATE requests
      SET status = $1
      WHERE request_id = $2
      RETURNING *;
    `;
    const updateValues = [action === 'accept' ? 'accepted' : 'declined', requestId];
    await db.query(updateQuery, updateValues);

    // Bei Annahme einer SHARE_DECK-Anfrage, den Eintrag in die share-Tabelle hinzufügen
    if (action === 'accept' && request.request_type === 'SHARE_DECK') {
      const shareQuery = `
        INSERT INTO deck_shares (deck_id, shared_with_user_id, permission_level)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const shareValues = [request.additional_data.deckId, request.receiver_id, request.additional_data.permissionLevel];
      await db.query(shareQuery, shareValues);
    }


    await db.query('COMMIT');

  } catch (error) {
    console.log(error);
    await db.query('ROLLBACK'); 
    if (!error.customError) {
      throw new InternalServerError("Database error: cannot handle the request.");
    }
    throw error;
  }
};



module.exports = {
  addShareDeskRequest,
  getOpenRequestsForUser,
  getUsersEligibleForShareDeckRequest,
  getOpenRequestsForDeck,
  deleteRequest,
  handleRequestResponse
};
