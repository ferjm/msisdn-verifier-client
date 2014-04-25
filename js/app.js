/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var App = {
  init: function init() {
    this.msisdn = document.getElementById('msisdn');
    this.mcc = document.getElementById('mcc');
    this.mnc = document.getElementById('mnc');
    document.getElementById('btVerify').addEventListener('click',
                                                         this.register.bind(this));
    document.getElementById('btReset').addEventListener('click',
                                                        this.reset.bind(this));
  },

  register: function register() {
    ClientRequestHelper.register(this.msisdn.value, this.mcc.value,
                                 this.mnc.value, false, (function(result) {
      console.log('Yay ' + JSON.stringify(result));
      if (!result.msisdnSessionToken) {
        console.error('No session token');
        return;
      }
      this.sessionToken = result.msisdnSessionToken;
      this.smsVerify();
    }).bind(this), (function(error) {
      console.error('Error ' + JSON.stringify(error));
    }).bind(this));
  },

  reset: function reset() {
    this.sessionToken = null;
  },

  smsVerify: function smsVerify() {
    ClientRequestHelper.smsVerify(this.msisdn.value, this.sessionToken,
      function(result) {
      console.log('Yay ' + result);
    }, function(error) {
      console.error('Error ' + JSON.stringify(error));
    });
  }
};

window.addEventListener('DOMContentLoaded', function onload() {
  window.removeEventListener('DOMContentLoaded', onload);

  App.init();
});
