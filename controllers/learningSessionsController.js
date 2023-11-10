const { BadRequestError } = require("../errors/customErrors");
const { handleErrors } = require("../errors/errorHandler");
const learningSessionsService = require("../services/learningSessionsService");

const getAllLearningSessions = async (req, res) => {
    try {
      const user_id = 1//req.params.user_id;
   
      if (!user_id) {
        throw new BadRequestError("User ID field is required.");
      }
  
      const sessions = await learningSessionsService.getAllLearningSessions(user_id);
      res.status(200).json({
        message: "Sessions erfolgreich gesendet",
        data: { sessions },
      });
    } catch (error) {
      handleErrors(error, res);
    }
  };

  module.exports = {
    getAllLearningSessions
  };