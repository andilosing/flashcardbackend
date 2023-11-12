const { BadRequestError } = require("../errors/customErrors");
const { handleErrors } = require("../errors/errorHandler");
const deeplService = require("../services/deeplService"); 

const translateText = async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;

    if (!text || !sourceLang || !targetLang) {
      throw new BadRequestError("All required fields must be provided");
    }

    const translatedTexts = await deeplService.translateText(text, sourceLang, targetLang);

    
    res.status(200).json({
      message: "Text translated successfully",
      data: { translations: translatedTexts },
    });
  } catch (error) {
    console.log(error)
    handleErrors(error, res);
  }
};

module.exports = {
  translateText
};
