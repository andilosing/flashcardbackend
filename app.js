const express = require("express");
const app = express();
const PORT = 8080;
const cors = require("cors");

const learningStackRoute = require("./routes/learningStackRoute")
const cardsRoute = require("./routes/cardsRoute")
const learningSessionsRoute = require("./routes/learningSessionsRoute")

const corsOptions = {
  origin: ["http://localhost:3000", "https://flashcardgopnik.onrender.com"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use("/cards", cardsRoute)
app.use("/learning-stack", learningStackRoute)
app.use("/sessions", learningSessionsRoute)

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}.`))
