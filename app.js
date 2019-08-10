//jshint esversion:6\
require('dotenv').config()

const md5 = require("md5");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const saltRounds = 10;

const session = require("express-session");

const passportLocalMOngoose = require("passport-local-mongoose");

const passport = require("passport");

mongoose.connect("mongodb+srv://admin-ashish:test123@cluster0-sufhd.mongodb.net/userDB", {
  useNewUrlParser: true
});

const express = require('express');

const bodyParser = require('body-parser');

const ejs = require('ejs');

const encrypt = require('mongoose-encryption');

const app = express();

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const findOrCreate = require('mongoose-findorcreate');
app.use(session({
  secret: 'This is our secret ',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));
mongoose.set('useCreateIndex', true);

app.set("view engine", "ejs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    //required: true
  },
  password: {
    type: String,
  },
  googleId:String,
  secret:String
});


userSchema.plugin(passportLocalMOngoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});

//var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password

  });
  req.login(user, function(err) {
    if (err)
      console.log(err);
    else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/secrets", function(req, res) {
  User.find({"secret":{$ne:null}},function(err,foundUsers){
    if(err)
      console.log(err);
    else
      res.render("secrets",{usersWithSecrets: foundUsers});
  });
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(req.body);
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
  });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });

app.get("/submit",function(req,res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedSecret=req.body.secret;
  console.log(req.user.id);
  User.findById(req.user.id,function(err,foundUser){
    if(err)
      console.log(err);
    else {
      foundUser.secret=submittedSecret;
      foundUser.save(function(){
        res.redirect("/secrets");
      });
    }
  });
  res.redirect("/");
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.listen(process.env.port || 3000, function() {
  console.log("Server Started With port 3000");
});
