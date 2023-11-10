const express = require('express')
const router = express.Router()
const cardsController = require("../controllers/cardsController")

//router.get("/", cardsController.getProperties)
router.post("/", cardsController.addCard)
//router.put("/:property_id/", cardsController.updateProperty)
//router.delete("/:property_id/", cardsController.deleteProperty)

module.exports = router;