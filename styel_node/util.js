const jwt = require("jsonwebtoken");
const JWT_SECRET = "dlejfldna"; // 이더리움
var util = {};

// success json 을 만드는 함수입니다. API가 return하는 json의 형태를 통일시키기 위해 바로 함수를 통해 json 오브젝트를 만들고 이를 return하게 됩니다.
util.successTrue = function(data) {
  return {
    success: true,
    message: null,
    errors: null,
    data: data
  };
};

// API가 성공하지 못한 경우 return하는 json의 형태를 통일시키기 위해 error 오브젝트나 message를 받아서 error json을 만드는 함수 입니다.
util.successFalse = function(err, message) {
  if (!err && !message) message = "data not found";
  return {
    success: false,
    message: message,
    errors: err ? util.parseError(err) : null,
    data: null
  };
};

// mongoose를 통해 resource를 조작하는 과정에서 발생하는 에러를 일정한 형태로 만들어 주는 함수입니다.
// resource 조작중에 에러가 mongoose 내는 에러와 mongoDB에서 내는 에러의 형태가 다르기 때문에 이 함수를 통해 에러의 형태를
// { 항목이름: { message: "에러메세지" } 로 통일시켜주는 함수입니다.
// if 에서 mongoose의 model validation error를, else if 에서 mongoDB에서 username이 중복되는 error를, else 에서 그 외 error들을 처리합니다.
util.parseError = function(errors) {
  var parsed = {};
  if (errors.name == "ValidationError") {
    for (var name in errors.errors) {
      var validationError = errors.errors[name];
      parsed[name] = { message: validationError.message };
    }
  } else if (errors.code == "11000" && errors.errmsg.indexOf("username") > 0) {
    parsed.username = { message: "This username already exists!" };
  } else {
    parsed.unhandled = errors;
  }
  return parsed;
};

// middlewares
util.isLoggedin = function(req, res, next) {
  let token = req.headers["x-access-token"];
  if (!token) return res.json(util.successFalse(null, "token is required!"));
  else {
    // jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) { // 환경 변수에 등록된 JWT_SECRET 접근, 여기서는 간단하게 nodejs에 넣어서 사용합니다.
    // 미들웨어로 token이 있는지 없는지 확인하고 token이 있다면 jwt.verify함수를 이용해서 토큰 hash를 확인하고 토큰에 들어있는 정보를 해독합니다.
    // 해독한 정보는 req.decoded에 저장하고 있으며 이후 로그인 유무는 decoded가 있는지 없는지를 통해 알 수 있습니다.
    jwt.verify(token, JWT_SECRET, function(err, decoded) {
      if (err) return res.json(util.successFalse(err));
      else {
        req.decoded = decoded;
        next();
      }
    });
  }
};

module.exports = util;
