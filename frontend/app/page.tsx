"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { socket } from "../service/socket";
import { Accordion, AccordionItem } from "@nextui-org/react";
import { Textarea } from "@nextui-org/react";
import { ScrollShadow } from "@nextui-org/react";

export interface user {
  name: string;
  id: string;
}

export interface message {
  name: string;
  message: string;
}

const Home = () => {
  const [stage, setstage] = useState(1);
  const [name, setName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [Chat, setChat] = useState("");
  const [ChatMessage, setChatMessage] = useState<message[]>([]);

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
      socket.off("Recievemessage");
    };
  }, []);

  socket.on("Recievemessage", (data: message) => {
    if (ChatMessage.length > 0) {
      console.log("1");
      setChatMessage([...ChatMessage, data]);
    } else {
      console.log("2");
      setChatMessage([data]);
    }
    console.log("sanity check", ChatMessage);
  });

  const handleClick = () => {
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
    setstage(1);
  };
  const handlePrivateChat = (data: user) => {
    console.log("Private Chat");
    console.log(name, "want to connect to", data.name);
    socket.emit("joinChatRoom", { name1: name, name2: data.name });
  };
  const handleSentMessage = () => {
    console.log("Sent Message", name, Chat);
    socket.emit("Sentmessage", { name: name, message: Chat });
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
                onClick={handleClick}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
              >
                Log In!
              </button>
            </div>
          </main>
        </div>
      )}
      {stage === 2 && (
        // <div className="w-full h-full bg-white">
        //   {onlineUsers?.map((user1: user) => (
        //     <div className="text-center">
        //       <p>
        //         ID:{user1.id} Name:{user1.name} is Online
        //       </p>
        //     </div>
        //   ))}
        //   <button
        //     onClick={handlelogout}
        //     className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
        //   >
        //     Logout
        //   </button>
        // </div>
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
                            onClick={() => handlePrivateChat(user1)}
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
                smt idk
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
              {ChatMessage?.map((message: message) => (
                <div className="flex flex-col border-2 border-round border-black">
                  <span className="text-black">sender : {message.name}</span>
                  <span className="text-black">
                    message : {message.message}
                  </span>
                </div>
              ))}
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
