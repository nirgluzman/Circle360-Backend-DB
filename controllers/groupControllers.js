const mongoose = require("mongoose");
const validator = require("validator");
const Group = require("../model/Group");

// get all groups in the DB
const getAllGroups = async (req, res) => {
  try {
    const group = await Group.find()
      .populate("members.userID")
      .limit(req.params.limit)
      .exec();

    if (!group.length) {
      return res.status(404).json({ success: false, error: "no groups in DB" });
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups from DB",
      error: error.message,
    });
  }
};

// get a group by groupCode
const getGroup = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const group = await Group.findOne({ groupCode })
      .populate(
        "members.userID",
        "nickname email profilePictureURL location incognito"
      )
      .exec();

    if (!group) {
      return res
        .status(404)
        .json({ success: false, error: "group not found in DB" });
    }
    res.status(200).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// create group	- valid userID and Email are required
const createGroup = async (req, res) => {
  try {
    const { email } = req.body;
    const userID = mongoose.Types.ObjectId(req.body.userID);

    // // ********* most cases captured by DB Schema *********
    // if (!userID || !mongoose.isValidObjectId(userID)) {
    //   return res
    //     .status(404)
    //     .json({ success: false, error: "userID is not valid" });
    // }

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    const group = await Group.create({
      members: { email, userID, accepted: true },
    });

    res.status(201).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// update a group
const updateGroup = async (req, res) => {
  const { groupCode } = req.params;
  const { public } = req.body;

  if (!public || !validator.isBoolean(public, { loose: false })) {
    return res.status(404).json({
      success: false,
      error: "public is missing or not valid",
    });
  }

  try {
    const group = await Group.findOneAndUpdate(
      { groupCode },
      { public },
      {
        new: true, // returns the modified document.
      }
    ).exec();
    if (!group) {
      return res.status(404).json({ success: false, error: "bad group code" });
    }

    res.status(200).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// delete a group
const deleteGroup = async (req, res) => {
  const { groupCode } = req.params;
  try {
    const group = await Group.findOneAndDelete({ groupCode }).exec();
    if (!group) {
      return res.status(404).json({ success: false, error: "bad group code" });
    }

    res
      .status(200)
      .json({ success: true, response: "group deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// add user to group
const addUserToGroup = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    // STEP-1: fetch the group from DB
    const members = await Group.findOne({ groupCode }).select("members");
    if (!members) {
      return res.status(404).json({ success: false, error: "bad group code" });
    }

    // STEP-2: iterate through array to check if the Email exists
    const foundIndex = members.members.findIndex((m) => m.email === email); // assume Email is unique.
    if (foundIndex !== -1) {
      return res
        .status(404)
        .json({ success: false, error: "user already exists in group" });
    }

    // STEP-3: add email to members array only if it does not exist.
    // $addToSet do not add the item to the given field if it already contains it (both the attribute names and values).
    // $push adds the given object to field whether it exists or not.
    // https://stackoverflow.com/questions/39776615/mongodb-addtoset-replace
    const group = await Group.findOneAndUpdate(
      { groupCode },
      { $addToSet: { members: { email } } },
      { new: true }
    )
      .select({ "members.userID": 0 })
      .exec();
    res
      .status(200)
      .json({ success: true, message: "user added to group", group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// update user in group - find user in group (by email) and updates its userID
const updateUserInGroup = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { email } = req.body;

    const userID = mongoose.Types.ObjectId(req.body.userID);

    // // ********* most cases captured by DB Schema *********
    // if (!userID || !mongoose.isValidObjectId(userID)) {
    //   return res
    //     .status(404)
    //     .json({ success: false, error: "userID is not valid" });
    // }

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    // STEP-1: fetch the group from DB
    const members = await Group.findOne({ groupCode }).select("public members");
    if (!members) {
      return res.status(404).json({ success: false, error: "bad group code" });
    }

    let group;

    // STEP-2.1: if group is PUBLIC, then add both email and accepted=TRUE in group members
    if (members.public) {
      group = await Group.findOneAndUpdate(
        { groupCode },
        { $addToSet: { members: { email, userID, accepted: true } } },
        { new: true }
      )
        .select({ "members.userID": 0 })
        .exec();
    } else {
      // STEP-3.1: if group is not PUBLIC, iterate through array to check if Email exists
      const foundIndex = members.members.findIndex((m) => m.email === email); // assume Email is unique.
      if (foundIndex === -1) {
        return res
          .status(404)
          .json({ success: false, error: "user does not exist in group" });
      }
      // STEP-3.2: update user details in members array.
      // https://stackoverflow.com/questions/39776615/mongodb-addtoset-replace
      group = await Group.findOneAndUpdate(
        { groupCode, "members.email": email },
        { $set: { "members.$": { email, userID, accepted: true } } }, // $set operator to update the value of an existing field in a document
        { new: true }
      )
        .select({ "members.userID": 0 })
        .exec();
    }
    res.status(200).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// delete a user in a group
const deleteUserInGroup = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    // STEP-1: fetch the group from DB
    const members = await Group.findOne({ groupCode }).select("members");
    if (!members) {
      return res.status(404).json({ success: false, error: "bad group code" });
    }

    // STEP-2: iterate through array to check if the Email exists.
    const foundIndex = members.members.findIndex((m) => m.email === email); // assume Email is unique.
    if (foundIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "user does not exist in group" });
    }

    // STEP-3: delete user in members array.
    const group = await Group.findOneAndUpdate(
      { groupCode, "members.email": email },
      { $pull: { members: { email } } },
      { new: true } //
    )
      .select({ "members.userID": 0 })
      .exec();

    res.status(200).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  updateUserInGroup,
  deleteUserInGroup,
};
