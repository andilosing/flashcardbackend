const preferencesModel = require('../models/preferencesModel'); 
const { InternalServerError } = require('../errors/customErrors');

const getAllPreferences = async (userId) => {
  try {
    const preferences = await preferencesModel.getAllPreferences(userId);
    return preferences;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("Error retrieving user preferences");
    }
  }
};

const updatePreferences = async (userId, preferences) => {
  try {
    const updatedPreferences = await preferencesModel.updatePreferences(userId, preferences);
    return updatedPreferences;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("Error updating user preferences");
    }
  }
};

const resetPreferences = async (userId) => {
    try {
      return await preferencesModel.resetPreferences(userId);
    } catch (error) {
      console.error("Error resetting preferences in Service:", error);
      throw new Error("Internal Server Error");
    }
  };

module.exports = {
  getAllPreferences,
  updatePreferences,
  resetPreferences
};
