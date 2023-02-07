const mongoose = require("mongoose");

// the validator seems to run only on Mongoose Create
function nicknameValidator(nickname) {
  return nickname != undefined && nickname.length > 0;
}

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: true,
      validate: [nicknameValidator, "nickname is missing or not valid"],
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      unique: [true, "email must be unique"],
      required: [true, "email is required"],
    },

    profilePictureURL: {
      type: String,
      trim: true,
    },

    location: {
      lat: {
        type: Number,
        default: 0,
      },
      lng: {
        type: Number,
        default: 0,
      },
    },

    enableNotifications: {
      type: Boolean,
      default: true,
    },

    incognito: {
      type: Boolean,
      default: false,
    },

    updateFrequency: {
      type: Number,
      default: 5,
    },

    radius: {
      type: Number,
      default: 5,
    },

    myGroups: [
      {
        _id: false,
        groupID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Group",
        },
        name: {
          type: String,
          default: "New Group",
          trim: true,
        },
        admin: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("validate", async function (next) {
  // https://mongoosejs.com/docs/middleware.html#order

  const randomId = Math.floor(Math.random() * 10000);
  this.profilePictureURL = `https://api.dicebear.com/5.x/bottts/svg?seed=${randomId}`;

  next();
});

module.exports = mongoose.model("User", userSchema);
