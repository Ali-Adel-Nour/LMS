const express = require('express');
const { notFound, handleError } = require('./middleware/errorHandler');
const app = express();
const dotenv = require('dotenv').config();
const dbConnect = require('./config/dbConfig');
const userRouter = require('./routes/userRoutes');
const googleRouter = require('./routes/googleRoutes');
const tutCatRouter = require('./routes/tutCatRoutes');
const tutorialRouter = require('./routes/tutorialRoutes');
const newsLetterRouter = require('./routes/newsLetterRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const contactRouter = require('./routes/contactRoutes');

//const videoRouter = require('./routes/videoRoutes');

const docRouter = require('./routes/docRoutes');

const docCatRouter = require('./routes/docCatRoutes');

const blogRouter = require('./routes/blogRoutes');

const blogCatRouter = require('./routes/blogCatRoutes');
const courseRouter = require('./routes/courseRoutes');
const lessonRouter = require('./routes/lessonRoutes');
const courseCatRouter = require('./routes/courseCatRoutes');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const passportSetup = require('./utils/passport');
const configureCors =  require('./config/corsConfig')
const {requestLogger,addTimeStamp} = require('./middleware/logger');

app.get('/', (req, res) => {
  res.send(`<a href="http://localhost:4000/google">Login with google</a>`);
});

app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: 'mysecret',
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 12 * 60 * 60,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
// body-parser with built-in Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(addTimeStamp);
app.use(configureCors.configureCors());


app.use('/', googleRouter);

app.use('/api/v1/user', userRouter);

app.use('/api/v1/tutorial/category', tutCatRouter);
app.use('/api/v1/tutorial', tutorialRouter);
app.use('/api/v1/newsletter', newsLetterRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/contact', contactRouter);
//app.use('/api/v1/video', videoRouter);
app.use('/api/v1/documentation', docRouter);
app.use('/api/v1/documentation/category', docCatRouter);
app.use('/api/v1/blog', blogRouter);
app.use('/api/v1/blog/category', blogCatRouter);
app.use('/api/v1/lesson',lessonRouter)
app.use('/api/v1/course', courseRouter);
app.use('/api/v1/course/category', courseCatRouter);


app.use(notFound);
app.use(handleError);

module.exports = app;