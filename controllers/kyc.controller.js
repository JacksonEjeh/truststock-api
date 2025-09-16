import User from "../models/user.model.js";
import sendEmail from "../utils/emailSender.js";
import CustomError from "../utils/errorHandler.js";


// Review and update a user's KYC status (admin only)

export const reviewKyc = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;
    const { status, notes } = req.body; // status: "verified" | "rejected" | "pending"

    if (!["verified", "rejected", "pending"].includes(status)) {
      throw new CustomError(400, "Invalid KYC status", "ValidationError");
    }

    const user = await User.findById(userId).session(session);
    if (!user) throw new CustomError(404, "User not found", "ValidationError");

    // Update KYC status
    user.kyc = {
      ...user.kyc,
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user._id, 
      notes: notes || user.kyc.notes,
    };

    await user.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Send email notification
    let subject, message;
    if (status === "verified") {
      subject = "KYC Verification Approved ✅";
      message = `
        Dear ${user.username || "User"},
        <br/><br/>
        Congratulations! Your KYC documents have been successfully verified. 🎉
        <br/><br/>
        You can now access full features of your account, including withdrawals.
        <br/><br/>
        Regards,<br/>
        Truststock Compliance Team
      `;
    } else if (status === "rejected") {
      subject = "KYC Verification Rejected ❌";
      message = `
        Dear ${user.username || "User"},
        <br/><br/>
        Unfortunately, your KYC documents could not be verified.
        <br/>
        Reason: <strong>${notes || "Documents did not meet requirements"}</strong>
        <br/><br/>
        Please re-upload valid documents and try again.
        <br/><br/>
        Regards,<br/>
        Truststock Compliance Team
      `;
    } else {
      subject = "KYC Under Review ⏳";
      message = `
        Dear ${user.username || "User"},
        <br/><br/>
        Your KYC documents are currently under review by our compliance team.
        <br/>
        You’ll be notified once a decision has been made.
        <br/><br/>
        Regards,<br/>
        Truststock Compliance Team
      `;
    }

    await sendEmail(user.email, subject, message); 

    res.status(200).json({
      success: true,
      message: `KYC ${status === "verified" ? "approved" : status}`,
      user: {
        id: user._id,
        email: user.email,
        kyc: user.kyc,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Upload government-issued ID documents (passport, driver’s license, SSN, etc.)
 
export const uploadIdDocs = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) throw new CustomError(404, "User not found", "ValidationError");

    const docTypes = req.body.docTypes ? JSON.parse(req.body.docTypes) : [];

    req.files.forEach((file, i) => {
      const docType = docTypes[i] || "id";

      // Prevent duplicate type
      user.idDocuments = user.idDocuments.filter((d) => d.type !== docType);

      user.idDocuments.push({
        type: docType,
        public_id: file.filename, 
        url: file.path, 
        uploadedAt: new Date(),
      });
    });

    if (user.kyc.status === "unsubmitted") {
      user.kyc.status = "pending";
    }

    await user.save();

    res.json({
      success: true,
      message: "ID documents uploaded successfully",
      files: req.files.map((f) => f.path),
      kycStatus: user.kyc.status,
    });
  } catch (err) {
    next(err);
  }
};

// Upload live selfies (front, left, right, smile, neutral, etc.)
 
export const uploadSelfies = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No selfies uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) throw new CustomError(404, "User not found", "ValidationError");

    const labels = req.body.labels ? JSON.parse(req.body.labels) : [];

    req.files.forEach((file, i) => {
      const label = labels[i] || `selfie-${i}`;

      // Prevent duplicate for same label
      user.selfieCaptures = user.selfieCaptures.filter((s) => s.label !== label);

      user.selfieCaptures.push({
        label,
        public_id: file.filename,
        url: file.path,
        uploadedAt: new Date(),
      });
    });

    if (user.kyc.status === "unsubmitted") {
      user.kyc.status = "pending";
    }

    await user.save();

    res.json({
      success: true,
      message: "Selfies uploaded successfully",
      files: req.files.map((f) => f.path),
      kycStatus: user.kyc.status,
    });
  } catch (err) {
    next(err);
  }
};
