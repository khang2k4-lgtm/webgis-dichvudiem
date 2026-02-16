require("dotenv").config();
const express = require('express');
//import express from 'express'
// console.log(">>> check env: ", process.env);

const configViewEngine = require('./config/viewEngine');
const webRoutes = require('./routes/web');
const connection = require('./config/database')
const app = express();
const port = process.env.PORT || 8888;//port
const hostname = process.env.HOST_NAME;

//config template engine  
configViewEngine(app);  //quan trọng

//khai bao route
// app.use('/', webRoutes);
// app.use('/test', webRoutes);



const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});




app.listen(port, hostname, () => {
    console.log(`Example app listening on port ${port}`)
})










