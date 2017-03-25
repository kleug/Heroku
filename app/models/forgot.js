var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
	username: String,
	date : Number,
	hash : String,
	ip : String,
	user_id : String,
	used : Boolean
});

module.exports = mongoose.model('Forgot', schema);
