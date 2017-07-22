var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
 
module.exports = mongoose.model('User',{
    username: String,
    password: String,
    email: String,
    firstName: String,
    lastName: String,
    resetPasswordToken: String,
		resetPasswordExpires: Date
});