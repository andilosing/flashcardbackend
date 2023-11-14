const { InternalServerError } = require("../errors/customErrors");
const decksModel = require("../models/decksModel");

const getDecksForUser = async (user_id) => {
  try {
    const decks = await decksModel.getDecksByUserId(user_id);

    const decksWithPercentages = decks.map((deck) => {
      const {
        good_status_count,
        mid_status_count,
        bad_status_count,
        learning_stack_count,
        total_card_count,
      } = deck;

      const percentages = calculatePercentages(
        good_status_count,
        mid_status_count,
        bad_status_count,
        total_card_count
      );

      // Berechnen des Prozentsatzes für den learning stack count
      const learningStackPercentage =
        total_card_count > 0
          ? Math.round((learning_stack_count / total_card_count) * 100)
          : 0;

      return {
        ...deck,
        goodPercentage: percentages.good,
        midPercentage: percentages.mid,
        badPercentage: percentages.bad,
        learningStackPercentage,
      };
    });

    return decksWithPercentages;
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("Error retrieving decks for user");
    }
  }
};

function calculatePercentages(goodCount, midCount, badCount, totalCount) {
  if (totalCount === 0) return { good: 0, mid: 0, bad: 0 };

  // Berechnen der Prozentsätze
  let goodPercentage = (goodCount / totalCount) * 100;
  let midPercentage = (midCount / totalCount) * 100;
  let badPercentage = (badCount / totalCount) * 100;

  // Runden auf die nächste ganze Zahl
  goodPercentage = Math.round(goodPercentage);
  midPercentage = Math.round(midPercentage);
  badPercentage = Math.round(badPercentage);

  return { good: goodPercentage, mid: midPercentage, bad: badPercentage };
}

module.exports = {
  getDecksForUser,
};
