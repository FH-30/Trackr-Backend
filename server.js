// Import statements
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");

const users = require("./routes/api/users");

// Initialize app to a server
const app = express();

// Allows body-parsing of JSON files
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.use(cors);

// Gets the URI of the MongoDB database used by app
const db = require("./config/keys").mongoURI;

// Connect to the specified MongoDB database
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(() => console.log("MongoDB successfully connected"))
    .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

// Routes
app.use("/api/users", users);

// Uses process.env.PORT if available otherwise 5000
const port = process.env.PORT || 5000;

// Tells the server which port to listen on
app.listen(port, () => console.log(`Server up and running on port ${port} !`));