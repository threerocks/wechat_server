'use strict';

var Func = function() {};
var that = module.exports = new Func();

// 将下划线命名转换为驼峰命名
_.toCamel = function (name) {
  var newName = '';
  var underline = false;
  for (var i = 0; i < name.length; i++) {
    if (name[i] === '_' || name[i] === '-') {
      underline = true;
    } else {
      newName += underline ? name[i].toUpperCase() : name[i];
      underline = false;
    }
  }
  ;
  return newName;
};

Func.prototype.cacheGet = thunkify(function (key, next) {
  cache.get(key, next);
});

Func.prototype.cacheSet = thunkify(function (key, value, next) {
  cache.set(key, value, next);
});

Func.prototype.cacheSetex = thunkify(function (key, value, timeout, next) {
  cache.setex(key, value, timeout, next);
});

Func.prototype.cacheDel = thunkify(function (key, next) {
  cache.del(key, next);
});

Func.prototype.sendGetRequest = thunkify(function (uri, data, next){
  request({
      uri: uri,
      method: 'GET',
      postData: data,
      timeout: 10000,
    }, function (err, ret, body) {
      if (err) {
        next(err, false);
      } 
      else {
        let retObj = JSON.parse(body);
          next(null, retObj);
      }
  });
});

Func.prototype.sendPostRequest = thunkify(function (uri, data, next){
  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(data),
    timeout: 10000,
  }, function (err, ret, body) {
    if (err) {
      next(null, -1);
    }
    else {
      let retObj = JSON.parse(body);
      next(null, retObj);
    }
  });
});
