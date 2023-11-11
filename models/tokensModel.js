const db = require("../db")
const usersModel = require("./usersModel")
const { InternalServerError, NotFoundError } = require('../errors/customErrors');



const saveToken = async (userId, token) => {
    try {
        await usersModel.getUserFromId(userId);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 9); // Datum auf 9 Tage in der Zukunft setzen
        expiresAt.setHours(23, 59, 0, 0); // Uhrzeit auf 23:59:00.000 setzen

        const query = `
            INSERT INTO tokens (user_id, token, expires_at)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [userId, token, expiresAt];
        const result = await db.query(query, values);

        if (!result.rows || result.rows.length === 0) {
            throw new InternalServerError('Keine ID zurückgegeben beim Speichern des Tokens.');
        }

        return result.rows[0]
    } catch (error) {
        console.log(error)
        if (!error.customError) {
            throw new InternalServerError('Fehler beim Speichern des Tokens in der Datenbank.');
        }
        throw error;
    }
}

const deleteToken = async (token) => {
    try {
        const query = 'DELETE FROM tokens WHERE token = $1';
        const result = await db.query(query, [token]);
        if (result.rowCount === 0) {
            throw new NotFoundError("No token found to delete.");
        }
    } catch (error) {
        if (!error.customError) {
            throw new InternalServerError("Database error while deleting token.");
        }
        throw error;
    }
};

const getToken = async (token, userId) => {
    try {
        const result = await db.query('SELECT * FROM tokens WHERE token = $1 AND user_id = $2', [token, userId]);
        if (result.rows.length === 0) {
            throw new NotFoundError("No matching token!");
        }
        return result.rows[0];
    } catch (error) {
        if (!error.customError) {
            throw new InternalServerError('Database error while searching for token.');
        }
        throw error;
    }
};

module.exports = {
    saveToken,
    deleteToken,
    getToken
}

