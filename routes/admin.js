const express = require("express");

const router = express.Router();
const postController = require("../controllers/post");
const userController = require("../controllers/user");

const { body } = require("express-validator");

const { isPremium } = require("../middleware/isPremium");

// /admin/create-post
router.get("/create-post", postController.renderCreatePage);

router.post(
  "/",
  [
    body("title")
      .isLength({ min: 10 })
      .withMessage("Title must have at least 10 letters."),
    body("description")
      .isLength({ min: 30 })
      .withMessage("Description must have at least 30 letters."),
  ],
  postController.createPost
);

//edit
router.get("/edit/:postId", postController.getEditPost);

router.post(
  "/edit-post",
  [
    body("title")
      .isLength({ min: 10 })
      .withMessage("Title must have at least 10 letters."),
    body("description")
      .isLength({ min: 30 })
      .withMessage("Description must have at least 30 letters."),
  ],
  postController.updatePost
);

//delete
router.post("/delete/:postId", postController.deletePost);

//profile
router.get("/profile", userController.getProfile);

//username
router.get("/username", userController.renderUsernamePage);

router.post(
  "/setusername",
  body("username")
    .isLength({ min: 4 })
    .withMessage("Username must have 4 letters."),
  userController.setUsername
);

//premium
router.get("/premium", userController.renderPremiumPage);

router.get("/subscription-success", userController.getSuccessPage);

router.get("/premium-details", userController.getPremiumDetails);

router.get("/subscription-cancel", userController.renderPremiumPage);

router.get("/profile-image", isPremium, userController.getProfileUploadPage);

router.post("/set-profile", isPremium, userController.setProfileImage);

module.exports = router;
