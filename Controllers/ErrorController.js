import { object } from 'joi'
import ErrorHandler from '../Utilities/ErrorHandler'

const HandleCastDBError = (err) => {
  const message = `Invalid ${err.path}:${err.value}`
  return new ErrorHandler(message, 400)
}

const HandelDuplicatedFieldsError = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)
  const message = `Dublicated Value : ${value} . please use another value ! `
  return new ErrorHandler(message, 400)
}

const HandleValidationError = (err) =>{

  const errors = object.values(err.errors).map(el=>el.message)

  const message = `Validation Error , ${errors.join('. ')} `
  return ErrorHandler(message,400)
}

const HandleJwtError = (err) => {
  ErrorHandler('Invalid Token , Please login Again !', 401)
}
const HandleExpiredJwtToken = (err) => {
  ErrorHandler('Token Expired , Please Login Again !', 401)
}


const ErrorDevelopment = function(res,err){
   res.status(err.statusCode).json({
      status:err.status,
      message:err.message,
      stack:err.stack,
      error:err,
    })
  

}


const ErrorProduction = function(res,err){
   if(err.isOperational){
  res.status(err.statusCode).json({
      status:err.status,
      message:err.message,
    })
  }
  else{
    console.log('Error',err);
    res.status(500).json({
      message:"Server Internal Error !",
      status:"Error"
    });
  }

}

const GlobalErrorHandler = (err,req,res,next)=>{

  err.status = err.status || 'fail'
  err.status = err.statusCode || 500
  
  if(process.env.NODE_ENV === 'development'){
    ErrorDevelopment(res,err)
  }
  else if(process.env.NODE_ENV === 'production'){

    const error = {...err}

    if(error.name === 'CastError') error =  HandleCastDBError(error)
    if (error.code=== 11000) error = HandelDuplicatedFieldsError(error);
    if(error.name === 'ValidationError') error = HandleValidationError(error)
    ErrorProduction(res,error)
    
  }

  
}

export default GlobalErrorHandler