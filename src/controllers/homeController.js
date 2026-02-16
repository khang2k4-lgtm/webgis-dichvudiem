const connection = require('../config/database')
const getHomepage = (req, res) => {
    let users = [];
    //query
    connection.query(
        'SELECT * FROM users u',
        function (err, results, fields) {
            users = results;
            console.log(">>>>results= ", results);
            //console.log("fields= ", fields);
            console.log(">>>>>check users ", users);
            res.send(JSON.stringify(users))
        }
    );

};

const getABC = (req, res) => {
    res.send('check ABC')
};

const getKhang = (req, res) => {
    //res.send('Hello with khang')
    res.render('sample.ejs')
};



module.exports = {
    getHomepage, getABC, getKhang
};