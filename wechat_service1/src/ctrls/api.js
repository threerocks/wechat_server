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

Ctrl.prototype.getAccToken = function* (req, res) {
  if (config.authorized.indexOf(req.body.token) === -1) {
    throw new Exception(1101);
  }

  let result = {
    oldAccToken: config.weixin.oldAccToken,
    accToken: config.weixin.accToken,
    lastUpdate: config.weixin.lastUpdate,
  };

  return result;
}

