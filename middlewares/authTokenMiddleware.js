const jwt = require('jsonwebtoken');
const tokensModel = require("../models/tokensModel")
const { NotFoundError } = require("../errors/customErrors")

const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers[`authorization`]
    const token = authHeader && authHeader.split(` `)[1]

    if (!token) {
        return res.status(401).json({ message: "Failed authorization" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
        const tokenRecord = await tokensModel.getToken(token, decoded.user_id);

        if(!tokenRecord){

        }
        
        req.userId = decoded.user_id;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(403).json({ message: "Invalid Token" });
        } else if (error instanceof NotFoundError) {
            // Spezifische Behandlung, wenn kein Token gefunden wurde
            return res.status(403).json({ message: "Token not found in Database" });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    authenticateJWT
}