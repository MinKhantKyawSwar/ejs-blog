const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const session = require("express-session");
const mongoStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

//routes
const postRoutes = require("./routes/post");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

//database model
const User = require("./models/user");

//error controller
const errorController = require("./controllers/error");

//middleware for login
const { isLogin } = require("./middleware/is-login");

//connecting database
const store = new mongoStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});

const csrfProtect = csrf();

const storageConfigure = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilterConfigure = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: storageConfigure, fileFilter: fileFilterConfigure }).single(
    "photo"
  )
);

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store,
  })
);

//middleware for validation
app.use(csrfProtect);
// middleware for storing messages
app.use(flash());

app.use((req, res, next) => {
  if (req.session.isLogin === undefined) {
    return next();
  }
  User.findById(req.session.userInfo._id)
    .select("_id email")
    .then((user) => {
      req.user = user;
      next();
    });
});

//to send csrf to all pages

app.use((req, res, next) => {
  res.locals.isLogin = req.session.isLogin ? true : false;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", isLogin, adminRoutes);
app.use(postRoutes);
app.use(authRoutes);

app.all("*", errorController.get404Page);
app.use(errorController.get500Page);

mongoose
  .connect(process.env.MONGODB_URL)
  .then((res) => {
    app.listen(8000);
    console.log("connected to mongodb");
  })
  .catch((err) => console.log(err));
