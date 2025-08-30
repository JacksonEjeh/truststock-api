import User from "../models/user.model";
import CustomError from "../utils/errorHandler";

const getAllUsers = async (req, res, next,) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        if(isNaN(pageNumber) || isNaN(limitNumber)) {
            throw new CustomError(400, "Invalid pagination parameters", "ValidationError")
        }
        
        const fetchedUsers = await User.find()
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
        
        const totalUsers = await User.countDocuments();
        res.status(200).json({
            success: true,
            users: fetchedUsers,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limitNumber),
            currentPage: pageNumber
        });
    } catch (error) {
        next(error)
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            throw new CustomError(404, "User not found", "NotFoundError");
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        next()
    }
};

const updateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user) {
            throw new CustomError(404, "User not found", "NotFoundError")
        } 
        const updateData = req.body;
        if(!updateData || Object.keys(updateData).length === 0) {
             throw new CustomError(400, "No data provided for update", "ValidationError");
        }
        if (updateData.password || updateData.otp) {
            throw new CustomError(400, "Password update is not allowed here", "ValidationError");
        }

        Object.assign(user, updateData);
        await user.save();

        res.status(200).json({
            success: true,
            user,
            message: "Profile update successfully"
        });
    } catch (error) {
        next(error)
    }
}