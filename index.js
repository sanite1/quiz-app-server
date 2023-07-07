require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const path = require("path");
const { connectToDB } = require("./config/database");
const PORT = process.env.PORT || process.env.SERVER_PORT || 4000;
const patientRoutes = require("./app/routes/patientRoutes");
const socket = require("socket.io-client")("http://localhost:3000");
const { Server } = require("socket.io");
const authRoutes = require("./app/routes/authRoutes");
const Quiz = require("./app/routes/quizRoutes");
const { requireAuth, checkUser } = require("./app/middlewares/authMiddleware");

const app = express();
const apiVersion = "/api/v1";

//Middleware
//To allow json requests and decode requests from forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,UPDATE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  next();
});
//To allow Cookies
app.use(cookieParser()); // To parse the incoming cookies
const corsOptions = {
  credentials: true,
  origin: ["https://nexus-frontend-rho.vercel.app", "http://localhost:3000"],
  // origin: "http://localhost:3000",
};
app.use(cors(corsOptions)); // npm i cors

app.use(apiVersion, Quiz); //Call routes here
//Invalid Route   //NB: using app.use instead of app.get/post handles all wrong requests and throws the message (For our API in dev/prod)
app.use("*", (req, res) => {
  res.status(404).send({ error: "Route does not exist" });
});
app.use((error, req, res, next) => {
  console.log("This is the rejected field ->", error);
  // console.log("This is the rejected field ->", error.field);
  res.status(400).json({ error: "Multer Error. Unexpected field -  ", error });
});

//Server and Database setup
const server = http.createServer(app);
// Only start server after connection to database has been established
const io = new Server(server, {
  cors: {
    origin: "https://nexus-frontend-rho.vercel.app",
  },
});
let users = [];
let usersInRoom = new Map();
const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};


connectToDB()
  .then(() => {
    //Starting Server/Listening to server

    server.listen(PORT, () => {
      console.log(`Server listening on PORT ${PORT}`);
    });
  })
  .catch(() => {
    console.log("Database connection failed!");
  });

//If any error in starting server
server.on("error", (err) => {
  console.log(`Error Present: ${err}`);
  process.exit(1);
});

// If any unhandledRejection in our process Event
process.on("unhandledRejection", (error) => {
  console.error("UNHANDLED REJECTION! Shutting down...", error);
  process.exit(1);
});
