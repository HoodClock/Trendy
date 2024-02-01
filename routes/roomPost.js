const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/DataVault');


const RoompostSchema = new mongoose.Schema({
  PostText: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  Likes: {
    type: Number,
    default: 0
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  }
});

RoompostSchema.plugin(plm);

module.exports = mongoose.model('RoomPost', RoompostSchema);