import CustomError from "../../utils/errorHandler.js";

export default function checkKycForWithdrawal(req, res, next) {
  const user = req.user;

  // Kyc check
  const profileOk = user.profileCompleted === true;
  const hasIdDoc = Array.isArray(user.idDocuments) && user.idDocuments.length > 0;
  const hasSelfies = Array.isArray(user.selfieCaptures) && user.selfieCaptures.length >= 2; 
  const kycApproved = user.kyc && user.kyc.status === "approved";

  // Required minimal: profile completed and at least uploaded ID + selfies; admin must approve before withdrawal
  if (!profileOk || !hasIdDoc || !hasSelfies || !kycApproved) {
    return next(
      new CustomError(
        403,
        "Withdrawal blocked: complete your profile and submit valid ID and live captures for KYC verification.",
        "KYCError"
      )
    );
  }

  return next();
}
