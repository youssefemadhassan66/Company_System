import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import ErrorHandler from './Utilities/ErrorHandler.js';

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.static(path.join(__dirname, 'Public')))



// Routes

// app.use('/api/v1/users')
// app.use('/api/v1/tasks')
// app.use('/api/v1/attendance')
// app.use('/api/v1/role')


app.use( (req, res, next) => {
  next(new ErrorHandler(`Can't find ${req.originalUrl} this route on the server`, 404));
});


app.use((err,req,res,next)=>{
  err.status = err.status || 'Error';
  err.statusCode = err.statusCode || 500;
  res.json({
    "Message" : err.message,
    "Status": err.status
  })
  next()
})

export default app
