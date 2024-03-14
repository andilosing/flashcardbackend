const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../models/usersModel");
const tokensModel = require("../models/tokensModel");
const tokenService = require("./tokensService");
const learningSessionsService = require("./learningSessionsService");
const {
  ValidationError,
  InternalServerError,
} = require("../errors/customErrors");

const login = async (username, password) => {
  try {
    const user = await userModel.getUserFromUsername(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new ValidationError("Username or password invalid.");
    }

    await userModel.updateLastLogin(user.user_id);

    const token = tokenService.generateToken(user);
    const savedToken = await tokensModel.saveToken(user.user_id, token);

    const learningTimeData =
    await learningSessionsService.calculateAverageLearningTime(user.user_id);

  const learnignStreakInDays =
    await learningSessionsService.calculateLearningStreak(user.user_id);

    return {
      user: {
        user_id: user.user_id,
        username: user.username,
        averageLearningTimePerDayMin:
        learningTimeData.averageLearningTimePerDayMin,
        learnignStreakInDays: learnignStreakInDays,
      },
      token: savedToken.token,
      expires_at: savedToken.expires_at,
    };
  } catch (error) {
    console.log(error);
    throw new InternalServerError("Error during login");
  }
};

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

    return users;
  } catch (error) {
    console.error("Error retrieving users:", error);
    throw new InternalServerError("Error retrieving other users.");
  }
};

const getLoggedInUser = async (userId) => {
  try {
    const user = await userModel.getUserFromId(userId);

    if (!user) {
      throw new ValidationError("No other users found.");
    }

    const learningTimeData =
      await learningSessionsService.calculateAverageLearningTime(userId);

    const learnignStreakInDays =
      await learningSessionsService.calculateLearningStreak(userId);

      

    return {
      user_id: user.user_id,
      username: user.username,
      averageLearningTimePerDayMin:
        learningTimeData.averageLearningTimePerDayMin,
      learnignStreakInDays: learnignStreakInDays,
    };
  } catch (error) {
    console.error("Error retrieving users:", error);
    throw new InternalServerError("Error retrieving other users.");
  }
};

module.exports = {
  login,
  logout,
  getAllUsersExceptCurrent,
  getLoggedInUser,
};
