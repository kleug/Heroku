// Controllers
var UserRoutes = require('../controllers/users');

// Models
var User = require('../models/user');

// Utils
var Utils = require('../utils');

module.exports = function(app, express) {
    var router = express.Router();
    var tmp = 0;

    app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
    });

    router.use(function(req, res, next) {
    var allowedRes = ["/", "/login", "/forgot", "/users"];
    
    next();
    return;
    if (!Utils.publicAccess(allowedRes, req.originalUrl)) {
	    console.log('=> Endpoint ' + req.originalUrl + ' needs token authentication');
	    if (!req.headers.hasOwnProperty('authorization'))
	 	return res.send({message: Utils.Constants._MSG_TOKEN_, details: "You must provide a token API", code: Utils.Constants._CODE_TOKEN_});
	    User.findOne({'user_tokens': req.headers.authorization}, function(err, user) {
		if (err)
		    return Utils.sendError(res, err);
		if (!user) {
		    return res.send({message: Utils.Constants._MSG_TOKEN_, details: "Token API unknown", code: Utils.Constants._CODE_TOKEN_});
		}
		next();
	    });
    } else {
	    console.log('=> Endpoint ' + req.originalUrl + ' doesn\'t need token authentication');
	    next();
    }
    });

    router.get('/', function(req, res) {
	res.json({message: Utils.Constants._MSG_WELCOME_, details: global.config.global.welcomeMessage, code: Utils.Constants._CODE_WELCOME_});	
    });
    
    app.use('/', router);
    app.use("/users", UserRoutes);
    app.use('/docs', function(req, res) {
    	app.use(express.static('dist'));
    	res.sendFile(Utils.path.resolve(__dirname, '../../dist/index.html'));
    });
};
