// Import statements
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const users = require("./routes/api/users");
const path = require("path");

// Initialize app to a server
const app = express();
const cors = require("cors");

app.use(cors());

// Allows body-parsing of JSON files
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

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

// Connect to the specified MongoDB database
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false})
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