import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import GlobalErrorController from './Controllers/ErrorController.js';
import AuthRouter from './Routes/AuthRoute.js'
import ErrorHandler from './Utilities/ErrorHandler.js';
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.static(path.join(__dirname, 'Public')))



// Routes

app.use('/api/v1/auth/',AuthRouter)
// app.use('/api/v1/users')
// app.use('/api/v1/tasks')
// app.use('/api/v1/attendance')
// app.use('/api/v1/role')


app.use( (req, res, next) => {
  next(new ErrorHandler(`Can't find ${req.originalUrl}...`, 404))
});


app.use(GlobalErrorController)
export default app
