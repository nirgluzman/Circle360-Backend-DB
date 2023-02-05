const mongoose = require("mongoose");

const groupIdLength = 6;

const groupSchema = new mongoose.Schema({
  groupCode: {
    type: String,
    unique: [true, "groupCode must be unique"],
    trim: true,
  },
  public: {
    type: Boolean,
    default: false,
  },
  members: [
    {
      _id: false,
      userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      email: {
        type: String,
        required: [true, "email is required"],
      },
      accepted: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

groupSchema.pre("validate", async function (next) {
  // https://mongoosejs.com/docs/middleware.html#order

  function makeId(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  this.groupCode = makeId(groupIdLength);

  next();
});

module.exports = mongoose.model("Group", groupSchema);
