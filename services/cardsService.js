const cardsModel = require('../models/cardsModel'); 
const { InternalServerError } = require('../errors/customErrors');
const decksModel = require("../models/decksModel")

const addCard = async (user_id, deck_id, front_content, back_content) => {
    try {

      const card = await cardsModel.addCard(user_id, deck_id, front_content, back_content);
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

  const getCardsForDeck = async (deckId, userId) => {
    try {
      const cards = await cardsModel.getCardsForDeck(deckId, userId);
      const permissions = await decksModel.getDeckPermissions(deckId, userId);
      return {
        cards: cards,
        permissions: permissions
      };
    } catch (error) {
      if (error.customError) {
        throw error;
      } else {
        throw new InternalServerError("Error retrieving cards for deck");
      }
    }
  };

  const updateCard = async (user_id, card_id, front_content, back_content) => {
    try {
      const updatedCard = await cardsModel.updateCard(user_id, card_id, front_content, back_content);
      return updatedCard;
    } catch (error) {
      if (error.customError) {
        throw error;
      } else {
        throw new InternalServerError("Error updating card");
      }
    }
};

const deleteCards = async (deckId, cardIds, userId) => {
  try {
    deletedCards = await cardsModel.deleteCards(deckId, cardIds, userId);
  } catch (error) {
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError("Error deleting cards");
    }
  }
};



  

  module.exports = {
    addCard,
    getCardsNotInUserProgress,
    getCardsForDeck,
    updateCard,
    deleteCards
  };
  