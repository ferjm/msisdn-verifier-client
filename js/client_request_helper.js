/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

(function(exports) {

  var SERVER_URL = 'https://msisdn-dev.stage.mozaws.net';
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
      if (req.status !== 200 && req.status !== 302) {
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
    discover: function discover(msisdn, mcc, mnc, roaming, onsuccess, onerror) {
      request({
        method: 'POST',
        url: SERVER_URL + '/discover',
        body: {
          msisdn: msisdn,
          mcc: mcc,
          mnc: mnc,
          roaming: roaming
        }
      }, onsuccess, onerror);
    },

    register: function register(onsuccess, onerror) {
      request({
        method: 'POST',
        url: SERVER_URL + '/register'
      }, onsuccess, onerror);
    },

    unregister: function unregister(msisdn, credentials, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: SERVER_URL + '/unregister',
          body: {
            msisdn: msisdn
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    },

    smsVerify: function smsVerify(msisdn, credentials, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: SERVER_URL + '/sms/mt/verify',
          body: {
            msisdn: msisdn,
            shortVerificationCode: true
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    },

    smsVerifyCode: function smsVerifyCode(verificationCode, credentials, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: SERVER_URL + '/sms/verify_code',
          body: {
            code: verificationCode
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    },

    certificateSign: function certificateSign(publicKey, duration, credentials, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: SERVER_URL + '/certificate/sign',
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
