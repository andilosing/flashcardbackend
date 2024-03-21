const { InternalServerError } = require("../errors/customErrors");
const learningStackModel = require("../models/learniningStackModel");
const cardsModel = require("../models/cardsModel");
const learningSessionsService = require("./learningSessionsService");

const MAX_CARDS = 10;

const addCardToLearningStack = async (user_id, card_id, initial_status) => {
  try {
    const progress = await learningStackModel.addCardToLearningStack(
      user_id,
      card_id,
      initial_status
    );
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
    const dueCards = await learningStackModel.getDueCardsForUser(
      user_id,
      MAX_CARDS
    );
    return dueCards;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("error retrieving due cards");
    }
  }
};

const updateCard = async (user_id, progress_id, currentStatus, difficulty) => {
  try {
    const newStatus = calculateNewStatus(currentStatus, difficulty);

    const nextReviewDate = getNextReviewDate(newStatus);

    const updatedCardId = await learningStackModel.updateCard(
      progress_id,
      newStatus,
      nextReviewDate
    );

    await learningSessionsService.manageLearningSession(user_id);

    return updatedCardId;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("error updating user progress");
    }
  }
};

// const refillAndRetrieveDueCards = async (user_id, frontCardsCount, backCardsCount) => {
//   try {
//     let maxCards = frontCardsCount + backCardsCount
//     // Hol zunächst fällige Karten mit review_count über 0
//     let dueCards = await learningStackModel.getDueCardsForUser(
//       user_id,
//       maxCards,
//       "nonZero"
//     );

//     // Liste für zusätzliche Karten mit review_count von 0
//     let zeroReviewCountCards = [];

//     // Wenn die maximale Anzahl von Karten nicht erreicht ist, versuche, Karten mit review_count von 0 zu holen
//     if (dueCards.length < maxCards) {
//       const additionalCardsNeeded = maxCards - dueCards.length;
//       zeroReviewCountCards = await learningStackModel.getDueCardsForUser(
//         user_id,
//         additionalCardsNeeded,
//         "zero"
//       );
//     }

//     // Überprüfe, ob nach dem Hinzufügen von Karten mit review_count von 0 die maximale Anzahl erreicht wird
//     if (dueCards.length + zeroReviewCountCards.length < maxCards) {
//       const shortfall =
//       maxCards - (dueCards.length + zeroReviewCountCards.length);
//       let availableCards = await cardsModel.getCardsNotInUserProgress(
//         user_id,
//         shortfall
//       );

//       // Füge Karten zum Benutzerfortschritt hinzu, um die Lücke zu schließen
//       for (const card of availableCards) {
//         await learningStackModel.addCardToUserProgress(
//           user_id,
//           card.card_id,
//           1
//         );
//       }

//       zeroReviewCountCards = await learningStackModel.getDueCardsForUser(
//         user_id,
//         shortfall,
//         "zero"
//       );
//     }

//     dueCards = dueCards.concat(zeroReviewCountCards);

//     // Vertausche Front und Rückseite für die spezifizierte Anzahl von Kartenrückseiten
//     swapFrontAndBack(dueCards, frontCardsCount, backCardsCount);


//     // Mische die Liste der fälligen Karten vor der Rückgabe
//     shuffleArray(dueCards);
//     return dueCards;
//   } catch (error) {
//     if (error.customError) {
//       throw error;
//     } else {
//       throw new InternalServerError("Error refilling and retrieving due cards");
//     }
//   }
// };

const refillAndRetrieveDueCards = async (user_id, frontCardsCount, backCardsCount, fetchAllDue = false) => {
  try {
    let dueCards = [];

    if (fetchAllDue) {
      // Hol alle fälligen Karten mit review_count über 0
      dueCards = await learningStackModel.getDueCardsForUser(
        user_id,
        null, 
        "nonZero"
      );

      // Berechne das Verhältnis, falls die Werte vorhanden sind, sonst default 100:0
      const totalCards = dueCards.length;
      let ratioFront = frontCardsCount / (frontCardsCount + backCardsCount);
      let ratioBack = backCardsCount / (frontCardsCount + backCardsCount);

      // Verhindere NaN, wenn beide Counts 0 sind
      if (isNaN(ratioFront) || isNaN(ratioBack)) {
        ratioFront = 1;
        ratioBack = 0;
      }

      // Berechne die neue Anzahl basierend auf dem Verhältnis
      const newFrontCount = Math.round(totalCards * ratioFront);
      const newBackCount = totalCards - newFrontCount; // Der Rest ist für Back-Karten

      // Vertausche Front und Rückseite basierend auf dem neuen Verhältnis
      swapFrontAndBack(dueCards, newFrontCount, newBackCount);
    } else {
      let maxCards = frontCardsCount + backCardsCount;
      // Hol zunächst fällige Karten mit review_count über 0
      dueCards = await learningStackModel.getDueCardsForUser(
        user_id,
        maxCards,
        "nonZero"
      );

      // Liste für zusätzliche Karten mit review_count von 0
      let zeroReviewCountCards = [];

      // Wenn die maximale Anzahl von Karten nicht erreicht ist, versuche, Karten mit review_count von 0 zu holen
      if (dueCards.length < maxCards) {
        const additionalCardsNeeded = maxCards - dueCards.length;
        zeroReviewCountCards = await learningStackModel.getDueCardsForUser(
          user_id,
          additionalCardsNeeded,
          "zero"
        );
      }

      // Überprüfe, ob nach dem Hinzufügen von Karten mit review_count von 0 die maximale Anzahl erreicht wird
      if (dueCards.length + zeroReviewCountCards.length < maxCards) {
        const shortfall = maxCards - (dueCards.length + zeroReviewCountCards.length);
        let availableCards = await cardsModel.getCardsNotInUserProgress(user_id, shortfall);

        // Füge Karten zum Benutzerfortschritt hinzu, um die Lücke zu schließen
        for (const card of availableCards) {
          await learningStackModel.addCardToUserProgress(user_id, card.card_id, 1);
        }

        zeroReviewCountCards = await learningStackModel.getDueCardsForUser(user_id, shortfall, "zero");
      }

      dueCards = dueCards.concat(zeroReviewCountCards);

      // Vertausche Front und Rückseite für die spezifizierte Anzahl von Kartenrückseiten
      swapFrontAndBack(dueCards, frontCardsCount, backCardsCount);
    }

    // Mische die Liste der fälligen Karten vor der Rückgabe
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


function swapFrontAndBack(cards, frontCardsCount, backCardsCount) {
 
  let startIndex = frontCardsCount;
  let endIndex = startIndex + backCardsCount;

  for (let i = startIndex; i < endIndex; i++) {
    if (i < cards.length) { 
      [cards[i].front_content, cards[i].back_content] = [cards[i].back_content, cards[i].front_content];
    }
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
      now.setHours(now.getHours() + 6);
      return now;
    case 4:
      now.setHours(now.getHours() + 12);
      return now;
    case 5:
      now.setDate(now.getDate() + 1);
      return now;
    case 6:
      now.setDate(now.getDate() + 2);
      return now;
    case 7:
      now.setDate(now.getDate() + 3);
      return now;
    case 8:
      now.setDate(now.getDate() + 5);
      return now;
    case 9:
      now.setDate(now.getDate() + 7);
      return now;
    case 10:
      now.setDate(now.getDate() + 9);
      return now;
    case 11:
      now.setDate(now.getDate() + 12);
      return now;
    case 12:
      now.setDate(now.getDate() + 15);
      return now;
    case 13:
      now.setDate(now.getDate() + 19);
      return now;
    case 14:
      now.setDate(now.getDate() + 23);
      return now;
    case 15:
      now.setDate(now.getDate() + 27);
      return now;
    case 16:
      now.setMonth(now.getMonth() + 1);
      return now;
    case 17:
      now.setMonth(now.getMonth() + 1);
      now.setDate(now.getDate() + 15);
      return now;
    case 18:
      now.setMonth(now.getMonth() + 2);
      return now;
    case 19:
      now.setMonth(now.getMonth() + 2);
      now.setDate(now.getDate() + 15);
      return now;
    case 20:
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

  return Math.min(Math.max(newStatus, 1), 20);
};

const setActiveStatusForCards = async (user_id, card_ids, is_active) => {
  try {
    for (const card_id of card_ids) {
      const existingEntry = await learningStackModel.checkCardInLearningStack(
        user_id,
        card_id
      );

      if (existingEntry) {
        await learningStackModel.updateCardActiveStatus(
          user_id,
          card_id,
          is_active
        );
      } else {
        await learningStackModel.addCardToLearningStackWithStatus(
          user_id,
          card_id,
          is_active
        );
      }
    }
  } catch (error) {
    console.log(error);
    throw new InternalServerError("Error updating active status for cards");
  }
};

module.exports = {
  addCardToLearningStack,
  getDueCards,
  updateCard,
  refillAndRetrieveDueCards,
  setActiveStatusForCards,
};
