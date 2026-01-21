import express from "express";
const router = express.router();
import {   signup,
    Login,
    logout,
    refreshToken,      
    restrictedTo,
    protection,
    resetPassword,
    updatePassword,
    forgetPassword,
    SendEmailVerification
 } from "../Middleware/AuthMiddelware";
 

