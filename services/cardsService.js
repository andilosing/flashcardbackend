const cardsModel = require('../models/cardsModel'); 
const { InternalServerError } = require('../errors/customErrors');

const addCard = async (deck_id, front_content, back_content) => {
    try {

      const card = await cardsModel.addCard(deck_id, front_content, back_content);
      return card;
    } catch (error) {
      if (error.customError) {
        throw error;
      }
      throw new InternalServerError('Error adding card');
    }
  };

  const getCardsNotInUserProgress = async (user_id) => {
    try {
      const cards = await cardsModel.getCardsNotInUserProgress(user_id);
      return cards;
    } catch (error) {
      if (error.customError) {
        throw error;
      } else {
        throw new InternalServerError("Error retrieving cards not in user progress");
      }
    }
  };

  const getCardsForDeck = async (deckId) => {
    try {
      const cards = await cardsModel.getCardsForDeck(deckId);
      return cards;
    } catch (error) {
      if (error.customError) {
        throw error;
      } else {
        throw new InternalServerError("Error retrieving cards for deck");
      }
    }
  };

  

  module.exports = {
    addCard,
    getCardsNotInUserProgress,
    getCardsForDeck
  };
  