const notificationsModel = require('../models/notificationsModel');
const learingSessionsModel = require("../models/learningSessionsModel")
const { InternalServerError } = require('../errors/customErrors');

const getNotificationsForUser = async (userId) => {
  try {
    let lastViewedAt = await notificationsModel.getLastViewedAt(userId);

    if (!lastViewedAt) {
      await notificationsModel.createInitialUserNotificationCheck(userId);
      lastViewedAt = new Date(0); 
    }

    const sessionsFromUsers = await learingSessionsModel.getLearnedCardsAndTimeSinceDate(userId, lastViewedAt);

    await notificationsModel.updateLastLoadedAt(userId);

    return sessionsFromUsers;
  } catch (error) {
    console.log(error)
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("Error retrieving notifications for user");
    }
  }
};

const updateLastViewedAtForUser = async (userId) => {
    try {
      await notificationsModel.updateLastViewedAt(userId);
    } catch (error) {
      if (error.customError) {
        throw error;
      } else {
        throw new InternalServerError("Error updating last viewed time for user");
      }
    }
  };
  
  module.exports = {
    getNotificationsForUser,
    updateLastViewedAtForUser
  };
  
