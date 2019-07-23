/* =============================
    LOAD THE DEPENDENCIES
===============================*/
const express = require("express");
const path = require("path"); // 윈도우, unix등의 경로 호환 문제 해결 window: \bin\www, unix: /bin/www

const session = require("express-session");
// const passport = require("passport"); // 세션 미들웨어
const bcrypt = require("bcryptjs"); // 암호화 모듈
const jwt = require("jsonwebtoken"); // Json Web Token 인증 모듈
const cookieParser = require("cookie-parser");

const fs = require("fs"); // 파일 생성, 삭제 등 컨트롤

const flash = require("connect-flash"); // flash message (세션에 담아서 전달)
const morgan = require("morgan"); // 로깅 모듈

const mongoose = require("mongoose"); // mongodb 연동 모듈
const MongoStore = require("connect-mongo")(session); // session값을 mongoDB에 저장

/* =============================
    LOAD THE CONFIG
===============================*/
const mongodbConfig = require("./server/config/mongodb"); // setup mongodb database url
const port = process.env.PORT || 4000; // port

// define model
// const userData = require("./models/user");

// router
const apiUsers = require("./routes/api/users");
const apiAuth = require("./routes/api/auth");
// const indexRouter = require("./routes/index")(express);
// const usersRouter = require("./routes/user")(express, passport);

/* =============================
    EXPRESS CONFIGURATION
===============================*/
const app = express();

// parse JSON and url-encoded query
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false
  })
);
app.use(function(req, res, next) {
  // CORS에  x-access-token이 추가되었습니다. jwt로 생성된 토큰은 header의 x-access-token 항목을 통해 전달됩니다.
  // CORS(Cross-Origin Resource Sharing): 한 도메인에서 로드되어 다른 도메인에 있는 리소스와 상호 작용하는 클라이언트 웹 애플리케이션에 대한 방법을 정의
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "content-type, x-access-token");
  next();
});

// print the request log on console
app.use(morgan("dev"));

// set the secret key variable for jwt
app.set("jwt-secret", mongodbConfig.secret);

app.use(cookieParser());

// flash message // connect-flash 모듈 사용
app.use(flash());

/* =============================
    STATICK FILES & VIEW ENGINE
===============================*/
// 정적파일(Static files)다루기
app.use(express.static(path.join(__dirname, "public")));

// view engine setup. ejs 모듈
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

/* =============================
    PASSPORT
===============================*/
// passport session
// app.use(
//   session({
//     secret: "rkswlrGhkdlxld", // 쿠키를 임의로 변조하는것을 방지하기 위한 sign값. 원하는 값을 넣어주자
//     resave: false, // 세션을 언제나(변하지 않아도)) 저장할 것인지 정하는 값. express-session documentation에서는 이 값을 false로 하는것을 권장하고 필요에 따라 true로 설정.
//     saveUninitialized: true, // uninitialized 세션이란 새로 생겼지만 변경되지 않은 세션을 의미한다. true로 설정 할 것을 권장한다.
//     // store: new FileStore() // session-file-store 모듈을 사용해서 세션값을 저장한다
//     store: new MongoStore({
//       url: mongodbConfig.url,
//       collection: "sessions"
//     })
//   })
// );

// setup passport
// require("./server/config/passport")(passport);
// Initialize passport auth
// app.use(passport.initialize());
// 영구적인 로그인 세션
// app.use(passport.session());

// // session 값을 전역(모든페이지)에서 사용 할 수 있게 해준다.
// app.use((req, res, next) => {
//   res.locals.sess_user = req.session.passport.user;
//   next();
// });

/* =============================
    Routes
===============================*/
// configure api router
app.use("/api/users", apiUsers);
app.use("/api/auth", apiAuth);

// app.use("/users", usersRouter);
// app.use("/", indexRouter);

/* =============================
    ERROR
===============================*/
// catch 404 and forward to error handler.
app.use((req, res, next) => {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

/* =============================
    CONNECT TO MONGODB SERVER
===============================*/
mongoose.connect(mongodbConfig.url, {
  useNewUrlParser: true
});

// global.Promise를 mongoose.Promise에 대입했습니다. 기본 프로미스를(mPromise) 노드의 프로미스로 교체한 것.
mongoose.Promise = global.Promise;

mongoose.set("useCreateIndex", true);
var db = mongoose.connection;
db.on(
  "error",
  console.error.bind(
    console,
    "MongoDB Connection Error. Make sure MongoDB is running."
  )
);
db.once("open", () => {
  console.log("Connected to mongod server");
});

/* =============================
    OPEN SERVER
===============================*/
app.listen(port, () => {
  console.log(`Express Server is running on port ${port}`);
});

// Reference

// JWT & Bcrypt : https://blog.naver.com/dlghks44/221266674043
