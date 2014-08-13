/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

(function(exports) {

  // var server = 'https://msisdn-dev.stage.mozaws.net';
  var TIMEOUT = 15000;

  function callback(cb, args) {
    if (cb && typeof cb === 'function') {
      cb.apply(null, args);
    }
  }

  function request(options, onsuccess, onerror) {
    var req = new XMLHttpRequest();
    req.open(options.method, options.url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.responseType = 'json';
    req.timeout = TIMEOUT;
    req.withCredentials = true;

    if (options.credentials) {
      var hawkHeader = hawk.client.header(options.url, options.method, {
        credentials: options.credentials
      });
      req.setRequestHeader('authorization', hawkHeader.field);
    }
    req.onload = function() {
      if (req.status !== 200 && req.status !== 204 && req.status !== 302) {
        callback(onerror, [req.response]);
        return;
      }
      callback(onsuccess, [req.response]);
    };

    req.onerror = req.ontimeout = function(event) {
      callback(onerror, [event.target.status]);
    };

    var body;
    if (options.body) {
      body = JSON.stringify(options.body);
    }

    req.send(body);
  }

  var ClientRequestHelper = {
    discover: function discover(server, msisdn, mcc, mnc, roaming, onsuccess, onerror) {
      var params = {
          mcc: mcc,
          mnc: mnc,
          roaming: roaming
      };
      if (msisdn) {
        params.msisdn = msisdn;
      }
      request({
        method: 'POST',
        url: server + '/discover',
        body: params
      }, onsuccess, onerror);
    },

    register: function register(server, onsuccess, onerror) {
      request({
        method: 'POST',
        url: server + '/register'
      }, onsuccess, onerror);
    },

    unregister: function unregister(server, msisdn, credentials, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: server + '/unregister',
          body: {
            msisdn: msisdn
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    },

    smsVerify: function smsVerify(server, msisdn, mcc, credentials, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: server + '/sms/mt/verify',
          body: {
            msisdn: msisdn,
            mcc: mcc,
            shortVerificationCode: true
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    },

    smsVerifyCode: function smsVerifyCode(server, verificationCode, credentials, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: server + '/sms/verify_code',
          body: {
            code: verificationCode
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    },

    certificateSign: function certificateSign(server, publicKey, duration, credentials, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: server + '/certificate/sign',
          body: {
            publicKey: JSON.stringify(publicKey),
            duration: duration
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    }
  };

  exports.ClientRequestHelper = ClientRequestHelper;
})(this);
