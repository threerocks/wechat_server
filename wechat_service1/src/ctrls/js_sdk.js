/**
 * Created by CDENG on 15/8/30.
 */
'use strict';


var Ctrl = function() {};
var that = module.exports = new Ctrl();

var CONSTANT = require('../common/constant');
var request = require('request');
var debug = require('debug')('weixin');
var fase = require('fase');
var async = fase.async;

var weixin = require('./weixin.js');

var sha1 = require('sha1');
var _ = require('underscore');

Ctrl.prototype.getParams = function* (req, res) {
  if (config.authorized.indexOf(req.body.token) === -1) {
    throw new Exception(1101);
  }

  let param = {};
  param.url = req.body.url;
  param.appId = config.weixin.appId;
  param.timestamp = new Date().getTime() + "";
  param.timestamp = param.timestamp.slice(0, param.timestamp.length-3);
  param.nonceStr = $.func.randString(16);

  let sorted = _.sortBy(
    [
      'noncestr=' + param.nonceStr,
      'jsapi_ticket=' + config.weixin.jsApiTicket, 
      'timestamp=' + param.timestamp, 
      'url=' + param.url
    ], function(err){
    if (err) {
      return err;
    }
  });

  let origin = sorted.join("&");
  debug('origin: ' + origin);
  param.signature = sha1(origin);
  return param;
}

