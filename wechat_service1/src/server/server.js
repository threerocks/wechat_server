'use strict';

// 引用
require('../common/global');
var express = require('express');
var router = require('./router');
//var wx = require("wechat-toolkit");

var wechat = require('wechat');
var wxConfig = {
  token: config.weixin.token,
  appid: config.weixin.appId,
  encodingAESKey: config.weixin.encodingAESKey,
};

// express配置
var app = express();
app.use(require('compression')());
app.use(require('connect-timeout')(config.timeout * 1000, {respond: false}));
app.use(require('body-parser').urlencoded({extended: false}));
app.use(function(req, res, next) {
  // 超时处理
  req.on('timeout', function () {
    res.send({
      code: config.errorPrefix + 1002,
      msg: errors[1002]
    });
    process.nextTick(function () {
      res.send = res.end = function () {
      };
    });
  });

  next();
});

//微信解析中间件
app.all('/', wechat(wxConfig, function (req, res, next) {
  next();
}));

// 路由
router(app);

// 错误
process.on('uncaughtException', function (err) {
  console.error('Global:');
  console.error(err);
  process.exit(0);
});

// 监听
app.listen(config.port);
console.log('wx-service server start: ' + config.port);
