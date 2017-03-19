var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
    user :{type : Schema.Types.ObjectId, ref : "User"},
    ingredients : [{food : {type : Schema.Types.ObjectId, ref : "Food"}, quantity : Number}]
});

module.exports = mongoose.model('Food', schema);
