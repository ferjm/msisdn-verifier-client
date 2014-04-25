/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

(function(exports) {

  var SERVER_URL = 'http://msisdn.dev.mozaws.net';
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
    register: function register(msisdn, mcc, mnc, roaming, onsuccess, onerror) {
      request({
        method: 'POST',
        url: SERVER_URL + '/register',
        body: {
          msisdn: msisdn,
          mcc: mcc,
          mnc: mnc,
          roaming: roaming
        }
      }, onsuccess, onerror);
    },

    unregister: function unregister(msisdn, onsuccess, onerror) {
      request({
        method: 'POST',
        url: SERVER_URL + '/unregister',
        body: {
          msisdn: msisdn
        }
      }, onsuccess, onerror);
    },

    smsVerify: function smsVerify(msisdn, credentials, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: SERVER_URL + '/sms/verify',
          body: {
            msisdn: msisdn
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    },

    smsResendCode: function smsResendCode(msisdn, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: SERVER_URL + '/sms/resend_code',
          body: {
            msisdn: msisdn
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    },

    smsVerifyCode: function smsVerifyCode(msisdn, verificationCode, publicKey,
                                          duration, onsuccess, onerror) {
      deriveHawkCredentials(credentials, 'sessionToken', 2 * 32, function(hawkCredentials) {
        request({
          method: 'POST',
          url: SERVER_URL + '/sms/verify_code',
          body: {
            msisdn: msisdn,
            code: verificationCode,
            publicKey: publicKey,
            duration: duration
          },
          credentials: hawkCredentials
        }, onsuccess, onerror);
      });
    }
  };

  exports.ClientRequestHelper = ClientRequestHelper;
})(this);
