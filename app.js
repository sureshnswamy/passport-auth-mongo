var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var expressSession = require('express-session');
var flash = require('connect-flash');
var brypt =require('bcrypt-nodejs');
var nodemailer = require('nodemailer')
var mongoose = require('mongoose');

var initPassport = require('./passport/init');
var routes = require('./routes/index')(passport);
var dbConfig = require('./db');
var imgroutes = require('./routes/imagefile');

mongoose.connect(dbConfig.url);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuring Passport

app.use(expressSession({secret: 'mySecretKey',
                        resave:true,
                        saveUninitialized:true}));
app.use(passport.initialize());
app.use(passport.session());

 // Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates

app.use(flash());


// Initialize Passport

initPassport(passport);

//To get the access for the functions defined in index.js class

app.use('/', routes);


app.use('/home', imgroutes);

// To store images 
//calling the function from index.js class using routes object..
app.get('/images', function(req, res) {

  imgroutes.getImages(function(err, genres) {
    if (err) {
    throw err;
    }
  res.json(genres);
   
  });
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
