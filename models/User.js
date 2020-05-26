// Import statements
const mongoose = require("mongoose");
const Schema = mongoose.Schema; // Gets the Schema class of Mongoose

//Create Schema(A template in which data mase using it has to be structured like)
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        unique: true,
        hidden: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Exports the model using the specified Schema
module.exports = mongoose.model("users", UserSchema);