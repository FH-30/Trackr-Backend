const crypto = require("crypto");

function hash(obj) {
    // 'digest' is the output of hash function containing  
    // only hexadecimal digits

    const x = JSON.stringify(obj);

    hashPwd = crypto.createHash('sha1').update(x).digest('hex');
  
    return hashPwd;
}

function label() {
    return Math.random().toString();
}

module.exports = {
    hash,
    label
}