/**
 * Created by yangtao on 16/2/17.
 */

'use strict';

var schema = db.define('userQrcode',{
  //编号
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  //关注或扫描等事件
  event: {
    type: Sequelize.STRING
  },
  //发送方账号(一个OpenID)
  open_id: {
    type: Sequelize.STRING
  },
  //消息创建时间
  event_fired_at: {
    type: Sequelize.DATE
  },
  //scene_id字典映射后的keywordId
  keyword_id: {
    type: Sequelize.INTEGER
  }
},{
  tableName: 'user_qrcode',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

schema.sync();
module.exports = schema;