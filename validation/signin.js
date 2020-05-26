// Import statements
const Validator = require("validator");
const isEmpty = require("is-empty");

// Exports a function which checks for the validity when signing in
module.exports = (data) => {
    // Define an errors object to store all identified errors
    let errors = {};
    let isEmail = null;

    // Convert empty fields to an empty string so we can use validator functions
    data.usernameOrEmail = isEmpty(data.usernameOrEmail) ? "" : data.usernameOrEmail;
    data.password = isEmpty(data.password) ? "" : data.password;

    // Username/Email checks
    if (Validator.isEmpty(data.usernameOrEmail)) {
        errors.usernameOrEmail = "Username/Email field is required";
    } else {
        if (Validator.isEmail(data.usernameOrEmail)) {
            isEmail = true;
        } else {
            isEmail = false;
        }
    }

    // Password checks
    if (Validator.isEmpty(data.password)) {
        errors.password = "Password field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors),
        isEmail
    }
}