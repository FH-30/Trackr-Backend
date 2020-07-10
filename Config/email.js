const mailer = require("nodemailer");
const keys = require("./keys");

module.exports = (recipientEmail, emailSubject, emailHTML) => {
    const transporter = mailer.createTransport({
        service: "gmail",
        auth: {
            user: keys.emailAddress,
            pass: keys.emailPassword
        }
    });
    const mailOptions = {
        from: keys.emailAddress,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHTML
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log(info);
        }
    });
}