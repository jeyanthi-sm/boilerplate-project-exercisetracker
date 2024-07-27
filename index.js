const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("strictQuery", true);
//User Schema
let userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: false },
});
let User = mongoose.model("User", userSchema);
//Exercise Schema
let exerciseSchema = new mongoose.Schema({
  ":_id": { type: String }, // required: true, unique: false },
  description: { type: String }, //required: true, unique: false },
  duration: Number,
  date: { type: Date, default: new Date() }, //String,
});
let Exercise = mongoose.model("Exercise", exerciseSchema);
//Log Schema
let logSchema = new mongoose.Schema({
  ":_id": { type: String }, // required: true, unique: false },
  count: Number,
  log: [
    {
      description: { type: String },
      duration: Number,
      date: Date,
    },
  ],
});
let Log = mongoose.model("Log", logSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post(
  "/api/users",
  bodyParser.urlencoded({ extended: false }),
  (req, res, next) => {
    let newUser = new User(req.body);
    newUser.save((err, savedUser) => {
      if (err) {
        return res.status(500).json({ error: "Failed to save user" });
      }
      res.json(savedUser);
    });
  }
);

app.get("/api/users", (req, res, next) => {
  User.find({}, (err, data) => {
    if (err) return next(err);
    res.json(data);
    next(err, data);
  });
});

//exercise
app.post(
  "/api/users/:_id/exercises",
  bodyParser.urlencoded({ extended: false }),
  async (req, res, next) => {
    const userId = req.params._id;
    const userFound = await User.findById(userId).exec();
    if (userFound["username"] === null) res.send("User not found ");
    else {
      let inputExerciseDate;
      console.log(req.body.date);
      if (req.body.date === "" || req.body.date === undefined)
        inputExerciseDate = new Date();
      else inputExerciseDate = new Date(req.body.date);
      console.log(inputExerciseDate);
      let inputExercise = new Exercise({
        ":_id": userId,
        username: userFound["username"],
        date: inputExerciseDate,
        duration: req.body.duration,
        description: req.body.description,
      });
      inputExercise.save((err) => {
        if (err) {
          console.log(err);
          return res.send(err);
        }
        console.log("before json");
        console.log(typeof userFound["id"]);
        console.log(typeof userFound["username"]);
        console.log(typeof inputExerciseDate.toDateString());
        console.log(typeof Number(req.body.duration));
        console.log(typeof req.body.description);

        res.json({
          _id: userFound["id"], //userId,
          username: userFound["username"],
          date: inputExerciseDate.toDateString(),
          duration: parseInt(req.body.duration),
          description: req.body.description,
        });
      });
    }
  }
);
//exercise
app.get(
  "/api/users/:_id/exercises",
  bodyParser.urlencoded({ extended: false }),
  async (req, res, next) => {
    const userId = req.params._id;
    let responseObj = {};
    const userFound = await User.findById(userId).exec();

    const exerciseFound = await Exercise.find({ _id: userId }).exec();

    if (userFound["username"] === null) res.send("User not found ");
    if (exerciseFound["id"] === null) res.send("Exercise not found ");

    res.json({
      _id: userFound["id"], //userId,
      username: userFound["username"],
      date: exerciseFound.date.toDateString(),
      duration: exerciseFound.duration,
      description: exerciseFound.description,
    });
  }
);

//logs
app.get(
  "/api/users/:_id/logs",
  bodyParser.urlencoded({ extended: false }),
  async (req, res, next) => {
    const userId = req.params._id;
    const fromDate = new Date(req.query?.from);
    const toDate = new Date(req.query?.to);
    const limit = Number(req.query?.limit ? req.query.limit : 0);
    console.log(limit);
    let findQuery = {};
    findQuery = { ":_id": userId };
    if (
      fromDate instanceof Date &&
      !isNaN(fromDate) &&
      toDate instanceof Date &&
      !isNaN(toDate)
    ) {
      findQuery.date = {
        $gte: fromDate,
        $lte: toDate,
      };
      //findQuery.date.$gte = someDate;
      //findQuery.date.$lte = toDate;
    }
    //if (limit) findQuery.limit = Number(limit);
    let responseObj = {};
    const userFound = await User.findById(userId).exec();
    if (userFound["username"] === null) res.send("User not found ");
    console.log(userId);
    responseObj = { _id: userFound.id, username: userFound.username };

    console.log(findQuery);

    Exercise.find(findQuery)
      .limit(limit)
      .then((exercises) => {
        responseObj.count = exercises.length;
        responseObj.log = //exercises;
          exercises.map((exercise) => {
            return {
              _id: exercise?._id,
              description: exercise?.description,
              duration: exercise?.duration,
              date: exercise.date?.toDateString(),
            };
          });

        res.json(responseObj);

        //      GET /api/users/66a49f18a2ad21e25b5565dc/logs?from=1989-12-31&to=1990-01-04 HTTP/1.1
        //GET /api/users/66a49f18a2ad21e25b5565dc/logs?limit=1 HTTP/1.1
      });
  }
);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
