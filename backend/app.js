const express = require("express");
const { Server } = require("socket.io");
const path = require("path");
const { fileURLToPath } = require("url");

const connectDB = require("./db.js");

const { createUser, createMessage, getMessages } = require("./functions.js");
const chat = require("./models/chat.js");
const { get, set } = require("mongoose");
                                                                           
const PORT = 3500;

const app = express();

connectDB();

const expressServer = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

const io = new Server(expressServer, {
  cors: {
    origin: "*", // any origin can connect
  },
});

// status of each id
const OnlineUsersState = {
  OnlineUsers: [], // {name: string, id: string}
  setOnlineUsers: function (newUsersArray) {
    this.OnlineUsers = newUsersArray;
  },
};
// group chat
const ChatRoomsState = {
  ChatRooms: [], // {name: string, roomId : string}
  setChatRooms: function (newChatRoomsArray) {
    this.ChatRooms = newChatRoomsArray;
  },
};
// map what room each user is in
const UserRoom = new Map();

function CleanUpUserList(id) {
  OnlineUsersState.setOnlineUsers(
    OnlineUsersState.OnlineUsers.filter((OnlineUsers) => OnlineUsers.id !== id)
  );
}

io.on("connection", (socket) => {
  // initial
  console.log(`User ${socket.id} connected`);
  io.emit("OnlineUsers", OnlineUsersState.OnlineUsers);

  // create user
  socket.on("create user", async ({ name, password }) => {
    console.log(`User ${name} is creating an account`);
    const user = await createUser(name, password);
    if (user) {
      socket.emit("create user", { name: user.name, id: user._id });
    } else {
      socket.emit("create user", { error: "User already exists" });
    }
  });

  // combat phantom socket
  const handshakeTimeout = setTimeout(() => {
    socket.disconnect();
    console.log("Socket disconnected due to handshake timeout");
  }, 5000); // 5 seconds
  socket.once("handshake", () => {
    clearTimeout(handshakeTimeout);
  });

  socket.on("createChatRoom", ({ roomName }) => {
    if (!ChatRoomsState.ChatRooms.includes(roomName)) {
      ChatRoomsState.setChatRooms([...ChatRoomsState.ChatRooms, roomName]);
      console.log(`Chat room ${roomName} created`);
      io.emit("createChatRoom", ChatRoomsState.ChatRooms);
    }
  });

  socket.on("joinChatRoom", ({ name, roomName }) => {
    // leave room if already in one
    if (UserRoom.has(name)) {
      socket.broadcast.to(UserRoom.get(name)).emit("message", {
        name: name,
        message: `${name} has left the Chat Room`,
        role: "Admin",
        messageId: Math.random().toString(),
      });
      socket.leave(UserRoom.get(name));
      UserRoom.delete(name);
    }
    console.log(`User ${name} joined chat room ${roomName}`);
    socket.join(roomName);
    UserRoom.set(name, roomName);
    // you just joned the room
    socket.emit("message", {
      name: name,
      message: `You have joined the Chat Room`,
      role: "Admin",
      messageId: Math.random().toString(),
    });
    // broadcast to the room
    socket.broadcast.to(roomName).emit("message", {
      name: name,
      message: `${name} has joined the Chat Room`,
      role: "Admin",
      messageId: Math.random().toString(),
    });

    // get chat history
    console.log("getting chat history from room", roomName)
    async function getChatHistory() {
      const chatHistory = await getMessages(roomName);
      // console.log("chat history", chatHistory)
      socket.emit("chatHistory", chatHistory);
    }
    getChatHistory();
    // console.log("chat history", chatHistory)
    // socket.emit("chatHistory", chatHistory);


  });

  // this section is to combat phantom socket
  // under construction
  socket.once("handshake", ({ id }) => {
    console.log(`User ${id} handshake`);
  });
  // end section

  socket.on("disconnect", () => {
    const disconnectedUser = socket.id;
    const disconnectedUserName = OnlineUsersState.OnlineUsers.find(
      (OnlineUsers) => OnlineUsers.id === disconnectedUser
    );
    console.log(`User ${socket.id} disconnected`);
    if (UserRoom.has(disconnectedUserName)) {
      socket.broadcast.to(UserRoom.get(disconnectedUserName)).emit("message", {
        name: disconnectedUserName,
        message: `${disconnectedUserName} has left the Chat Room`,
        role: "Admin",
        messageId: Math.random().toString(),
      });
      socket.leave(UserRoom.get(disconnectedUserName));
      UserRoom.delete(disconnectedUserName);
    }
    CleanUpUserList(disconnectedUser);
    console.log("A socket has disconnected", OnlineUsersState.OnlineUsers);
    io.emit("OnlineUsers", OnlineUsersState.OnlineUsers);
  });

  socket.on("logout", ({ name, id }) => {
    CleanUpUserList(id);
    if (UserRoom.has(name)) {
      socket.broadcast.to(UserRoom.get(name)).emit("message", {
        name: name,
        message: `${name} has left the Chat Room`,
        role: "Admin",
        messageId: Math.random().toString(),
      });
      socket.leave(UserRoom.get(name));
      UserRoom.delete(name);
    }
    console.log("A user has logout", OnlineUsersState.OnlineUsers);
    io.emit("OnlineUsers", OnlineUsersState.OnlineUsers);
  });

  socket.on("login", ({ name, id }) => {
    console.log(`User ${name} with id ${id} arrive`);
    if (name && id) {
      console.log(`User ${name} with id ${id} logged in`);
      const user = { name, id };
      OnlineUsersState.setOnlineUsers([
        ...OnlineUsersState.OnlineUsers.filter(
          (OnlineUsers) => OnlineUsers.id !== id
        ),
        user,
      ]);
      io.emit("OnlineUsers", OnlineUsersState.OnlineUsers);
      socket.emit("createChatRoom", ChatRoomsState.ChatRooms);
    }
  });
  socket.on("message", ({ name, message, role, messageId }) => {
    const room = UserRoom.get(name);
    console.log(
      `User ${name} with role ${role} just sent a message in room ${room}`
    );
    // create message to db
    createMessage(room, name, message, role);

    io.to(room).emit("message", { name, message, role, messageId });
  });
});
