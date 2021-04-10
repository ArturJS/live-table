// @ts-check
"use strict";

const path = require("path");
const fs = require("fs").promises;
const http = require("http");
const WebSocket = require("ws");

const getFile = async (pathname) => {
  let filename = "index.html";

  if (pathname.length > 1) {
    filename = pathname.slice(1);
  }

  return await fs.readFile(
    path.resolve(__dirname, `./client/${filename}`),
    "utf8"
  );
};

const getExtension = (pathname) => {
  const dotLastIndex = pathname.lastIndexOf(".");

  if (dotLastIndex === -1) {
    return "";
  }

  return pathname.slice(dotLastIndex + 1);
};

const getContentType = (pathname) => {
  const extToType = {
    js: "text/javascript",
    css: "text/css",
    "": "text/html",
  };
  const extension = getExtension(pathname);

  return extToType[extension];
};

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const file = await getFile(pathname);

  res.writeHead(200, {
    "Content-Type": getContentType(pathname),
  });
  res.end(file);
});

server.listen(8000, () => {
  console.log("Listen port 8000");
});

const ws = new WebSocket.Server({ server });

ws.on("connection", (connection, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`Connected ${ip}`);
  connection.on("message", (message) => {
    console.log("Received: " + message);
    for (const client of ws.clients) {
      if (client.readyState !== WebSocket.OPEN) continue;
      if (client === connection) continue;
      client.send(message);
    }
  });
  connection.on("close", () => {
    console.log(`Disconnected ${ip}`);
  });
});
