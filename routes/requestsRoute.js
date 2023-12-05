const express = require('express');
const router = express.Router();
const requestsController = require("../controllers/requestsController");

router.get("/open", requestsController.getOpenRequestsForUser);
router.post("/", requestsController.addShareDeskRequest);
router.get("/eligible-users/:deckId", requestsController.getUsersEligibleForShareDeck);
router.delete("/:requestId", requestsController.deleteRequest)
router.put("/response/:requestId", requestsController.handleRequestResponse);

module.exports = router;
