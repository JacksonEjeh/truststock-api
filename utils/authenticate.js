import jwt from"jsonwebtoken";
import CustomError from "./errorHandler.js";
import { config } from "../configs/config.js";
import User from "../models/user.model.js";

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new CustomError(401, 'No token provided', 'AuthError')
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt_secret);
        } catch (error) {
            if(error.name === 'TokenExpiredError') {
                throw new CustomError(401, 'Access token expired', 'TokenExpired');
            }
            throw new CustomError(401, 'Invalid token', 'AuthError');
        }
        
        const user = await User.findById(decoded.id).select('-password');
        if(!user) throw new CustomError(401, 'User not found', 'AuthError');
        
        req.user = user;
        next();
    } catch (error) {
        next(error)
    }
};

export default authenticate