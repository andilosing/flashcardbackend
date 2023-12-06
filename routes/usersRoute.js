const express = require('express')
const router = express.Router()
const usersController = require("../controllers/usersController")

router.get("/", usersController.getAllUsersExceptCurrent)
router.get("/user", usersController.getLoggedInUser)

module.exports = router;