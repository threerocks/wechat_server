'use strict';

const config = require('./../../common/config');
const crypto = require('crypto');
const wx = require("wechat-toolkit");
const wechat = require('wechat');
const request = require('request');
const wechatConfig = {
  token: config.wechat.token,
  appid: config.wechat.appId,
  encodingAESKey: config.wechat.encodingAESKey
};

exports.sha1 = function (str) {
  var md5sum = crypto.createHash("sha1");
  md5sum.update(str);
  str = md5sum.digest("hex");
  return str;
};
exports.getMenuToken = function () {
  return new Promise((resolve, reject) => {
      wx.getAccessToken(config.wechat.appId, config.wechat.appSecret, (err, access_token) => {
      if (err) reject(err);
      resolve(access_token);
    });
})
};
exports.getWechatMsg = function (req, res) {
  return new Promise((resolve, reject) => {
      wechat(wechatConfig, (req, res, next) => {
        // 微信输入信息都在req.weixin上
        const msg = req.weixin;
        const eventObj = processMsgType(req, res, msg);
        resolve(eventObj)
      }
  )(req, res)
})
};
function processMsgType(req, res, msg) {
  if ((msg.MsgType == 'event') && (msg.Event == 'subscribe')) {
    return {type: 'subscribe', req: req, res: res, msg: msg};
  }
  else if ((msg.MsgType == 'event') && (msg.Event == 'unsubscribe')) {
    return {type: 'unsubscribe', req: req, res: res, msg: msg};
  }
  else if(msg.MsgType == 'text'){
    return {type: 'text', req: req, res: res, msg: msg};
  }
  else{
    return {type: 'other', req: req, res: res, msg: msg};
  }
}

exports.getToken = function (code) {
  let reqUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?';
  let params = {
    appid: config.wechat.appId,
    secret: config.wechat.appSecret,
    code: code,
    grant_type: 'authorization_code'
  };
  return new Promise((resolve, reject) => {
      wx.exchangeAccessToken(params.appid, params.secret, params.code, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    })
  })
};

//根据openId找到userId
exports.getUserInfo = function* (model, openId) {
  const data = yield model.findOne({
    where: {
      openId: openId,
    }
  });
  return data;
};

//根据userId找到studentId
exports.getStudentId = function* (model, userId) {
  const data = yield model.findOne({
    where: {
      userId: userId,
    }
  });
  return data.id;
};

//根据userId找到teacherId
exports.getTeacherId = function* (teacherModel, staffModel, userId) {
  const staff = yield staffModel.findOne({
    where: {
      userId: userId,
    }
  });
  const teacher = yield teacherModel.findOne({
    where: {
      staffId: staff.id
    }
  });
  return teacher.id;
};

//feedbacks数组依据create_at的快速排序
exports.quickSort = sort;
function sort(array, start, end) {
  if (!array || start >= end) {
    return;
  }
  var i = start;
  var j = end;
  var tmp = array[i].createAt;
  var tmpObj = array[i];
  while (i < j) {
    while (i < j && array[j].createAt >= tmp) {
      j--;
    }
    if (i < j) {
      array[i++] = array[j];
    }
    while (i < j && array[i].createAt <= tmp) {
      i++;
    }
    if (i < j) {
      array[j--] = array[i];
    }
  }
  array[i] = tmpObj;
  sort(array, start, i - 1);
  sort(array, i + 1, end);
}

//解绑事件
exports.unbind = function* (model, openId){
  try {
    yield model.destroy({
      where: {
        openId: openId,
      }
    });
    return true;
  }catch (err){
    throw err;
  }
};


//菜单选项设置
let reqUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?';
let params = {
  appid: config.wechat.appId,
  redirect_url: 'http://xxxxxx.com/api/OAuth2',
  response_type: 'code',
  scope: 'snsapi_base',
};

exports.defaultMenu = {
  url: '/api/wechat/defaultMenu',
  menuObj: {
    "button": [
      {
        "name": config.wechat.menu[0].main,
        "sub_button": [
          {
            "type": "view",
            "name": config.wechat.menu[0].subMenu[0].name,
            "url": `${reqUrl}appid=${params.appid}&redirect_uri=${params.redirect_url}&response_type=${params.response_type}&scope=${params.scope}&state=studentfeedbacks#wechat_redirect`,
          },
          {
            "type": "view",
            "name": config.wechat.menu[0].subMenu[1].name,
            "url": `${reqUrl}appid=${params.appid}&redirect_uri=${params.redirect_url}&response_type=${params.response_type}&scope=${params.scope}&state=studenttimetable#wechat_redirect`,
          }
        ]
      },
      {
        "name": config.wechat.menu[1].main,
        "sub_button": [
          {
            "type": "view",
            "name": config.wechat.menu[1].subMenu[0].name,
            "url": `${reqUrl}appid=${params.appid}&redirect_uri=${params.redirect_url}&response_type=${params.response_type}&scope=${params.scope}&state=teachertimetable#wechat_redirect`,
          },
          {
            "type": "view",
            "name": config.wechat.menu[1].subMenu[1].name,
            "url": `${reqUrl}appid=${params.appid}&redirect_uri=${params.redirect_url}&response_type=${params.response_type}&scope=${params.scope}&state=managestudent#wechat_redirect`,
          }
        ]
      }
    ]
  }
};