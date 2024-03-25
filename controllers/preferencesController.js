const preferencesService = require("../services/preferencesService");
const { BadRequestError } = require("../errors/customErrors");
const { handleErrors } = require("../errors/errorHandler");

const getPreferences = async (req, res) => {
  try {
    const userId = req.userId; 
    if (!userId) {
      throw new BadRequestError("User ID field is required.");
    }

    const preferences = await preferencesService.getAllPreferences(userId);

    res.status(200).json({
      message: "Preferences retrieved successfully",
      data: { preferences },
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};

const updatePreferences = async (req, res) => {
    try {
      const userId = req.userId; 
      const { front_cards_count, back_cards_count, average_learning_time_good, average_learning_time_bad, learning_streak_good, learning_streak_bad, fetch_all_due_mode } = req.body;
  
      if (!userId) {
        throw new BadRequestError("User ID field is required.");
      }
  
      const numericInputs = [front_cards_count, back_cards_count, average_learning_time_good, average_learning_time_bad, learning_streak_good,  learning_streak_bad];
      
      if (!numericInputs.every(num => typeof num === 'number' && num >= 0)) {
        throw new BadRequestError("All numeric fields must be non-negative numbers.");
      }
  
      if (average_learning_time_good <  average_learning_time_bad) {
        throw new BadRequestError("Average learning times should be in descending order: good > bad.");
      }
  
      if (learning_streak_good <  learning_streak_bad) {
        throw new BadRequestError("Learning streaks should be in descending order: good > mid > bad.");
      }
  
      const allowedFetchModes = ['never', 'always', 'firstTimeDaily'];
      if (!allowedFetchModes.includes(fetch_all_due_mode)) {
        throw new BadRequestError("Invalid fetch all due mode. Allowed values are: never, always, firstTimeDaily.");
      }
  
      const preferences = await preferencesService.updatePreferences(userId, {
        front_cards_count, back_cards_count, average_learning_time_good, average_learning_time_bad, learning_streak_good, learning_streak_bad, fetch_all_due_mode
      });
  
      res.status(200).json({
        message: "Preferences updated successfully",
        data: {preferences}
      });
    } catch (error) {
      console.log(error);
      handleErrors(error, res);
    }
  };
  

const resetPreferences = async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new BadRequestError("User ID field is required.");
      }
  
      const defaultPreferences = await preferencesService.resetPreferences(userId);
  
      res.status(200).json({
        message: "Preferences reset successfully",
        data: { preferences: defaultPreferences },
      });
    } catch (error) {
      console.log(error);
      handleErrors(error, res);
    }
  };

module.exports = {
  getPreferences,
  updatePreferences,
  resetPreferences
};
