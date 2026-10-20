const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Realona Exchange - Nodemailer Test',
    text: 'Your Nodemailer App Password is configured and working successfully!'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('❌ Email Error:', error);
    } else {
        console.log('✅ Email Sent Successfully:', info.response);
    }
});
