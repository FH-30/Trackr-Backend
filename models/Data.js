const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const JobSchema = new Schema ({
    _id: false,
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

const DataSchema = new Schema ({
    username: {
        type: String,
        required: true,
        unique: true
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
    }
});

module.exports = mongoose.model("data", DataSchema);