var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
    user : {type : Schema.Types.ObjectId, ref : "User"},
    products : [{type : Schema.Types.ObjectId, ref : "Food"}],
    price : Number
});

module.exports = mongoose.model('ShopList', schema);
