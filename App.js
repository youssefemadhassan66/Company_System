import express from 'express'                   
import path from 'path'
import { fileURLToPath } from 'url'
import GlobalErrorController from './Controllers/ErrorController.js';
import AuthRouter from './Routes/AuthRoute.js'
import UserRouter from './Routes/UserRoute.js'
import RoleRouter from './Routes/RoleRoute.js'
import ErrorHandler from './Utilities/ErrorHandler.js';
import TaskRouter from './Routes/TasksRouter.js'


import qs from 'qs'
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.json())
app.use(express.static(path.join(__dirname, 'Public')))
app.use(express.urlencoded({ extended: true }));
app.set('query parser', (str) => qs.parse(str))
// Routes

app.use('/api/v1/auth/',AuthRouter)
app.use('/api/v1/user/',UserRouter)
app.use('/api/v1/role/',RoleRouter)
app.use('/api/v1/tasks/',TaskRouter)
// app.use('/api/v1/attendance')



app.use( (req, res, next) => {
  next(new ErrorHandler(`Can't find ${req.originalUrl}...`, 404))
});


app.use(GlobalErrorController)
export default app
