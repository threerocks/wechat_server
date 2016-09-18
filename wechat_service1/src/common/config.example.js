'use strict';

module.exports = {
  // 监听端口
  port: 3015,

  // 默认超时时间
  timeout: 10,

  // 错误码前缀
  errorPrefix: 'WX',

  authorized: [
    // 智课
    "N0LXYPFL03O4TU2WQEU536NDJR7IJKII",
    // 批改
    "KVN182L4M59FP1KFJ1IWRJ192UFNV648",
    // 备考
    "IO193UNVKDF711LFLGIDS81JVMLAFKEI",
    // 微信
    'YXHQKS48XXT0SMREP570DBAPQJ02MI69',
  ],

  db: {
    dbname: 'weixin_service',
    username: 'weixin_service',
    password: 'weixin_service',
    host: 'dev.smartstudy.com',
    port: 3306,
    pool: 10
  },

  // 缓存
  cache: {
    host: '127.0.0.1',
    port: 6379
  },

  kaowei: {
    host: 'http://app.smartstudy.com/kaowei/kaowei_wap'
  },

  wap: {
    host: 'http://dev.m.smartstudy.com'
  },

  user: {
    host: 'http://172.16.3.237:5000'
  },

  weixin: {
    appId: 'wx45bfa5b4213fa863',
    appSecret: '6c5b42a215a7c90e2ed0d2ebb2780dad',
    token: 'ss_test',
    encodingAESKey: 'qbpnfwNeMuIAho2fktz4n9rWjDwudSZ6fmfXfaoaAPs',

    template: {
      kaowei: '98QYgiCPxyNbeeVvpWSs_l5SQiF2fYm1ORQMwXJifME',
    }
  },
};
