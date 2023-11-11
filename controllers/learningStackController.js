const { BadRequestError } = require("../errors/customErrors");
const { handleErrors } = require("../errors/errorHandler");
const learningStackService = require("../services/learningStackService");


const getDueCards = async (req, res) => {
  try {
    const user_id = req.userId

    if (!user_id) {
      throw new BadRequestError("User ID field is required.");
    }

    const dueCards = await learningStackService.refillAndRetrieveDueCards(user_id);
    res.status(200).json({
      message: "Due cards retrieved successfully",
      data: { learningStack: dueCards },
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

const updateCard = async (req, res) => {
  try {
    const { progress_id, status, difficulty } = req.body;

    // Validierung, ob alle erforderlichen Felder vorhanden sind
    if (!progress_id || !difficulty) {
      throw new BadRequestError("All required fields must be provided");
    }

    const cardId = await learningStackService.updateCard(
      progress_id,
      status,
      difficulty
    );
    
    res.status(200).json({
      message: "User progress updated successfully",
      data: { cardId },
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

module.exports = {
  getDueCards,
  updateCard
};
