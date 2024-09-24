const bcrypt = require("bcrypt");
const User = require("../models/user");
const crypto = require("crypto");

const nodeMailer = require("nodemailer");
const dotenv = require("dotenv").config();

const { validationResult } = require("express-validator");

const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_MAIL,
    pass: process.env.MAIL_PASSWORD,
  },
});

// render register page
exports.getRegisterPage = (req, res) => {
  let message = req.flash("regError");
  if (message.length > 0) {
    message = message[0];
  } else {
    message: null;
  }
  res.render("auth/register", {
    title: "Register",
    errorMsg: message,
    oldFormData: { email: "", password: "" },
  });
};

//handle register page
exports.registerAccount = (req, res) => {
  const { email, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/register", {
      title: "Register",
      errorMsg: errors.array()[0].msg,
      oldFormData: { email, password },
    });
  }

  bcrypt
    .hash(password, 10)
    .then((hashedPassword) => {
      return User.create({
        email,
        password: hashedPassword,
      });
    })
    .then((_) => {
      res.redirect("/login");
      transporter.sendMail(
        {
          from: process.env.SENDER_MAIL,
          to: email,
          subject: "Register Successful",
          html: "<h1>Your account is successfully registered.</h1><p>Create wonderful blogs here in Blog.io</p>",
        },
        (err) => {
          console.log(err);
          const error = new Error("Something went wrong");
          return next(error);
        }
      );
    });
};

//render login page
exports.getLoginPage = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message: null;
  }
  res.render("auth/login", {
    title: "Login",
    errorMsg: message,
    oldFormData: {
      email: "",
      password: "",
    },
  });
};

//handle login
exports.postLoginData = (req, res) => {
  const { email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      title: "Login",
      errorMsg: errors.array()[0].msg,
      oldFormData: {
        email,
        password,
      },
    });
  }
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        res.status(422).render("auth/login", {
          title: "Login",
          errorMsg: "Please enter valid email and password",
          oldFormData: {
            email,
            password,
          },
        });
      }

      bcrypt
        .compare(password, user.password)
        .then((isMatch) => {
          if (isMatch) {
            req.session.isLogin = true;
            req.session.userInfo = user;
            return req.session.save((err) => {
              res.redirect("/");
              console.log(err);
            });
          }
          res.status(422).render("auth/login", {
            title: "Login",
            errorMsg: "Please enter valid email and password",
            oldFormData: {
              email,
              password,
            },
          });
        })
        .catch((err) => {
          console.log(err);
          const error = new Error("Something went wrong");
          return next(error);
        });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

//handle logout
exports.logout = (req, res) => {
  req.session.destroy((_) => {
    res.redirect("/");
  });
};

//render reset password page
exports.getResetPage = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message: null;
  }
  res.render("auth/reset", {
    title: "Reset Password",
    errorMsg: message,
    oldFormData: { email: "" },
  });
};

//render feedback page
exports.getfeedbackPage = (req, res) => {
  res.render("auth/feedback", { title: "Success" });
};

//reset password link send
exports.resetLinkSend = (req, res) => {
  const { email } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/reset", {
      title: "Reset Password",
      errorMsg: errors.array()[0].msg,
      oldFormData: { email },
    });
  }

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset-password");
    }
    const token = buffer.toString("hex");
    User.findOne({ email })
      .then((user) => {
        if (!user) {
          return res.status(422).render("auth/reset", {
            title: "Reset Password",
            errorMsg: "No account exists with this email",
            oldFormData: { email },
          });
          req.flash("error", "No account found with this email.");
          return res.redirect("/reset-password");
        }
        user.resetToken = token;
        user.tokenExpiration = Date.now() + 1800000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/feedback");
        transporter.sendMail(
          {
            from: process.env.SENDER_MAIL,
            to: email,
            subject: "Reset Password",
            html: `<h1>Reset password.</h1><p>Change your account password by clicking the link below.</p><a href="http://localhost:8080/reset-password/${token}" target="_blank">Click me to change password !!</a>`,
          },
          (err) => {
            console.log(err);
            const error = new Error("Something went wrong");
            return error;
          }
        );
      })
      .catch((err) => {
        console.log(err);
        const error = new Error("Something went wrong");
        return next(error);
      });
  });
};

//render newpassword page
exports.getNewPasswordPage = (req, res) => {
  const { token } = req.params;
  User.findOne({
    resetToken: token,
    tokenExpiration: {
      $gt: Date.now(),
    },
  })
    .then((user) => {
      if (user) {
        let message = req.flash("error");
        if (message.length > 0) {
          message = message[0];
        } else {
          message: null;
        }
        return res.render("auth/newpassword", {
          title: "Change Password",
          errorMsg: message,
          resetToken: token,
          user_id: user._id,
          oldFormData: { password: "", confirm_password: "" },
        });
      } else {
        res.redirect("/");
      }
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

//change new password
exports.changeNewPassword = (req, res) => {
  const { password, confirm_password, user_id, resetToken } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/newpassword", {
      title: "Change password",
      resetToken,
      user_id,
      errorMsg: errors.array()[0].msg,
      oldFormData: { password, confirm_password },
    });
  }

  let resetUser;
  User.findOne({
    resetToken,
    tokenExpiration: { $gt: Date.now() },
    _id: user_id,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(password, 10);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.tokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      return res.redirect("login");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};
