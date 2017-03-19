var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var routes = require('./app/routes/index');
var Promise = require('bluebird');
var fs = require('fs');
var multer = require('multer');
var app = express();
var data = fs.readFileSync('./config.json');

try {
	global.config = JSON.parse(data);
	console.dir(global.config);
} catch (err) {
	console.log('There has been an error parsing your config file.')
	console.log(err);
}

app.use(morgan('dev'));

app.use(bodyParser.urlencoded({
	extended : true
}));
app.use(bodyParser.json());

var port = process.env.PORT || 9090;
var domain = 'localhost'
var mongoose = Promise.promisifyAll(require('mongoose'));

var mongooseAddress = process.env.MONGOLAB_URI || 'localhost:27017/petitchefv2'
console.log('mongoose connecting add' + mongooseAddress);
mongoose.connect(mongooseAddress);

routes(app, express);

app.listen(port);
console.log('Magic happens on port ' + port);
