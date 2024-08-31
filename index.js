// init project
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

// basic config and routing
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// listen for requests  MAKE SURE CORRECT IN ALL PROJECTS
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// log requests in console
app.use("/", function (req, res, next) {
  console.log("+++");
  console.log(req.method + " " + req.path + " - " + req.ip);
  console.log("---");
  next();
});

// define user schema
let userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number },
  log: { type: [{}] },
});

// define user model
let User = mongoose.model("User", userSchema);

// handle user creation
/* can post to /api/users with username to create new user
return response: json object with username and _id properites
*/
app.post("/api/users", function (req, res) {
  console.log("+++++++++++++++");
  console.log("+++ post to /api/users +++");
  console.log("+++++++++++++++");

  console.log("~~~");
  console.log("Username submitted in form:", req.body.username);
  console.log("~~~");

  let newUser = new User({
    username: req.body.username,
    count: 0,
  });
  newUser.save(function (err, data) {
    if (err) return console.error(err);
    console.log("~~~");
    console.log("User data saved in database:", data);
    console.log(
      "User data object displayed in json:",
      "username",
      data.username,
      "_id",
      data._id
    );
    console.log("~~~");
    res.json({ username: data.username, _id: data._id });
  });
  console.log("---------------");
  console.log("--- post to /api/users ---");
  console.log("---------------");
});

// handle get request to /api/users
/* can get request to /api/users returns an array of all users, each element is array is an object literal with username and _id
will have to filter this for user username and _id
*/
app.get("/api/users", function (req, res) {
  console.log("+++++++++++++++");
  console.log("+++ get from /api/users +++");
  console.log("+++++++++++++++");
  User.find({})
    .sort({ username: 1 })
    .select("username _id")
    .exec(function (err, data) {
      if (err) return console.error(err);
      res.json(data);
    });
  console.log("---------------");
  console.log("--- get from /api/users ---");
  console.log("---------------");
});

// handle post request to /api/users/:_id/exercises
/* can post to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date supplied, use current date
return response, json object will be the user object with the exercises fields added 
*/
app.post("/api/users/:_id/exercises", function (req, res) {
  console.log("+++++++++++++++");
  console.log("+++ post to api/users/:_id/exercises +++");
  console.log("+++++++++++++++");
  console.log("req.body:", req.body);
  console.log("req.params:", req.params);

  console.log("~~~");
  //let id = req.body[':_id'];
  let id = req.params._id;
  console.log("id:", id);

  let date;
  if (!req.body.date) {
    date = new Date().toDateString();
  } else {
    date = new Date(req.body.date).toDateString();
  }
  console.log("date:", date);

  let logEntry = {
    description: req.body.description,
    duration: +req.body.duration,
    date: date,
  };
  console.log("logEntry:", logEntry);
  console.log("~~~");

  User.findById({ _id: id }, function (err, user) {
    if (err) return console.error(err);
    console.log("~~~");
    console.log("user found:", id, user.username);
    console.log("log entry to push:", logEntry);
    console.log("user object before", user);
    console.log("~~~");
    user.log.push(logEntry);
    console.log("user count before", user.count);
    user.count++;
    console.log("user count after:", user.count);
    user.save(function (err, updatedUser) {
      if (err) return console.error(err);
      console.log("updatedUser object:", updatedUser);
      console.log(
        "return object",
        "username",
        updatedUser.username,
        "description",
        logEntry.description,
        "duration",
        logEntry.duration,
        "date",
        logEntry.date,
        "_id",
        updatedUser._id
      );
      res.json({
        username: updatedUser.username,
        description: logEntry.description,
        duration: logEntry.duration,
        date: logEntry.date,
        _id: updatedUser._id,
      });
    });
  });
  console.log("---------------");
  console.log("--- post to api/users/:_id/exercises ---");
  console.log("---------------");
});

// handle get request from /api/users/:_id/logs
/* can get request from /api/users/:_id/logs to get full exercise log of user
from and to are dates in yyyy-mm-dd format
limit is an integer of how many logs to send back
*/
app.get("/api/users/:_id/logs", function (req, res) {
  console.log("+++++++++++++++");
  console.log("+++ get from /api/users/:_id/logs +++");
  console.log("+++++++++++++++");

  console.log("Query is:", req.query);
  let from, to, limit;
  if (req.query.from) {
    from = req.query.from;
  }
  if (req.query.to) {
    to = req.query.to;
  }
  if (req.query.limit) {
    limit = req.query.limit;
  }
  console.log("From:", from, "To:", to, "Limit:", limit);

  let id = req.params._id;
  console.log("Id:", id);

  User.find({ _id: id }, function (err, user) {
    if (err) return console.error(err);
    console.log("log:", user[0].log);

    let filteredLog;

    let formattedLog = user[0].log.map((obj) => {
      if (obj.date) {
        return { ...obj, date: new Date(obj.date).toISOString().split("T")[0] };
      }
      return obj;
    });

    console.log("~~~~ pre-formattedlog:", user[0].log);
    console.log("~~~~ FomattedLog:", formattedLog);

    if (from && to && limit) {
      filteredLog = formattedLog
        .filter((x) => x.date > from && x.date < to)
        .slice(0, limit);
      console.log("filteredLog with from and to and limit:", filteredLog);
    } else if (from && to) {
      filteredLog = formattedLog.filter((x) => x.date > from && x.date < to);
      console.log("filteredLog with from and to:", filteredLog);
    } else if (limit) {
      filteredLog = formattedLog.slice(0, limit);
      console.log("filteredLog with limit:", filteredLog);
    } else {
      filteredLog = formattedLog;
      console.log("filteredLog without params:", filteredLog);
    }

    returnLog = filteredLog.map((obj) => {
      if (obj.date) {
        return { ...obj, date: new Date(obj.date).toDateString() };
      }
      return obj;
    });

    console.log("log to return:", returnLog);

    res.json({
      username: user[0].username,
      count: user[0].count,
      _id: user[0]._id,
      log: returnLog,
    });
  });

  console.log("---------------");
  console.log("--- get from /api/users/:_id/logs ---");
  console.log("---------------");
});
