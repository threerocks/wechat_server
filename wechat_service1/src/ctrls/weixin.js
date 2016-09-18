/**
 * Created by CDENG on 15/8/13.
 */
'use strict';


var Ctrl = function() {};
var that = module.exports = new Ctrl();

var CONSTANT = require('../common/constant');
var wx = require("wechat-toolkit");
var request = require('request');
var debug = require('debug')('weixin');
var fase = require('fase');
var async = fase.async;

var sha1 = require('sha1');
var _ = require('underscore');

var processPassive = require('./process_passive');

Ctrl.prototype.enableDev = function * (req, res) {

}

Ctrl.prototype.processRecvPost = function* (req, res) {
  if (req.weixin.MsgType !== 'event'
    && (yield func.cacheGet('customerService_openid:' + req.weixin.FromUserName))
  ) {//redirect to customer service
    debug('transfering to customerService');
    res.reply({type: 'transfer_customer_service'});
    return;
  }

  switch(req.weixin.MsgType){
    case 'event':
      yield that.processEvent(req, res);
      break;
    case 'text':
      yield processPassive.text(req, res);
      break;
    default:
      res.reply({type: "text", content: 'Hello world!'});
      break;
  }
}

Ctrl.prototype.processEvent = function* (req, res) {
  switch (req.weixin.Event) {
    case 'subscribe':
      yield processPassive.subscribe(req, res);
    break;
    case 'SCAN':
      yield processPassive.scan(req, res);
    break;
    case 'LOCATION' :{
      let location = {};
      location.latitude = req.weixin.Latitude;
      location.longitude = req.weixin.Longitude;
      location.precision = req.weixin.Precision;
      yield func.cacheSet('location_openId: ' + req.weixin.FromUserName, JSON.stringify(location));
      break;
    }
    case 'CLICK' : {
      yield processPassive.buttonClick(req, res);
    }
    case 'VIEW' : {
    }
    default:
      debug(req.weixin);
      break;
  }
  return 'nothing bad happened';
}

Ctrl.prototype.updateJsApiTicket = function (next){
  let data = {};
  data.access_token = config.weixin.accToken;
  data.type = 'jsapi';
  request(
    {
      uri: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
      method: 'GET',
      qs: data,
      timeout: 10000
    }, function(err, res, body) {
    if (err) {
      debug('err: ' + err);
      next(err);
    }
    else{
      debug('update jsapi body: ' + body);
      var resultObj = JSON.parse(body);
      if (parseInt(resultObj.errcode !== 0)) {
        console.log('something wrong getting JSAPI Ticket: ' + resultObj.errmsg);
        next(resultObj.errmsg);
      }
      else {
        config.weixin.jsApiTicket = resultObj.ticket;
        next(null);
      }
    }
  });
}

Ctrl.prototype.updateAccToken = function (next) {
  let data = {};
  data.appid = config.weixin.appId;
  data.secret = config.weixin.appSecret;
  data.grant_type = 'client_credential';

  request(
    {
      uri: 'https://api.weixin.qq.com/cgi-bin/token',
      method: 'GET',
      qs: data,
      timeout: 10000
    }, function(err, res, body) {
    if (err) {
      debug('err: ' + err);
      next(err);
    } 
    else {
      debug('update token body: ' + body);
      var resultObj = JSON.parse(body);
      if (resultObj.access_token) {
        config.weixin.oldAccToken = (config.weixin.accToken) ? config.weixin.accToken : '';
        config.weixin.accToken = resultObj.access_token;
        next(null);
      }
      else {
        console.log('something wrong in updateAccToken');
        next('something wrong in updateAccToken');
      }
    }
  });
}

//由定时器触发，每小时更新一次accToken和JDK相关
//若bForceUpdate为真的话无视上次更新时间，否则距上次更新一小时以上时更新
Ctrl.prototype.timedUpdate = function* (bForceUpdate, next) {
  let currentTime = new Date();
  if (bForceUpdate || !config.weixin.lastUpdate || currentTime - new Date(config.weixin.lastUpdate) >= 60*60*1000-1000 ) {
    that.updateAccToken(function(err){
      if (err) {
        next(err, false);
      }
      else {
        that.updateJsApiTicket(function(err){
          if (err) {
            next(err, false);
          }
          else {
            config.weixin.lastUpdate = currentTime;
            cache.set('weixinConfig', JSON.stringify(config.weixin), function(err, next){
              if (err) {
                next('sth wrong writing token to cache: ' + err);
              } else {

              }
            });
            next(null, true);
          }
        });
      }
    });
  }
}

setTimeout(function () {
  cache.get('weixinConfig', function(err, ret){
    if (err) {
      console.log('err reading cached: ' + err);
    }
    else {
      if (ret) {
        let retObj = JSON.parse(ret);
        if (retObj.lastUpdate)  config.weixin.lastUpdate = retObj.lastUpdate;
        if (retObj.oldAccToken) config.weixin.oldAccToken = retObj.oldAccToken;
        if (retObj.accToken)    config.weixin.accToken = retObj.accToken;
        if (retObj.jsApiTicket) config.weixin.jsApiTicket = retObj.jsApiTicket;
        debug('update from cached token, lastUpdate: ' + retObj.lastUpdate);
        debug('accToken: ' + retObj.accToken);
        async(that.timedUpdate, [false], function(err){
          if (err) {
            console.log('something wrong during timed update');
          }
        });
      }
      else {
        async(that.timedUpdate, [true], function(err){
          if (err) {
            console.log('something wrong during timed update');
          }
        });
      }
    }
  });
}, 10 * 1000);

//定时器，每5分钟跳一次
setInterval(function(){
  async(that.timedUpdate, [false], function(err){
    if (err) {
      console.log('something wrong during timed update');
    }
  });
}, 5*60*1000);

