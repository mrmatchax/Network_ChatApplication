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
    origin: "*",
  },
});

// state
const OnlineUsersState = {
  OnlineUsers: [],
  setOnlineUsers: function (newUsersArray) {
    this.OnlineUsers = newUsersArray;
  },
};
const UserRoom = new Map();

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("joinChatRoom", ({ name1, name2 }) => {
    if (UserRoom.has(name1)) {
      socket.leave(UserRoom.get(name1));
      UserRoom.delete(name1);
    }
    console.log(`User ${name1} joined chat room with ${name2}`);
    if (name1.localeCompare(name2) < 0) {
      console.log("join room", name1 + name2);
      socket.join(name1 + name2);
      UserRoom.set(name1, name1 + name2);
    } else {
      console.log("join room", name2 + name1);
      socket.join(name2 + name1);
      UserRoom.set(name1, name2 + name1);
    }
  });
  socket.on("Sentmessage", ({ name, message }) => {
    const room = UserRoom.get(name);
    console.log(`User ${name} sent message in room ${room}`);
    io.to(room).emit("Recievemessage", { name, message });
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
