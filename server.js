// Import statements
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const users = require("./routes/api/users");
const path = require("path");
const queryParser = require('express-query-parser');
const helmet = require("helmet");
const compression = require('compression');

// Initialize app to a server
const app = express();
const cors = require("cors");

var corsOptions = {
    origin: 'http://localhost:3000',
}

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());


// Allows body-parsing of JSON files
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

// Converts booleans in url parameter into actual booleans instead of treating them like string, similarly for null
app.use(
    queryParser({
      parseNull: true,
      parseBoolean: true
    })
);

if (process.env.NODE_ENV === "production") {
    app.use(express.static('client/build'));

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "https://orbital-trackr.herokuapp.com"); // update to match the domain you will make the request from
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
}

// Gets the URI of the MongoDB database used by app
const db = require("./config/keys").mongoURI;

const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    autoIndex: true, //this is the code I added that solved it all
    keepAlive: true,
    poolSize: 10,
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    useFindAndModify: false,
    useUnifiedTopology: true
  }

// Connect to the specified MongoDB database
mongoose.connect(db, options)
    .then(() => console.log("MongoDB successfully connected"))
    .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

// Routes
app.use("/api/users", users);

// app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, '/client/build/index.html'));
// });

// Uses process.env.PORT if available otherwise 5000
const port = process.env.PORT || 5000;

// Tells the server which port to listen on
app.listen(port, () => console.log(`Server up and running on port ${port} !`));