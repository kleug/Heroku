// Import entities
var User = require('../models/user');

// Import Modules
var Promise = require('bluebird');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
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
		var mailOptions = {
		    from: '"' + global.config.mail.welcomeMail.settings.fromName+'"<'+global.config.mail.welcomeMail.settings.fromAddress+'>',
		    to: user.email,
		    subject: global.config.mail.welcomeMail.settings.subject,
		    text: Utils.parseWelcomeMail(mail_text, user, req),
		    html: Utils.parseWelcomeMail(mail_html, user, req)
		};
	    }

	    res.json({message: Utils.Constants._MSG_CREATED_, details: user, code: Utils.Constants._CODE_CREATED_});
	    Utils.getMailTransporter().sendMail(mailOptions, function(error, info) {
		if (error)
		    return console.log(error);
		console.log('Message sent: ' + info.response);
	    });
	});
    });
});


router.post("/logOut", function(req, res) {
    var missing = Utils.checkFields(req.body, ["username"]);
    if (missing.length != 0)
	return res.send({message: Utils.Constants._MSG_ARGS_, details: "Missing followwing properties : " + missing, code: Utils.Constants._CODE_ARGS_});
    User.findOne({"username": req.body.username}, function(err, user) {
	if (err)
	    return Utils.sendError(res, err);
	if (user.user_tokens.indexOf(req.headers.authorization) < 0)
	    res.send({message: Utils.Constants._MSG_TOKEN_, details: 'Token provided is not associated to the specified user', code: Utils.Constants._CODE_TOKEN_});
	user.user_tokens.splice(user.user_tokens.indexOf(req.headers.authorization), 1);
	user.save(function(err) {
	    if (err)
		return Utils.sendError(res, err);
	    var obj = user.toObject();
	    delete obj['user_tokens'];
	    res.json({message: Utils.Constants._MSG_OK_, details: obj, code: Utils.Constants._CODE_OK_});
	});
    });
});

router.post("/forgot", function(req, res) {
    if (!req.body.hasOwnProperty('email') && !req.body.hasOwnProperty('username'))
	return res.send({message: Utils.Constants._MSG_FAILED_, details: 'You must provide a [\'email\' or \'username\'] property into JSON body request in order to send reset password link', code: Utils.Constants._CODE_FAILED_});
    var toSearch = ((req.body.hasOwnProperty('email')) ? "email" : "username");
    User.findOne({[toSearch]: ((req.body.hasOwnProperty('email')) ? req.body.email : req.body.username)}, function(err, user) {
	if (err)
	    return res.send({message: Utils.Constants.MSG_UNKNOWN_, details: err, code: Utils.Constants._CODE_UNKNOWN_});
	if (!user || user === null)
	    return res.send({message: Utils.Constants._MSG_FAILED_, details: 'User not found by his ' + toSearch + ' : ' + ((req.body.hasOwnProperty('email')) ? req.body.email : req.body.username), code: Utils.Constants._CODE_FAILED_});

	var forgotHash = randomString(32);
	var forgot = new Forgot();

	forgot.username = req.body.username;
	forgot.date = Date.now() / 1000 | 0;
	forgot.hash = forgotHash;
	forgot.ip = req.connection.remoteAddress;
	forgot.user_id = user.id;
	forgot.used = false;

	try {
	    var mail_text = Utils.loadFile(global.config.mail.forgotMail.templates.text);
	    var mail_html = Utils.loadFile(global.config.mail.forgotMail.templates.html);
	} catch (err) {
	    return res.send({message: Utils.Constants._MSG_UNKNOWN_, details: 'Error while fetching mail template, action canceled', code: Utils.Constants._CODE_UNKNOWN_});
	}
	forgot.save(function(err) {
	    if (err)
		return res.send({message: Utils.Constants._MSG_FAILED_, details: err, code: Utils.Constants._CODE_FAILED_});
	    var mailOptions = {
		from: '"'+global.config.mail.forgotMail.settings.fromName+'"<'+global.config.mail.forgotMail.settings.fromAddress+'>',
		to: user.email,
		subject: global.config.mail.forgotMail.settings.subject,
		text: Utils.parseForgotMail(mail_text, user, forgot, req, forgotHash),
		html: Utils.parseForgotMail(mail_html, user, forgot, req, forgotHash)
	    };
	    res.json({message: Utils.Constants._MSG_OK_, details: "Reset password link for " + user.username + " will be sent to " + user.email, code: Utils.Constants._CODE_OK_});
	    Utils.getMailTransporter.sendMail(mailOptions, function(error, info) {
		if (error)
		    return console.log(error);
		console.log('Message sent: ' + info.response);
	    });
	});
    });
});

router.post("/forgot/:id", function(req, res) {
    Forgot.findById(req.params.forgot_id, function(err, forgot) {
	if (err)
	    return Utils.sendError(res, err);
	if (!forgot || forgot === null)
	    return res.send({message: Utils.Constants._MSG_FAILED_, details: "Bad forgot ID", code: Utils.Constants._CODE_FAILED_});
	if (forgot.hash != req.params.hash)
	    return res.send({message: Utils.Constants._MSG_FAILED_, details: "Bad Hash provided", code: Utils.Constants._CODE_FAILED_});
	if (forgot.used)
	    return res.send({message: Utils.Constants._MSG_FAILED_, details: 'This reset link has already been used', code: Utils.Constants._CODE_FAILED_});
	if (eval(Date.now() / 1000 - forgot.date) >= (60 * 30))
	    return res.send({message: Utils.Constants._MSG_FAILED_, details: 'Link expired', code: Utils.Constants._CODE_FAILED_});
	User.findById(forgot.user_id, function(err, user) {
	    if (err)
		return Utils.sendError(res, err);
	    forgot.used = true;
	    forgot.save(function(err, forgot) {
		if (err)
		    return Utils.sendError(res, err);
		res.json({message: Utils.Constants._MSG_OK_, details: user, code: Utils.Constants._CODE_OK_});
	    });
	});
    });
});

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
	user.user_tokens.push(obj.user_token);
	user.save(function(err) {
	    if (err)
		return res.send({message: Utils.Constants._MSG_UNKNOWN_, details: err, code: Utils.Constants._CODE_UNKNOWN_});
	    delete obj['user_tokens'];
	    res.json({message: Utils.Constants._MSG_OK_, details: obj, code: Utils.Constants._CODE_OK_});
	});
    });
});

router.get("/", function(req, res) {
/*    Utils.checkToken(req, res, true).then(function(result) {
	if (!result)
	    return Utils.sendUnauthorized(req, res);*/
	User.find({}, function(err, users) {
	    if (err)
		return Utils.sendError(res, err);
	    res.json({message: Utils.Constants._MSG_OK_, details: users, code: Utils.Constants._CODE_OK_});
//	});
    });
});

router.get("/test", function(req, res) {
	console.log("c'est bon");
	
	var user = new User();
    var mdsum = crypto.createHash('md5');

    user.username = "toto";
    mdsum.update("test");
	user.password = mdsum.digest('hex');
	user.created_on = Date.now() / 1000 | 0;
	user.isAdmin = true;
	user.email = "NOWWWcxcxdvxcWW@test.com";
	user.timelines_id = [];;


	user.save(function(err) {
	    if (err) {
	    	throw err;
	    	console.log("c'est FINI");
	    	return Utils.sendError(res, err);
	    }
	    else {
	    	console.log("c'est FINI");
	    	res.send({message: Utils.Constants._MSG_ARGS_, details: "ok : ", code:Utils.Constants._CODE_OK_});
	    }
    });
});

router.get("/:id", function(req, res) {
    Utils.checkToken(req, res, false, req.params.user_id).then(function(result) {
	if (!result) {
	    Utils.sendUnauthorized(req, res);
	    return;
	}

	User.findById(req.params.user_id, function(err, user) {
	    if (err)
		return Utils.sendError(res, err);

	    // Result
	    var result = user.toObject();

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

router.put("/:id", function(req, res) {
    var shasum = crypto.createHash('sha1');
    Utils.checkToken(req, res, true, req.params.user_id).then(function(result) {
	if (!result)
	    return Utils.sendUnauthorized(req, res);
	User.findById(req.params.user_id, function(err, user) {
	    if (err)
		return Utils.sendError(res, err);

	    if (req.body.hasOwnProperty('name'))
		user.name = req.body.name;
	    if (req.body.hasOwnProperty('email'))
		user.email = req.body.email;
	    if (req.body.hasOwnProperty('password')) {
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

router.delete("/:id", function(req, res) {
    Utils.checkToken(req, res, true).then(function(result) {
	if (!result)
	    return Utils.sendUnauthorized(req, res);
	User.remove({_id: req.params.user_id}, function(err, user) {
	    if (err)
		return Utils.sendError(res, err);
	    res.json({message: Utils.Constants._MSG_DELETED_, details: user, code: Utils.Constants._CODE_DELETED_});
	});
    });
});

module.exports = router;
