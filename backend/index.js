require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');

const app = express();
const videoRouter = require("./src/video");

const connectToMongoDB = () => {
  return new Promise((resolve, reject) => {
      mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
      const db = mongoose.connection;
      db.on("error", (error) => {
          console.error("MongoDB connection error: ", error);
          reject(error);
      });
      db.once("open", () => {
          console.log("Connected to MongoDB");
          resolve(db);
      });
  });
}

app.use(express.json());

app.use(cors());

app.use("/video", videoRouter);

async function startServer() {
  try {
    await connectToMongoDB();
    app.listen(process.env.PORT, () =>
      console.log(`Server started port: http://localhost:${process.env.PORT}/`)
    );
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();