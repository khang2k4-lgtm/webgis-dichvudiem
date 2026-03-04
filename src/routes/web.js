const express = require('express');
const { getHomepage, getABC, getKhang, index } = require('../controllers/homeController');
const router = express.Router();

//router.Method('/route',handler)

//khai bao route
//router.get('/', getHomepage);
//app.use('/test', webRoutes);

router.get('/abc', getABC)
router.get('/khang', getKhang)


module.exports = router;