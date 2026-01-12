import jwt from 'jsonwebtoken'
import wrapAsync from '../Utilities/wrapAsync'
import ErrorHandler from '../Utilities/ErrorHandler'
import User from '../Models/UserModel'
import crypto from 'crypto'
import mongoose from 'mongoose'
import { promisify } from "util";


const jwtSignInHelper = id =>{
    return jwt.sign({id},process.env.TOKEN_SECRET,{expiresIn:process.env.TOKEN_EXPIRES_IN})
}

const CreateAndSendToken = (user,req,res,next)=>{
    const token = jwtSignInHelper(user._id)
    res.status(201).json({
        status: 'Success',
        token,
        data:{
            user:user
        }
    })
}


// signup
exports.signup = wrapAsync( async (req,res,next)=>{
    const newUser = await User.create(req.body);
    const User_id = newUser._id
    jwtSignInHelper(User_id)
    res.status(201).json({
        status:'success',
        message:"User created Successfully ",
        data:{
            user:newUser
        }
    })
})

// Login 
exports.Login =  wrapAsync( async (req,res,next)=>{

    const  {Email,Password} = req.body;

    if(!Email || !Password){
        return next (new ErrorHandler('Please provide email and password!',400))
    }
    
    // find email if exist 
    const user = await User.findOne({Email}).select('+Password')
    if(!user){
        return next(new ErrorHandler('This email is not found...', 401));
    }
    
    // Compare passwords
    if(! await user.matchUserPassword(user.Password)){
         new ErrorHandler('Password is no\'t correct , Please Try again !');
    }
    
    const token = jwtSignInHelper(user._id)
    
    res.status(201).json({
        status:'Success',
        message:'User Authenticated Successfully',
        token,
        data:{
            user:user
        }
    })
})

// Protection MiddleWare

const protection = wrapAsync(async (req,res,next)=>{
    const authHeader = req.headers['authorization'];
    let token; 
    
    if(authHeader && authHeader.startsWith('Bearer')){
        token = authHeader.split(' ')[1]
    }
     
    if(!token){
        return next(ErrorHandler('Their is no token provided please login first !',401));
    }

    let DecodedToken = await promisify(jwt.verify)(token, process.env.TOKEN_SECRET);

    const currUSer = await User.findById(DecodedToken.id).populate({
        path:'role',
        select:Name
    })
    

    if(!currUSer){
        return next(ErrorHandler('User no longer exists ',401))
    }

    if(!currUSer.checkAuthAfterPasswordChange(DecodedToken.iat)){
        return next(ErrorHandler('User changed password , Please login again'))
    }
    req.user = currUSer
    next()
})


// Restricted to some roles 

const restrictedTo = (...roles)=>{ (req,res,next) => {
    if(!req.user || !req.user.role.Name){
        return next(new ErrorHandler('User not authenticated', 401));
    }
    let role = req.user.role.Name
    
    if(!roles.includes(role)){
        return next(ErrorHandler("This role is not authorized for this route",403))
    }
    next();
}}

// logout 
const logout = wrapAsync((req,res,next)=>{
    console.log("Hello world!")

})

