"use client";

import { useEffect, useState } from "react";
import { socket } from "../service/socket";
import { Accordion, AccordionItem } from "@nextui-org/react";
import { Textarea } from "@nextui-org/react";
import { ScrollShadow } from "@nextui-org/react";
import { Input } from "@nextui-org/react";

export interface user {
  name: string;
  id: string;
}

export interface message {
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
  const [chatMessage, setChatMessage] = useState<message[]>([]);
  const [chatRoom, setChatRoom] = useState<string[]>([]);
  const [chatGroupName, setChatGroupName] = useState<string>("");

  useEffect(() => {
    console.log("Connected with ID:", socket.id);
    console.log(socket);
    socket.on("connect", () => {
      console.log("Connected with ID:", socket.id);
      console.log(socket);
    });
    socket.on("OnlineUsers", (onlineUsers) => {
      console.log(onlineUsers);
      setOnlineUsers(onlineUsers);
    });
    socket.emit("handshake", { id: socket.id });
    return () => {
      socket.off("connect");
      socket.off("OnlineUsers");
      socket.off("message");
    };
  }, []);

  socket.on("message", (data: message) => {
    setChatMessage([...chatMessage, data]);
    // console.log("sanity check", chatMessage);
  });
  socket.on("createChatRoom", (data: string[]) => {
    setChatRoom(data);
  });

  const handleLogin = () => {
    if (!name.trim()) {
      alert("Input field is required!");
      return;
    }
    console.log(name);
    console.log(socket.connected);
    console.log(socket);
    socket.emit("login", { name: name, id: socket.id });
    setstage(2);
  };

  const handlelogout = () => {
    socket.emit("logout", { name: name, id: socket.id });
    setChatMessage([]);
    setstage(1);
  };
  const handleJoinPrivateChat = (data: user) => {
    console.log("Private Chat");
    console.log(name, "want to connect to", data.name);
    const roomName =
      name.localeCompare(data.name) > 0
        ? "private_" + name + data.name
        : "private_" + data.name + name;
    socket.emit("joinChatRoom", { name: name, roomName: roomName });
    setChatMessage([]);
  };
  const handleJoinGroupChat = (data: string) => {
    console.log("Group Chat");
    console.log(name, "want to connect to", data);
    socket.emit("joinChatRoom", { name: name, roomName: "publec_" + data });
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
    console.log("Create Group Chat");
    socket.emit("createChatRoom", { roomName: chatGroupName });
  };

  return (
    <div className="w-full h-full">
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
                    (user1: user) =>
                      user1.name !== name && (
                        <div className="text-center">
                          <button
                            onClick={() => handleJoinPrivateChat(user1)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
                          >
                            {user1.name}
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
              {chatMessage?.map((message: message) =>
                // <div className="flex flex-col border-2 border-round border-black">
                //   <span className="text-black">sender : {message.name}</span>
                //   <span className="text-black">
                //     message : {message.message}
                //   </span>
                // </div>
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
