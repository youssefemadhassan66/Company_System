import express, { json } from 'express'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World from Express!')
})

export default app
