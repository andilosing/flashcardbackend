const db = require("../db");
const { InternalServerError } = require('../errors/customErrors');

const getUserFromId = async (userId) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error checking if id exists:', error);
        throw new InternalServerError();
    }
};

const getUserFromEmail = async (email) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    } catch (error) {
        console.error('Error checking if email exists:', error);
        throw new InternalServerError();
    }
};

const getUserFromUsername = async (username) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0];
    } catch (error) {
        console.error('Error checking if username exists:', error);
        throw new InternalServerError();
    }
};

const updateLastLogin = async (userId) => {
    try {
        await db.query('UPDATE users SET last_login_at = NOW() WHERE user_id = $1', [userId]);
    } catch (error) {
        console.error('Error updating last login:', error);
        throw new InternalServerError();
    }
};

const getAllUsersExceptCurrent = async (currentUserId) => {
    try {
        const query = 'SELECT user_id, username FROM users WHERE user_id != $1';
        const values = [currentUserId];
        const result = await db.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error retrieving all users except current:', error);
        throw new InternalServerError();
    }
};




module.exports = {
    getUserFromId,
    getUserFromEmail,
    getUserFromUsername,
    updateLastLogin,
    getAllUsersExceptCurrent

}