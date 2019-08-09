//jshint esversion:6\
require('dotenv').config()
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const express = require('express');

const bodyParser = require('body-parser');

const ejs = require('ejs');

const encrypt=require('mongoose-encryption');

const app = express();


app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.set("view engine", "ejs");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});

const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({
      email: username
    },
    function(err, foundUser) {
      if (err) {
        res.send(err);
      }
      else{
        if(foundUser) {
          if (foundUser.password=== password)
            res.render("secrets");
          else {
            res.send("Wron Username Or Password");
            res.send(foundUser);
            console.log(foundUser);
          }

        }
        else
          console.log(foundUser);
    }
    }
  );
});


app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  const newUser = new User({
    email: username,
    password: password
  });
  newUser.save(function(err) {
    if (err)
      res.send(err);
    else
      res.render("secrets");
  });
});

app.listen(process.env.port || 3000, function() {
  console.log("Server Started With port 3000");
});
