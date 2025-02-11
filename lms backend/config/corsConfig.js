const cors = require('cors')


const configureCors = () => {
  return cors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:4000', 'http://localhost:5000']


      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],

    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Version'],

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