var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
    name : String,
    description : String,
    time : Number
});

module.exports = mongoose.model('Step', schema);
