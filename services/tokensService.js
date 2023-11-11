const jwt = require('jsonwebtoken');
const tokensModel = require("../models/tokensModel")
const { UnauthorizedError, InternalServerError } = require('../errors/customErrors');
require("dotenv").config();

const generateToken = (user) => {
    try {
        const payload = {
            user_id: user.user_id,
            username: user.username,
        }
        const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET, { expiresIn: '10d' });  
        return token;
    } catch (error) {
        console.error("Fehler beim Generieren des Tokens:", error);
        throw new Error("Fehler beim Generieren des Tokens");
    }
}

const verifyToken = async (token) => {
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
        const userId = decodedToken.userId
        const tokenFromDb = await tokensModel.getToken(token, userId)
        return decodedToken;
    } catch (error) {
        throw new UnauthorizedError("Ungültiger oder abgelaufener Token");
    }
}

module.exports = {
    generateToken,
    verifyToken,
}