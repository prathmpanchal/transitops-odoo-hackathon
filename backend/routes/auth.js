const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SECRET = 'transitops-hackathon-secret'; // Change later if needed

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '8h' });

  res.json({ 
    success: true, 
    data: { 
      token, 
      user: { id: user.id, name: user.name, role: user.role } 
    } 
  });
});

module.exports = router;