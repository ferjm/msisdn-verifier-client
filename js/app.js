/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var App = {
  init: function init() {
    this.msisdn = document.getElementById('msisdn');
    this.mcc = document.getElementById('mcc');
    this.mnc = document.getElementById('mnc');
    this.registerForm = document.getElementById('register-form');
    this.verifyForm = document.getElementById('verify-form');
    document.getElementById('btRegister').addEventListener('click',
                                                           this.register.bind(this));
    document.getElementById('btReset').addEventListener('click',
                                                        this.reset.bind(this));
  },

  showVerificationForm: function showVerificationForm() {
    this.registerForm.classList.add('hidden');
    this.verifyForm.classList.remove('hidden');
  },

  showRegistrationForm: function showRegistrationForm() {
    this.registerForm.classList.remove('hidden');
    this.verifyForm.classList.add('hidden');
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
    this.showRegistrationForm();
  },

  smsVerify: function smsVerify() {
    ClientRequestHelper.smsVerify(this.msisdn.value, this.sessionToken,
      (function(result) {
      console.log('Yay ' + JSON.stringify(result));
      require('./lib/jwcrypto').generateKeyPair.generateKeypair({
          algorithm: 'DS',
          keysize: 160
      }, function(err, keypair) {
          // serialize the public key
          console.log('keypair ' + keypair.publicKey.serialize());
      });
      this.showVerificationForm();
    }).bind(this), function(error) {
      console.error('Error ' + JSON.stringify(error));
    });
  }
};

window.addEventListener('DOMContentLoaded', function onload() {
  window.removeEventListener('DOMContentLoaded', onload);
  App.init();
});
