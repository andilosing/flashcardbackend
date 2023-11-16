const { BadRequestError } = require("../errors/customErrors");
const { handleErrors } = require("../errors/errorHandler");
const cardsService = require("../services/cardsService");

const addCard = async (req, res) => {
    try {
      
      const { deck_id, front_content, back_content } = req.body;
  
      if (!deck_id || !front_content || !back_content) {
        throw new BadRequestError("All required fields must be provided");
      }
  
      const card = await cardsService.addCard(deck_id, front_content, back_content);
  
      res.status(201).json({
        message: "Card added successfully",
        data: { card: card },
      });
    } catch (error) {
      console.log(error);
      handleErrors(error, res);
    }
  };

const getCardsForDeck = async (req, res) => {
  try {
    const deckId = req.params.deckId; 

    if (!deckId) {
      throw new BadRequestError("Deck ID is required.");
    }

    const cards = await cardsService.getCardsForDeck(deckId);

    res.status(200).json({
      message: "Cards retrieved successfully",
      data: { cards },
    });
  } catch (error) {
    console.log(error);
      handleErrors(error, res);
  }
};

const updateCard = async (req, res) => {
  try {
    const { card_id, front_content, back_content } = req.body;

    if (!card_id || !front_content || !back_content) {
      throw new BadRequestError("Card ID, front content, and back content must be provided");
    }

    const updatedCard = await cardsService.updateCard(card_id, front_content, back_content);

    res.status(200).json({
      message: "Card updated successfully",
      data: { card: updatedCard },
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};
  
  module.exports = {
    addCard,
    getCardsForDeck,
    updateCard
  };