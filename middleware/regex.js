function ValidateInput(req, res, next) {
  const { name, email, password } = req.body;
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  const passRegex =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,8}$/;
  const nameRegex = /^[a-zA-Z][a-zA-Z_-]{2,19}$/;
  if (!nameRegex.test(name)) {
    return res
      .status(400)
      .send("Username should start with a letter , can have _ or - and must be upto six letter");
  }
  if (!emailRegex.test(email)) {
    return res.status(400).send("Invalid Format must contain @");
  }
  if (!passRegex.test(password)) {
    return res
      .status(400)
      .send(
        "Password must have 6 to 8 characters long , one special character, one digit and one alphabetic character"
      );
  }
  next();
}
module.exports = { ValidateInput };
