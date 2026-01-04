import mongoose from 'mongoose'
const schema = mongoose.Schema

const roleSchema = new schema(
  {
    RoleCode: {
      type: String,
      required: [true, 'Role code is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return validator.isAlpha(value)
        },
      },
    },
    Name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return validator.isAlpha(value)
        },
        message: 'Role name must contain only letters',
      },
      enum: {
        Values: ['owner', 'admin', 'manager', 'team lead', 'moderator', 'employee'],
        message: '{VALUE} Invalid role name',
      },
      default: 'employee',
    },
    Level: {
      type: Number,
      min: 1,
      max: 6,
      default: 6,
    },

    IsActive: {
      type: Boolean,
      default: true,
    },
    Description: {
      type: String,
      required: [true, 'Role description is required'],
      trim: true,
      lowercase: true,
    },
    UpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
)

roleSchema.pre('save', function (next) {
  if (this.isModified('Name') || this.isNew) {
    const levelOfPower = {
      owner: 1,
      admin: 2,
      manager: 3,
      'team lead': 4,
      moderator: 5,
      employee: 6,
    }
    let assign_level = levelOfPower[this.Name]

    if (this.Name === undefined) {
      return next(new Error('In valid role name'))
    }

    this.Level = assign_level

    next()
  }
})

roleSchema.pre('remove', async function (next) {
  let role = this
  let defaultRole = ['admin', 'moderator', 'team lead']
  if (defaultRole.includes(role.Name)) {
    return next(new Error('Cannot delete default system role'))
  }
  next()
})

roleSchema.pre('remove', async function (next) {
  let User = mongoose.model('User')
  let userCount = await User.countDocuments({
    Role: this._id,
  })

  if (userCount > 0) {
    return next(new Error(`Can't delete role , there are ${userCount} users  assigned to that role . please Reassign users first `))
  }
  next()
})

roleSchema.pre(/^find/, function (next) {
  this.find({ IsActive: { $ne: false } })
})

const Role = mongoose.model('Role', roleSchema)

export default Role
