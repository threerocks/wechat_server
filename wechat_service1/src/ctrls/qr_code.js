/**
 * Created by yangtao on 16/2/15.
 */

'use strict';

let Ctrl = function() {};
let that = module.exports = new Ctrl();

let CONSTANT = require('../common/constant');
let wx = require("wechat-toolkit");
let request = require('request');
let debug = require('debug')('weixin');
let fase = require('fase');
let async = fase.async;

let weixin = require('./weixin.js');

Ctrl.prototype.getQrCode = function* (req, res) {
  if (!req.query.action_name || !req.query.scene_id) {
    throw new Exception(4002); //参数不足
  }

  let data = {};
  data.action_info = {};
  data.action_info.scene = {};

  if (req.query.expire_seconds) {
    data.expire_seconds = parseInt(req.query.expire_seconds);
  }

  data.action_name = req.query.action_name;
  data.action_info.scene.scene_id = parseInt(req.query.scene_id);

  if (data.action_name == 'QR_SCENE') {
    if (data.expire_seconds) {
      if (data.expire_seconds >2592000 || data.expire_seconds < 0) {
        throw new Exception(4001); //expire_seconds 错误
      }
    }
    if (data.action_info.scene.scene_id > 1 && data.action_info.scene.scene_id < 100000) {
      throw new Exception(4001); //scene_id值范围错误
    }
  }
  if (data.action_name == 'QR_LIMIT_SCENE') {
    if (data.expire_seconds) {
      throw new Exception(4001); //永久二维码不该有该字段
    }
    if (data.action_info.scene.scene_id > 100000 || data.action_info.scene.scene_id < 1) {
      throw new Exception(4001); //scene_id值范围错误
    }
  }

  let ticketMsg = yield that.getQrCodeTicket(data);
  if (ticketMsg) {
    if (ticketMsg.expire_seconds !== data.expire_seconds){
      console.log('expire_seconds mismatch: ' + data.expire_seconds + ' vs. ' + ticketMsg.expire_seconds)
      throw new Exception(4000); //前后超时时间不一致
    }
    let ticket = ticketMsg.ticket;  //ticket是否需要进行UrlEncode转换
    let uri = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=';
    let url = uri + ticket;
    return url;
  }
  else {
    throw new Exception(4000);
  }
}

Ctrl.prototype.getQrCodeTicket = function* (data) {
  if (!data) {
    return false;
  }
  let ticketMsg;
  let uri = 'https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=';
  uri += config.weixin.accToken;
  ticketMsg = yield func.sendPostRequest(uri,data);
  if (ticketMsg.errcode) {
    console.log('err getting ticketMsg: ' + ticketMsg.errcode);
    throw new Exception(4000);
  }
  return ticketMsg;
}

Ctrl.prototype.getKeyUrlArray = function* (req, res) {
  if (!req.body.keywordArray) {
    return false;
  }

  let keywordArray = JSON.parse(req.body.keywordArray);
  let keywordUrlArray = [];
  let keywordUrlObj = {};
  for(let i = 0; i < keywordArray.length; i++) {
    if (keywordArray[i] == ''){
      continue;
    }
    keywordUrlObj = yield models.qrUrl.find({keyword: keywordArray[i], status: 1}, {attributes: ['keyword', 'qr_url']});
    if (keywordUrlObj && keywordUrlObj[0] && keywordUrlObj[0].keyword === keywordArray[i]) {
      keywordUrlArray.push(keywordUrlObj[0]);
    }
    else {
      keywordUrlObj = {};
      let values = {};
      let sceneIds = yield models.qrUrl.find({},{attributes: ['scene_id']});
      let scene_id = Math.floor(Math.random() * 100000 + 1);
      let retValues = yield that.getUrl(scene_id, sceneIds);

      values.keyword = keywordArray[i];
      values.scene_id = retValues.scene_id;
      values.qr_url = retValues.url;
      values.status = retValues.status;

      let obj = yield models.qrUrl.save(values);

      keywordUrlObj.keyword = obj.dataValues.keyword;
      keywordUrlObj.qr_url = obj.dataValues.qr_url;
      keywordUrlArray.push(keywordUrlObj);
    }
  }

  return keywordUrlArray;
}

Ctrl.prototype.getUrl = function* (scene_id, sceneIds) {
  if (!scene_id) {
    return false;
  }
  let retValues = {};
  let data = {};
  data.action_name = "QR_LIMIT_SCENE";
  data.action_info = {};
  data.action_info.scene = {};

  while (scene_id) {
    if (sceneIds.indexOf(scene_id) == -1) {
      break;
    }
    else {
      scene_id = Math.floor(Math.random() * 100000 + 1);
    }
  }

  retValues.scene_id = scene_id;
  data.action_info.scene.scene_id = scene_id;
  let tickeyMsg = yield that.getQrCodeTicket(data);
  if (tickeyMsg) {
    let ticket = tickeyMsg.ticket;
    let uri = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=';
    let url = uri + ticket;
    retValues.url = url;
    retValues.status = 1;
  }
  if (tickeyMsg.errcode) {
    console.log('err getting ticketMsg: ' + tickeyMsg.errcode);
    throw new Exception(4000);
  }

  return retValues;
}

