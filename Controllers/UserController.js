import User from "../Models/UserModel.js";
import mongoose from "mongoose";
import wrapAsync from "../Utilities/wrapAsync.js";
import ErrorHandler from "../Utilities/ErrorHandler.js";
import ApiFeatures from "../Utilities/ApiFeatures.js";
import Role from "../Models/RoleModel.js";



// GET ME 
const getMe=  wrapAsync(async (req,res,next)=>{
    const _id = req.user.id 
    next()
})
// GET ALL USERS
const getAllUsers = wrapAsync(async (req,res,next)=>{

   const mainQuery = User.find({}).populate({path:"Role",select:"Name"})

   const features = new ApiFeatures(mainQuery,req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination()

   let doc = await features.query
   
   doc = features.populatedFilter(doc)

    res.status(200).json({
        status:"Success",
         results: doc.length,
        data:{
            documents:doc
        }
    })
})

const getUSerById= wrapAsync(async (req,res,next)=>{
    const _id = req.params.id 
    
    if(!_id){
        return next(new ErrorHandler("Please Provide user ID ",404))
    }

    const user = await User.findById(_id).populate({path:"Role",select:"Name RoleCode Level"}).lean()
     
     if(!user){
        return next(new ErrorHandler("User not found ",404))
    }

    res.status(200).json({
        status:"Success",
        data:{
            user:user
        }
    })
})

const updateUserById = wrapAsync(async(req,res,next)=>{
    const document  = User.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    })

    if(!document){
        return next(new ErrorHandler("Document not found",404))
    }
      res.status(200).json({
      status: 'success',
      data: {
        data: document
      }
    });
})

const deleteUserByID = wrapAsync(async (req,res,next)=>{
    const _id = req.params.id

    if(!_id){
        return next(new ErrorHandler("Please Provide user id",404))
    }
    
    const doc = await User.findByIdAndDelete(_id);

    if(!doc){
        return next(new ErrorHandler("Document not found",404))
    }

       res.status(204).json({
        status:"Success",
        data:{
            user:null
        }
    })
})

const ToggleActivateUSer = wrapAsync(async (req,res,next)=>{
    const _id = req.params.id 

    if(!_id){
        return next(new ErrorHandler("Please Provide user id",404))
    }

    const user = await User.findById(_id)

   if(!user){
        return next(new ErrorHandler("User not found ",404))
    }

    user.IsActive = !user.IsActive;

    await user.save();
    
    res.status(200).json({
        status:"Success",
        data:{
            IsActive:user.IsActive
        }
    })
    
})

export { 
    getMe,
    getAllUsers,
    getUSerById,
    deleteUserByID,
    updateUserById,
    ToggleActivateUSer
}
