const fetch = require('node-fetch');
const { DeepLApiError, InternalServerError } = require('../errors/customErrors');
require("dotenv").config();

const apiRequest = async (url, method, body, apiKey) => {
  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `auth_key=${apiKey}&${body}`
    });

    const data = await response.json();
    if (!response.ok) {
        handleDeepLApiErrors(response, data);
    }

    return data;
  } catch (error) {
    console.log(error)
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError();
    }
  }
};

const translateText = async (text, sourceLang, targetLang) => {
    try {
    const url = 'https://api-free.deepl.com/v2/translate';
    const body = `text=${encodeURIComponent(text)}&source_lang=${sourceLang}&target_lang=${targetLang}`;
    
    const data = await apiRequest(url, 'POST', body, process.env.DEEPL_API_KEY);
    if (data && data.translations) {
        return data.translations.map(translation => translation.text).join(" ");
      } else {
        return ""
      }
}  catch (error) {
    console.log(error)
    if (error.customError) {
      throw error;
    } else {
      throw new InternalServerError();
    }
  }
};






  const handleDeepLApiErrors = (response, data) => {
    let errorMessage = '';
  
    switch (response.status) {
      case 400:
        errorMessage = data.message || 'Invalid request sent to DeepL API.';
        break;
      case 401:
        errorMessage = data.message || 'Unauthorized access to DeepL API.';
        break;
      case 403:
        errorMessage = data.message || 'Access to DeepL API forbidden.';
        break;
      case 404:
        errorMessage = data.message || 'DeepL API endpoint not found.';
        break;
      case 429:
        errorMessage = data.message || 'Too many requests to DeepL API.';
        break;
      default:
        errorMessage = data.message || 'An internal error occurred in DeepL API.';
        break;
    }
  
    throw new DeepLApiError(errorMessage);
  };



  

module.exports = {
  apiRequest,
  translateText
};