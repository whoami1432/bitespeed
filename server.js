'use strict';

const express = require('express');
const helmet = require('helmet');
require('dotenv').config();
const compression = require('compression');
const cors = require('cors');
const hpp = require('hpp');
const expressMongoanitaize = require('express-mongo-sanitize');

const app = express();

const { requestId } = require('./service/uuidGenerator');
const { consoleWritter } = require('./service/consoleViewer');
const notFound = require('./middlewares/notFound');
const erorrHandler = require('./middlewares/errorHandler');
const { limiter } = require('./middlewares/rateLimiter');
const everyReqDetails = require('./middlewares/everyReqCatcher');

/* Route file import */
const helloWorldRoute = require('./app/routes/helloWorld.route');
const biteSpeed = require('./app/routes/bitespeed');

const port = process.env.PORT;

process.on('uncaughtException', error => {
	console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', error => {
	console.error('Unhandled rejection:', error);
});

app.use(limiter);
app.use(expressMongoanitaize());
app.use(hpp());
app.use('*', cors());
app.use(compression({ level: 1 }));
app.use(requestId);
app.use(helmet());
app.use(express.json({ limit: '500mb', extended: true }));
app.use(everyReqDetails);

app.use('/api/', helloWorldRoute);
app.use('/', biteSpeed);

app.get('/', (req, res) => res.status(200).send('Hello World!'));

// error handlers
app.use('*', notFound);
app.use(erorrHandler);

app.listen(port, () => {
	consoleWritter(port);
});
