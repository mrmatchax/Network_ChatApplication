import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3500;

const app = express();

app.use(express.static(path.join(__dirname, "public")));

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
// map what room each user is in
const UserRoom = new Map();

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("joinChatRoom", ({ name, roomName }) => {
    if (UserRoom.has(name)) {
      socket.leave(UserRoom.get(name));
      UserRoom.delete(name);
    }
    console.log(`User ${name} joined chat room ${roomName}`);
    socket.join(roomName);
    UserRoom.set(name, roomName);
  });

  socket.on("message", ({ name, message, role }) => {
    const room = UserRoom.get(name);
    console.log(
      `User ${name} with role ${role} just sent a message in room ${room}`
    );
    io.to(room).emit("message", { name, message, role });
  });

  // this section is to combat phantom socket
  // under construction
  socket.once("handshake", ({ id }) => {
    console.log(`User ${id} handshake`);
  });
  // end section

  socket.on("disconnect", () => {
    const disconnectedUser = socket.id;
    console.log(`User ${socket.id} disconnected`);
    OnlineUsersState.setOnlineUsers(
      OnlineUsersState.OnlineUsers.filter(
        (OnlineUsers) => OnlineUsers.id !== disconnectedUser
      )
    );
    console.log(OnlineUsersState.OnlineUsers);
    io.emit("OnlineUsers", OnlineUsersState.OnlineUsers);
  });

  socket.on("logout", ({ name, id }) => {
    OnlineUsersState.setOnlineUsers(
      OnlineUsersState.OnlineUsers.filter(
        (OnlineUsers) => OnlineUsers.id !== id
      )
    );
    console.log(OnlineUsersState.OnlineUsers);
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
    }
  });
});
