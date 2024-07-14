import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

import User from "./models/usersModel.mjs";

const app = express();

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viewsPath = path.join(__dirname, "views");
app.use(express.static(viewsPath));

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});

//Connect to mongodb
mongoose
  .connect("mongodb://localhost:27017/Sample")
  .then(() => {
    console.log("connected to mongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

//Render Signup html
app.get("/", (req, res) => {
  res.sendFile(path.join(viewsPath, "signup.html"));
});

//Insert users Info in database
app.post("/signup-user", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.json({ success: true, message: "User saved successfully!" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      res.status(400).json({ success: false, message: errors });
    } else {
      res.status(500).json({ success: false, message: "Error saving user" });
    }
  }
});

//Check user credentials and login user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      res.json({ success: true, message: "Login successful", userId: user._id });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ success: false, message: "Error logging in user" });
  }
});

//Fetch user name
app.get('/user-name/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId, 'name'); 

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ success: false, message: 'Error fetching user info' });
    }
});