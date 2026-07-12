const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { ok, fail, signToken } = require('../middleware/validate');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 400, 'Email and password are required');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return fail(res, 401, 'Invalid email or password');

  const match = bcrypt.compareSync(password, user.password);
  if (!match) return fail(res, 401, 'Invalid email or password');

  const token = signToken(user);
  return ok(res, { token, user: { id: user.id, name: user.name, role: user.role } });
});

module.exports = router;
