/**
 * Created by CDENG on 15/8/31.
 */
'use strict';


var Ctrl = function() {};
var that = module.exports = new Ctrl();

var CONSTANT = require('../common/constant');
var request = require('request');
var debug = require('debug')('weixin');
var fase = require('fase');
var async = fase.async;

var wx = require("wechat-toolkit");

var cacheGet = thunkify(function (key, next) {
  cache.get(key, next);
});

var cacheSet = thunkify(function (key, value, next) {
  cache.set(key, value, next);
});

var getOAuthToken = thunkify(function (code, next){
  wx.exchangeAccessToken(config.weixin.appId, config.weixin.appSecret, code, function(err, result){
    if (err) {
      console.log(err);
      next(null, err);
    }
    else {
      next(null, result);
    }
  });
});

var getOAuthUserInfo = thunkify(function (token, openid, next){
  wx.getUserInfo(token, openid, function(err, result){
    if (err) {
      console.log(err);
      next(null, err);
    }
    else {
      next(null, result);
    }
  });
});

Ctrl.prototype.getUserInfo = thunkify(function (openid, next){
  wx.getFanInfo(config.weixin.accToken, openid, function(err, result){
    if (err) {
      console.log(err);
      next(null, err);
    }
    else {
      next(null, result);
    }
  });
});

Ctrl.prototype.getOAuth = function* (req, res) {
  if (config.authorized.indexOf(req.body.token) === -1) {
    throw new Exception(1101);
  }

  if (!req.body.code) {
    throw new Exception(3002);
  }

  let code = req.body.code;
  let oAuthToken = yield getOAuthToken(code);

  if (oAuthToken.errcode === 40029) {
    throw new Exception(3031);
  }
  else if (oAuthToken.errcode) {
    throw new Exception(3030);
  }

  let userInfo = yield getOAuthUserInfo(oAuthToken.access_token, oAuthToken.openid);
  if (userInfo.errcode) {
    throw new Exception(3030);
  }

  if (oAuthToken.openid) {
    let location = JSON.parse(yield cacheGet('location_openId: ' + oAuthToken.openid));
    if (location) {
      userInfo.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        precision: location.precision,
      };
      if (oAuthToken.unionid) {
        userInfo.unionid = oAuthToken.unionid;
      }
    }
  }

  return userInfo;
}

