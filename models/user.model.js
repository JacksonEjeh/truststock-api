import mongoose from "mongoose";
import { nanoid } from "nanoid";

const phoneNumberValidator = /^[+]?[0-9]{10,15}$/;

const userSchema = new mongoose.Schema({
    investor_status: { type: String, default: "retail" },
    investor_Id: {
        type: String,
        unique: true,
    },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    profilePics: {
        url: { type: String, trim: true },
        public_id: { type: String, trim: true }
    },
    phone_number: {
        type: String,
        validate: {
            validator: function (v) {
                return phoneNumberValidator.test(v);
            },
            message: "Phone number must be a valid number with 10–15 digits, optionally starting with a '+'"
        }
    },
    gender: { type: String, trim: true, lowercase: true, enum: ["male", "female"] },
    date_of_birth: {
        type: Date,
        validate: {
            validator: function (value) {
                return value < new Date();
            },
            message: "Date of birth cannot be in the future"
        }
    },
    country_of_residence: { type: String, trim: true, lowercase: true },
    city: { type: String, trim: true, lowercase: true },
    street: { type: String, trim: true, lowercase: true },
    postal_code: { type: String, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    isVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    refreshToken: { type: String, select: false }
}, { timestamps: true });

userSchema.pre("save", function (next) {
    if (this.isNew && !this.investor_Id) {
        this.investor_Id = `TRS-${nanoid(10)}`;
    }
    next();
});

userSchema.pre("save", function (next) {
    this.isProfileComplete =
        !!this.investor_status &&
        !!this.investor_Id &&
        !!this.first_name &&
        !!this.last_name &&
        !!this.email &&
        !!this.profilePics?.url &&
        !!this.phone_number &&
        !!this.gender &&
        !!this.date_of_birth &&
        !!this.country_of_residence &&
        !!this.city &&
        !!this.street &&
        !!this.postal_code;
    next();
});

const User = mongoose.model("User", userSchema);
export default User;
