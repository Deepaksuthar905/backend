const express = require("express");
const app = express();
const mongoose = require("mongoose");

app.use(express.json());

// DB connection
mongoose.connect("mongodb://localhost:27017/mydb")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Routes
const categoryRoutes = require("./routes/categoryRoutes");
const auth = require("./routes/auth");

app.use("/", auth);
app.use("/api", categoryRoutes);

// Start Server
app.listen(3000, () => console.log("Server running on port 3000"));
