module.exports = (headers) => {
    if (headers && headers.authorization) {
        const parts = headers.authorization.split(" ");
        
        if (parts.length === 2) {
            return parts[1];
        }
    }
    return null;
};