"use strict";
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function main() {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'luditeapp@gmail.com', // generated ethereal user
            pass: 'luditepassword' // generated ethereal password
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'luditellc@gmail.com', // sender address
        to: "henhen7.24@gmail.com", // list of receivers
        subject: "Hello", // Subject line
        text: "Hello world", // plain text body
    });

    console.log("Message sent: %s", info);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}

main().catch(console.error);