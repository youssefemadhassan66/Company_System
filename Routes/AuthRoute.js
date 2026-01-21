import express from "express";
const router = express.Router();
import {   signup,
    Login,
    logout,
    refreshToken,      
    restrictedTo,
    protection,
    resetPassword,
    updatePassword,
    forgetPassword,
    SendEmailVerification,
    getVerificationTokenByEmail,
    reSendEmailToken
 } from "../Middleware/AuthMiddelware.js";


 router.post("/signup",signup)
 router.post("/login",Login)
 router.post("/forgetPassword",forgetPassword)
 router.post("/resetPassword/:token",resetPassword)
 router.post("/verify-email/:token",SendEmailVerification)
 router.get("/resend-email-token",reSendEmailToken)
 router.get("/get-verification-token",getVerificationTokenByEmail)
 


export default router