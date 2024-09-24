const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const User = require("../models/user");

const authController = require("../controllers/auth");

//render register page
router.get("/register", authController.getRegisterPage);

//handle register
router.post(
  "/register",
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address here!")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((user) => {
        if (user) {
          return Promise.reject(
            "Email is already exists. Try login or Please enter another email."
          );
        }
      });
    }),
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must have at least 4 characters."),
  authController.registerAccount
);

//render login page
router.get("/login", authController.getLoginPage);

//handle login
router.post(
  "/login",
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address here!"),
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must have valid"),
  authController.postLoginData
);

//handle logout
router.post("/logout", authController.logout);

//render reset page
router.get("/reset-password", authController.getResetPage);

//render feedback page
router.get("/feedback", authController.getfeedbackPage);

//send reset email
router.post(
  "/reset",
  body("email").isEmail().withMessage("Please enter a valid email"),
  authController.resetLinkSend
);

//render new password
router.get("/reset-password/:token", authController.getNewPasswordPage);

//change new password
router.post(
  "/change-new-password",
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must have at least 4 characters."),
  body("confirm_password")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password must be identical.");
      }
      return true;
    }),
  authController.changeNewPassword
);
module.exports = router;
