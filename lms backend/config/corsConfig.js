const cors = require('cors')


const configureCors = () => {
  return cors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:4000', 'http://localhost:5000','http://localhost:3000',
        'http://127.0.0.1:5000',null]


      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        console.log('CORS blocked origin:', origin)
        callback(null, true) // Temporarily allow all during development
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],

    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Version','X-Requested-With'],

    exposedHeaders : [
      'Content-Length',
      'X-Total-Count',
      'Content-Range'
    ],

  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204



  })
}

module.exports = {configureCors}