const mailer = require("nodemailer");

module.exports = (recipientEmail, emailSubject, emailHTML) => {
    const transporter = mailer.createTransport({
        service: "gmail",
        auth: {
            user: "trackr.fraclestudio@gmail.com",
            pass: "Fracle12345"
        }
    });
    const mailOptions = {
        from: "trackr.fraclestudio@gmail.com",
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