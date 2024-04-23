const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
    },

    name: {
        type: String,
        required: true,
    },

    message: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        default: "User"
    },

    messageID: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Chat', chatSchema);