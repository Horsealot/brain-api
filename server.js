const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const formData = require('express-form-data')
const cors = require('cors');
const errorHandler = require('errorhandler');
const routes = require('./routes/');
const helmet = require('helmet');
const config = require('config');
const port = process.env.PORT || 5000;

//Configure mongoose's promise to global promise
//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';
const isTesting = process.env.NODE_ENV === 'test';

//Initiate our app
const app = express();
const router = express.Router();

//Configure our app
app.use(cors());
app.use(helmet());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit: '5mb'}));
app.use(formData.parse())
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'brainsecret-token', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

if(!isProduction) {
    app.use(errorHandler());
}

// Start rabbitmq producers
const Producer = require('./producers/index');
Producer.start();

require('./config/passport');

/** set up routes {API Endpoints} */
routes(router);
app.use('/api', router);

//Error handlers & middlewares
if(!isProduction) {
    app.use((req, res, err) => {
        res.status(err.status || 500);

        res.json({
            errors: {
                message: err.message,
                error: err,
            },
        });
    });
}

app.use((req, res, err) => {
    res.status(err.status || 500);

    res.json({
        errors: {
            message: err.message,
            error: {},
        },
    });
});

app.listen(port, () => console.log(`Listening on port ${port}`));

if (process.env.NODE_ENV === 'production') {
    process.on('uncaughtException', function (er) {
        console.error(er.stack)
    })
}

module.exports = app;
