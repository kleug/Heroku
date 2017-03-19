var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
    name : String,
    address : String,
    zip_code : String,
    city : String
});

module.exports = mongoose.model('Supermarket', schema);
