const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const util = require("../../util");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "dlejfldna"; // 이더리움

// login
router.post(
  "/login",
  function(req, res, next) {
    var isValid = true;
    var validationError = {
      name: "ValidationError",
      errors: {}
    };

    if (!req.body.username) {
      isValid = false;
      validationError.errors.username = { message: "Username is required!" };
    }
    if (!req.body.password) {
      isValid = false;
      validationError.errors.password = { message: "Password is required!" };
    }

    if (!isValid) return res.json(util.successFalse(validationError));
    else next();
  },
  function(req, res, next) {
    User.findOne({ username: req.body.username })
      .select({ password: 1, username: 1 })
      .exec(function(err, user) {
        // if (err) return res.json(util.successFalse(err));
        if (err) {
          console.log(util.successFalse(err));
          return;
        } else if (!user || !user.validPassword(req.body.password)) {
          // 데이터 베이스에 user가 없을 경우 또는 아이디와 비밀번호가 일치하지 않을 경우
          // return res.json(
          //   util.successFalse(null, "Username or Password is invalid")
          // );
          console.log(
            util.successFalse(null, "Username or Password is invalid")
          );
          return;
        } else {
          var payload = {
            _id: user._id,
            username: user.username
          };
          // var secretOrPrivateKey = process.env.JWT_SECRET;
          var secretOrPrivateKey = JWT_SECRET;
          var options = { expiresIn: 60 * 60 * 24 };
          // 아이디와 비밀번호가 일치함을 확인한 후에 jwt.sign함수를 통해 token을 생성하여 return하게 됩니다.
          // jwt.sign은 payload, secretOrPrivateKey, options, Callback 함수의 4개의 파라메터를 전달받습니다.
          // hash 생성 알고리즘, token 유효기간등을 설정할 수 있는 options입니다. 저는 24시간이 지나면 토큰이 무효가 되도록하였습니다.
          jwt.sign(payload, secretOrPrivateKey, options, function(err, token) {
            if (err) return res.json(util.successFalse(err));
            res.json(util.successTrue(token));
            console.log(util.successTrue(token));
          });
        }
      });
  }
);

// me
router.get("/me", util.isLoggedin, function(req, res, next) {
  //  token을 해독해서 DB에서 user 정보를 return하는 API입니다.
  User.findById(req.decoded._id).exec(function(err, user) {
    if (err || !user) return res.json(util.successFalse(err));
    res.json(util.successTrue(user));
    console.log(util.successTrue(user));
  });
});

// refresh
router.get("/refresh", util.isLoggedin, function(req, res, next) {
  //  token의 유효기간이 끝나기전에 새로운 토큰을 발행하는 API입니다.
  User.findById(req.decoded._id).exec(function(err, user) {
    if (err || !user) return res.json(util.successFalse(err));
    else {
      var payload = {
        _id: user._id,
        username: user.username
      };
      // var secretOrPrivateKey = process.env.JWT_SECRET;
      var secretOrPrivateKey = JWT_SECRET;
      var options = { expiresIn: 60 * 60 * 24 };
      jwt.sign(payload, secretOrPrivateKey, options, function(err, token) {
        if (err) return res.json(util.successFalse(err));
        res.json(util.successTrue(token));
      });
    }
  });
});

module.exports = router;
