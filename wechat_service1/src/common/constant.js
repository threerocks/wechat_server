'use strict';

module.exports = {
  NOT_SEND_JSON: 'not_send_json_1vkla011889fdoq',

  WEIXIN_WRONG_ACC_TOKEN: 40001,
  WEIXIN_RETRIES: 3,

  URL: {
    WX_OAUTH_INI: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=',
    KAOWEI: encodeURI(config.kaowei.host),
    KOUYU: config.wap.host + '/activity/speak',
    TEACHERS: config.wap.host + '/teachers/toefl',
    COURSES: config.wap.host + '/courses/toefl',
    USER_BIND: config.user.host + '/weixin_mp/bind',
    DOWNLOAD_APP: 'http://a.app.qq.com/o/simple.jsp?pkgname=com.smartstudy.zhike',
    WENWEN: 'http://wen.beikaodi.com',
  },

  MEDIA: {
    PIC: {
      DOWNLOAD_APP: 'https://mmbiz.qlogo.cn/mmbiz/iaBmDVE8BLHf9gveoTvsKt3PhevjudvQGSf0achZCvBnsZWdobEoywiayRKAvSbzrKeUqic2gpU5xlrkGCm4sevxg/0?wx_fmt=jpeg'
    }
  },

  WEIXIN_KEY_SORT: {
    'HY': 'welcome',
    'HYZH': 'welcome',
    'ZH': 'bind',
    'ZB': 'live'
  },

  CACHE_KEYS: {
    MEDIA: 'MEDIA_oZtL7s4yXR3zkQMGN4AFIiMwOs7M'
  },

};