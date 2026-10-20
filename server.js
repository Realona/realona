const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Temporary in-memory OTP storage
const otpStore = {};

// 1. API: Send OTP for Password Reset
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 mins expiry

    const mailOptions = {
        from: `"Realona Exchange" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔒 Realona Password Reset OTP Code',
        html: `
            <div style="font-family: Arial, sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; border-radius: 8px;">
                <h2 style="color: #58a6ff;">Realona Exchange</h2>
                <p>You requested a password reset. Use the OTP code below to verify your account:</p>
                <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #238636; background: #161b22; padding: 12px; border-radius: 6px; text-align: center; margin: 15px 0;">
                    ${otp}
                </div>
                <p style="font-size: 12px; color: #8b949e;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'OTP sent successfully to email!' });
    } catch (err) {
        console.error('OTP Mail Error:', err);
        res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
    }
});

// API: Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];

    if (!record) return res.status(400).json({ success: false, message: 'No OTP requested for this email.' });
    if (Date.now() > record.expires) {
        delete otpStore[email];
        return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }
    if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP code.' });

    delete otpStore[email];
    res.json({ success: true, message: 'OTP verified successfully!' });
});

// 2. API: Send Escrow Trade Email Notification
app.post('/api/notify-escrow', async (req, res) => {
    const { email, itemTitle, price, role } = req.body;
    const recipient = email || process.env.EMAIL_USER;

    const mailOptions = {
        from: `"Realona Escrow" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `🛡️ Escrow Update: ${itemTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; border-radius: 8px;">
                <h2 style="color: #238636;">Escrow Payment Secured</h2>
                <p>Funds for <strong>${itemTitle}</strong> (${price}) have been safely locked in Realona Escrow.</p>
                <div style="background: #161b22; padding: 12px; border-radius: 6px; border-left: 4px solid #238636; margin: 15px 0;">
                    <p style="margin: 0; font-size: 14px;">Status: <strong>Funds Held in Escrow</strong></p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #8b949e;">Next step: Seller releases credentials via Trade Chat.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Escrow email notification sent!' });
    } catch (err) {
        console.error('Escrow Mail Error:', err);
        res.status(500).json({ success: false, message: 'Failed to send escrow notification.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Realona Backend API running on port ${PORT}`));
