const User = require('../models/User');
const asyncWrapper = require('../utils/asyncWrapper');
const CustomError = require('../utils/customError');
const jwt = require('jsonwebtoken');

const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id, studentId: user.studentId, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            studentId: user.studentId,
            email: user.email,
            role: user.role
        }
    });
};

exports.register = asyncWrapper(async (req, res, next) => {
    const { studentId, email, password, role } = req.body;

    const user = await User.create({
        studentId,
        email,
        password,
        role
    });

    sendTokenResponse(user, 201, res);
});

exports.login = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new CustomError('Please provide an email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new CustomError('Invalid credentials', 401));
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new CustomError('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
});
