import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import ErrorHandler from './Utilities/ErrorHandler.js';

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.static(path.join(__dirname, 'Public')))





app.get('/', async function (req, res) {
  res.status(200).json('Hello world from server ! ')
})

app.get('/test', async function (req, res, next) {
  const err = new Error('Something Broken')
  next(err)
})

app.get('/test2', async function (req, res, next) {
  const err = new Error('Something else Broken')
  next(err)
})

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
