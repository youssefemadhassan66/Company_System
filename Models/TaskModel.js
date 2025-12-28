import mongoose from 'mongoose' 
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
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },  
}, { timestamps: true })

const Task = mongoose.model('Task', tasksSchema)



export default Task