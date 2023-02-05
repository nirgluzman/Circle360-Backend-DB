const mongoose = require("mongoose");
const validator = require("validator");
const User = require("../model/User");

const getAllUsers = async (req, res) => {
  try {
    const user = await User.find()
      .populate("myGroups.groupID")
      .limit(req.params.limit)
      .exec();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "failed to fetch users from DB",
      error: error.message,
    });
  }
};

const getManyUsers = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.find({ email: { $in: email } })
      .select({
        email: 1,
        nickname: 1,
        profilePictureURL: 1,
        location: 1,
        incognito: 1,
      })
      .exec();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "email not found in DB" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    const user = await User.findOne({ email })
      .populate(
        "myGroups.groupID",
        "groupCode public members.email members.accepted"
      )
      .exec();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "email not found in DB" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { nickname, email } = req.body;

    // ********* not required, captured by DB Schema *********
    if (!nickname) {
      return res.status(404).json({
        success: false,
        error: "nickname is missing or not valid",
      });
    }

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    const user = await User.create({ nickname, email });

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const {
      email,
      nickname,
      profilePictureURL,
      location,
      enableNotifications,
      incognito,
      updateFrequency,
      radius,
      myGroups,
    } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    const user = await User.findOneAndUpdate(
      { email },
      {
        // Mongoose strip out undefined keys by default
        // https://mongoosejs.com/docs/migrating_to_6.html#removed-omitundefined,
        $set: {
          nickname,
          profilePictureURL,
          location,
          enableNotifications,
          incognito,
          updateFrequency,
          radius,
          myGroups,
        },
      },
      {
        new: true, // returns the modified document.
      }
    )
      .populate("myGroups.groupID", "-_id groupCode members.email")
      .exec();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "email not found in DB" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// upsert = update that inserts a new document if no document matches the filter
// https://stackoverflow.com/questions/15627967/why-mongoose-doesnt-validate-on-update
const upsertUser = async (req, res) => {
  try {
    const {
      nickname,
      email,
      profilePictureURL,
      location,
      enableNotifications,
      incognito,
      updateFrequency,
      radius,
      myGroups,
    } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    let user = await User.findOne({ email }).exec();

    if (!user) {
      user = await User.create({ nickname, email });
    } else {
      user = await User.findOneAndUpdate(
        { email },
        {
          nickname,
          profilePictureURL,
          location,
          enableNotifications,
          incognito,
          updateFrequency,
          radius,
          myGroups,
        },
        {
          new: true, // returns the modified document.
          //  upsert: true,
          //  upsert inserts a new document if no document matches the filter.
          //  upsert does not trigger Schema validation -> i.e. upsert does not validate that nickname exists.
        }
      ).exec();
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOneAndDelete({ email }).exec();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "email not found in DB" });
    }
    res
      .status(200)
      .json({ success: true, response: "user deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllMyGroups = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    const user = await User.findOne({ email })
      .select("email nickname myGroups")
      .populate("myGroups.groupID")
      .exec();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "email not found in DB" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getGroup = async (req, res) => {
  try {
    const groupID = mongoose.Types.ObjectId(req.params.groupID);

    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    const user = await User.findOne({ email })
      .select({ myGroups: 1 })
      .populate("myGroups.groupID")
      .exec();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "email or groupID not found in DB" });
    }

    const findGroup = user.myGroups.find((m) => m.groupID.equals(groupID));

    res.status(200).json({ success: true, user: findGroup });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const groupID = mongoose.Types.ObjectId(req.params.groupID);
    const { email, name, admin } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    // STEP-1: fetch the myGroups from DB
    const myGroups = await User.findOne({ email }).select("myGroups");
    if (!myGroups) {
      return res
        .status(404)
        .json({ success: false, error: "email not found in DB" });
    }

    // STEP-2: iterate through array to check if the groupID exists
    const foundIndex = myGroups.myGroups.findIndex((m) =>
      m.groupID.equals(groupID)
    ); // groupID is unique.
    if (foundIndex !== -1) {
      return res
        .status(404)
        .json({ success: false, error: "groupID already exists" });
    }

    // STEP-3: create a group only if groupID does not exist (unique identifier)
    const user = await User.findOneAndUpdate(
      { email },
      // $push adds the given object to field whether it exists or not.
      // https://stackoverflow.com/questions/39776615/mongodb-addtoset-replace
      { $push: { myGroups: { groupID, name, admin } } },
      { new: true }
    );

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    const groupID = mongoose.Types.ObjectId(req.params.groupID);
    const { email, name, admin } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    if (admin && !validator.isBoolean(admin)) {
      return res.status(404).json({
        success: false,
        error: "admin is not valid",
      });
    }

    // STEP-1: fetch the myGroups from DB
    const myGroups = await User.findOne({ email }).select("myGroups");
    if (!myGroups) {
      return res
        .status(404)
        .json({ success: false, error: "email not found in DB" });
    }

    // STEP-2: iterate through array to check if the groupID exists
    const foundIndex = myGroups.myGroups.findIndex((m) =>
      m.groupID.equals(groupID)
    ); // groupID is unique.
    if (foundIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "groupID does not exist" });
    }

    // STEP-3: update group details in myGroup array.
    // https://stackoverflow.com/questions/39776615/mongodb-addtoset-replace
    const user = await User.findOneAndUpdate(
      { email, "myGroups.groupID": groupID },
      { $set: { "myGroups.$": { groupID, name, admin } } }, // $set operator to update the value of an existing field in a document
      { new: true } //
    ).exec();

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const groupID = mongoose.Types.ObjectId(req.params.groupID);
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        error: "email is missing or not valid",
      });
    }

    // STEP-1: fetch the myGroups from DB
    const myGroups = await User.findOne({ email }).select("myGroups");
    if (!myGroups) {
      return res
        .status(404)
        .json({ success: false, error: "email not found in DB" });
    }

    // STEP-2: iterate through array to check if the groupID exists
    const foundIndex = myGroups.myGroups.findIndex((m) =>
      m.groupID.equals(groupID)
    ); // groupID is unique.
    if (foundIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "groupID does not exist" });
    }

    // STEP-3: delete the group in myGroup array.
    const user = await User.findOneAndUpdate(
      { email, "myGroups.groupID": groupID },
      { $pull: { myGroups: { groupID } } },
      { new: true } //
    ).exec();

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
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
};
