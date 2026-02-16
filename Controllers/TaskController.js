import Task from "../Models/TaskModel.js"
import ApiFeatures from "../Utilities/ApiFeatures.js"
import ErrorHandler from "../Utilities/ErrorHandler.js"
import wrapAsync from "../Utilities/wrapAsync.js"


const createNewTask = wrapAsync(async(req,res,next)=>{

    const newTask = await Task.create(
        {
            title:req.body.title,
            description:req.body.description,
            type:req.body.type,
            priority:req.body.priority,
            status:req.body.status,
            assignedTo:req.body.assignedTo,
            assignedBy:req.body.assignedBy,
            dueDate:req.body.dueDate,
        })

    if (!newTask){
         return next(new ErrorHandler("Error while creating the task " , 404))
    }

    res.status(210).json({
        status:"Success",
        Message:"Task created successfully",
        data:{
            task : newTask
        }
        
    })

})




const getAllTasks = wrapAsync(async(req,res,next)=>{
const MainQuery = Task.find({}).populate({
    path: "assignedTo",
    select: "_id UserName FirstName Email Position"
}).populate({
    path :"assignedBy",
    select:"_id UserName Position"
})
    
    const features  = new ApiFeatures(MainQuery,req.query)
    .filter()
    .sort()
    .pagination()
    .limitFields()

    let doc = await features.query;

    if(!doc){
        return next(new ErrorHandler("No documents found " , 404))
    }
    
    doc = features.populatedFilter(doc);

       res.status(200).json({
        status:"Success",
         results: doc.length,
        data:{
            documents:doc
        }
    })

})

const getTaskById = wrapAsync(async(req,res,next)=>{
    const _id = req.params.id
    
    if(!id){
        return next(new ErrorHandler("Task Id is missing please provide TaskID"))
    }

    const task =  await Task.findById(_id)

    if(!task){
        return next(new ErrorHandler("No document for this task found ! ") )
    }

    res.status(200).json({
        status:"Success",
        
        data:{
            task:task
        }
    })


})

const UpdateTaskByID = wrapAsync(async (req,res,next)=>{

    const _id = req.params.id;
    
    if(!_id){
        return next(new ErrorHandler("Task Id is missing please provide TaskID",404))
    }

    const document = Task.findByIdAndUpdate(_id,req.body,{new:true,runValidators:true})

    if(!document){
        return next(new ErrorHandler("No document for this task found !",404))
    }

       res.status(200).json({
        status:"Success",
        Message:"Task Updated successfully",
        data:{
            document : document
        }
        
    })
})



const DeleteTaskByID = wrapAsync(async (req,res,next)=>{

    const _id = req.params.id;
    
    if(!_id){
        return next(new ErrorHandler("Task Id is missing please provide TaskID",404))
    }

    const document = Task.findByIdAndDelete(_id)

    if(!document){
        return next(new ErrorHandler("No document for this task found !",404))
    }

       res.status(200).json({
        status:"Success",
        Message:"Task Deleted successfully",
    })
})


const MarkTaskAsCompleted = wrapAsync(async(req,res,next)=>{
    const _id = req.params.id
    
    if(!_id){
        return next(new ErrorHandler("Task Id is missing please provide TaskID",404))
    }

    const  task =  await Task.findById(task)

    const taskCompleted = await task.markComplete();
    
    if(!taskCompleted){
         return next(new ErrorHandler("Error while converting task to complete ",500))
    }

        res.status(200).json({
        status:"Success",
        Message:"Task marked as completed successfully",
        data:{
            task:task
        }
    })

})
const GetUserTaskStats =wrapAsync(async(req,res,next)=>{
    
})


export {
    getAllTasks,
    createNewTask,
    UpdateTaskByID,
    DeleteTaskByID,
    getTaskById,
    MarkTaskAsCompleted
}

















