const express = require('express');
const {notFound,globalErrorHandler} = require('./middleware/errorHandler');

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

const subscriptionRouter = require('./routes/subscriptionRoutes');
//const videoRouter = require('./routes/videoRoutes');

const docRouter = require('./routes/docRoutes');

const docCatRouter = require('./routes/docCatRoutes');

const blogRouter = require('./routes/blogRoutes');

const blogCatRouter = require('./routes/blogCatRoutes');

const checkoutRouter = require('./routes/checkoutRoutes');
const courseRouter = require('./routes/courseRoutes');
const lessonRouter = require('./routes/lessonRoutes');
const courseCatRouter = require('./routes/courseCatRoutes');
const workWithUsRouter = require('./routes/workWithUsRoutes');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const passportSetup = require('./utils/passport');
const configureCors =  require('./config/corsConfig')
const {requestLogger,addTimeStamp} = require('./middleware/logger');
const { urlVersioning } = require('./middleware/apiVerisoning')
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp')

app.get('/', (req, res) => {
  res.send(`<a href="http://localhost:4000/google">Login with google</a>`);
});

app.use(helmet());

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
app.use(express.json(limit = '20kb'));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(addTimeStamp);
app.use(configureCors.configureCors());
app.use(sanitize());
app.use(xss());
//HTTP Parameter Pollution
app.use(hpp(whitelist = []))

app.use('/', googleRouter);

app.use(urlVersioning('v1'));

app.use(cookieParser());


app.use('/api/v1/webhook', express.raw({type: 'application/json'}));

app.use('/api/v1/user', userRouter);

app.use('/api/v1/checkout', checkoutRouter);

app.use('/api/v1/subscription', subscriptionRouter);

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
app.use('/api/v1/work-with-us', workWithUsRouter);

app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;