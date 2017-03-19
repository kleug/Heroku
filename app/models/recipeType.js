var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
    name : String
});

module.exports = mongoose.model('RecipeType', schema);
