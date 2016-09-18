/**
 * Created by CDENG on 15/8/30.
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

var createMenu = thunkify(function (accToken, menuObj, next) {
  wx.createMenu(accToken, menuObj, function(err, error_code, error_message){
    if (err) {
      next(err, -1);
    }
    else {
      next(null, error_code);
    }
  });
});

Ctrl.prototype.deleteMenu = function* (req, res) {
  if (config.authorized.indexOf(req.body.token) === -1) {
    throw new Exception(1101);
  }

  if(config.weixin.accToken){
    let data = {};
    let retObj = {};
    for (let i = 0; i<CONSTANT.WEIXIN_RETRIES; ++i) {
      data.access_token = config.weixin.accToken;
      retObj = yield func.sendGetRequest('https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=' + data.access_token, null);
      if (retObj.errcode === 0) {
        break;
      }
      else {
        if (retObj.errcode === CONSTANT.WEIXIN_WRONG_ACC_TOKEN) {
          yield weixin.timedUpdate(true, function(err){
            if (err) {
              console.log('something wrong during timed update');
            }
          });
        }
      }
    }
    return retObj.errcode;
  }
  else {
    throw new Exception(3003);
  }
}

Ctrl.prototype.createDefaultMenu = function* (req, res) {
  if (config.authorized.indexOf(req.body.token) === -1) {
    throw new Exception(1101);
  }

  let scope = 'snsapi_userinfo';
  let menuObj = {};
  menuObj.button = [
    {
      type: 'view',
      name: '留学问问',
      url: CONSTANT.URL.WENWEN
    },
    // {
    //   name: '学习工具',
    //   sub_button: [
    //     {
    //       type: 'view',
    //       name: '托福代报名',
    //       url: CONSTANT.URL.WX_OAUTH_INI + config.weixin.appId
    //         + '&redirect_uri=' + encodeURIComponent(config.kaowei.host)
    //         + '&response_type=code'
    //         + '&scope=' + scope
    //         + '&state=' + 'bindAccount' + '#wechat_redirect'
    //     },
    //     {
    //       type: 'view',
    //       name: '大胆说口语',
    //       url: CONSTANT.URL.KOUYU
    //     }
    //   ]
    // },
    {
      name: '用户服务',
      sub_button: [
        {
          type: 'view',
          name: '智课名师',
          url: CONSTANT.URL.TEACHERS
        },
        {
          type: 'view',
          name: '课程试听',
          url: CONSTANT.URL.COURSES
        },
        {
          type: 'click',
          name: '在线客服',
          key: 'customerService',
        },
        {
          type: 'view',
          name: '账号绑定',
          url: CONSTANT.URL.WX_OAUTH_INI + config.weixin.appId
            + '&redirect_uri=' + encodeURIComponent(CONSTANT.URL.USER_BIND)
            + '&response_type=code'
            + '&scope=' + scope
            + '&state=' + 'bindAccount' + '#wechat_redirect'
        }
      ]
    },
    {
      type: 'view',
      name: 'APP 下载',
      url: CONSTANT.URL.DOWNLOAD_APP
    }
  ];

  if(config.weixin.accToken){
    let retObj = {};
    for (let i = 0; i<CONSTANT.WEIXIN_RETRIES; ++i) {
      retObj = yield createMenu(config.weixin.accToken, menuObj);
      if (retObj.errorcode === 0) {
        break;
      }
      else if (retObj.errorcode === CONSTANT.WEIXIN_WRONG_ACC_TOKEN) {
        yield weixin.timedUpdate(true, function(err){
          if (err) {
            console.log('something wrong during timed update');
          }
        });
      }
    }
    return retObj.errorcode;
  }
  else {
    throw new Exception(3003);
  }
}

Ctrl.prototype.createMenu = function* (req, res) {
  if (config.authorized.indexOf(req.body.token) === -1) {
    throw new Exception(1101);
  }

  if (req.body.menu) {
    let menuObj = JSON.parse(req.body.menu);
    if(config.weixin.accToken){
      let retObj = {};
      for (let i = 0; i<CONSTANT.WEIXIN_RETRIES; ++i) {
        retObj = yield createMenu(config.weixin.accToken, menuObj);
        if (retObj.errorcode === 0) {
          break;
        }
        else if (retObj.errorcode === CONSTANT.WEIXIN_WRONG_ACC_TOKEN) {
          yield weixin.timedUpdate(true, function(err){
            if (err) {
              console.log('something wrong during timed update');
            }
          });
        }
      }
      return retObj.errorcode;
    }
    else {
      throw new Exception(3003);
    }
  }
  else {
    throw new Exception(3002)
  }
  
}

