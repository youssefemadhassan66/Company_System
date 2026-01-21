import jwt from 'jsonwebtoken'
import wrapAsync from '../Utilities/wrapAsync.js'
import ErrorHandler from '../Utilities/ErrorHandler.js'
import User from '../Models/UserModel.js'
import Role from '../Models/RoleModel.js'
import Email from '../Utilities/Email.js'
import crypto from 'crypto'
import { promisify } from "util"

const SignAccessTokenHelper = id => {
    return jwt.sign(
        { id }, 
        process.env.JWT_TOKEN_SECRET, 
        { expiresIn: process.env.JWT_TOKEN_EXPIRES_IN || '30m' }
    )
}

const SignRefreshTokenHelper = id => {
    return jwt.sign(
        { id }, 
        process.env.JWT_REFRESH_TOKEN_SECRET, 
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '9d' }
    )
}

const SendCookie = (req, res, TokenName, TokenParam, Options) => {
    const cookieOptions = {
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    }
    res.cookie(TokenName, TokenParam, {
        ...cookieOptions,
        ...Options
    })
}

const CreateAndSendTokens = async (user, statuscode, req, res) => {
    const accessToken = SignAccessTokenHelper(user._id)
    const refreshToken = SignRefreshTokenHelper(user._id)

    await user.StoreRefreshToken(refreshToken)

    SendCookie(req, res, 'accessToken', accessToken, {
        expires: new Date(Date.now() + 30 * 60 * 1000)
    })
    SendCookie(req, res, 'refreshToken', refreshToken, {
        expires: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)
    })
   
    res.status(statuscode).json({
        status: 'Success',
        tokens: {
            accessToken,
            refreshToken,
        },
        data: {
            user: user
        }
    })
}

// Signup
const signup = wrapAsync(async (req, res, next) => {
    const newUser = await User.create({
        UserName: req.body.UserName,
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Email: req.body.Email,
        NationalId: req.body.NationalId,
        Password: req.body.Password,
        Position: req.body.Position,
        PhoneNumber: req.body.PhoneNumber,
        Gender: req.body.Gender,
        DateOfBirth: req.body.DateOfBirth,
        Address: req.body.Address,
        Role: req.body.Role,
        Salary: req.body.Salary,
        Bonus: req.body.Bonus,
        IsEmailVerified: false
    })
    
    try {
        const EmailVerificationToken = await newUser.sendEmailAuthToken()
        const url = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${EmailVerificationToken}`
        await newUser.save({ validateBeforeSave: false })
        await new Email(newUser, url).SendEmailVerification()
        
        res.status(201).json({
            status: 'success',
            message: 'User created! Please verify your email to activate your account.',
            data: {
                email: newUser.Email
            }
        })
    } catch (err) {
        // Delete user if email fails
        await User.findByIdAndDelete(newUser._id)
        return next(new ErrorHandler('Failed to send verification email. Please try again later!', 500))
    }
})

// Login  
const Login = wrapAsync(async (req, res, next) => {
    const { Email, Password } = req.body

    if (!Email || !Password) {
        return next(new ErrorHandler('Please provide email and password!', 400))
    }
    
    const user = await User.findOne({ Email })
    .populate('Role')
    .select('+Password')
       
        
    if (!user) {
        return next(new ErrorHandler('This email is not found', 401))
    }
    if(user.IsEmailVerified !=true){
        return next(new ErrorHandler('This email is not verified', 401))
    }

    if (!await user.matchUserPassword(Password)) {
        return next(new ErrorHandler('Password is not correct, please try again!', 401))
    }
    
    CreateAndSendTokens(user, 200, req, res)
})

// Refresh Token
const refreshToken = wrapAsync(async (req, res, next) => {
    let refreshToken
    
    if (req.cookies.refreshToken) {
        refreshToken = req.cookies.refreshToken
    } else if (req.body.refreshToken) {
        refreshToken = req.body.refreshToken
    }
    
    if (!refreshToken) {
        return next(new ErrorHandler("Refresh token is missing", 400))
    }
    
    let decodedToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET)

    if (!decodedToken) {
        return next(new ErrorHandler("Error while verifying refresh token", 400))
    }

    const user = await User.findById(decodedToken.id)
        .select('+refreshToken +refreshTokenExpire')
        .populate('Role')

    if (!user) {
        return next(new ErrorHandler("User no longer exists", 400))
    }

    if (!user.VerifyRefreshToken(refreshToken)) {
        return next(new ErrorHandler("Refresh token is not valid or has been revoked", 400))
    }
    
    if (user.checkAuthAfterPasswordChange(decodedToken.iat)) {
        return next(new ErrorHandler('User recently changed password! Please log in again.', 401))
    }

    const accessToken = SignAccessTokenHelper(user._id)

    res.status(200).json({
        status: 'success',
        data: {
            accessToken,
            expiresIn: process.env.JWT_TOKEN_EXPIRES_IN || '30m',
            user: user
        }
    })
})

// Logout 
const logout = wrapAsync(async (req, res, next) => {
    const user = req.user
    
    if (!user) {
        return next(new ErrorHandler("Error finding the user to logout", 400))
    }

    await user.clearRefreshToken()
   
    SendCookie(req, res, 'accessToken', 'loggedOut', {
        expires: new Date(Date.now() + 10 * 1000)
    })
    SendCookie(req, res, 'refreshToken', 'loggedOut', {
        expires: new Date(Date.now() + 10 * 1000)
    })

    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    })
})

// Protection Middleware
const protection = wrapAsync(async (req, res, next) => {
    let token
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer')) {
        token = authHeader.split(' ')[1]
    }
    if (req.cookies.accessToken) {
        token = req.cookies.accessToken
    }

    if (!token || token === 'loggedOut') {
        return next(new ErrorHandler('There is no token provided, please login first!', 401))
    }
    
    let DecodedToken = await promisify(jwt.verify)(token, process.env.JWT_TOKEN_SECRET)

    const currUser = await User.findById(DecodedToken.id).populate({
        path: 'Role',
        select: 'Name'
    })

    if (!currUser) {
        return next(new ErrorHandler('User no longer exists', 401))
    }

    if (currUser.checkAuthAfterPasswordChange(DecodedToken.iat)) {
        return next(new ErrorHandler('User changed password, please login again', 401))
    }
    
    req.user = currUser
    next()
})

// Restricted to Some Roles
const restrictedTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.Role?.Name) {
            return next(new ErrorHandler('User not authenticated', 401))
        }
        if (!roles.includes(req.user.Role.Name)) {
            return next(new ErrorHandler("This role is not authorized for this route", 403))
        }
        next()
    }
}


const forgetPassword = wrapAsync(async (req, res, next) => {
    // 1. Find user by email
    const user = await User.findOne({ Email: req.body.Email , IsEmailVerified:{$ne:false}})
    
    if (!user) {
        return next(new ErrorHandler("No user found with that email address", 404))
    }

    // 2. Generate reset token
    const resetToken = user.sendPasswordResetToken()
    
    
    await user.save({ validateBeforeSave: false })

    try {
        // 3. Build reset URL
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`

        
        await new Email(user, resetURL).sendPasswordReset()

        res.status(200).json({
            status: 'success',
            message: 'Password reset token sent to email!'
        })
    } catch (err) {
        // If email fails, clear reset token
        user.passwordResetToken = undefined
        user.passwordResetExpire = undefined
        await user.save({ validateBeforeSave: false })

        return next(new ErrorHandler("There was an error sending the email. Try again later!", 500))
    }
})


const resetPassword = wrapAsync(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpire: { $gt: Date.now() }
    })
    
    if (!user) {
        return next(new ErrorHandler("Token is invalid or has expired", 400))
    }

    // 3. Validate passwords
    const { Password, PasswordConfirm } = req.body

    if (!Password || !PasswordConfirm) {
        return next(new ErrorHandler("Please provide password and password confirmation", 400))
    }

    if (Password !== PasswordConfirm) {
        return next(new ErrorHandler("Passwords do not match", 400))
    }

    // 4. Update password and clear reset token
    user.Password = Password
    user.passwordResetToken = undefined
    user.passwordResetExpire = undefined
    await user.save()

    // 5. Log user in
    CreateAndSendTokens(user, 200, req, res)
})

// Password (for logged-in users)
const updatePassword = wrapAsync(async (req, res, next) => {
    // 1. Get user
    const user = await User.findById(req.user.id).select("+Password")

    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }


    const { currentPassword, newPassword, newPasswordConfirm } = req.body

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
        return next(new ErrorHandler("Please provide all required fields", 400))
    }


    if (!await user.matchUserPassword(currentPassword)) {
        return next(new ErrorHandler("Your current password is incorrect", 401))
    }

    // 3. Validate new passwords match
    if (newPassword !== newPasswordConfirm) {
        return next(new ErrorHandler("New passwords do not match", 400))
    }

   
    user.Password = newPassword
    await user.save()

    // 5. Log user in with new password
    CreateAndSendTokens(user, 200, req, res)
})

const SendEmailVerification = wrapAsync(async (req,res,next)=>{
    
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')
    
    console.log(hashedToken)
    const user = await User.findOne({
        emailVerificationToken:hashedToken,
        emailVerificationExpire:{$gt:Date.now()}
    })
 
    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }

    user.IsEmailVerified  = true
    await user.save()
    CreateAndSendTokens(user, 200, req, res)
})

const reSendEmailToken = wrapAsync(async(req,res,next)=>{

    const {email} = req.query

    if(!email){
        return next(new ErrorHandler('Email is required', 400))
    }

    const user  = await User.findOne({Email:email})
       if (!user) {
        return next(new ErrorHandler('User not found', 404))
    }


     try{
        const EmailVerificationToken = user.sendEmailAuthToken()
        const url = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${EmailVerificationToken}`
        await new Email(user,url).SendEmailVerification()
        
        res.status(200).json({
            status: 'success',
            message: 'Verification email sent successfully'
        })
    }catch(err){
        user.emailVerificationToken = undefined
        user.emailVerificationExpire = undefined
        await user.save({ validateBeforeSave: false })
        
        return next(new ErrorHandler('Error sending verification email. Try again later!', 500))
    }

})

// Debug endpoint to get verification token (for testing only)
const getVerificationTokenByEmail = wrapAsync(async (req, res, next) => {
    const { email } = req.query

    if (!email) {
        return next(new ErrorHandler('Email is required', 400))
    }

    const user = await User.findOne({ Email: email })

    if (!user) {
        return next(new ErrorHandler('User not found', 404))
    }

    // Generate a fresh verification token
    const newVerificationToken = await user.sendEmailAuthToken()
    await user.save({ validateBeforeSave: false })

    res.status(200).json({
        status: 'success',
        message: 'New verification token generated (for testing only)',
        email: user.Email,
        verificationToken: newVerificationToken,
        verificationUrl: `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${newVerificationToken}`
    })
})

export {
    signup,
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
}

