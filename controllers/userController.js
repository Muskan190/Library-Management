const User = require("../models/userModel");
const { Op } = require("sequelize");
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rabbit = require("../rabbitMQ/rabbit.js");
const rabbitObj = new rabbit();
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Fetch the user from the database
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    const {
      isWhitelisted,
      password: hashedPassword,
      id,
      name,
    } = user.dataValues;

    // Check if the user is whitelisted
    if (!isWhitelisted) {
      return res.status(403).json({ message: "User is blacklisted!" });
    }

    // Verify the password
    const isPasswordValid = await bycrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }
    // generating JWT token for admin
    const admin = email === "admin1@gmail.com";
    const token1 = admin ? "secretone" : "secret";
    const tokenmessage = admin
      ? "Admin Login Successfull"
      : "User Login Successfull";
    // Generate JWT token
    const token = jwt.sign(
      {
        data: {
          id,
          email,
          username: name,
        },
      },
      token1,
      { expiresIn: "1h" }
    );
    return res
      .status(200)
      .json({ token, message: tokenmessage, isAdmin: admin ? true : false });
  } catch (error) {
    // Handle server errors
    console.error("Error during login:", error);
    return res
      .status(500)
      .json({ message: "Error logging in", error: error.message });
  }
};

const signupUser = async (req, res) => {
  try {
    await rabbitObj.SendMessage(JSON.stringify(req.body));
    const receivemessage = await rabbitObj.ReceiveMessage();
    const { name, email, password } = receivemessage;

    if (!name || !email || !password) {
      return res.status(404).json({ message: "Please Fill all the fields!!" });
    }
    const user = await User.findOne({
      where: { [Op.or]: [{ name }, { email }] },
    });
    if (user) {
      return res
        .status(409)
        .json({ message: "UserName or Email already exists!!" });
    }
    // Hashing the Password
    const saltRounds = 10;
    const plainPassword = password;
    const salt = await bycrypt.genSalt(saltRounds);
    const hash = await bycrypt.hash(plainPassword, salt);
    const newUser = await User.create({ name, email, password: hash });
    return res.status(200).json({ newUser, message: "SignUp successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding user", error: error });
  }
};
module.exports = { signupUser, loginUser };
