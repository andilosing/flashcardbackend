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
  
  module.exports = {
    addCard
  };