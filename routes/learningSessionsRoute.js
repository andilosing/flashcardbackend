const express = require('express')
const router = express.Router()
const learningSessionsController = require("../controllers/learningSessionsController")

router.get("/", learningSessionsController.getAllLearningSessions)


module.exports = router;