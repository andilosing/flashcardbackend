const { BadRequestError } = require("../errors/customErrors");
const authService = require("../services/authService");
const { handleErrors } = require("../errors/errorHandler");

const getAllUsersExceptCurrent = async (req, res) => {
    try {
        const currentUserId = req.userId; 
  
        if (!currentUserId) {
            throw new BadRequestError("User ID is required.");
        }
  
        const users = await authService.getAllUsersExceptCurrent(currentUserId);
  
        res.status(200).json({
            message: "Users retrieved successfully",
            data: {users}
        });
    } catch (error) {
        console.log(error);
        handleErrors(error, res);
    }
  };

  module.exports = {
    getAllUsersExceptCurrent
  };