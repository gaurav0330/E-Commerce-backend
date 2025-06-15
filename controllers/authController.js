const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail, sendLoginEmail } = require('../services/emailServices');

const registerUser = async (req, res) => {
  const { email, password, companyName, username } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      companyName,
      username: username || email.split('@')[0]
    });

    await user.save();

    // Send welcome email
    const welcomeMessage = `Hello ${user.username || email},\n\nWelcome to our E-Commerce Platform! Your account has been successfully created for ${companyName}.\n\nStart adding products, get your predictions, and track your inventory.\nE-Commerce Team`;
    await sendEmail(email, 'Welcome to E-Commerce Platform', welcomeMessage);

    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token });
  } catch (error) {
    console.error('Error registering user:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send login alert email
    await sendLoginEmail(user.username || email.split('@')[0], user.email);

    res.json({ token });
  } catch (error) {
    console.error('Error logging in user:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message, error.stack);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

module.exports = { registerUser, loginUser, getAllUsers };