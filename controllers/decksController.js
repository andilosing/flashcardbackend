const { BadRequestError } = require("../errors/customErrors");
const { handleErrors } = require("../errors/errorHandler");
const decksService = require("../services/decksService");

const getDecks = async (req, res) => {
  try {
    const user_id = req.userId;

    if (!user_id) {
      throw new BadRequestError("User ID field is required.");
    }

    const decks = await decksService.getDecksForUser(user_id);
    res.status(200).json({
      message: "Decks retrieved successfully",
      data: { decks },
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

const updateDeckStatus = async (req, res) => {
  try {
    const user_id = req.userId;
    const { deckId, isActive } = req.body;

    if (!user_id || !deckId) {
      throw new BadRequestError("User ID and Deck ID are required.");
    }

    if (typeof isActive !== 'boolean') {
      throw new BadRequestError("isActive must be a boolean value (true or false).");
    }

    const updatedDeckStatus = await decksService.updateDeckStatus(user_id, deckId, isActive);
    res.status(200).json({
      message: "Deck status updated successfully",
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

const createDeck = async (req, res) => {
  try {
    const userId = req.userId;
    const { deckName } = req.body;

    if (!userId || !deckName) {
      throw new BadRequestError("User ID and deck name are required.");
    }

    const newDeck = await decksService.createDeck(userId, deckName);
    res.status(201).json({
      message: "Deck created successfully",
      data: {deck: newDeck},
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

module.exports = {
  getDecks,
  updateDeckStatus,
  createDeck
};
