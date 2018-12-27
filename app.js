//core modules
require("./config/config");
const path = require("path");

//third party modules
const express = require("express");
const ObjectID = require("mongodb").ObjectID;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const favicon = require("serve-favicon");
const _ = require("lodash");

//private modules
const {
  mongoose
} = require("./db/mongoose");
const {
  User
} = require("./models/user");
const {
  authorize
} = require("./middleware/authorize");

//app setup
const app = express();
const PORT = process.env.PORT;

//app config
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static("public"));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//routes
app.get("/", (req, res) => {
  res.render("welcome");
});

app.get('/home', authorize, (req, res) => {
  res.render('home');
});

//User routes

//GET /users/new
app.get("/users/new", (req, res) => {
  res.render("signUpForm");
});

//POST /users
app.post("/users", (req, res) => {
  let body = _.pick(req.body, ["name", "email", "password"]);
  let newUser = new User(body);
  newUser
    .save()
    .then(() => {
      return newUser.genAuthToken();
    })
    .then(token => {
      res.cookie("auth-token", token, {
        httpOnly: false
      }).redirect("/home");
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

//GET /users/login/new
app.get("/users/login/new", (req, res) => {
  res.status(200).render("loginForm");
});

//POST /users/login
app.post("/users/login", (req, res) => {
  let body = _.pick(req.body, ["email", "password"]);
  User.findByCredentials(body.email, body.password)
    .then(user => {
      user.genAuthToken().then((token) => {
        res.cookie('auth-token', token, {
          httpOnly: false
        }).redirect('/home');
      });
    })
    .catch(err => {
      res.status(401).send(err);
    });
});

//POST /users/me/logout
app.post('/users/me/logout', authorize, (req, res) => {
  let token = req.token;
  let user = req.user;
  user.deleteToken(token).then((result) => {
    res.clearCookie('auth-token').redirect('/');
  }).catch((err) => {
    res.status(400).send(err);
  });
});

//port config
app.listen(PORT, () => {
  console.log(`The server is up on the port ${PORT}`);
});