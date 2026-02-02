const express = require('express');
const router = express.Router();



//khai bao route
router.get('/', (req, res) => {
    res.send('Hello Worldddddddddddddddddddddddddd!')
})

router.get('/abc', (req, res) => {
    res.send('check abc')
})


//khai bao route
//app.use('/test', webRoutes);

router.get('/khang', (req, res) => {
    //res.send('Hello World! with /khang')
    res.render('sample.ejs')
})


module.exports = router;