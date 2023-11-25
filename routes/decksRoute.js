const express = require('express')
const router = express.Router()
const decksController = require("../controllers/decksController")

router.get("/", decksController.getDecks)
router.put("/status/", decksController.updateDeckStatus)
router.post("/", decksController.createDeck)

module.exports = router;