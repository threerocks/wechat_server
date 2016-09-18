'use strict';

const wechatHelper = require('./common/wechat.helper');
const subjectHelper = require('./common/subject_helper');
const url = require('url');
const config = require('./../common/config');
const wx = require('wechat-toolkit');
const user = require('./../services/user');
const backendConstants = require('../common/constants');
const request = require('request');
const ONE_HOUR = 60 * 60 * 1000;

module.exports = class Model extends BaseModel {
  // 构造函数
  constructor() {
    super();
    this.orm = this.load(schemas.wechat);
    this.ormTask = this.load(schemas.studentTask);
    this.ormStudent = this.load(schemas.student);
    this.ormStaff = this.load(schemas.organizationStaff);
    this.ormTeacher = this.load(schemas.teacher);
    this.ormClassroom = this.load(schemas.classroom);
    this.vipCourse = this.load(schemas.vipCourse);
    this.groupCourse = this.load(schemas.groupCourse);
    this.ormContractTransfer = this.load(schemas.contractTransfer);

    this.vipCourse.belongsTo(this.ormTeacher, { foreignKey: 'teacherId' })
    this.vipCourse.belongsTo(this.ormStudent, { foreignKey: 'studentId' })
    this.vipCourse.belongsTo(this.ormClassroom, { foreignKey: 'classroomId' })
    this.ormTeacher.belongsTo(this.ormStaff, { foreignKey: 'staffId', as: 'teacherStaff', constraints: false })
  }

  // 服务器确认
  *wechatVerification(req, res) {
    var query = url.parse(req.url, true).query;
    var signature = query.signature;
    var echostr = query.echostr;
    var timestamp = query['timestamp'];
    var nonce = query.nonce;
    var oriArray = new Array();
    oriArray[0] = nonce;
    oriArray[1] = timestamp;
    oriArray[2] = config.wechat.token;
    oriArray.sort();
    var original = oriArray.join('');
    console.log("Original str : " + original);
    console.log("Signature : " + signature);
    var scyptoString = wechatHelper.sha1(original);
    if (signature == scyptoString) {
      res.end(echostr);
      console.log("Confirm and send echo back");
    } else {
      res.end("false");
      console.log("Failed!");
    }
  }

  // 默认菜单
  *defaultMenu() {
    const token = yield wechatHelper.getMenuToken();
    console.log(token);
    wx.createMenu(token, wechatHelper.defaultMenu.menuObj, function (err, error_code, error_message) {
      if (err) {
        console.log(err);
        return;
      }
      console.log(wechatHelper.defaultMenu.menuObj);
      console.log(error_code);
      console.log(error_message)
    })
  }

  // 设置模板消息行业信息
  *setIndustry() {
    const token = yield wechatHelper.getMenuToken();
    const url = `https://api.weixin.qq.com/cgi-bin/template/api_set_industry?access_token=${token}`;
    const formData = {
      "industry_id1": "1",
      "industry_id2": "16"
    };
    request.post({
      url: url,
      formData: formData
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return console.error('upload failed:', err);
      }
      console.log('Upload successful!  Server responded with:', body);
    });
  }

  // 获取模板消息行业信息
  *getIndustryInfo() {
    const token = yield wechatHelper.getMenuToken();
    const url = `https://api.weixin.qq.com/cgi-bin/template/get_industry?access_token=${token}`;
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body) // Show the HTML for the Google homepage.
      }
    });
  }

  // 获取模板信息
  *getTemplete() {
    const token = yield wechatHelper.getMenuToken();
    const url = `https://api.weixin.qq.com/cgi-bin/template/get_all_private_template?access_token=${token}`;
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body) // Show the HTML for the Google homepage.
      }
    });
  }

  // 删除模板
  *deleteTemplete(params) {
    const token = yield wechatHelper.getMenuToken();
    const url = `https://api.weixin.qq.com/cgi-bin/template/del_private_template?access_token=${token}`;
    const formData = {
      "template_id": params.templateId
    };
    request.post({
      url: url,
      formData: formData
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return console.error('upload failed:', err);
      }
      console.log('Upload successful!  Server responded with:', body);
    });
  }

  // 推送模板信息
  *autoPush(taskId, studentId, feedback) {
    const student = yield this.ormStudent.findById(studentId);
    if (!student) throw new Exception(2303);
    const bindingInfo = yield this.orm.findOne({
      where: {
        userId: (student.userId).toString(),
      }
    });
    if (!bindingInfo) return false;
    const task = yield this.ormTask.findById(taskId);
    const time = new Date(feedback.createAt);

    const token = yield wechatHelper.getMenuToken();
    const openId = bindingInfo.openId;
    var data = {
      first: {
        value: "您好,您有反馈信息!",
        color: "#888888"
      },
      "keyword1": {
        value: task.name,
        color: "#0A0A0A"
      },
      "keyword2": {
        value: feedback.content,
        color: "#0A0A0A"
      },
      "remark": {
        value: '反馈教师:  '
        + feedback.userName + ' '
        + '\n反馈时间:  '
        + time.getFullYear() + '.'
        + time.getMonth() + '.'
        + time.getDate() + ' '
        + time.getHours() + ':'
        + time.getMinutes(),
        color: "#888888"
      }
    };
    var obj = {
      access_token: token,
      fan_open_id: openId,
      template_id: 'XXXXXXXXXXXXX',
      top_color: "#000000",
      data: data
    };
    wx.sendTemplateMessage(obj, function (err, code, message) {
      if (err) {
        console.log(err);
        return;
      }
      console.log(code);
      console.log(message);
    });
  }

  // 用户交互事件处理
  *postProcessRecv(req, res, body) {
    const eventObj = yield wechatHelper.getWechatMsg(req, res, body);
    const type = eventObj.type,
      wReq = eventObj.req,
      wRes = eventObj.res,
      msg = eventObj.msg;
    switch (type) {
      case 'subscribe':
        wRes.reply('感谢您的关注!');
        break;
      case 'unsubscribe':
        const flag = yield wechatHelper.unbind(this.orm, msg.FromUserName);
        if (flag) console.log(msg.FromUserName + ' 完成解绑');
        break;
      case 'text':
        if (msg.Content !== '解绑' && msg.Content !== 'jiebang' && msg.Content !== 'jb') {
          wRes.reply('无法识别的关键字，仅支持jb、jiebang、解绑，三个关键字用于账号解绑')
        } else {
          const flag = yield wechatHelper.unbind(this.orm, msg.FromUserName);
          if (flag) console.log(msg.FromUserName + ' 完成解绑');
          wRes.reply('解绑成功')
        }
        break;
      case 'other':
        wRes.reply('无法识别的关键字');
        break;
      default:
        wRes.reply('无法识别');
        break;
    }
  }
};
