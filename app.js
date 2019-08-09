//jshint esversion:6\
require('dotenv').config()

const md5 = require("md5");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const saltRounds = 10;


mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const express = require('express');

const bodyParser = require('body-parser');

const ejs = require('ejs');

const encrypt = require('mongoose-encryption');

const app = express();


app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.set("view engine", "ejs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});

const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res) {
  res.render("home");
  console.log(md5("ashish"));
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {

  const username = req.body.username;
  const password = req.body.password;
  console.log(password);
  bcrypt.hash(password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    User.findOne({
        email: username
      },
      function(err, foundUser) {
        if (err) {
          res.send(err);
        } else {
          if (foundUser) {
            bcrypt.compare(password, foundUser.password, function(err, result) {
                if(result===true)
                  res.render("secrets");
                else {
                    res.send("Wrong Username Or Password");
                    console.log(foundUser);
                    console.log(hash);
                  }

              });


          } else
            console.log(foundUser);
        }
      }
    );
  });

});


app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  bcrypt.hash(password, saltRounds, function(err, hash) {
    const newUser = new User({
      email: username,
      password: hash
    });
    newUser.save(function(err) {
      if (err)
        res.send(err);
      else
        res.render("secrets");
    });
  });


});

app.get("/logout", function(req, res) {
  res.render("home");
});

app.listen(process.env.port || 3000, function() {
  console.log("Server Started With port 3000");
});
