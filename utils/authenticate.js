import jwt from"jsonwebtoken";
import CustomError from "./errorHandler.js";
import { config } from "../configs/config.js";
import User from "../models/user.model.js";

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if(!token) throw new CustomError(401, "Unauthorized", "AuthError");

        const decoded = jwt.verify(token, config.jwt_secret);
        const user = await User.findById(decoded.id);

        if(!user) throw new CustomError(401, "User not found", "AuthError");

        req.user = user;
        next();
    } catch (error) {
        next(error)
    }
};

export default authenticate