const requestsModel = require('../models/requestsModel');
const { InternalServerError } = require('../errors/customErrors');

const addShareDeskRequest = async (requestType, senderId, receiverId, additionalData) => {
    try {
        const request = await requestsModel.addShareDeskRequest(requestType, senderId, receiverId, additionalData);
        return request;
    } catch (error) {
        console.log("Error in addRequest service method:", error);
        if (error.customError) {
            throw error;
        }
        throw new InternalServerError('Error adding request');
    }
};

const getOpenRequestsForUser = async (userId) => {
    try {
        const requests = await requestsModel.getOpenRequestsForUser(userId);
        return requests;
    } catch (error) {
        console.log("Error in getOpenRequestsForUser service method:", error);
        if (error.customError) {
            throw error;
        }
        throw new InternalServerError('Error retrieving open requests');
    }
};

const getUsersEligibleForShareDeckRequest = async (senderId, deckId) => {
    try {
        const eligibleUsers = await requestsModel.getUsersEligibleForShareDeckRequest(senderId, deckId);
        return eligibleUsers;
    } catch (error) {
        console.log("Error in getUsersEligibleForShareDeckRequest service method:", error);
        if (error.customError) {
            throw error;
        }
        throw new InternalServerError('Error retrieving eligible users for share deck request');
    }
};

const deleteRequest = async (requestId, userId) => {
    try {
        await requestsModel.deleteRequest(requestId, userId);
    } catch (error) {
        console.log("Error in deleteRequest service method:", error);
        if (error.customError) {
            throw error;
        }
        throw new InternalServerError('Error deleting request');
    }
};

const handleRequestResponse = async (requestId, userId, action) => {
    try {
        await requestsModel.handleRequestResponse(requestId, userId, action);
    } catch (error) {
        console.log("Error in request response service method:", error);
        if (error.customError) {
            throw error;
        }
        throw new InternalServerError('Error deleting request');
    }
};


module.exports = {
    addShareDeskRequest,
    getOpenRequestsForUser,
    getUsersEligibleForShareDeckRequest,
    deleteRequest,
    handleRequestResponse
};
