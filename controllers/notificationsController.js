const notificationsService = require("../services/notificationsService");
const { BadRequestError } = require("../errors/customErrors");
const { handleErrors } = require("../errors/errorHandler");

const getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError("User ID field is required.");
    }

    const notifications = await notificationsService.getNotificationsForUser(userId);

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: { notifications },
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};

const updateLastViewedAtForUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError("User ID field is required.");
    }

    await notificationsService.updateLastViewedAtForUser(userId);

    res.status(200).json({
      message: "Last viewed at updated successfully",
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};

module.exports = {
  getNotificationsForUser,
  updateLastViewedAtForUser,
};
