const express = require('express')
const router = express.Router()
const notificationsController = require("../controllers/notificationsController")

router.get("/", notificationsController.getNotificationsForUser)
router.put("/", notificationsController.updateLastViewedAtForUser)


module.exports = router;
