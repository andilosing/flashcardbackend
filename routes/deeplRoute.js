const express = require('express')
const router = express.Router()
const deeplController = require("../controllers/deeplController")

router.post("/", deeplController.translateText)


module.exports = router;