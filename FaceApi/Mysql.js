let mysql = require('mysql');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'abc123',
    database: 'face_detect'
});

// 连接数据库
connection.connect();

let result;

// 定义一个异步函数，返回一个Promise对象
async function query(sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, function (error, rows, fields) {
            if (error) reject(error);
            resolve(rows);
        });
    });
}

// 使用async/await来执行查询并赋值给全局变量
(async function () {
    try {
        console.log("执行mysql...")
        result = await query('SELECT * FROM leader');
        console.log(result);
        await main(result);
    } catch (error) {
        console.error(error);
    } finally {
        connection.end();
    }
})();
