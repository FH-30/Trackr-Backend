// Import statements
const mongoose = require("mongoose");
const Schema = mongoose.Schema; // Gets the Schema class of Mongoose

const JobSchema = new Schema ({
    _id: false,
    id: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    interviewDate: {
        type: Date
    }
});

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
        lowercase: true
    },
    jobs: {
        type: [JobSchema],
        required: true
    },
    date: {
        type: Date,
        default: new Date()
    }
});

// Exports the model using the specified Schema
module.exports = mongoose.model("users", UserSchema);