const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const util = require("../../util");

// index
router.get("/", util.isLoggedin, function(req, res, next) {
  User.find({})
    .sort({ username: 1 })
    .exec(function(err, users) {
      res.json(
        err || !users ? util.successFalse(err) : util.successTrue(users)
      );
    });
});

// create
router.post("/", function(req, res, next) {
  var newUser = new User();
  newUser.username = username;
  newUser.email = email;
  newUser.password = newUser.generateHash(password);
  newUser.save(function(err, user) {
    res.json(err || !user ? util.successFalse(err) : util.successTrue(user));
  });
});

// show
router.get("/:username", util.isLoggedin, function(req, res, next) {
  User.findOne({ username: req.params.username }).exec(function(err, user) {
    res.json(err || !user ? util.successFalse(err) : util.successTrue(user));
  });
});

// update
router.put("/:username", util.isLoggedin, checkPermission, function(
  req,
  res,
  next
) {
  User.findOne({ username: req.params.username })
    .select({ password: 1 }) // 1 or true to include the field in the return documents, 0 or false to exclude the field. user로 부터 password를 불러옴
    .exec(function(err, user) {
      if (err || !user) return res.json(util.successFalse(err));

      // update user object
      user.originalPassword = user.password; // originPassword에 받아온 password를 넣는다.
      user.password = req.body.generateHash(newPassword)
        ? req.body.generateHash(newPassword)
        : user.password;
      for (var p in req.body) {
        user[p] = req.body[p]; // user에 body의 내용을 추가한다.
      }

      // save updated user
      user.save(function(err, user) {
        if (err || !user) return res.json(util.successFalse(err));
        else {
          user.password = undefined;
          res.json(util.successTrue(user));
        }
      });
    });
});

// destroy, 로그인되었나 확인하여 decode 정보를 추가하고, checkPermission에서 decode 정보를 통해 username을 가진 id가 로그인된 유저인지 확인한다.
router.delete("/:username", util.isLoggedin, checkPermission, function(
  req,
  res,
  next
) {
  User.findOneAndRemove({ username: req.params.username }).exec(function(
    err,
    user
  ) {
    res.json(err || !user ? util.successFalse(err) : util.successTrue(user));
  });
});

module.exports = router;

// private functions
// username을 가지고 있는 user의 _id와 jwt 토큰에 있는 _id와 같은지 확인합니다. 즉 해당 유저가 아니면 삭제 권한이 없습니다.
function checkPermission(req, res, next) {
  User.findOne({ username: req.params.username }, function(err, user) {
    if (err || !user) return res.json(util.successFalse(err));
    else if (!req.decoded || user._id != req.decoded._id)
      return res.json(util.successFalse(null, "You don't have permission"));
    else next();
  });
}
