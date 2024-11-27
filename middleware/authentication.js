const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
async function auth(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }
    jwt.verify(token, "secret", async (error, decoded) => {
      if (!error) {
        const userdetail = await User.findByPk(decoded.data.id);
        if (!userdetail) {
          return res.status(404).json("User not found");
        }
        next();
      } else {
        return res.status(403).json({ message: error.message });
      }
    });
  } catch (error) {
    console.log(`error is ${error}`);
    return res.status(500).json({ message: error.message });
  }
}
async function adminAuth(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }
    jwt.verify(token,"secretone",async(error,decoded)=>{
      if (!error) {
        const admindetail = await User.findByPk(decoded.data.id);
        if (!admindetail) {
          return res.status(404).json("Admin not found");
        }
        next();
      } else {
        return res.status(403).json({ message: error.message });
      }
    })
  } catch (error) {
    console.log(`error is ${error}`);
    return res.status(500).json({ message: error.message });
  }
}
module.exports = { auth , adminAuth};
