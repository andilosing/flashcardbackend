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

  const calculateAverageLearningTime = async (user_id) => {
    try {
      const firstLearningDateResult = await learningSessionsModel.getFirstLearningDateForUser(user_id);
  
      if (!firstLearningDateResult.first_learning_date) {
        return {
          message: "No learning session available",
          averageLearningTimePerDayMin: 0 
        };
      }
  
      const totalLearningTimeResult = await learningSessionsModel.getTotalLearningTimeSinceDate(user_id, firstLearningDateResult.first_learning_date);
      const totalLearningTimeMinutes = totalLearningTimeResult.total_learning_time_minutes || 0;
  
      const today = new Date() ;
       //weil datum falsch aus db tabelle geholt wird um 1 tag
      today.setDate(today.getDate() - 1);

      const firstLearningDate = new Date(firstLearningDateResult.first_learning_date);
      const daysSinceFirstLearningDay = Math.ceil((today - firstLearningDate) / (1000 * 60 * 60 * 24));
  
      const averageLearningTimePerDayMin = daysSinceFirstLearningDay > 0 ? totalLearningTimeMinutes / daysSinceFirstLearningDay : 0;
  
      return {
        averageLearningTimePerDayMin: Math.floor(averageLearningTimePerDayMin) 
      };
    } catch (error) {
      if (error.customError) {
        throw error;
      } else {
        throw new InternalServerError("Error calculating average learning time");
      }
    }
  };

  const calculateLearningStreak = async (user_id) => {
    try {
      const learningDays = await learningSessionsModel.getConsecutiveLearningDays(user_id);
      if (learningDays.length === 0) {
        return 0; 
      }
  
      let streak = 0;
      const today = new Date();
      //weil datum falsch aus db tabelle geholt wird um 1 tag
      today.setDate(today.getDate() - 1);
      today.setHours(0, 0, 0, 0);
  
      let lastDay = new Date(learningDays[0].session_date);
      lastDay.setHours(0, 0, 0, 0);
  
      const diffInDaysToToday = (today - lastDay) / (1000 * 60 * 60 * 24);
  
      if (diffInDaysToToday < 2) {
        streak = 1;
      }
  
      for (let i = 1; i < learningDays.length; i++) {
        const currentDay = new Date(learningDays[i].session_date);
        currentDay.setHours(0, 0, 0, 0); 
        const diffInDays = (lastDay - currentDay) / (1000 * 60 * 60 * 24);
  
        if (diffInDays === 1) {
          streak++;
        } else {
          break; 
        }
        lastDay = currentDay; 
      }
      return streak;
    } catch (error) {
      console.log(error);
      throw new InternalServerError("Error calculating learning streak.");
    }
  };
  
  
  

  module.exports = {
    manageLearningSession,
    getAllLearningSessions,
    calculateAverageLearningTime,
    calculateLearningStreak
  }