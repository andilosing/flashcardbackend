const { InternalServerError } = require("../errors/customErrors");
const learningSessionsModel = require("../models/learningSessionsModel"); 

const SESSION_THRESHOLD = 2 * 60 * 1000;

 const manageLearningSession = async (user_id) => {
    try {
    const lastSession = await learningSessionsModel.getLastLearningSessionForUser(user_id);
    const currentTime = new Date();
  
    if (!lastSession || currentTime - new Date(lastSession.end_learning_at) > SESSION_THRESHOLD) {
      await learningSessionsModel.startLearningSession(user_id);
    } else {
      await learningSessionsModel.updateLearningSession(lastSession.session_id);
    }
}
    catch(error){
        if (error.customError) {
            throw error;
          } else {
            throw new InternalServerError("error managing sessions");
          }

    }
  };

  const getAllLearningSessions = async (user_id) => {
    try {
      const sessions = await learningSessionsModel.getAllLearningSessionsForUser(user_id);
      return sessions; // Gibt eine Liste aller Lernsessions für den gegebenen Benutzer zurück
    } catch (error) {
        console.log(error)
      if (error.customError) {
        throw error;
      } else {
        throw new InternalServerError("error retrieving all learning sessions");
      }
    }
  };

  module.exports = {
    manageLearningSession,
    getAllLearningSessions
  }