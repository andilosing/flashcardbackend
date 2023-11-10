const express = require('express')
const router = express.Router()
const learningStackController = require("../controllers/learningStackController")

router.get("/", learningStackController.getDueCards)
//router.post("/", learningStackController.addProperty)
router.put("/", learningStackController.updateCard)
//router.delete("/:property_id/", learningStackController.deleteProperty)

module.exports = router;