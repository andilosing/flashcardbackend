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
    const user_id = req.userId;

    if (!user_id) {
      throw new BadRequestError("User ID field is required.");
    }

    if (!deckId) {
      throw new BadRequestError("Deck ID is required.");
    }

    const cards = await cardsService.getCardsForDeck(deckId, user_id);

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

const deleteCards = async (req, res) => {
  try {
    const { deck_id, card_ids } = req.body;
    const userId = req.userId; 

    if (!deck_id || !card_ids || card_ids.length === 0) {
      throw new BadRequestError("Deck ID and card IDs must be provided");
    }

    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const cardIdsArray = `{${card_ids.join(",")}}`;

    await cardsService.deleteCards(deck_id, cardIdsArray, userId);

    res.status(200).json({
      message: "Cards deleted successfully"
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};
  
  module.exports = {
    addCard,
    getCardsForDeck,
    updateCard,
    deleteCards
  };