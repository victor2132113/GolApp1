require('dotenv').config();

module.exports = {
  development: {
    username: 'root',
    password: '',
    database: 'golapp_db',
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    logging: console.log
  },
  test: {
    username: 'root',
    password: '',
    database: 'golapp_db_test',
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: 'root',
    password: '',
    database: 'golapp_db_prod',
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    logging: false
  }
};
