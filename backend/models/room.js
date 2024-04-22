const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('Room', roomSchema);