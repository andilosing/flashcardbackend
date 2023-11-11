const express = require("express");
const app = express();
const PORT = 8080;
const cors = require("cors");
const bcrypt = require("bcrypt")

const learningStackRoute = require("./routes/learningStackRoute")
const cardsRoute = require("./routes/cardsRoute")
const learningSessionsRoute = require("./routes/learningSessionsRoute")
const authRoute = require("./routes/authRoute")

const authTokenMiddleware = require("./middlewares/authTokenMiddleware")

const corsOptions = {
  origin: ["http://localhost:3000", "https://flashcardgopnik.onrender.com"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));


// const generatePasswod = async () => {
//   const SALT_ROUNDS = 10;
//   const hashedPassword = await bcrypt.hash("1", SALT_ROUNDS);
//   console.log(hashedPassword)

// }

// generatePasswod()



app.use("/auth", authRoute)
app.use("/cards", authTokenMiddleware.authenticateJWT, cardsRoute)
app.use("/learning-stack", authTokenMiddleware.authenticateJWT, learningStackRoute)
app.use("/sessions", authTokenMiddleware.authenticateJWT, learningSessionsRoute)

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}.`))
