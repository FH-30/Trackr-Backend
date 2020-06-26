// Import statements
const Validator = require("validator");
const isEmpty = require("is-empty");

// Exports a function which checks for the validity when signing up
module.exports = (data, fieldName) => {
    // Define an errors object to store all identified errors
    let errors = {};

    // Convert empty fields to an empty string so we can use validator functions
    if (fieldName === "username") {
        data.username = isEmpty(data.username) ? "" : data.username;

        // Username checks
        if (Validator.isEmpty(data.username)) {
            errors.username = "Username field is required";
        }
    } else if (fieldName === "password") {
        data.password = isEmpty(data.password) ? "" : data.password;

        // Password checks
        if (Validator.isEmpty(data.password)) {
            errors.username = "Password field is required";
        }
    } else if (fieldName === "email") {
        data.email = isEmpty(data.email) ? "" : data.email;

        // Email checks
        if (Validator.isEmpty(data.email)) {
            errors.email = "Email field is required";
        } else if (!Validator.isEmail(data.email)) {
            errors.email = "Email is invalid"
        }
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}