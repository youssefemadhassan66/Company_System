import mongoose from 'mongoose' 
import { useId } from 'react'
const { schema } = mongoose
const tasksSchema = new schema({
    title: {
        type: String,
        required: true,
        maxlength: [100, 'Title must be less than 100 characters'],
        minlength: [3, 'Title must be at least 3 characters'],
        trim: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: [500, 'Description must be less than 500 characters'],
        minlength: [10, 'Description must be at least 10 characters'],
        trim: true,
    },
    type:{
        type: String,
        required: true,
        default: 'Update',
    },
    priority:{
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'in progress', 'completed', 'archived'],
        default: 'pending',
    },
    assignedTo: {
        type: schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedBy: {
        type: schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > Date.now()
            },
            message: 'Due date must be in the future',
        },
    },
    review:{
        type:string,
        maxlength: [1000, 'Review must be less than 1000 characters'],
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    ComlpletedAt:{
        type:Date
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },  
    
}, { 
    timestamps: true ,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})

tasksSchema.index({ status: 1, dueDate: 1 });
tasksSchema.index({ assignedTo: 1, status: 1 });
tasksSchema.index({ priority: 1 });
tasksSchema.index({ isDeleted: 1 });
tasksSchema.index({ dueDate: 1 });


tasksSchema.pre(/^find/,function(next){
    this.find({ isDeleted: { $ne: false } })
})

tasksSchema.pre('save',function (next) {

   if(this.isModified('status')){
    if(this.status === 'complete'){
        this.isCompleted = true;
        this.ComlpletedAt = new Date();
        this.progress = 100;
    }

    else if (this.status ==='Pending' || this.status === 'in progress'){
        this.isCompleted = false;
        this.ComlpletedAt = undefined
    }
   }
   
   if(this.isModified('status') && !this.isModified('progress')){
    if (this.status == 'pending') {this.progress = 0} 
    if (this.status == 'in progress') {this.progress = Math.max(this.progress || 0, 50)} 
    if (this.status == 'complete') {this.progress = 100} 

   }

   next();
})



// Methods 

tasksSchema.methods.markComplete = async function () {
    this.status = 'complete';
    this.isCompleted = true;
    this.progress = 100;
    this.ComlpletedAt = new Date();
    return this.save();
}

tasksSchema.statics.getStatistics = async function(userId = null) {
    const matchStage = userId ? { assignedTo: userId } : {};
    
const stats = await this.aggregate([
        { $match: { ...matchStage, isDeleted: false } },
        {
            $facet: {
                totalTasks: [{ $count: "count" }],
                byStatus: [
                    { $group: { _id: "$status", count: { $sum: 1 } } }
                ],
                byPriority: [
                    { $group: { _id: "$priority", count: { $sum: 1 } } }
                ],
                byType: [
                    { $group: { _id: "$type", count: { $sum: 1 } } }
                ],
                overdueTasks: [
                    { 
                        $match: { 
                            status: { $nin: ['completed', 'archived'] },
                            dueDate: { $lt: new Date() }
                        }
                    },
                    { $count: "count" }
                ],
                upcomingTasks: [
                    { 
                        $match: { 
                            status: { $nin: ['completed', 'archived'] },
                            dueDate: { 
                                $gt: new Date(),
                                $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
                            }
                        }
                    },
                    { $count: "count" }
                ],
                completionStats: [
                    {
                        $group: {
                            _id: null,
                            totalEstimatedHours: { $sum: "$estimatedHours" },
                            totalActualHours: { $sum: "$actualHours" },
                            avgProgress: { $avg: "$progress" }
                        }
                    }
                ],
                monthlyCompletion: [
                    {
                        $group: {
                            _id: { 
                                year: { $year: "$completedAt" },
                                month: { $month: "$completedAt" }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id.year": -1, "_id.month": -1 } },
                    { $limit: 12 }
                ]
            }
        }
    ]);

    return stats[0];
};

tasksSchema.statics.getTasksBetweenDateRange = async function(userId=null,StartDate,EndDate){

    const MatchedUser = userId ? {assignedTo:userId} : {}
       return await this.find({
            ...MatchedUser,
            createdAt:{
                $gte:StartDate,
                $lte:EndDate
            },
            isDeleted:false
        }).sort({createdAt:-1})
}

tasksSchema.statics.getDueDate = async function(userId,EndDate){

    const MatchedUser = userId ? {assignedTo:userId} : {};
    const today = new Date();
       return await this.find({
            ...MatchedUser,
            dueDate:{
                $gte:today,
                $lte:EndDate
            },
            isDeleted:false
        }).sort({dueDate:-1})
}

tasksSchema.getOverDueTasks = async function (userId = null) {
    today = new Date()
    MatchedUser = userId ? {assignedTo:userId} :{}
    return this.find({
        status:{$nin:['completed', 'archived']},
        dueDate:{$lte:today},
        isDeleted:false
    })
}



const Task = mongoose.model('Task', tasksSchema)



export default Task