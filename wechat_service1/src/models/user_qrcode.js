/**
 * Created by yangtao on 16/2/18.
 */
'use strict';

//引用
var util = require('util');
var Base = require('./base');

var Model = function () {
  this.orm = require('../schemas/user_qrcode');
}
util.inherits(Model, Base);
var me = module.exports = new Model();

Model.prototype.save = function* (data) {
  var values = {
    event: data.event,
    open_id: data.open_id,
    event_fired_at: data.event_fired_at,
    keyword_id: data.keyword_id
  };

  var ret = yield me.orm.create(values);
  return ret;
};

Model.prototype.update = function* (data) {
  var ret = yield me.orm.update({
  },{
    where: {
      open_id: data.open_id,
      keyword_id: data.keyword_id
    }
  });

  return ret;
}