const { BadRequestError } = require("../errors/customErrors");
const { handleErrors } = require("../errors/errorHandler");
const requestsService = require("../services/requestsService");

const addShareDeskRequest = async (req, res) => {
  try {
    const {
      requestType,
      receiverId,
      deckId: deckIdRaw,
      permissionLevel,
    } = req.body;
    const senderId = req.userId;



    if (!senderId) {
      throw new BadRequestError("User ID is required.");
    }
    if (!receiverId) {
      throw new BadRequestError("Receiver ID is required.");
    }

    if (requestType !== "SHARE_DECK") {
      throw new BadRequestError("Invalid request type.");
    }

    // Konvertiert deckId in eine Zahl und überprüft, ob sie gültig ist
    const deckId = parseInt(deckIdRaw, 10);
    if (isNaN(deckId)) {
      throw new BadRequestError("Deck ID must be a valid number.");
    }

    if (!["write", "read"].includes(permissionLevel)) {
      throw new BadRequestError(
        "Permission level must be either write or read for SHARE_DECK request type."
      );
    }

    const additionalData = { deckId, permissionLevel };
    const request = await requestsService.addShareDeskRequest(
      requestType,
      senderId,
      receiverId,
      additionalData
    );

    res.status(201).json({
      message: "Request added successfully",
      data: { request },
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};

const getOpenRequestsForUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError("User ID is required.");
    }

    const requests = await requestsService.getOpenRequestsForUser(userId);

    res.status(200).json({
      message: "Open requests retrieved successfully",
      data: { requests: requests },
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};

const getUsersEligibleForShareDeck = async (req, res) => {
  try {
    const senderId = req.userId;
    const deckId = req.params.deckId;

    if (!senderId) {
      throw new BadRequestError("User ID is required.");
    }

    if (!deckId) {
      throw new BadRequestError("Deck ID is required.");
    }

    const eligibleUsers =
      await requestsService.getUsersEligibleForShareDeckRequest(
        senderId,
        deckId
      );

    res.status(200).json({
      message: "Eligible users for deck sharing retrieved successfully",
      data: { users: eligibleUsers },
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};

const deleteRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError("User ID is required.");
    }

    if (!requestId) {
      throw new BadRequestError("Request ID is required.");
    }

    await requestsService.deleteRequest(requestId, userId);

    res.status(200).json({
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};

const handleRequestResponse = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.userId;
    const { action } = req.body;

    if (!userId || !requestId) {
      throw new BadRequestError("User ID and Request ID are required.");
    }

    if (!["accept", "decline"].includes(action)) {
      throw new BadRequestError(
        "Invalid action. Must be either 'accept' or 'decline'."
      );
    }

    await requestsService.handleRequestResponse(requestId, userId, action);

    res.status(200).json({
      message: `Request ${
        action === "accept" ? "accepted" : "declined"
      } successfully`,
    });
  } catch (error) {
    console.log(error);
    handleErrors(error, res);
  }
};

module.exports = {
  addShareDeskRequest,
  getOpenRequestsForUser,
  getUsersEligibleForShareDeck,
  deleteRequest,
  handleRequestResponse,
};
