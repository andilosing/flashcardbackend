const { InternalServerError } = require("../errors/customErrors");
const learningStackModel = require("../models/learniningStackModel"); 
const cardsModel = require("../models/cardsModel")
const learningSessionsService = require("./learningSessionsService")

const MAX_CARDS = 50;


const addCardToLearningStack = async (user_id, card_id, initial_status) => {
  try {
    const progress = await learningStackModel.addCardToLearningStack(user_id, card_id, initial_status);
    return progress;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("error adding user progress");
    }
  }
};


const getDueCards = async (user_id) => {
  try {
    const dueCards = await learningStackModel.getDueCardsForUser(user_id);
    return dueCards;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("error retrieving due cards");
    }
  }
};


const updateCard = async (progress_id, currentStatus, difficulty) => {
  try {
    const newStatus = calculateNewStatus(currentStatus, difficulty);

    const nextReviewDate = getNextReviewDate(newStatus);

    const updatedCardId = await learningStackModel.updateCard(
      progress_id, newStatus, nextReviewDate);

    await learningSessionsService.manageLearningSession(1)

    return updatedCardId;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("error updating user progress");
    }
  }
};

const refillAndRetrieveDueCards = async (user_id) => {
  try {
    let dueCards = await learningStackModel.getDueCardsForUser(user_id);

    if (dueCards.length < MAX_CARDS) {
      const cardsToAddCount = MAX_CARDS - dueCards.length;

      const availableCards = await cardsModel.getCardsNotInUserProgress(user_id);
      
      const cardsToAdd = availableCards.slice(0, cardsToAddCount);

      for (const card of cardsToAdd) {
        await learningStackModel.addCardToUserProgress(user_id, card.card_id, 1);
      }

      dueCards = await learningStackModel.getDueCardsForUser(user_id);
    }

    return dueCards;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("Error refilling and retrieving due cards");
    }
  }
};


const getNextReviewDate = (status) => {
  const now = new Date();
  switch (status) {
    case 1:
      return now;
    case 2:
      now.setMinutes(now.getMinutes() + 5);
      return now;
    case 3:
      now.setMinutes(now.getMinutes() + 30);
      return now;
    case 4:
      now.setHours(now.getHours() + 1);
      return now;
    case 5:
      now.setHours(now.getHours() + 5);
      return now;
    case 6:
      now.setDate(now.getDate() + 1);
      return now;
    case 7:
      now.setDate(now.getDate() + 3);
      return now;
    case 8:
      now.setDate(now.getDate() + 7);
      return now;
    case 9:
      now.setMonth(now.getDate() + 21);
      return now;
    case 10:
      now.setMonth(now.getMonth() + 2);
      return now;
    default:
      return now;
  }
};

const calculateNewStatus = (currentStatus, difficulty) => {
  let newStatus = currentStatus;

  switch (difficulty) {
    case 1:
      newStatus += 3;
      break;
    case 2:
      newStatus += 1;
      break;
    case 3:
      newStatus = Math.max(newStatus - 1, 1);
      break;
    case 4:
      newStatus = 1;
      break;
    default:
      break;
  }

  return Math.min(Math.max(newStatus, 1), 10);
};




module.exports = {
  addCardToLearningStack,
  getDueCards,
  updateCard,
  refillAndRetrieveDueCards
};
