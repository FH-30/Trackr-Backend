const mongoURI = process.env.mongoURI;
const authSecret = process.env.authSecret;
const refreshSecret = process.env.refreshSecret;
const emailSecret = process.env.emailSecret;
const emailAddress = process.env.emailAddress;
const emailPassword = process.env.emailPassword;
const clearBitAPIKey = process.env.clearBitAPIKey;
const googleAPIKey = process.env.googleAPIKey;

module.exports = {
    mongoURI,
    authSecret,
    refreshSecret,
    emailSecret,
    emailAddress,
    emailPassword,
    clearBitAPIKey,
    googleAPIKey
}