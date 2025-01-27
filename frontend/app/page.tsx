"use client";

import { useEffect, useState } from "react";
import { socket } from "../service/socket";
import { Accordion, AccordionItem } from "@nextui-org/react";
import { Textarea } from "@nextui-org/react";
import { ScrollShadow } from "@nextui-org/react";
import { Input } from "@nextui-org/react";

export interface User {
  name: string;
  id: string;
}

export interface Message {
  name: string;
  message: string;
  role: string;
  messageId: number;
}

const Home = () => {
  const [stage, setstage] = useState(1);
  const [name, setName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chat, setChat] = useState("");
  const [chatMessage, setChatMessage] = useState<Message[]>([]);
  const [chatRoom, setChatRoom] = useState<string[]>([]);
  const [chatGroupName, setChatGroupName] = useState<string>("");

  useEffect(() => {
    console.log("Socket Information", socket);
    socket.emit("handshake", { id: socket.id });
    return () => {
      socket.off("OnlineUsers");
      socket.off("message");
      socket.off("createChatRoom");
    };
  }, []);

  socket.on("message", (message: Message) => {
    setChatMessage([...chatMessage, message]);
  });

  socket.on("createChatRoom", (data: string[]) => {
    setChatRoom([...data]);
  });

  socket.on("OnlineUsers", (onlineUsers) => {
    console.log("someone new joined", onlineUsers);
    setOnlineUsers(onlineUsers);
  });

  const handleLogin = () => {
    if (!name.trim()) {
      alert("Input field is required!");
      return;
    }
    if (onlineUsers.find((user: User) => user.name === name)) {
      alert("There is already a user with this name!");
      return;
    }
    console.log("Login as", name);
    socket.emit("login", { name: name, id: socket.id });
    setstage(2);
  };

  const handlelogout = () => {
    console.log("Logout as", name);
    socket.emit("logout", { name: name, id: socket.id });
    setChatMessage([]);
    setstage(1);
  };
  const handleJoinPrivateChat = (user: User) => {
    console.log("Private Chat");
    console.log(name, "want to connect to", user.name);
    const roomName =
      name.localeCompare(user.name) > 0
        ? "private_" + name + user.name
        : "private_" + user.name + name;
    socket.emit("joinChatRoom", { name: name, roomName: roomName });
    setChatMessage([]);
  };
  const handleJoinGroupChat = (roomName: string) => {
    console.log("Group Chat");
    console.log(name, "want to connect to room name", roomName);
    socket.emit("joinChatRoom", { name: name, roomName: "public_" + roomName });
    setChatMessage([]);
  };
  const handleSentMessage = () => {
    console.log("Sent Message", name, chat);
    socket.emit("message", {
      name: name,
      message: chat,
      role: "User",
      messageId: 0,
    });
  };

  const handleCreateGroupChat = () => {
    if (chatGroupName === "") {
      alert("Input field is required!");
      return;
    }
    if (chatRoom.find((room: string) => room === chatGroupName)) {
      alert("There is already a group chat with this name!");
      return;
    }
    console.log("Create Group Chat");
    socket.emit("createChatRoom", { roomName: chatGroupName });
  };

  return (
    <div className="w-full h-full">
      {/* this is the login page */}
      {stage === 1 && (
        <div className="w-full h-full bg-[#E0E7FF]">
          <main className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <div className="flex flex-col space-y-4 w-[630px] rounded-md border bg-white px-12 py-6 shadow-lg">
              <p className="my-6 text-center text-3xl font-bold italic text-indigo-700">
                DebChat
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter something..."
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
              <button
                onClick={handleLogin}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
              >
                Log In!
              </button>
            </div>
          </main>
        </div>
      )}
      {stage === 2 && (
        <div className="w-full h-full bg-white flex flex-row">
          <div className="h-full w-1/3 px-2 border-2 border-indigo-600">
            <Accordion>
              <AccordionItem
                key="1"
                aria-label="Accordion 1"
                title="Private Chat"
              >
                <ScrollShadow
                  orientation="horizontal"
                  className="w-full h-full"
                >
                  {onlineUsers?.map(
                    (user: User) =>
                      user.name !== name && (
                        <div className="text-center">
                          <button
                            onClick={() => handleJoinPrivateChat(user)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
                          >
                            {user.name}
                          </button>
                        </div>
                      )
                  )}
                </ScrollShadow>
              </AccordionItem>
              <AccordionItem
                key="2"
                aria-label="Accordion 2"
                title="Group Chat"
              >
                <ScrollShadow
                  orientation="horizontal"
                  className="w-full h-full"
                >
                  <div>
                    <Input
                      type="string"
                      placeholder="Create Chat Group"
                      onChange={(e) => setChatGroupName(e.target.value)}
                    />
                    <button
                      onClick={handleCreateGroupChat}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
                    >
                      Create Group Chat!
                    </button>
                  </div>
                  {chatRoom.length > 0 &&
                    chatRoom.map((room: string) => (
                      <div className="text-center">
                        <button
                          onClick={() => handleJoinGroupChat(room)}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
                        >
                          {room}
                        </button>
                      </div>
                    ))}
                </ScrollShadow>
              </AccordionItem>
            </Accordion>
            <button
              onClick={handlelogout}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
            >
              Logout
            </button>
          </div>

          <div className="h-full w-full bg-black flex flex-col">
            <div className="bg-white w-full h-3/4">
              {chatMessage?.map((message: Message) =>
                message.role === "Admin" ? (
                  <div className="flex flex-col border-2 border-round border-black items-center justify-center">
                    <span className="text-black">{message.message}</span>
                  </div>
                ) : message.name === name && message.role === "User" ? (
                  <div className="flex flex-col border-2 border-round border-black items-end justify-center bg-blue-400">
                    <span className="text-black">{message.message}</span>
                  </div>
                ) : (
                  <div className="flex flex-col border-2 border-round border-black items-start justify-center bg-slate-400">
                    <span className="text-black">{message.message}</span>
                  </div>
                )
              )}
            </div>
            <div className="w-full h-1/4 bottom-0 bg-indigo-600">
              <Textarea
                label="Chat Box"
                placeholder="Enter your message here..."
                className=""
                onChange={(e) => setChat(e.target.value)}
              />
              <button
                onClick={handleSentMessage}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
              >
                sent Message!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
