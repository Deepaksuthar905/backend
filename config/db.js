const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let uri = (process.env.MONGO_URI || "").trim();
    if (!uri && process.env.MONGO_ATLAS_USER && process.env.MONGO_ATLAS_PASS && process.env.MONGO_ATLAS_CLUSTER) {
      const user = String(process.env.MONGO_ATLAS_USER).trim().replace(/\s/g, "");
      const rawPass = String(process.env.MONGO_ATLAS_PASS).trim().replace(/\s/g, "");
      const pass = encodeURIComponent(rawPass);
      const cluster = String(process.env.MONGO_ATLAS_CLUSTER).trim().replace(/\s/g, "");
      const db = (process.env.MONGO_DB_NAME || "hardware_shop").trim();
      uri = `mongodb+srv://${user}:${pass}@${cluster}/${db}?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`;
    }
    uri = uri || "mongodb://127.0.0.1:27017/hardware_shop";
    // Atlas Database User = admin me auth; agar MONGO_URI me authSource nahi to add karo
    if (uri.includes("mongodb+srv") && !uri.includes("authSource=")) {
      uri += (uri.includes("?") ? "&" : "?") + "authSource=admin";
    }
    await mongoose.connect(uri);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.log("DB Connection Error: ", err.message || err);
  }
};

module.exports = connectDB;
