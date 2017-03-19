var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
    user : {type : Schema.Types.ObjectId, ref : "User"},
    products : [{type : Schema.Types.ObjectId, ref : "Food"}],
    supermarket : {type : Schema.Types.ObjectId, ref : "Supermarket"},
    price : Number,
    barcode : String
});

module.exports = mongoose.model('Ticket', schema);
