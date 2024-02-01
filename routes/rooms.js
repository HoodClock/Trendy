const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/DataVault');

const roomSchema = new mongoose.Schema({
    roomname: {
        type: String,
    },
    roompurpose: {
        type: String,
    },
    roomtags: {
        type: String,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoomPost',
        }
    ]
});

roomSchema.plugin(plm);

module.exports = mongoose.model("Room", roomSchema);
