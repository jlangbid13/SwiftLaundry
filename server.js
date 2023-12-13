require('dotenv').config();
const path = require("path");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('connected to database'))
  .catch((err) => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// Authentication routes
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email }).exec();
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                res.send({ message: "Login Successful", user: user });
            } else {
                res.send({ message: "Password didn't match" });
            }
        } else {
            res.send({ message: "User not registered" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email: email }).exec();
        if (existingUser) {
            res.send({ message: "User already registered" });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                name,
                email,
                password: hashedPassword,
            });
            await user.save();
            res.send({ message: "Successfully Registered" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

// Schedule routes
app.use('/api/schedule', scheduleRoutes);

if (process.env.NODE_ENV === "production") {
    app.use("/", express.static("frontend/build"));
  
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "frontend/build/index.html"));
    });
  }

// Server start
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
