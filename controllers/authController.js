const { BadRequestError } = require("../errors/customErrors");
const authService = require("../services/authService");
const { handleErrors } = require("../errors/errorHandler");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new BadRequestError("Both username and password are required.");
    }

    const result = await authService.login(username, password);


    res.status(200).json({
      message: "Erfollgreich eingeloggt.",
      data: { user: result.user, token: result.token, expires_at: result.expires_at },
    });
  } catch (error) {
    handleErrors(error, res);
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new BadRequestError("Refresh token not provided.");
    }

    await authService.logout(refreshToken);

    res.status(200).json({
        message: "Erfollgreich ausgeloggt.",
        
      });
  } catch (error) {
    handleErrors(error, res);
  }
};

module.exports = {
  login,
  logout,
};
