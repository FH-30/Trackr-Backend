// Import statements
const Validator = require("validator");
const isEmpty = require("is-empty");

// Exports a function which checks for the validity when signing up
module.exports = (data) => {
    // Define an errors object to store all identified errors
    let errors = {};
    let hasInterviewDate = true;

    // Convert empty fields to an empty string so we can use validator functions
    data.id = isEmpty(data.id) ? "" : data.id;
    data.company = isEmpty(data.company) ? "" : data.company;
    data.role = isEmpty(data.role) ? "" : data.role;
    data.status = isEmpty(data.status) ? "" : data.status;
    data.interviewDate = isEmpty(data.interviewDate) ? "" : data.interviewDate;

    if (Validator.isEmpty(data.id)) {
        errors.id = "ID field is required";
    }

    if (Validator.isEmpty(data.company)) {
        errors.company = "Company field is required";
    }

    if (Validator.isEmpty(data.role)) {
        errors.role = "Role field is required";
    }

    if (Validator.isEmpty(data.status)) {
        errors.status = "Status field is required";
    } else if (data.status !== "toApply" && data.status !== "applied" 
                && data.status !== "interview" && data.status !== "offer") {
        errors.status = "Status field invalid (Contact our support team if you see this)";
    }

    if (Validator.isEmpty(data.interviewDate)) {
        hasInterviewDate = false; 
    }

    return {
        errors,
        isValid: isEmpty(errors),
        hasInterviewDate
    }
}