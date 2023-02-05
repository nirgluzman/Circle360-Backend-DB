const express = require("express");

const {
  getAllGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  updateUserInGroup,
  deleteUserInGroup,
} = require("../controllers/groupControllers");

const app = express.Router();

app.get("/all/:limit", getAllGroups);

app.post("/", createGroup);
app.route("/:groupCode").get(getGroup).put(updateGroup).delete(deleteGroup);

app
  .route("/user/:groupCode")
  .post(addUserToGroup)
  .put(updateUserInGroup)
  .delete(deleteUserInGroup);

module.exports = app;
