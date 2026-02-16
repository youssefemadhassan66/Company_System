import Role from "../Models/RoleModel.js";
import wrapAsync from "../Utilities/wrapAsync.js";
import ApiFeatures from "../Utilities/ApiFeatures.js";
import ErrorHandler from "../Utilities/ErrorHandler.js";

const getAllRoles = wrapAsync(async (req,res,next)=> {
    const mainQuery = Role.find({})

    const  features = new ApiFeatures(mainQuery,req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination()

    let documents = await features.query

    if(!documents || documents=={}){
        return next(new ErrorHandler("No document found ",404))
    }
    res.status(200).json({
        status:"success",
        results: documents.length,
        data:{
            documents:documents
        }
    })

})

const getRoleById = wrapAsync(async (req,res,next)=> {
    const _id = req.params.id 

    if(!_id){
        return next(new ErrorHandler("Role id is not found "),404)
    }

    const document  = await Role.findById(_id);

    if(!document){
        return next(new ErrorHandler("Role Document is not found  "),404)
    }

    res.status(200).json({
        status:"success",
        data:{
            document:document
        }
    })

})

const CreateRole = wrapAsync(async (req,res,next)=>{
    const newRole = await Role.create(
        {
            RoleCode : req.body.RoleCode,
            Name : req.body.Name,
            Description : req.body.Description,
        }
    )

    res.status(200).json({
        status:"Success",
        Message:"Role created successfully",
        data:{
            document : newRole
        }
        
    })
})

const UpdateRoleByID = wrapAsync(async (req,res,next)=>{

    const _id = req.params.id;
    
    if(!_id){
        return next(new ErrorHandler("Role Id is missing please provide RoleID",404))
    }

    const document = Role.findByIdAndUpdate(_id,req.body,{new:true,runValidators:true})

    if(!document){
        return next(new ErrorHandler("Document is missing ",404))
    }

       res.status(200).json({
        status:"Success",
        Message:"Role Updated successfully",
        data:{
            document : document
        }
        
    })
})



const DeleteRoleByID = wrapAsync(async (req,res,next)=>{

    const _id = req.params.id;
    
    if(!_id){
        return next(new ErrorHandler("Role Id is missing please provide RoleID",404))
    }

    const document = Role.findByIdAndDelete(_id)

    if(!document){
        return next(new ErrorHandler("Document is missing ",404))
    }

       res.status(200).json({
        status:"Success",
        Message:"Role Deleted successfully",
    })
})


export {
    getAllRoles,
    getRoleById,
    CreateRole,
    UpdateRoleByID,
    DeleteRoleByID
}