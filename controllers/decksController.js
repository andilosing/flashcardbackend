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

module.exports = {
  getDecks,
};
