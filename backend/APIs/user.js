// APIs/user.api.js
const express = require('express');
const { getDB } = require('../db');
const createuser = require('./util.js');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const user = express.Router();

user.post('/sign-up',createuser);

// GET user profile by ID
// router.get('/:id', async (req, res) => {
//   const db = getDB();
//   const { id } = req.params;

//   try {
//     const user = await db.collection('users').findOne({ _id: new require('mongodb').ObjectId(id) });

//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Hide password before sending back
//     const { password, ...safeUser } = user;
//     res.json(safeUser);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // PUT update user profile
// router.put('/:id', async (req, res) => {
//   const db = getDB();
//   const { id } = req.params;
//   const { name, email } = req.body;

//   try {
//     const updated = await db.collection('users').findOneAndUpdate(
//       { _id: new require('mongodb').ObjectId(id) },
//       { $set: { name, email } },
//       { returnDocument: 'after' }
//     );

//     if (!updated.value) return res.status(404).json({ message: 'User not found' });

//     const { password, ...safeUser } = updated.value;
//     res.json(safeUser);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


//soft delete
user.delete('/soft-delete/:emailPrefix', async (req, res) => {
    const db = getDB();
    const { emailPrefix } = req.params;
  
    try {
      const user = await db.collection('users').findOne({
        email: { $regex: `^${emailPrefix}@`, $options: 'i' },
        isDeleted: { $ne: true }
      });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found or already deleted' });
      }
  
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
  
      res.status(200).json({ message: 'User soft-deleted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
// Hard delete using email prefix
user.delete('/hard-delete/:emailPrefix', async (req, res) => {
    const db = getDB();
    const { emailPrefix } = req.params;
  
    try {
      const result = await db.collection('users').deleteOne({
        email: { $regex: `^${emailPrefix}@`, $options: 'i' }
      });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ message: 'User permanently deleted' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  });
  


module.exports = user;
