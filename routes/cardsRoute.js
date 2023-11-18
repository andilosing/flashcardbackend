const express = require('express')
const router = express.Router()
const cardsController = require("../controllers/cardsController")

router.get("/:deckId", cardsController.getCardsForDeck)
router.post("/", cardsController.addCard)
router.put("/", cardsController.updateCard)
router.delete("/", cardsController.deleteCards)

module.exports = router;
