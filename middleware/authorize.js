const { User } = require("./../models/user");

let authorize = (req, res, next) => {
  console.log("Authorize");
  let token = req.cookies["auth-token"];
  console.log(token);
  User.findByToken(token)
    .then(user => {
      console.log(user);
      req.user = user;
      req.token = token;
      next();
    })
    .catch(err => {
      res.status(400).send(err);
    });
};

module.exports = { authorize };
