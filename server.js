require("dotenv").config();
require("colors");

const connectDB = require("./dbinit");
connectDB();

const express = require("express");
const cors = require("cors");

const app = express();

const userRoutes = require("./routes/user");
const groupRoutes = require("./routes/group");

PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json("Welcome to Circle360 DB tier");
});

app.use("/user", userRoutes);
app.use("/group", groupRoutes);

app.listen(PORT, () => {
  console.log(`server is running http://localhost:${PORT}`.red);
});
