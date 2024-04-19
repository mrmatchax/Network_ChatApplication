const User = require("./models/users");
const Chat = require("./models/chat");

module.exports.createUser = async (name, password) => {
    const user = new User({
        name: name,
        password: password
    });

    return await user.save();
}

module.exports.getUserById = async (id) => {
    return await User.findById(id);
}

module.exports.getMessages = async (room) => {
    return await Chat.find({ room: room });
}

module.exports.createMessage = async (room, sender, message, role) => {
    console.log("saved message:",  room, sender, message, role);
    const chat = new Chat({
        room: room,
        name: sender,
        message: message,
        role: role
    });

    return await chat.save();
}

module.exports.getUser = async (name) => {
    return await User.findOne({ name: name });
}