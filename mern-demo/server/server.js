const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Student = require("./models/Student");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.on("finish", () => console.log(req.method, req.path, res.statusCode));
  next();
});

if (process.env.SERVE_CLIENT !== "true") {
  app.get("/", (req, res) => res.send("MERN Demo API is running!"));
}
app.get("/api/hello", (req, res) => {
  res.json({ message: "MERN Demo API is running!" });
});

function studentInput(req, res, next) {
  const { studentId, name, email } = req.body || {};
  if (![studentId, name, email].every((v) => typeof v === "string" && v.trim())) {
    return res.status(400).json({ message: "Vui lòng nhập MSSV, họ tên và email." });
  }
  req.studentInput = { studentId: studentId.trim(), name: name.trim(), email: email.trim() };
  next();
}

function validId(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "ID sinh viên không hợp lệ." });
  }
  next();
}

function handleError(res, error) {
  if (error.code === 11000) {
    return res.status(409).json({ message: "MSSV đã tồn tại." });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join("; ") });
  }
  console.error(error.name);
  return res.status(500).json({ message: "Không xử lý được yêu cầu. Vui lòng thử lại." });
}

app.get("/api/students", async (req, res) => {
  try {
    res.json(await Student.find());
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/students", studentInput, async (req, res) => {
  try {
    res.status(201).json(await Student.create(req.studentInput));
  } catch (error) {
    handleError(res, error);
  }
});

app.put("/api/students/:id", validId, studentInput, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.studentInput, {
      new: true, runValidators: true,
    });
    if (!student) return res.status(404).json({ message: "Không tìm thấy sinh viên." });
    res.json(student);
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/api/students/:id", validId, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Không tìm thấy sinh viên." });
    res.json({ message: "Đã xóa sinh viên.", student });
  } catch (error) {
    handleError(res, error);
  }
});


app.use("/api", (req, res) => {
  res.status(404).json({ message: "API không tồn tại." });
});

// Render can serve the built React application and API from one web service.
if (process.env.SERVE_CLIENT === "true") {
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get("/{*page}", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) throw new Error("Thiếu MONGODB_URI trong mern-demo/.env");
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "cloud_lab" });
    await Student.init();
    console.log("MongoDB connected successfully (cloud_lab)");
    app.listen(PORT, "0.0.0.0", () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.error("Không khởi động được backend:", error.name);
    await mongoose.disconnect();
    process.exitCode = 1;
  }
}

startServer();
