const { InternalServerError } = require("../errors/customErrors");
const decksModel = require("../models/decksModel");

const getDecksForUser = async (user_id) => {
  try {
    const decks = await decksModel.getDecksByUserId(user_id);
    return decks; 
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("Error retrieving decks for user");
    }
  }
};

module.exports = {
  getDecksForUser,
};
