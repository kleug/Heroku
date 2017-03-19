var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
    title : String,
    description : String,
    picture : String,
    ingredients : [{food : {type : Schema.Types.ObjectId, ref : "Food"}, quantity : Number}],
    category : {type : Schema.Types.ObjectId, ref : "RecipeType"},
    steps : [{type : Schema.Types.ObjectId, ref : "Step"}],
    creationDate : {type : Date, defaut : Date.now()}
});

module.exports = mongoose.model('Recipe', schema);
