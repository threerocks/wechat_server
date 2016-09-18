'use strict';

// 全局变量
global.config = require('./config');
global.constant = require('./constant');
global._ = require('lodash');
global.co = require('co');
global.thunkify = require('thunkify-wrap');
global.Sequelize = require('sequelize');
global.validator = require('validator');
global.request = require('request');
global.$ = require('fase');
global.func = require('./func');

//数据库
global.db = new Sequelize(config.db.dbname, config.db.username, config.db.password, {
  dialect: 'mysql',
  host: config.db.host,
  port: config.db.port,
  timezone: '+08:00',
  logging: undefined,
  pool: {
    maxConnections: config.db.pool
  }
});

//cache
var redis = require("redis")
global.cache = redis.createClient(
  config.cache.port, 
  config.cache.host,
  {enable_offline_queue: false}
);
 
global.cache.on("error", function (err) {
  console.log("Redis Client Error " + err);
});

// 全局错误
global.errors = require('./errors');
global.Exception = function(code, msg) {
  this.code = code;
  this.msg = msg || errors[code];
  this.stack = new Error(this.code + ': ' + this.msg).stack;
};

// 控制器
global.ctrls = require('./ctrls');

// 模型
global.models = require('./models');

