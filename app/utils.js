var User = require('./models/user');
var Promise = require('bluebird');
var fs = require('fs');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var Constants = require('./constants');
var _ = require('underscore');
var path = require('path');

exports.Constants = Constants;
exports.path = path;


exports.allowCrossDomain = function validateFormatInput(email, exp) {
    var re =  exp;
    return re.test(email);
}

exports.allowCrossDomain = function(req, res, next) {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    var origin = req.headers.origin;
    if (_.contains(app.get('allowed_origins'), origin)) {
	res.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (req.method === 'OPTIONS') {
	res.send(200);
    } else {
	next();
    }
};

exports.getUserByToken = function(token) {
    return new Promise(function(resolve, reject) {
	User.findOne({'user_tokens': token}, function(err, user) {
	    if (err || !user || user === null)
		return resolve(null);
	    resolve(user);
	});
    });
};

exports.checkToken = function(req, res, mustBeAdmin, userId) {
    return new Promise(function(resolve, reject) {

    if (!req.headers.authorization)
    	return resolve(false);
	User.findOne({'user_tokens': req.headers.authorization}, function(err, user) {
	    if (err)
		return reject(err);
	    if (!user || user === null)
		return resolve(false);
        if(user.isAdmin) 
            return resolve(true);
        if(userId instanceof Array) {
            if(userId !== undefined && (userId.indexOf(User) != -1)) 
                return resolve(true);
        } else {
    	    if (userId !== undefined && userId.toString() != user._id.toString())
    		return resolve(false);
        }

	    if (mustBeAdmin && user.isAdmin)
		    return resolve(true);
        
	    else if (mustBeAdmin && !user.isAdmin)
		    return resolve(false);
	    return resolve(true);
	});
    });
};

exports.getUsersByCustomer = function(customer_id) {
    return new Promise(function(resolve, reject) {
        User.find({customers_id: {"$in": [customer_id]}}, function(err, users) {
            if (err)
                reject(err);
            //console.log("user id :" + users);
            resolve(users);
        });
    });
};

exports.sendUnauthorized = function(req, res) {
    res.status(403);
    res.send({message: Constants._MSG_UNAUTHORIZED_, details: "Token mismatch with authorized token", code: Constants._CODE_ERROR_});
};

exports.replaceAll = function(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}


// Should be modify foreach on tab with key and value
exports.parseForgotMail = function(mail, user, forgot, req, hash) {
    var me = require('./utils');
    
    console.log(Constants)
    mail = me.replaceAll(mail, "%username%", user.username);
    mail = me.replaceAll(mail, "%ip%", req.connection.remoteAddress);
    mail = me.replaceAll(mail, "%forgotid%", forgot.id);
    mail = me.replaceAll(mail, "%hash%", hash);
    mail = me.replaceAll(mail, "%host%", process.env.URL || Constants._HOST_);
    return mail;
}
//Should be modify foreach on tab with key and value
exports.parseWelcomeMail = function(mail, user, req) {
    var me = require('./utils');

    mail = me.replaceAll(mail, "%username%", user.username);
    mail = me.replaceAll(mail, "%ip%", req.connection.remoteAddress);
    return mail;
}
//Should be modify foreach on tab with key and value
exports.parseChangePwd = function(mail, query) {
    var me = require('./utils');

    mail = me.replaceAll(mail, "%query%", query);
    return mail;
}

exports.loadFile = function(filename) {
    var data = null;

    try {
    	data = fs.readFileSync(filename, 'utf8');
    	return data;
    } catch (err) {
    	console.log('There has been an error when fetching file \''+filename+'\'')
    	console.log(err);
    	console.log('this is the end');
    	throw err;
    }
}

exports.checkFields = function(o, fields) {
    var missing = [];

    fields.forEach(function(item) {
	if (!o.hasOwnProperty(item))
	    missing.push(item);
    });
    return missing;
}

exports.publicAccess = function(tab, res) {
    var baseEndpoint = res.split('/');
    console.log('Searching for endpoint \'/' + baseEndpoint[1] + '\'');
    if (tab.indexOf('/' + baseEndpoint[1]) >= 0) {
    	return true;
    }    
    return false;
}


exports.isNotEmpty = function(string) {
    return string != null && string !== undefined && string != "";
}

exports.getMailTransporter = function() {
	console.log('host: ' + global.config.mail.smtp.server);
	console.log('port: ' + global.config.mail.smtp.port);
	console.log('user: ' + global.config.mail.smtp.user);
	console.log('pass: ' + global.config.mail.smtp.password);
    return transporter = nodemailer.createTransport(
	smtpTransport({
	    host: global.config.mail.smtp.server,
	    secure: false,
	    port: global.config.mail.smtp.port,
	    auth: {
		user: global.config.mail.smtp.user,
		pass: global.config.mail.smtp.password
	    },
	    tls: {rejectUnauthorized: false},
	    debug:true
	})
    );
};


exports.sendMyEmail = function(mail) {
	var sg = require('sendgrid')(global.config.mail.smtp.apikey);
	var request = sg.emptyRequest({
	  method: 'POST',
	  path: '/v3/mail/send',
	  body: mail.toJSON()
	});

	sg.API(request, function(error, response) {
		if (error) {
			console.log(error);
			return false;
		}
		return response.statusCode
	  /*console.log(response.statusCode);
	  console.log(response.body);
	  console.log(response.headers);*/
	});
}

exports.sendError = function(res, err) {
    return res.send({message: Constants._MSG_UNKNOWN_, details: err, code: Constants._CODE_UNKNOWN_});
};


// Error when missing params
exports.sendMissingParams = function(res, mapas) {
    res.status(403);
    res.send({message: Constants._MSG_MISSING_PARAMS_, details: "Missing fallowing params : " + mapas, code: Constants._CODE_ARGS_});
};
