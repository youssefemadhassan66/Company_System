import mongoose from "mongoose";
import User from "./UserModel";
import { allow, boolean, date, required, string } from "joi";
import { defaultFormat } from "moment";
import { type } from "os";
const schema = mongoose.Schema

const attendanceSchema = new schema ({  
    Employee :{
        ref: 'User',
        type:schema.Types.ObjectId,
        required:true
    },
    CheckIn:{
        time:date,
        location:{
        latitude: Number,
        longitude: Number
        },
        required:true
    },
    CheckOut:{
        time:date,
        required:true,
        location:{
        latitude: Number,
        longitude: Number
        },
    },
    WorkMode:{
       type: String,
        enum: ['office', 'work-from-home', 'hybrid'],
        default: 'office',
        required: true,
        index: true
    },
    Status:{
        type:string,
        enum: ['present', 'absent', 'late', 'half-day', 'on-leave','holiday'],
        required:true,
        default:'absent',
        index:true
    },
    WorkHours:{
        type:Number,
        default:0
    },
    Date:{
        type:Date,
        default:Date.now(),
        index:true,
    },
    workLocation:{
       name:{
        type:string,
        required:true
       }
       ,latitude: {
        type:Number,
        required:true
       },
       longitude:{
        type:Number,
        required:true
       },
       allowedRadius:{
        type:Number,
        default:100
       }
    },
    IsCheckInIn:{
       type: boolean,
       default:true
    },
    IsCheckInOut:{
       type: boolean,
       default:true
    }
   
},{
    timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})

// Compound index: One record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// For common queries
attendanceSchema.index({ status: 1, date: -1 });

attendanceSchema.virtual('IsComplete').get(function(){
    return !!(this.IsCheckInIn && this.IsCheckInOut)
})

attendanceSchema.pre('save',async function (next) {
    if(this.CheckIn?.time && this.CheckOut?.time){
        // In milSecond
        let WorkHourInMil = this.CheckOut.time -  this.CheckIn.time
        this.WorkHours = Math.round((WorkHourInMil / (1000 * 60 * 60)) * 100) / 100;
    }  
    if (this.workMode === 'work-from-home') {
        this.isCheckInValid = true;
        this.isCheckOutValid = true;
  }
    return next()
})


// Statice Methods

attendanceSchema.statics.getDateByRange = function(EmployeeId,StartDate,EndDate){

    return this.find({
        Employee:EmployeeId,
        Date:{$gte:StartDate,$lte:EndDate}
    }).sort('date').lean();

}

attendanceSchema.statics.getToday = function(EmployeeId){
    const today = new Date()
    today = setHours(0,0,0,0);
    return this.findOne({
        Employee:EmployeeId,
        Date:today
    });
};

attendanceSchema.statics.getInvalidLocations = function(filters = {}) {
  return this.find({
    workMode: 'office', // Only office mode can have invalid locations
    $or: [
      { isCheckInValid: false },
      { isCheckOutValid: false }
    ],
    ...filters
  })
  .populate('employee', 'firstName lastName email')
  .sort('-date')
  .lean();
};

const Attendance = mongoose.Model('Attendance',attendanceSchema)

export default Attendance 