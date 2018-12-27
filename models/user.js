const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

let userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        let re = new RegExp("f201[4-8][0-9]{4}@goa.bits-pilani.ac.in");
        if (re.test(v)) {
          return true;
        } else {
          return false;
        }
      },
      message: `{VALUE} is not a valid BITS Mail`
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

userSchema.methods.genAuthToken = function () {
  let user = this;
  let access = "auth";
  let token = jwt
    .sign({
      _id: user._id.toHexString(),
      access
    }, process.env.JWT_SECRET)
    .toString();

  user.tokens.push({
    access,
    token
  });
  return user.save().then(() => {
    return token;
  });
};

userSchema.methods.toJSON = function () {
  let user = this;
  return {
    _id: user._id,
    name: user.name,
    email: user.email
  };
};

userSchema.pre("save", function (next) {
  let user = this;
  if (user.isModified("password")) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.statics.findByToken = function (token) {
  let User = this;
  let decoded;
  return new Promise((res, rej) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        rej("Invalid Token");
      } else {
        User.findById(decoded._id)
          .then(user => {
            if (user) {
              res(user);
            } else {
              rej("No such user found");
            }
          })
          .catch(err => {
            rej("Unable to connect to MongoDB Server");
          });
      }
    });
  });
};

userSchema.statics.findByCredentials = function (email, password) {
  let User = this;
  return User.findOne({
    email
  }).then(user => {
    if (!user) {
      return Promise.reject("Unregistered User");
    } else {
      console.log(user);
      return bcrypt.compare(password, user.password).then(res => {
        if (res) {
          return user;
        } else {
          return Promise.reject('Wrong Password');
        }
      });
    }
  });
};

userSchema.methods.deleteToken = function (token) {
  let user = this;
  return user.update({
    $pull: {
      tokens: {
        token: token
      }
    }
  })
}

let User = mongoose.model("User", userSchema);

module.exports = {
  User
};