const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/DataVault');


const postSchema = new mongoose.Schema({
  PostText: {
    type: String,
  },
  image: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  Likes:{
    type: Number,
    default: 0
  }
});

postSchema.plugin(plm);

module.exports = mongoose.model('Post', postSchema);