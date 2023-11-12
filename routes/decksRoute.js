const express = require('express')
const router = express.Router()
const decksController = require("../controllers/decksController")

router.get("/", decksController.getDecks)

module.exports = router;