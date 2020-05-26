// Import statements
const Validator = require("validator");
const isEmpty = require("is-empty");

// Exports a function which checks for the validity when signing up
module.exports = (data) => {
    // Define an errors object to store all identified errors
    let errors = {};

    // Convert empty fields to an empty string so we can use validator functions
    data.username = isEmpty(data.username) ? "" : data.username;
    data.password = isEmpty(data.password) ? "" : data.password;
    data.email = isEmpty(data.email) ? "" : data.email;

    // Username checks
    if (Validator.isEmpty(data.username)) {
        errors.username = "Username field is required";
    }

    // Password checks
    if (Validator.isEmpty(data.password)) {
        errors.password = "Password field is required";
    }

    // Email checks
    if (Validator.isEmpty(data.email)) {
        errors.email = "Email field is required";
    } else if (!Validator.isEmail(data.email)) {
        errors.email = "Email is invalid";
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}