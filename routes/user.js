const express = require("express");

const {
  getAllUsers,
  getManyUsers,
  getUser,
  createUser,
  updateUser,
  upsertUser,
  deleteUser,
  getAllMyGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} = require("../controllers/userControllers");

const app = express.Router();

app.get("/all/:limit", getAllUsers);
app.get("/many", getManyUsers);

app.route("/").get(getUser).put(updateUser).post(createUser).delete(deleteUser);

app.route("/upsert").put(upsertUser);

app.route("/group/all").get(getAllMyGroups);

app
  .route("/group/:groupID")
  .get(getGroup)
  .post(createGroup)
  .put(updateGroup)
  .delete(deleteGroup);

module.exports = app;
