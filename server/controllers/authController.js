import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

// In-memory fallback users if MongoDB is temporarily offline
const inMemoryUsers = [
  {
    _id: 'mock_admin_1',
    username: 'admin',
    email: 'admin@smartcity.com',
    role: 'admin',
    password: 'password123'
  },
  {
    _id: 'mock_citizen_1',
    username: 'citizen',
    email: 'citizen@smartcity.com',
    role: 'citizen',
    password: 'password123'
  }
];

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'smartcity3d_jwt_super_secret_key_2026', {
    expiresIn: '30d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Citizen or Admin)
 */
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if database is connected
    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
      }

      const user = await User.create({
        username,
        email,
        password,
        role: role === 'admin' ? 'admin' : 'citizen'
      });

      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          token: generateToken(user._id, user.role)
        }
      });
    } else {
      // In-memory fallback
      const existing = inMemoryUsers.find(u => u.email === email || u.username === username);
      if (existing) {
        return res.status(400).json({ success: false, message: 'User already exists (Demo Mode)' });
      }

      const newUser = {
        _id: `mock_${Date.now()}`,
        username,
        email,
        role: role === 'admin' ? 'admin' : 'citizen',
        password
      };
      inMemoryUsers.push(newUser);

      return res.status(201).json({
        success: true,
        mode: 'in-memory-fallback',
        data: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          token: generateToken(newUser._id, newUser.role)
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      return res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          token: generateToken(user._id, user.role)
        }
      });
    } else {
      // In-memory fallback
      const user = inMemoryUsers.find(u => u.email === email && u.password === password);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Demo accounts: admin@smartcity.com (password123), citizen@smartcity.com (password123)' });
      }

      return res.json({
        success: true,
        mode: 'in-memory-fallback',
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          token: generateToken(user._id, user.role)
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get logged in user profile
 */
export const getUserProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    return res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};
