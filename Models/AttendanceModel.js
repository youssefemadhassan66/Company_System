import mongoose from "mongoose";
import User from "./UserModel";
import { required } from "joi";
const schema = mongoose.Schema

const AttendanceSchema = new schema ({  
    Employee :{
        ref: 'User',
        type:schema.Types.ObjectId,
        required:true
    },
    CheckIn:{
        type:date,
        required:true
    },
    CheckOut:{
        type:date,
        required:true
    },
    Status:{
        type:string,
        enum: ['present', 'absent', 'late', 'half-day', 'on-leave'],
        required:true,
        default:'absent'
    }


   
})