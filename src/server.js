// const { createServer } = require('node:http');

// const hostname = '127.0.0.1';
// const port = 3000;

// const server = createServer((req, res) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/plain');
//     res.end('Hello World');
// });

// server.listen(port, hostname, () => {
//     console.log(`Server running at http://${hostname}:${port}/`);
// });

const express = require('express');
const path = require('path');
require("dotenv").config();
//import express from 'express'

console.log(">>> check env: ", process.env);



const app = express();
const port = process.env.PORT || 8888;//port
const hostname = process.env.HOST_NAME;

//config template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')

//khai bao route
app.get('/khang', (req, res) => {
    //res.send('Hello Worldddddddddddddddddddddddddd!')
    res.render('sample.ejs')
})

app.listen(port, hostname, () => {
    console.log(`Example app listening on port ${port}`)
})
