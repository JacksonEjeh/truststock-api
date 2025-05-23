import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import sendEmail from "../utils/emailSender.js";
import CustomError from "../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import { config } from "../configs/config.js";

const generateOTP = () =>({
    otp: Math.floor(100000 + Math.random() * 900000).toString(),
    otpExpiresAt: Date.now() + 10 * 60 *1000,
});

const generateAndSendOTP = async (user)=> {
    const { otp, otpExpiresAt} = generateOTP();
    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendEmail(user.email, "Your OTP Code", `Your new OTP is ${otp}. It expires in 10 minutes`);
};

// user registration and send OTP
const signUp = async (req, res, next) => {

    const session = await User.startSession();
    session.startTransaction();

    try {
        const { first_name, last_name, email, password } = req.body;

        const existingUser = await User.findOne({ email }).exec();
        if (existingUser) throw new CustomError(400, "User already exists", "ValidationError");

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
        if (!passwordRegex.test(password)) {
            throw new CustomError(400, "Password must include uppercase, lowercase, number, and special character.", "ValidationError");
        }

        if (!first_name || !last_name || !email || !password) {
            throw new CustomError(400, "All fields are required", "ValidationError");
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            throw new CustomError(400, "Invalid email format", "ValidationError");
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const { otp, otpExpiresAt } = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        const newUser = new User({
            first_name,
            last_name,
            email,
            password: passwordHash,
            otp: hashedOTP,
            otpExpiresAt,
            isVerified: false,
        });

        await newUser.save({ session });

        // ✅ Send email BEFORE committing the transaction
        const emailSent = await sendEmail(
            email,
            "Your OTP Code",
            `Your OTP is: ${otp}. It expires in 10 minutes.`
        );

        if (emailSent.success === false) {
            throw new CustomError(400, "Failed to send OTP, Please try again later", "ValidationError");
        }

        await session.commitTransaction(); // ✅ Commit only after successful email
        session.endSession();

        res.status(201).json({
            success: true,
            message: "OTP sent to email. Please verify your account.",
            data: { email },
        });
    }catch (error) {
        await session.abortTransaction();
        session.endSession();
        // Handle duplicate key errors clearly
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            const value = error.keyValue[field];
            return next(new CustomError(400, `Duplicate ${field}: "${value}"`, "ValidationError"));
        }
        // Default
        next(error);
    }
    
};

// verify otp and activate account
const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email }).select("+otp +otpExpiresAt");

        
        if(!user) throw new CustomError(404, "User not found", "ValidationError");
        if(user.isVerified) throw new CustomError(400, "User is already verified", "ValidationError");

        // console.log("Received OTP from request:", otp);
        // console.log("Stored OTP in DB:", user.otp);

        if(!otp || !user.otp){
            throw new CustomError(400, "OTP expired or invalid", "ValidationError");
        }

        //check if otp is expired
        if(Date.now() > user.otpExpiresAt){
            await generateAndSendOTP(user);
            return res.status(404).json({ success: false, message: "OTP expired. A new OTP has been sent."});
        } 

        const otpMatch = await bcrypt.compare(otp.toString(), user.otp);
        if(!otpMatch) throw new CustomError(400, "Invalid OTP", "ValidationError");

        user.isVerified = true;
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        res.status(200).json({ success: true, message: "Account verified successfully"});
    } catch (error) {
        next(error)
    }
};

// Resend OTP
const resendOTP = async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new CustomError(400, "Email is required", "ValidationError");
      }
  
      const user = await User.findOne({ email });
  
      if (!user) {
        throw new CustomError(404, "User not found", "ValidationError");
      }
  
      if (user.isVerified) {
        throw new CustomError(400, "User is already verified", "ValidationError");
      }
  
      await generateAndSendOTP(user);
  
      res.status(200).json({
        success: true,
        message: "New OTP sent to your email.",
        data: { email },
      });
    } catch (error) {
      next(error);
    }
};  

// user login (generate tokens)
const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        if(!email && !password) throw new CustomError(400, "Email and password are required", "ValidationError");
        if(!email) throw new CustomError(400, "Email is required", "ValidationError");
        if(!password) throw new CustomError(400, "Password is required", "ValidationError");
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/; // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        if (!passwordRegex.test(password)) {
            throw new CustomError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number", "ValidationError");
        }
        if ( !email || !password) {
            throw new CustomError(400, "All fields are required", "ValidationError");
        }
        if (!email.match(/^\S+@\S+\.\S+$/)) {
            throw new CustomError(400, "Invalid email format", "ValidationError");
        }

        const user = await User.findOne({ email }).select("+password +refreshToken");
        
        if(!user) throw new CustomError(404, "User not found", "ValidationError");
        if(!user.isVerified) throw new CustomError(403, "Account not verified", "ValidationError");

        const passwordMatch = await bcrypt.compare(password, user.password);
        if(!passwordMatch) throw new CustomError(400, "Invalid credentials", "ValidationError");

        const accessToken = jwt.sign({ id: user._id}, config.jwt_secret, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: user._id}, config.refresh_secret, { expiresIn: "7d" });

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });


        res.status(200).json({ success: true, accessToken: accessToken, user: { email: user.email, first_name: user.first_name, last_name: user.last_name, isProfileComplete: user.isProfileComplete } });
    }catch (error){
        next(error)
    }
};

//Refresh Token
const refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;     
        
        if(!refreshToken) throw new CustomError(401, "No refresh token provided", "AuthorizationError");
        
        const decoded = jwt.verify( refreshToken, config.refresh_secret);
        const user = await User.findById(decoded.id);

        if(!user) throw new CustomError(403, "Invalid refresh token", "AuthorizationError");
        
        const newAccessToken = jwt.sign({ id: user._id }, config.jwt_secret, { expiresIn: "15m"});
        
        res.status(200).json({ success: true, accessToken: newAccessToken});
    } catch (error) {
        next(error)   
    }
};

//Logout (invalidate refresh token)
const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) throw new CustomError(401, "No refresh token provided", "AuthorizationError");

        const decoded = jwt.verify( refreshToken, config.refresh_secret);
        if(!decoded) throw new CustomError(403, "Invalid refresh token", "AuthorizationError");
        
        const user = await User.findById(decoded.id);

        user.refreshToken = null;
        await user.save();
        
        res.clearCookie("refreshToken", { httpOnly: true, sameSite: "Strict" });

        res.status(200).json({ success: true, message: "Logged out successfully" });

    } catch (error) {
        next(error)
    }
};

// Forgot password (SEND OTP)
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) throw new CustomError(404, "User not found", "ValidationError");

        await generateAndSendOTP(user)

        res.status(200).json({ success: true, message: "Password reset OTP sent to email.", data: { email: user.email } });
    } catch (error) {
       next(error) 
    }
};

// Reset password (verify otp and update password)
const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email }).select("+otp +otpExpiresAt");
        if (!user) throw new CustomError(404, "User not found", "ValidationError");

        if (!otp || !user.otp) {
            throw new CustomError(400, "OTP expired or invalid", "ValidationError");
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/; // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        if (!passwordRegex.test(newPassword)) {
            throw new CustomError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number", "ValidationError");
        }
        if (Date.now() > user.otpExpiresAt) {
            await generateAndSendOTP(user);
            return new CustomError(400, "OTP expired. A new OTP has been sent.", "ValidationError");
        }

        const otpMatch = await bcrypt.compare(otp.toString(), user.otp);
        if (!otpMatch) throw new CustomError(400, "Invalid OTP", "ValidationError");

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successfully" });

    } catch (error) {
        next(error)
    }
};

// change password
const changePassword = async ( req, res, next) => {
    try {
        const { old_password, new_password } = req.body;
        if ( !old_password ) throw new CustomError( 400, "Old password is required", "ValidationError");
        if ( !new_password ) throw new CustomError( 400, "New password is required", "ValidationError");

        const user = await User.findOne({ _id: req.user._id }).select("+password");
        if( !user ) throw new CustomError( 404, "User not found", "ValidationError");

        const passwordMatch = await bcrypt.compare(old_password, user.password);
        if( !passwordMatch ) throw new CustomError( 400, "Invalid old password", "ValidationError");

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/; // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        if ( !passwordRegex.test(new_password) ) {
            throw new CustomError( 400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number", "ValidationError");
        }

        user.password = await bcrypt.hash(new_password, 10);
        await user.save();

        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        next(error);
    }
}


export { signIn, signUp, logout, forgotPassword, resetPassword, verifyOTP, resendOTP, refreshToken, changePassword};
