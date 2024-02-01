const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/DataVault');


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    sparse: true
  },
  email: {
    type: String,
  },
  password: String,
  post: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    }
  ],
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  }],
  ProfileImage: String,
});

userSchema.plugin(plm);

module.exports = mongoose.model('User', userSchema);