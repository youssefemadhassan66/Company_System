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
export {
    getAllRoles,
    getRoleById,
}