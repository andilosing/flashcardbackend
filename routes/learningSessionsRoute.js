const express = require('express')
const router = express.Router()
const learningSessionsController = require("../controllers/learningSessionsController")

router.get("/", learningSessionsController.getAllLearningSessions)
router.get("/:userId", learningSessionsController.getAllLearningSessionsForOtherUser)


module.exports = router;