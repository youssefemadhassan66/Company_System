/* eslint-disable import/no-extraneous-dependencies */
import mongoose from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'


const schema = mongoose.Schema
const userSchema = new schema(
  {
    UserName: {
      type: String,
      required: true,
      maxlength: [30, 'User name must be less than 30 characters'],
      minlength: [3, 'User name must be more than 3 characters'],
    },
    FirstName: {
      type: String,
      required: [true, 'First Name is required'],
      maxlength: [30, 'First Name must be less than 30 characters'],
      minlength: [3, 'First Name must be at least 3 characters'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return validator.isAlpha(value)
        },
        message: 'First Name must contain only letters',
      },
    },
    LastName: {
      type: String,
      required: [true, 'Last Name is required'],
      maxlength: [30, 'Last Name must be less than 30 characters'],
      minlength: [3, 'Last Name must be at least 3 characters'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return validator.isAlpha(value)
        },
        message: 'Last Name must contain only letters',
      },
    },
    Email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return validator.isEmail(value)
        },
        message: 'Invalid Email',
      },
    },
    IsEmailVerified:{
      type:Boolean,
    },
    NationalId: {
      type: String,
      required: [true, 'National ID is required'],
      unique: true,
      maxlength: [14, 'National ID must be 14 characters'],
      minlength: [14, 'National ID must be 14 characters'],
      trim: true,
      lowercase: true,
      select: false,
      validate: {
        validator: function (value) {
          return validator.isNumeric(value)
        },
        message: 'Invalid National ID',
      },
    },
    Password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
      validate: {
        validator: function (value) {
          return validator.isStrongPassword(value)
        },
        message:
          'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number and one special character',
      },
    },
    Position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return validator.isAlpha(value)
        },
        message: 'Position must contain only letters',
      },
    },
    PhoneNumber: {
      type: String,
      required: [true, 'Phone Number is required'],
      match: [/^01[0125][0-9]{8}$/, 'Invalid phone number'],
      validate: {
        validator: function (value) {
          return validator.isMobilePhone(value)
        },
        message: 'Invalid Phone Number',
      },
    },
    ProfilePicture: {
      type: String,
      default: 'default.png',
    },
    Gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    DateOfBirth: {
      type: Date,
      required: [true, 'Date of Birth is required'],
      
    },
    Address: {
      type: String,
      trim: true,
      lowercase: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    Salary: {
      type: Number,
      validate: {
        validator: function (value) {
          return value > 0
        },
        message: 'User salary must be greater than 0',
      },
    },
    Bonus: {
      type: Number,
      validate: {
        validator: function (value) {
          return value > 0
        },
        message: 'User salary must be greater than 0',
      },
    },
    IsActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    Role: {
      ref: 'Role',
      type: schema.Types.ObjectId,
      required: true,
    },
    emailVerificationToken: {
      type:String,
      select:false,
    },
    emailVerificationExpire:
    {
      type:Date,
      select:false,
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    refreshToken: 
    {
      type:String,
      select:false
    },
    refreshTokenExpire:{
       type:Date,
      select:false
    },
  },
  { timestamps: true }
)

userSchema.virtual('FullName').get(function () {
  return `${this.FirstName} ${this.LastName}`
})

userSchema.virtual('Age').get(function () {
  if (!this.DateOfBirth) return null
  let Age = new Date().getFullYear() - this.DateOfBirth.getFullYear()
  return Age
})

userSchema.pre(/^find/, function () {
  this.find({ IsActive: { $ne: false } })
})

userSchema.pre('save', async function () {
  if (!this.isModified('Password')) {
    return
  }
  this.Password = await bcrypt.hash(
    this.Password,
    parseInt(process.env.SALT_ROUNDS, 10)
  )
})

userSchema.pre('save', async function () {
  if (!this.isModified('Password') || this.isNew) {
    return
  }
  this.passwordChangeAt = Date.now() - 1000
})

userSchema.methods.matchUserPassword = async function (CandidatePassword) {
  return await bcrypt.compare(CandidatePassword, this.Password)
}

userSchema.methods.checkAuthAfterPasswordChange = async function (JwtIatTime) {
  if (this.passwordChangeAt) {
    var password_TimeStamp = Math.floor(this.passwordChangeAt.getTime() / 1000)
    return password_TimeStamp > JwtIatTime
  }
  return false
}

userSchema.methods.sendPasswordResetToken = function () {
  let resetToken = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  this.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000)
  return resetToken
}

userSchema.methods.sendEmailAuthToken = async function () {
  let VerificationToken = crypto.randomBytes(32).toString('hex')
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(VerificationToken)
    .digest('hex')
  this.emailVerificationExpire = new Date(Date.now() + 20 * 60 * 1000)
  return VerificationToken
}

userSchema.methods.StoreRefreshToken = function (JwtRefreshToken) {
  this.refreshToken = crypto.createHash('sha256').update(JwtRefreshToken).digest('hex')
   this.refreshTokenExpire = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)
  return this.save({ validateBeforeSave: false })
}

userSchema.methods.VerifyRefreshToken = function(JwtRefreshToken){
  if(!this.refreshToken || !this.refreshTokenExpire){
    return false;
  }

  const hashedRefreshToken = crypto.createHash('sha256').update(JwtRefreshToken).digest('hex')

  return this.refreshToken === hashedRefreshToken && this.refreshTokenExpire > Date.now() ;

}

userSchema.methods.clearRefreshToken = function(){
  this.refreshTokenExpire=undefined;
  this.refreshToken=undefined;
    return this.save({ validateBeforeSave: false });
}


userSchema.index({ LastName: 1, FirstName: 1 })

const User = mongoose.model('User', userSchema)
export default User
