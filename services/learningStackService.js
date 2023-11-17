const { InternalServerError } = require("../errors/customErrors");
const learningStackModel = require("../models/learniningStackModel"); 
const cardsModel = require("../models/cardsModel")
const learningSessionsService = require("./learningSessionsService")

const MAX_CARDS = 10;


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
    const dueCards = await learningStackModel.getDueCardsForUser(user_id, MAX_CARDS);
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
    let dueCards = await learningStackModel.getDueCardsForUser(user_id, MAX_CARDS);

    if (dueCards.length < MAX_CARDS) {
      const cardsToAddCount = MAX_CARDS - dueCards.length;
      let availableCards = await cardsModel.getCardsNotInUserProgress(user_id);

      if (availableCards.length === 0) {
        
      } else {
        const cardsToAdd = availableCards.slice(0, cardsToAddCount);
        for (const card of cardsToAdd) {
          await learningStackModel.addCardToUserProgress(user_id, card.card_id, 1);
        }
        dueCards = await learningStackModel.getDueCardsForUser(user_id, MAX_CARDS);
      }
    }

    shuffleArray(dueCards);
    return dueCards;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("Error refilling and retrieving due cards");
    }
  }
};


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Tauschen von Elementen
  }
}


const getNextReviewDate = (status) => {
  const now = new Date();
  switch (status) {
    case 1:
      return now;
    case 2:
      now.setMinutes(now.getMinutes() + 30);
      return now;
    case 3:
      now.setMinutes(now.getHours() + 6);
      return now;
    case 4:
      now.setDate(now.getDate() + 1);
      return now;
    case 5:
      now.setDate(now.getDate() + 3);
      return now;
    case 6:
      now.setDate(now.getDate() + 7);
      return now;
    case 7:
      now.setDate(now.getDate() + 14);
      return now;
    case 8:
      now.setMonth(now.getMonth() + 1);
      return now;
    case 9:
      now.setMonth(now.getMonth() + 2);
      return now;
    case 10:
      now.setMonth(now.getMonth() + 3);
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
