const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const userModel = require('../models/usersModel')
const tokensModel = require("../models/tokensModel")
const tokenService = require("./tokensService")
const { ValidationError, InternalServerError } = require('../errors/customErrors');

const login = async (username, password) => {
    try {
        const user = await userModel.getUserFromUsername(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        throw new ValidationError("Username or password invalid.");
    }

    await userModel.updateLastLogin(user.user_id);

    const token = tokenService.generateToken(user);
    const savedToken = await tokensModel.saveToken(user.user_id, token);

    return {
        user: { user_id: user.user_id, username: user.username},
        token: savedToken.token,
        expires_at: savedToken.expires_at
    };
    } catch (error) {
        console.log(error)
        throw new InternalServerError("Error during login");
    }
    
}

const logout = async (token) => {
    try {
        await tokensModel.deleteToken(token);
    } catch (error) {
        throw new InternalServerError("Error during logout");
    }
};

const getAllUsersExceptCurrent = async (currentUserId) => {
    try {
        const users = await userModel.getAllUsersExceptCurrent(currentUserId);
  
        if (!users) {
            throw new ValidationError("No other users found.");
        }
  
        return users;
    } catch (error) {
        console.error('Error retrieving users:', error);
        throw new InternalServerError("Error retrieving other users.");
    }
  }
  

module.exports = {
    login,
    logout,
    getAllUsersExceptCurrent
};