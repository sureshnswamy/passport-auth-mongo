var express = require('express');
var router = express.Router();
var async = require('async');
var flash = require('connect-flash');
var crypto = require('crypto');
var nodemailer = require('nodemailer')
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


	// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	// Handle /forgot password form
	// ************************************

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
						// res.render ('forgot', {message:req.flash('error')} )
						req.flash('error', 'No account with that email address exists');
						return res.redirect;
					}
					user.resetPasswordToken = token;
        	user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        	user.save(function(err){
        		done(err,token,user);
        	})
				})
			},
			function(token, user, done) {
	      var smtpTransport = nodemailer.createTransport({
	         service: 'Gmail',
    				auth: {
			        user: 'somename@@gmail.com',
			        pass: 'password',
	        	}
	      });
	      var mailOptions = {
	        to: user.email,
	        from: 'inkiscot@gmail.com',
	        subject: 'Node.js Password Reset',
	        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
	          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
	          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
	          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
	      };
	      smtpTransport.sendMail(mailOptions, function(err) {
	        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
	        done(err, 'done');
	      });
    	}
    	],function(err) {
    		if (err) return next(err);
    			res.redirect('/forgot');
  		});


	});
	// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	// Handle /reset  password form if user is valid
	// ************************************
	router.get('/reset/:token', function(req, res) {
	  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
	    if (!user) {
	      req.flash('error', 'Password reset token is invalid or has expired.');
	      return res.redirect('/forgot');
	    }
	    res.render('reset', {
	      user: req.user
	    });
	  });
	});

	router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            if(!user){
            	req.flash('error');
	      			return res.redirect('/forgot');
            } else {
            	console.log(user);
            	done(user);
            }
            
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'Gmail',
        auth: {
          user: 'somename@gmail.com',
          pass: 'password'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});


	return router;
}