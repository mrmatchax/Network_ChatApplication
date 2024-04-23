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
  const [stage, setStage] = useState(1);
  const [name, setName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chat, setChat] = useState("");
  const [chatMessage, setChatMessage] = useState<Message[]>([]);
  const [chatRoom, setChatRoom] = useState<string[]>([]);
  const [chatGroupName, setChatGroupName] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

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
    console.log("Message Received");
    setChatMessage([...chatMessage, message]);
  });

  socket.on("roomHistory", (roomHistory: string[]) => {
    console.log("Room History", roomHistory);
    setChatRoom([...roomHistory]);
  });

  socket.on("chatHistory", (chatHistory: Message[]) => {
    // console.log("Chat History", chatHistory.toString());
    // concat chatMessage and chatHistory
    for (let i = 0; i < chatHistory.length; i++) {
      if (chatHistory[i].role === "Admin") {
        if (chatHistory[i].name === name){
          chatHistory[i].message = "You have joined the Chat Room"
        } else {
          console.log("Name", chatHistory[i].name, name);
          chatHistory[i].message = chatHistory[i].name + " has joined the Chat Room";
        }
        
      }
    }
    setChatMessage([...chatMessage, ...chatHistory]);
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
    setStage(2);
  };

  const handleLogout = () => {
    console.log("Logout as", name);
    socket.emit("logout", { name: name, id: socket.id });
    setChatMessage([]);
    setStage(1);
  };
  
  const handleJoinPrivateChat = (user: User) => {
    console.log("Private Chat");
    console.log(name, "want to connect to", user.name);
    const roomName =
      name.localeCompare(user.name) < 0
        ? "private_" + name + user.name
        : "private_" + user.name + name;
    socket.emit("joinChatRoom", { name: name, roomName: roomName });
    setChatMessage([]);
  };

  const handleJoinGroupChat = (roomName: string) => {
    console.log("Group Chat");
    console.log(name, "want to connect to room name", roomName);
    setChatMessage([]);
    socket.emit("joinChatRoom", { name: name, roomName: "public_" + roomName });
  };
  
  const handleSentMessage = () => {
    console.log("Sent Message", name, chat);
    if (chat.trim() === "") {
      alert("Input field is required!");
      return;
    }
    socket.emit("message", {
      name: name,
      message: chat,
      role: "User",
      messageId: 0,
    });
    setChat(""); // Clear chat input after sending
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

  const renderMessages = () => {
    return chatMessage.map((message: Message, index: number) => (
      <div
        key={index}
        className={`flex flex-col ${
          message.name === name ? "items-end" : "items-start"
        } justify-center p-2 my-1`}
      >
        {message.role === "Admin" ? (
          <div className="flex items-center justify-center">
            <span className="font-bold">{message.message}</span>
          </div>
        ) : (
          <div
            className={`border-2 border-round border-black ${
              message.name === name ? "bg-blue-400 text-white" : "bg-slate-400"
            } rounded-md p-2`}
          >
            <span className="font-bold">
              {message.name !== name ? `${message.name} :` : "Me :"}
            </span>{" "}
            {message.message}
          </div>
        )}
      </div>
    ));
  };
  

  return (
    <div className="w-full h-full">
      {/* Login page */}
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

      {/* Chat area */}
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
                        <div key={user.id} className="text-center mb-2">
                          <button onClick={() => handleJoinPrivateChat(user)}
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
                  <div className="text-center mb-2">
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
                      <div key={room} className="text-center mb-2">
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
              onClick={handleLogout}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
            >
              Logout
            </button>
          </div>

          <div className="h-full w-full bg-black flex flex-col">
            <div className="bg-white w-full h-3/4 overflow-y-auto p-2">
              {renderMessages()}
            </div>
            <div className="w-full h-1/4 bottom-0 bg-indigo-600 flex flex-col">
              <Textarea
                label={<span className="text-white">Chat Box</span>}
                placeholder="Enter your message here..."
                className="text-black"
                value={chat}
                onChange={(e) => setChat(e.target.value)}
              />
              <button
                onClick={handleSentMessage}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
              >
                Send a Message!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

