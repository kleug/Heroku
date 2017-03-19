var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
    name : String,
    picture : String,
    category : {type : Schema.Types.ObjectId, ref : "FoodType"}
});

module.exports = mongoose.model('Food', schema);
