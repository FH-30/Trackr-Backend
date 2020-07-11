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
        type: String
    }
});

//Create Schema(A template in which data mase using it has to be structured like)
const UserSchema = new Schema({
    linkedInID: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
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
    refreshToken: {
        type: String,
        default: ""
    },
    verified: {
        type: Boolean,
        default: false,
        required: true
    },
    jobsSorted: {
        type: Boolean,
        default: false,
        required: true
    },
    usernameSet: {
        type: Boolean,
        default: false,
        required: true
    }
}, {timestamps: true});

UserSchema.index({createdAt: 1}, {expireAfterSeconds: 3*60*60, partialFilterExpression : {verified: false}});

// Exports the model using the specified Schema
module.exports = mongoose.model("users", UserSchema);