const jwt = require('jsonwebtoken');
const CustomError = require('../utils/customError');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new CustomError('Not authorized to access this route', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Mocking user retrieval for the sake of the assessment if user db doesn't exist yet, 
        // but assuming it's managed via token claims usually
        req.user = decoded;
        next();
    } catch (err) {
        return next(new CustomError('Not authorized to access this route', 401));
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(
                new CustomError(`User role ${req.user ? req.user.role : 'undefined'} is not authorized to access this route`, 403)
            );
        }
        next();
    };
};
