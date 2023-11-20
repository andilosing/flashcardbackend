const express = require('express')
const router = express.Router()
const decksController = require("../controllers/decksController")

router.get("/", decksController.getDecks)
router.post("/status/", decksController.updateDeckStatus)

module.exports = router;