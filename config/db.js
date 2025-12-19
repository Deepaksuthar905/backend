const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/hardware_shop");
    console.log("MongoDB Connected...");
  } catch (err) {
    console.log("DB Connection Error: ", err);
  }
};

module.exports = connectDB;
