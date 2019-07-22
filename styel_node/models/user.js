const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

let userSchema = new Schema(
  {
    email: {
      type: String,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Should be a vaild email address!"
      ],
      trim: true
    },
    username: {
      type: String,
      required: [true, "Username is required!"],
      match: [/^.{4,12}$/, "Should be 4-12 characters!"], // '/' : regex는 '/' 안에 작성, '^' 문자열의 시작, '$' 문자열의 끝, '.' 어떠한 문자열이라도 상관 없음, {4, 12} 4이상 12이하의 길이
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      select: false // false로 두어 User.find할 때 보이지 않음. select({password: 1})을 통해 user에 추가되도록 함.
    }
  },
  {
    toObject: { virtuals: true }
  }
);

// virtuals
// DB에 저장되는 값은 password인데, 회원가입, 정보 수정시에는 아래 값들이 필요합니다.
// DB에 저장되지 않아도 되는 정보들은 virtual로 만들어 줍니다.
userSchema
  .virtual("passwordConfirmation")
  .get(function() {
    return this._passwordConfirmation;
  })
  .set(function(value) {
    this._passwordConfirmation = value;
  });

userSchema
  .virtual("originalPassword")
  .get(function() {
    return this._originalPassword;
  })
  .set(function(value) {
    this._originalPassword = value;
  });

userSchema
  .virtual("currentPassword")
  .get(function() {
    return this._currentPassword;
  })
  .set(function(value) {
    this._currentPassword = value;
  });

userSchema
  .virtual("newPassword")
  .get(function() {
    return this._newPassword;
  })
  .set(function(value) {
    this._newPassword = value;
  });

// password validation
// DB에 정보를 생성, 수정하기 전에 mongoose가 값이 유효(valid)한지 확인(validate)을 하게 되는데 password항목에 custom(사용자정의) validation 함수를 지정할 수 있습니다.
// virtual들은 직접 validation이 안되기 때문에(DB에 값을 저장하지 않으니까 어찌보면 당연합니다) password에서 값을 확인하도록 했습니다.
// validation callback 함수 속에서 this는 user model입니다.
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
var passwordRegexErrorMessage =
  "Should be minimum 8 characters of alphabet and number combination!";
userSchema.path("password").validate(function(v) {
  var user = this;

  /* =============================
    CREATE USER
  ===============================*/
  // model.isNew 항목이 true이면 새로 생긴 model(DB에 한번도 기록되지 않았던 model) 즉, 새로 생성되는 user
  // 회원가입의 경우 password confirmation값이 없는 경우, password와 password confirmation값이 다른 경우에 유효하지않음처리(invalidate)
  if (user.isNew) {
    if (!user.passwordConfirmation) {
      user.invalidate(
        "passwordConfirmation",
        "Password Confirmation is required!"
      );
    }
    if (!passwordRegex.test(user.password)) {
      user.invalidate("password", passwordRegexErrorMessage);
    } else if (user.password !== user.passwordConfirmation) {
      user.invalidate(
        "passwordConfirmation",
        "Password Confirmation does not matched!"
      );
    }
  }

  /* =============================
    UPDATE USER
  ===============================*/
  // 값이 false이면 DB에서 읽어 온 model 즉, 회원정보를 수정하는 경우
  // 회원정보 수정의 경우 current password값이 없는 경우, current password값이 original password랑 다른 경우, new password 와 password confirmation값이 다른 경우 invalidate
  // 회원정보 수정시에는 항상 비밀번호를 수정하는 것은 아니기 때문에 new password와 password confirmation값이 없어도 에러는 아닙니다.
  if (!user.isNew) {
    if (!user.currentPassword) {
      user.invalidate("currentPassword", "Current Password is required!");
    }
    if (
      user.currentPassword &&
      !bcrypt.compareSync(user.currentPassword, user.originalPassword)
    ) {
      // original password와 current password가 맞는지 비교
      user.invalidate("currentPassword", "Current Password is invalid!");
    }
    if (user.newPassword && !passwordRegex.test(user.newPassword)) {
      // user의 새로운 비밀번호가 있을 경우 정규식을 만족하는지 확인한다.
      user.invalidate("newPassword", passwordRegexErrorMessage);
    } else if (user.newPassword !== user.passwordConfirmation) {
      user.invalidate(
        "passwordConfirmation",
        "Password Confirmation does not matched!"
      );
    }
  }
});

// /* =============================
//     HASH PASSWORD
// ===============================*/
// userSchema.pre("save", function(next) {
//   let user = this;
//   if (!user.isModified("password")) {
//     return next();
//   } else {
//     user.password = bcrypt.hashSync(user.password);
//     return next();
//   }
// });

// /* =============================
//     AUTHENTICATE
// ===============================*/
// userSchema.methods.authenticate = function(password) {
//   let user = this;
//   return bcrypt.compareSync(password, user.password);
// };

/* =============================
    ENCRYPT PASSWORD
===============================*/
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

/* =============================
    CONFIRM VALIDPASSWORD
===============================*/
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// user 모델을 생성하고 앱에 공개(expose)
module.exports = mongoose.model("User", userSchema);
