var express = require('express');
var router = express.Router();
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');


var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){

	

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true  
	}));

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render('home', { user: req.user });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		req.session.destroy();
		res.redirect('/');
	});

	/* Handle forgot GET */

	router.get('/forgot', function(req,res) {
		res.render('forgot', {
			user: req.user
		});
	});

	router.post('/forgot', function(req, res, next) {
	//	console.log('here is forgot')
		async.waterfall([
			function (done) {
				crypto.randomBytes(20, function(err, buf){
					var token = buf.toString('hex');
					done(err,token);
				});
			},
			function(token,done){
				User.findOne({email:req.body.email}, function(err,user){
					console.log(req.body.email, user)
					if(!user){
						console.log(err)
						req.flash('error', 'No account with that email address exists');
						return res.redirect('/forgot');
					}
					user.resetPasswordToken = token;
        	user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        	user.save(function(err){
        		done(err,token,user);
        	})
				})
			}


			])


	});
	

	return router;
}