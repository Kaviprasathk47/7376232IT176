const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/notifications', notificationRoutes);

module.exports = app;
