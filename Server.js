import DbConfig from './Configs/DbConfig.js'
import app from './App.js'
import 'dotenv/config'
const Port = process.env.PORT || 300

async function StartServer() {
  try {
    await DbConfig()

    const server = app.listen(Port, () => {
      console.log(`Server is running on port : ${Port} `)
    })
    process.on('unhandledRejection', (err) => {
      console.log('unHandled Rejection app is shutting down ')
      console.log(err.name, err.message)
      server.close(() => {
        process.exit(1)
      })
    })
  } catch (error) {
    console.log('Failed to start the server ', error)
    process.exit(1)
  }
}

StartServer()
