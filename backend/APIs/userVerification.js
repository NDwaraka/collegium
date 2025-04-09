const express = require('express');
const { getDB } = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const user = express.Router();

// Generate transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, type, token) => {
    const verifyURL = `${process.env.BASE_URL}/user/verify-email/${token}`;
  
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      html: `<p>Click <a href="${verifyURL}">here</a> to verify your email address.</p>`,
    });
  };

// 🔸 Optional re-send endpoint
user.post('/resend-verification', async (req, res) => {
    const { email, type } = req.body;
    const db = getDB();
    const collectionName = type === 'admin' ? 'admins' : 'users';
  
    try {
      const user = await db.collection(collectionName).findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.isVerified) return res.status(400).json({ message: 'User already verified' });
  
      const token = crypto.randomBytes(32).toString('hex');
  
      await db.collection(collectionName).updateOne(
        { email },
        { $set: { verificationToken: token, tokenCreatedAt: new Date() } }
      );
  
      await sendVerificationEmail(email, type, token);
  
      res.status(200).json({ message: 'Verification email sent' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Send verification email
// Send verification email (token stored in user document)
user.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    const db = getDB();
  
    try {
      const user =
        (await db.collection('users').findOne({ verificationToken: token })) ||
        (await db.collection('admins').findOne({ verificationToken: token }));
  
      if (!user) return res.status(400).send('Invalid or expired token');
  
      // ✅ Check if token expired (24 hours = 86400000 ms)
      const now = new Date();
      const tokenCreatedAt = new Date(user.tokenCreatedAt);
      const timeDifference = now - tokenCreatedAt;
  
      if (timeDifference > 24 * 60 * 60 * 1000) {
        return res.status(400).send('Token has expired. Please request a new verification link.');
      }
  
      const collectionName = user.type === 'admin' ? 'admins' : 'users';
  
      await db.collection(collectionName).updateOne(
        { _id: user._id },
        {
          $set: { isVerified: true },
          $unset: { verificationToken: "", tokenCreatedAt: "" },
        }
      );
  
      res.send('Email verified successfully');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  

  module.exports = {
    router: user,
    sendVerificationEmail
  };

