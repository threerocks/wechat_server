'use strict';

// 引用
var log = require('util').log;

// 运行
module.exports = function (func) {
  return function (req, res, next) {
    // 访问日志
    log(req.method + ' ' + req.url);

    // 执行
    co(func(req, res)).then(function (data) {
      if (data === constant.NOT_SEND_JSON) return;

      res.send({
        code: 0,
        data: data
      });
    }, function (err) {
      console.log(err.stack);

      err.code = err.code || 1000;
      res.send({
        code: config.errorPrefix + err.code,
        msg: err.msg || '未知错误'
      });
    });
  };
};
