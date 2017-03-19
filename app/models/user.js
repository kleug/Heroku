var mongoose     = require('mongoose');
var Schema       = mongoose.Schema, ObjectId = Schema.ObjectId;

var schema   = new Schema({
    username: String,
    password: String,
    email: String,
    created_on: Number,
    isAdmin: Boolean,
    user_tokens: String,
    name: String,
    timelines_id: [String],
    stock : [{type : Schema.Types.ObjectId, ref : "Food"}]
});

module.exports = mongoose.model('User', schema);
