require("dotenv").config();
const express = require('express');
//import express from 'express'
console.log(">>> check env: ", process.env);

const configViewEngine = require('./config/viewEngine');
const webRoutes = require('./routes/web');


const app = express();
const port = process.env.PORT || 8888;//port
const hostname = process.env.HOST_NAME;

//config template engine
configViewEngine(app);
//khai bao route
app.use('/test', webRoutes);




app.listen(port, hostname, () => {
    console.log(`Example app listening on port ${port}`)
})
