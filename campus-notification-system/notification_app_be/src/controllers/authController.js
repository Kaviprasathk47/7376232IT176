const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, studentId) => {
    return jwt.sign({ id, studentId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

exports.register = async (req, res) => {
    try {
        const { studentId, email, password } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({ studentId, email, password });
        
        res.status(201).json({
            success: true,
            token: generateToken(user._id, user.studentId)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.status(200).json({
            success: true,
            token: generateToken(user._id, user.studentId)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
