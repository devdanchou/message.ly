"use strict";

const Router = require("express").Router;
const router = new Router();
// const app = require("../app")
const { application } = require("express");
const jwt = require("jsonwebtoken");
const { NotFoundError, BadRequestError, UnauthorizedError } = require("../expressError");
const { authenicateJWT } = require("../middleware/auth");
const { SECRET_KEY } = require("../config");
const User = require("../models/user");

//TODO: do we need this????
// app.use(express.json())
// app.use(authenicateJWT)

/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const { username, password } = req.body;

  if (await User.authenticate(username, password)) {
    //TODO: what is user name being passed in 22
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  } else {
    throw new UnauthorizedError("Invalid User/Password");

  }

});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {

  if (req.body === undefined) throw new BadRequestError();

  const { username } = await User.register(req.body);
  console.log("username here:", {username})
  let token = jwt.sign({ username }, SECRET_KEY);
  return res.json({ token });

});

module.exports = router;