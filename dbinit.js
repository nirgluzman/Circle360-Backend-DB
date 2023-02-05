const mongoose = require("mongoose");

const connectDB = async () => {
  const conn = await mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "Circle360",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // https://dev.to/akshatsinghania/mongoose-unique-not-working-16bf
      autoIndex: true,
    })
    .then(console.log("Atlas MongoDB connected !".green))
    .catch((err) => console.log(`Atlas MongoDB error: ${err}`.red));
};

module.exports = connectDB;
