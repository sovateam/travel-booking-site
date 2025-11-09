import { readData } from '../../../utils/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-change-in-production';

// Simple hash function (same as in register)
const simpleHash = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  const users = readData('users.json');
  const user = users.find(u => u.phone === phone);

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  if (user.status !== 'approved') {
    return res.status(400).json({ message: 'Account not approved yet' });
  }

  // Compare hashed passwords
  const isPasswordValid = simpleHash(password) === user.password;
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid password' });
  }

  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(200).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role || 'user'
    }
  });
}