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

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

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
