/**
 * Created by CDENG on 15/9/10.
 */
'use strict';


var Ctrl = function() {};
var that = module.exports = new Ctrl();

var CONSTANT = require('../common/constant');
var request = require('request');
var debug = require('debug')('weixin');
var fase = require('fase');
var async = fase.async;

var sha1 = require('sha1');
var _ = require('underscore');

var media = require('./media.js');
var userInfo = require('./user_info.js');

Ctrl.prototype.text = function* (req, res) {
  let replyText = '';
  switch (req.weixin.Content) {
    case '雅思':
      replyText = '想了解更多的雅思信息，请关注我们的http://m.smartstudy.com/，里面有最新信息。';
      break;
    case '托福':
      replyText = '想了解更多的托福信息，请关注我们的http://m.smartstudy.com/，里面有最新信息。';
      break;
    case '出国':
      replyText = '想去哪个国家，没有计划，不知道怎么准备和学习？联系我们400-011-9191。我们有专业的课程老师在等着你的来点哦~';
      break;
    case '留学':
      replyText = '想去哪个国家，没有计划，不知道怎么准备和学习？联系我们400-011-9191。我们有专业的课程老师在等着你的来点哦~';
      break;
    default: 
      res.reply({type: 'transfer_customer_service'});
      return;
      break;
  }
  res.reply({type: "text", content: replyText});
  return;
}

Ctrl.prototype.subscribe = function* (req, res) {
  let event = req.weixin.Event;
  let open_id = req.weixin.FromUserName;
  let event_key = req.weixin.EventKey;
  let event_fired_at = new Date(req.weixin.CreateTime * 1000);

  let weiXinData = {
    event: event,
    open_id: open_id,
    event_key: event_key,
    event_fired_at: event_fired_at
  };

  let userQrcode = yield that.getUserQrcode(weiXinData);
  let retArray = yield that.replyWelcome(req.weixin.EventKey);
  if (retArray) {
    res.reply(retArray);
  }
  else{
    let url = 'http://open.weixin.qq.com/connect/oauth2/authorize?appid=' + config.weixin.appId
      + '&redirect_uri=' + encodeURI(config.weixin.urlWapHost + config.weixin.pathKaowei)
      + '&response_type=code'
      + '&scope=' + 'snsapi_userinfo'
      + '&state=' + 'TestSeat' + '#wechat_redirect';
    let info = yield userInfo.getUserInfo(req.weixin.FromUserName);
    res.reply([{
      title: '加入智课，开启精彩人生',
      description: info.nickname + '你好，加入智课领红包，妈妈再也不用担心我的英语!',
      url: url,
      picurl: 'https://mmbiz.qlogo.cn/mmbiz/iaBmDVE8BLHcux8pBFSW6l2wCoLMfC7ibhQicULp8YMJnIEyBC1qXBUw2clxWYu3NPciblZsZur66FT9mAAU2zGwbg/0?wx_fmt=jpeg',
    }]);
  }
  return;
}

Ctrl.prototype.buttonClick = function* (req, res){
  switch (req.weixin.EventKey) {
    case 'liveCourse' :
      let retArray = [];
      let liveArray = yield media.getNewsMedia('live_default');
      if(liveArray){
        for (let i = 0, l = liveArray.length; i < l && i < 3; ++i) {
          retArray.push(liveArray[i]);
        }
      }
      res.reply(retArray);
      break;
    case 'downloadApp' :
      res.reply();
    case 'customerService' :
      yield func.cacheSetex('customerService_openid:' + req.weixin.FromUserName, 600, true);
      res.reply({type: 'text', content: '您好，我是小智，有什么可以帮到您的？'});
      break;
    default:
      res.reply({type: 'text', content: 'You Clicked: ' + req.weixin.EventKey});
      break;
  }
  return;
}

Ctrl.prototype.getParams = function* (req, res) {
  return;
}

Ctrl.prototype.scan = function* (req, res) {
  let eventkey = req.weixin.EventKey;
  let scene_id = eventkey.match(/[0-9]+/g);
  if(scene_id){
    let retArray = yield that.replyWelcome(req.weixin.EventKey);
    if(retArray){
      res.reply(retArray);
    }
    else {
      res.reply({type: 'text', content: '欢迎到智课'});
    }
  }
  //todo:扫码签到
  else{
    res.reply({type: 'text', content: '欢迎到智课'});
  }
  return;
}

Ctrl.prototype.replyWelcome = function* (eventKey) {
  let scene_id = eventKey.match(/[0-9]+/g);
  let scene_type;
  let keyObj = yield models.qrUrl.find({scene_id: scene_id, status: 1}, {attributes: ['keyword']});
  if (keyObj && keyObj[0]) {
    scene_type = keyObj[0].keyword;
  }
  if (!scene_type) {
    scene_type = 'default';
  }

  let welArray = yield media.getNewsMedia('welcome' + '_' + scene_type);

  if (welArray) {
    let retArray = [];
    for(let i = 0; i < welArray.length; i++) {
      retArray.push(welArray[i]);
    }
    if (retArray.length > 3) {
      retArray.length = 3;
    }
    return retArray;
  }
  else {
    return false;
  }
}

Ctrl.prototype.getUserQrcode = function* (weiXinData) {
  if (!weiXinData) {
    return false;
  }
  let eventKey = weiXinData.event_key;
  let scene_id = eventKey.match(/[0-9]+/g);
  let keywordObj = yield models.qrUrl.find({scene_id: scene_id, status: 1});
  let keywordId;

  if (keywordObj && keywordObj[0]) {
    keywordId = keywordObj[0].id;
  }
  else {
    keywordId = 0;
  }

  let retUserQrcode;

  let where = {
    open_id: weiXinData.open_id,
    keyword_id: keywordId
  };
  let userQrcodeObj = yield models.userQrcode.find(where);

  if (userQrcodeObj && userQrcodeObj[0]) {
     retUserQrcode = yield models.userQrcode.update(where);
  }
  else {
    let values = {
      event: weiXinData.event,
      open_id: weiXinData.open_id,
      event_fired_at: weiXinData.event_fired_at,
      keyword_id: keywordId
    };
     retUserQrcode = yield models.userQrcode.save(values);
  }

  return retUserQrcode;
}
