// APIs/auth.api.js
// const express = require('express');
// const bcrypt = require('bcryptjs');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { getDB } = require('../db');
const { sendVerificationEmail } = require('./userVerification');
const crypto = require('crypto');

dotenv.config();

const createUser = async (req, res) => {
  const { name, email, password, type } = req.body;
  const db = getDB();

  if (!name || !email || !password || !type) {
    return res.status(400).json({ message: 'All fields are required (name, email, password, type).' });
  }

  // Admin email validation
  if (type === 'admin' && !email.endsWith('@vnevjietadmin.in')) {
    return res.status(403).json({ message: 'Not possible to be admin.' });
  }

  const collectionName = type === 'admin' ? 'admins' : 'users';

  try {
    const existing = await db.collection(collectionName).findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isDeleted = false;
    const isVerified = false;
    const token = crypto.randomBytes(32).toString('hex');
    // const tokenCreatedAt;

    const result = await db.collection(collectionName).insertOne({
      name,
      email,
      password: hashedPassword,
      type,
      isDeleted: false,
      isVerified: false,
      verificationToken: token,
      tokenCreatedAt: new Date(), 
      createdAt: new Date()
    });

    // ... after inserting the user
    await sendVerificationEmail(email, result.insertedId.toString(),token); //

    res.status(201).json({
      _id: result.insertedId,
      email,
      name,
      type,
      isDeleted,
      isVerified
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = createUser;
