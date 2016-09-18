/**
 * Created by CDENG on 15/8/31.
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

var weixin = require('./weixin.js');

Ctrl.prototype.sendExamSeatMsg = function* (req, res) {
  if (config.authorized.indexOf(req.body.token) === -1) {
    throw new Exception(1101);
  }

  if (!req.body.toUser || !req.body.exam || !req.body.date || !req.body.school) {
    throw new Exception(3002);
  }

  if (!config.weixin.accToken) {
    throw new Exception(3003);
  }

  let currentTime = new Date();
  let wxOpenId = req.body.toUser;
  let uri = 'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=' + config.weixin.accToken;
  let data = {
    touser: wxOpenId,
    template_id: config.weixin.template.kaowei,
    url: '',
    topcolor: '#0000FF',
    data: {
      first: {
        value: '您查询的考场有新考位',
        color: "#173177",
      },
      keyword1: {
        value: req.body.exam,
        color: "#173177",
      },
      keyword2: {
        value: req.body.date,
        color: "#173177",
      },
      keyword3: {
        value: req.body.school,
        color: "#173177",
      },
      keyword4: {
        value: currentTime.toLocaleString(),
        color: "#173177",
      },
      remark:{
        value: '谢谢',
        color: "#173177",
      }
    }
  };
  let retMsg = yield func.sendPostRequest(uri, data);
  if (retMsg.errorcode) {
    throw new Exception(3100);
  }

  return retMsg;
}
