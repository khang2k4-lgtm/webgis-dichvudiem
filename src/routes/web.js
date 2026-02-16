const express = require('express');
const { getHomepage, getABC, getKhang } = require('../controllers/homeController');
const router = express.Router();

//router.Method('/route',handler)

//khai bao route
router.get('/', getHomepage);
router.get('/abc', getABC)
//khai bao route
//app.use('/test', webRoutes);

router.get('/khang', getKhang)


module.exports = router;