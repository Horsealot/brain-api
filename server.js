const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const formData = require('express-form-data')
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const routes = require('./routes/');
const helmet = require('helmet');
const config = require('config');
const port = process.env.PORT || 5000;

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

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

/** Connect to the database */
mongoose.connect(`${config.get('db.host')}/${config.get('db.db_name')}`, { useNewUrlParser: true });

if(!isProduction) {
    app.use(errorHandler());
}
if(!isProduction && !isTesting) {
    mongoose.set('debug', true);
}

// Start rabbitmq producers
const Producer = require('./producers/index');
Producer.start();

//Models & routes
require('./models/Users');
require('./models/Invites');
require('./models/PasswordRequests');
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