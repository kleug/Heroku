// Import entities
var User = require('../models/user');
var Forgot = require('../models/forgot');

// Import Modules
var Promise = require('bluebird');
var crypto = require('crypto');
var multer = require('multer');
var express = require('express');

var Utils = require('../utils');
var Constants = require('../constants');

// Global vars
var upload = multer({dest: 'public/uploads/users_avatars'});


var router = express.Router();

function randomString(len, charSet) {
	charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var randomString = '';
	for (var i = 0; i < len; i++) {
		var randomPoz = Math.floor(Math.random() * charSet.length);
		randomString += charSet.substring(randomPoz,randomPoz+1);
	}
	return randomString;
}

// ok
router.post("/", function(req, res) {
    var user = new User();
    var mdsum = crypto.createHash('md5');

    Utils.checkToken(req, res, true).then(function(result) {
	if (result) {
	    Utils.sendUnauthorized(req, res);
	    return;
	}
	var missing = Utils.checkFields(req.body, ["username", "password", "isAdmin", "email", "sendWelcomeMail"]);
	if (missing.length != 0)
	    return res.send({message: Utils.Constants._MSG_ARGS_, details: "Missing followwing properties : " + missing, code: Utils.Constants._CODE_ARGS_});

	if (Utils.validateFormatInput(req.body.password, Utils.Constants._REGEX_PWD_) === false)
		return res.send({message: Utils.Constants._MSG_PWD_FORM_, details: "Should containt atleast 8 character whose containt 1 Number, 1 big char and 1 small char .", code: Utils.Constants._CODE_PWD_});
	if (Utils.validateFormatInput(req.body.email, Utils.Constants._REGEX_MAIL_) === false)
		return res.send({message: Utils.Constants._MSG_MAIL_FORM_, details: "Bad email format", code: Utils.Constants._CODE_MAIL_});

	user.username = req.body.username;
	mdsum.update(req.body.password);
	user.password = mdsum.digest('hex');
	user.created_on = Date.now() / 1000 | 0;
	user.isAdmin = req.body.isAdmin;
	user.email = req.body.email;
	user.timelines_id = [];;

	if (req.body.sendWelcomeMail) {
	    try {
	    	var mail_text = Utils.loadFile(global.config.mail.welcomeMail.templates.text);
	    	var mail_html = Utils.loadFile(global.config.mail.welcomeMail.templates.html);
	    } catch (err) {
	    	console.log(err);
	    	return res.send({message: 'Error while fetching mail template, action canceled', details: err, code: Utils.Constants._CODE_FAILED_});
	    }
	}

	user.save(function(err) {
	    if (err)
	    	return Utils.sendError(res, err);
	    if (req.body.sendWelcomeMail) {
	    	var helper = require('sendgrid').mail;
	  	  
	    	var from_email = new helper.Email('"' + global.config.mail.welcomeMail.settings.fromName+'"<'+global.config.mail.welcomeMail.settings.fromAddress+'>');
	    	var to_email = new helper.Email(user.email);
	    	var subject = global.config.mail.welcomeMail.settings.subject;
	    	var content = new helper.Content("text/html", Utils.parseWelcomeMail(mail_html, user, req));
	    	
	    	var mail = new helper.Mail(from_email, subject, to_email, content);
	    	
	    	if (Utils.sendMyEmail(mail) === false)
	    		return res.json({message: Utils.Constants._MSG_CREATED_ + " But email was not sent", details: user, code: Utils.Constants._CODE_CREATED_});
	    	res.json({message: Utils.Constants._MSG_CREATED_, details: user, code: Utils.Constants._CODE_CREATED_});
	    }
	});
    });
});

// ok
router.post("/logOut", function(req, res) {	
    var missing = Utils.checkFields(req.body, ["username"]);
    if (missing.length != 0)
    	return res.send({message: Utils.Constants._MSG_ARGS_, details: "Missing followwing properties : " + missing, code: Utils.Constants._CODE_ARGS_});
    User.findOne({"username": req.body.username}, function(err, user) {
	if (err)
	    return Utils.sendError(res, err);
	if(!user.user_tokens)
		return res.send({message: Utils.Constants._MSG_TOKEN_, details: "User specified already logout", code: Utils.Constants._CODE_TOKEN_});
	if (user.user_tokens.indexOf(req.headers.authorization) < 0)
	    return res.send({message: Utils.Constants._MSG_TOKEN_, details: 'Token provided is not associated to the specified user', code: Utils.Constants._CODE_TOKEN_});
	// user.user_tokens.splice(user.user_tokens.indexOf(req.headers.authorization),
	// 1);
	user.user_tokens = undefined;
	user.save(function(err) {
	    if (err)
	    	return Utils.sendError(res, err);
	    var obj = user.toObject();
	    delete obj['user_tokens'];
	    res.json({message: Utils.Constants._MSG_OK_, details: obj, code: Utils.Constants._CODE_OK_});
	});
    });
});


// ok
router.post("/forgot", function(req, res) {
    if (!req.body.hasOwnProperty('email') && !req.body.hasOwnProperty('username'))
	return res.send({message: Utils.Constants._MSG_FAILED_, details: 'You must provide a [\'email\' or \'username\'] property into JSON body request in order to send reset password link', code: Utils.Constants._CODE_FAILED_});
    var toSearch = ((req.body.hasOwnProperty('email')) ? "email" : "username");
    User.findOne({[toSearch]: ((req.body.hasOwnProperty('email')) ? req.body.email : req.body.username)}, function(err, user) {
	if (err)
	    return res.send({message: Utils.Constants.MSG_UNKNOWN_, details: err, code: Utils.Constants._CODE_UNKNOWN_});
	if (!user || user === null)
	    return res.send({message: Utils.Constants._MSG_FAILED_, details: 'User not found by his ' + toSearch + ' : ' + ((req.body.hasOwnProperty('email')) ? req.body.email : req.body.username), code: Utils.Constants._CODE_FAILED_});

	var forgotHash = randomString(42);
	var forgot = new Forgot();

	forgot.username = req.body.username;
	forgot.date = Date.now() / 1000 | 0;
	forgot.hash = forgotHash;
	forgot.ip = req.connection.remoteAddress;
	forgot.user_id = user.id;
	forgot.used = false;

	try {
	   // var mail_text = Utils.loadFile(global.config.mail.forgotMail.templates.text);
	    var mail_html = Utils.loadFile(global.config.mail.forgotMail.templates.html);
	} catch (err) {
	    return res.send({message: Utils.Constants._MSG_UNKNOWN_, details: 'Error while fetching mail template, action canceled', code: Utils.Constants._CODE_UNKNOWN_});
	}
	forgot.save(function(err) {
	    if (err)
	    	return res.send({message: Utils.Constants._MSG_FAILED_, details: err, code: Utils.Constants._CODE_FAILED_});
    	
	    var helper = require('sendgrid').mail;
	  	  
    	var from_email = new helper.Email('"'+global.config.mail.forgotMail.settings.fromName+'"<'+global.config.mail.forgotMail.settings.fromAddress+'>');
    	var to_email = new helper.Email(user.email);
    	var subject = global.config.mail.forgotMail.settings.subject;
    	var content = new helper.Content("text/html", Utils.parseForgotMail(mail_html, user, forgot, req, forgotHash));
    	console.log(content);
    	var mail = new helper.Mail(from_email, subject, to_email, content);
    	if (Utils.sendMyEmail(mail) === false)
    		return res.send({message: 'Error while sending mail, action canceled', details: err, code: Utils.Constants._CODE_FAILED_});
    	res.json({message: Utils.Constants._MSG_OK_, details: "Reset password link for " + user.username + " was sent to " + user.email, code: Utils.Constants._CODE_OK_});
	});
    });
});


router.route("/forgot/:id/:hash")
	.all(function(req, res, next){
		Forgot.findById(req.params.id, function(err, forgot) {
			if (err)
			    return Utils.sendError(res, err);
			if (!forgot || forgot === null)
			    return res.send({messparamsage: Utils.Constants._MSG_FAILED_, details: "Bad forgot ID", code: Utils.Constants._CODE_FAILED_});
			if (forgot.hash != req.params.hash)
			    return res.send({message: Utils.Constants._MSG_FAILED_, details: "Bad Hash provided", code: Utils.Constants._CODE_FAILED_});
			if (forgot.used)
			    return res.send({message: Utils.Constants._MSG_FAILED_, details: 'This reset link has already been used', code: Utils.Constants._CODE_FAILED_});
			if (eval(Date.now() / 1000 - forgot.date) >= (60 * 30))
			    return res.send({message: Utils.Constants._MSG_FAILED_, details: 'Link expired', code: Utils.Constants._CODE_FAILED_});
			res.locals.forgot = forgot;
			next();
		});
	})
	.get(function(req, res) {
		User.findById(res.locals.forgot.user_id, function(err, user) {
		    if (err)
		    	return Utils.sendError(res, err);
		    try {
			    var page_html = Utils.loadFile(global.config.webpage.modifyPwd);
			} catch (err) {
			    return res.send({message: Utils.Constants._MSG_UNKNOWN_, details: 'Error while fetching modify template, action canceled', code: Utils.Constants._CODE_UNKNOWN_});
			}
			page_html = Utils.parseChangePwd(page_html, req.originalUrl);
			res.send(page_html);
		});
	})
	.post(function(req, res) {
		User.findById(res.locals.forgot.user_id, function(err, user) {
			if (err)
				return Utils.sendError(res, err);
			if (!Utils.checkFields(req.body, ["pwd1", "pwd2"]).length) {
				if (Utils.validateFormatInput(req.body.pwd1, Utils.Constants._REGEX_PWD_) === false)
					return res.send({message: Utils.Constants._MSG_PWD_FORM_, details: "Should containt atleast 8 character whose containt 1 Number, 1 big char and 1 small char .", code: Utils.Constants._CODE_PWD_});
				var mdsum = crypto.createHash('md5');
			    mdsum.update(req.body.pwd1);
			    user.password = mdsum.digest('hex');
			    user.save(function(err) {
			    	if (err)
			    		return res.send({message: Utils.Constants._MSG_UNKNOWN_, details: err, code: Utils.Constants._CODE_UNKNOWN_});	    		
			    });
			    res.locals.forgot.used = true;
			    res.locals.forgot.save(function(err, forgot) {
			    	if (err)
			    		return Utils.sendError(res, err);
			    	console.log("ON A FINI")
			    	return res.send("Password modify ! You can log again !");
			    });
			}
		});
	});
	

// ok check user_token(s)
router.post("/login", function(req, res) {
    var mdsum = crypto.createHash('md5');

    var missing = Utils.checkFields(req.body, ["username", "password"]);
    if (missing.length != 0)
	return res.send({message: Utils.Constants._MSG_ARGS_, details: "Missing followwing properties : " + missing, code: Utils.Constants._CODE_ARGS_});
    User.findOne({"username": req.body.username}, function(err, user) {
	if (err)
	    return res.send({message: Utils.Constants._MSG_UNKNOWN_, details: err, code: _CODE_UNKNOWN_});
	mdsum.update(req.body.password);
	if (!user || user.password != mdsum.digest('hex'))
	    return res.json({message: Utils.Constants._MSG_FAILED_, details: "Bad user and/or password", code: Utils.Constants._CODE_FAILED_});
	var obj = user.toObject();
	obj.user_token = randomString(42);
	user.user_tokens = obj.user_token;
    user.save(function(err) {
	    if (err)
		return res.send({message: Utils.Constants._MSG_UNKNOWN_, details: err, code: Utils.Constants._CODE_UNKNOWN_});
	    delete obj['user_tokens'];
	    res.json({message: Utils.Constants._MSG_OK_, details: obj, code: Utils.Constants._CODE_OK_});
	});
    });
});

// ok
router.get("/", function(req, res) {
    Utils.checkToken(req, res, true).then(function(result) {
	if (!result)
	    return Utils.sendUnauthorized(req, res);
	User.find({}, function(err, users) {
	    if (err)
	    	return Utils.sendError(res, err);
	    res.json({message: Utils.Constants._MSG_OK_, details: users, code: Utils.Constants._CODE_OK_});
	});
    });
});


//test route put your test here en call /users/test
router.get("/test", function(req, res) {
	var regex =  Utils.Constants._REGEX_PWD_;
	console.log("SHOULD BE YES  === %j", process.env.URL);
	console.log("SHOUlD BE NO === %j", regex.test("0azertyui"));
	Forgot.find({}, function(err, users) {
	    if (err)
	    	return Utils.sendError(res, err);
	    res.json({message: Utils.Constants._MSG_OK_, details: users, code: Utils.Constants._CODE_OK_});
	});
});


// OK
router.get("/:id", function(req, res) {
	Utils.checkToken(req, res, false, req.params.id).then(function(result) {
	if (!result) {
	    Utils.sendUnauthorized(req, res);
	    return;
	}
	
	User.findById(req.params.id, function(err, user) {
	    if (err)
		return Utils.sendError(res, err);
	    
	    // Result
	    var result = user.toObject();

	    //
	    // DIF ????
	    //
	    
	    // Get User with fetching objects
	    if (req.query.full == Constants._TRUE_) {
	    	res.json({message: Utils.Constants._MSG_OK_, details: result, code: Utils.Constants._CODE_OK_});
	    } else
		// Get user without fetching objects
		// Send result
	    	res.json({message: Utils.Constants._MSG_OK_, details: result, code: Utils.Constants._CODE_OK_});
	});
    });
});

// ok
// check rules who can modify what
router.put("/:id", function(req, res) {
    var shasum = crypto.createHash('sha1');
    Utils.checkToken(req, res, false, req.params.id).then(function(result) {
	if (!result)
	    return Utils.sendUnauthorized(req, res);
	User.findById(req.params.id, function(err, user) {
	    if (err)
	    	return Utils.sendError(res, err);
	    
	    if (req.body.hasOwnProperty('username'))
	    	user.username = req.body.username;
	    if (req.body.hasOwnProperty('email')){
			if (Utils.validateFormatInput(req.body.email, Utils.Constants._REGEX_MAIL_) === false)
				return res.send({message: Utils.Constants._MSG_MAIL_FORM_, details: "Bad email format", code: Utils.Constants._CODE_MAIL_});
	    	user.email = req.body.email;
	    }
	    if (req.body.hasOwnProperty('password')) {
	    	 if (Utils.validateFormatInput(req.body.password, Utils.Constants._REGEX_PWD_) === false)
	 			return res.send({message: Utils.Constants._MSG_PWD_FORM_, details: "Should containt atleast 8 character whose containt 1 Number, 1 big char and 1 small char .", code: Utils.Constants._CODE_PWD_});	    	
	    	shasum.update(req.body.password);
	    	user.password = shasum.digest('hex');
	    }

	    if (req.body.hasOwnProperty('isAdmin')) {
		Utils.checkToken(req, res, true).then(function(result) {
		    if (req.body.hasOwnProperty('isAdmin'))
		    	user.isAdmin = req.body.isAdmin;
		    user.save(function(err) {
			if (err)
			    return Utils.SendError(res, err);
			res.json({message: Utils.Constants._MSG_MODIFIED_, details: user, code: Utils.Constants._CODE_MODIFIED_});
		    });
		});
	    } else {
		user.save(function(err) {
		    if (err)
			return Utils.SendError(res, err);
		    res.json({message: Utils.Constants._MSG_MODIFIED_, details: user, code: Utils.Constants._CODE_MODIFIED_});
		});
	    }
	});
    });
});


// OK
router.delete("/:id", function(req, res) {
    Utils.checkToken(req, res, true).then(function(result) {
	if (!result)
	    return Utils.sendUnauthorized(req, res);
	// No check if remove delete something or not. Result in
	// user.result.n console.log()
	User.remove({_id: req.params.id}, function(err, user) {
	    if (err)
	    	return Utils.sendError(res, err);
	    res.json({message: Utils.Constants._MSG_DELETED_, details: user, code: Utils.Constants._CODE_DELETED_});
	});
    });
});

module.exports = router;
