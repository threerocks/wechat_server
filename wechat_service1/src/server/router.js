'use strict';

// 引用
var run = require('./run');

// 路由
module.exports = function(app) {

  app.get('/', run(ctrls.weixin.enableDev));
  app.post('/',run(ctrls.weixin.processRecvPost));
  
  app.post('/api/menu/del', run(ctrls.menu.deleteMenu));
  app.post('/api/menu/create', run(ctrls.menu.createMenu));
  app.post('/api/menu/createdefault', run(ctrls.menu.createDefaultMenu));

  app.post('/api/user/oauth', run(ctrls.userInfo.getOAuth));
  app.post('/api/activemsg/post', run(ctrls.activeMessage.sendExamSeatMsg));
  app.post('/api/media/info', run(ctrls.media.refreshMediaInfo));

  app.post('/api/jssdk/get', run(ctrls.jsSdk.getParams));
  app.post('/api/accToken/get', run(ctrls.api.getAccToken));

  //生成单个二维码
  //app.get('/api/qrcode/',run(ctrls.qrCode.getQrCode));

  //批量生成二维码
  app.post('/api/qrcode/',run(ctrls.qrCode.getKeyUrlArray));


  // 404
  app.all('*', function(req, res) {
    res.send({
      code: config.errorPrefix + 1001,
      msg: errors[1001]
    });
  });
};
