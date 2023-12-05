const express = require('express')
const router = express.Router()
const decksController = require("../controllers/decksController")

router.get("/", decksController.getDecks)
router.get("/:deckId/shares", decksController.getDeckShares)
router.put("/status/", decksController.updateDeckStatus)
router.post("/", decksController.createDeck)
router.put("/shares/:shareId", decksController.updateSharePermission)

module.exports = router;