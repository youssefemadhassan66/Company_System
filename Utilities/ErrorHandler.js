class ErrorHandler extends Error{
    constructor(Message,statusCode){
        super(Message)
        this.statusCode = statusCode
        this.status = `${this.statusCode}`.startsWith('4') ? 'fail' :'Error';
        this.isOperational= true;
        Error.captureStackTrace(this,this.constructor)
    }
    
}

export default ErrorHandler