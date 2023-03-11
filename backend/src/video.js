const express = require("express");
const multer = require("multer");
const router = express.Router();
const crypto = require("crypto");
const streamifier = require("streamifier");
const path = require("path");

const { ObjectId, GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");

const db = mongoose.connection;

const videoBucket = new GridFSBucket(db, {
  bucketName: "videos",
  chunkSizeBytes: 1024 * 1024,
  writeConcern: { w: "majority" },
  readPreference: "primary",
});

const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB (in bytes)
  },
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const { originalname, buffer } = req.file;
  try {
    const filename =
      crypto.randomBytes(16).toString("hex") + path.extname(originalname);
    const uploadStream = videoBucket.openUploadStream(filename);
    const readStream = streamifier.createReadStream(buffer);
    const result = readStream.pipe(uploadStream);

    return res.status(200).json({ fileName: result.filename });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.get("/download/:filename", async (req, res) => {
  const { filename } = req.params;
  const range = req.headers.range;
  // Ensure there is a range given for the video

  if (!range) {
    res.status(400).send("Requires Range header");
  }
  const files = await videoBucket.find({ filename: filename }).toArray();
  if (files.length === 0) {
    return res.status(404).send("File not found");
  }
  const fileSize = files[0].length;

  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, fileSize - 1);

  // Create headers
  const contentLength = end - start + 1;

  const headers = {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  try {
    const downloadStream = videoBucket.openDownloadStreamByName(filename, {
      start,
      end,
    });

    // Stream the video chunk to the client
    downloadStream.pipe(res);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.delete("/delete/:filename", async (req, res) => {
  const videoId = req.params.id;

  try {
    await bucket.delete(new ObjectId(videoId));
    res.send("video deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
