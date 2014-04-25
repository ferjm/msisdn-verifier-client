/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var App = {
  init: function init() {
    this.msisdn = document.getElementById('msisdn');
    this.mcc = document.getElementById('mcc');
    this.mnc = document.getElementById('mnc');
    this.verificationCode = document.getElementById('verification-code');
    this.registerForm = document.getElementById('register-form');
    this.verifyForm = document.getElementById('verify-form');
    this.verified = document.getElementById('verified');
    this.resetButton = document.getElementById('reset-button');
    this.resetButton.addEventListener('click', this.reset.bind(this));
    document.getElementById('register-button').addEventListener('click',
                                                                this.register.bind(this));
    document.getElementById('verify-button').addEventListener('click',
                                                              this.smsVerifyCode.bind(this));
    document.getElementById('resend-button').addEventListener('click',
                                                              this.smsResendCode.bind(this));
  },

  showVerificationForm: function showVerificationForm() {
    this.registerForm.classList.add('hidden');
    this.verifyForm.classList.remove('hidden');
    this.verified.classList.add('hidden');
  },

  showRegistrationForm: function showRegistrationForm() {
    this.registerForm.classList.remove('hidden');
    this.verifyForm.classList.add('hidden');
    this.verified.classList.add('hidden');
    this.resetButton.textContent = 'Reset';
  },

  showVerified: function showVerified() {
    this.registerForm.classList.add('hidden');
    this.verifyForm.classList.add('hidden');
    this.verified.classList.remove('hidden');
    this.resetButton.textContent = 'Restart';
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
      this.showVerificationForm();
    }).bind(this), function(error) {
      console.error('Error ' + JSON.stringify(error));
    });
  },

  smsVerifyCode: function smsVerifyCode() {
    var jwcrypto = window.require('./lib/jwcrypto');
    jwcrypto.addEntropy(this.sessionToken);
    jwcrypto.generateKeypair({
      algorithm: 'DS',
      keysize: 128
    }, (function(err, keypair) {
      console.log('keypair ' + keypair.publicKey.serialize());
      var publicKey = keypair.publicKey;
      ClientRequestHelper.smsVerifyCode(
        this.msisdn.value,
        this.verificationCode.value,
        publicKey,
        86400000,
        this.sessionToken,
        (function(result) {
          console.log('Yay ' + JSON.stringify(result));
          this.showVerified();
        }).bind(this),
        function(error) {
          console.log('Error: ' + JSON.stringify(error));
        });
    }).bind(this));
  },

  smsResendCode: function smsResendCode() {
    ClientRequestHelper.smsResendCode(this.msisdn.value,
                                      this.sessionToken,
                                      function(result) {
      console.log('Yay ' + JSON.stringify(result));
    }, function(error) {
      console.log('Error: ' + JSON.stringify(error));
    });
  }
};

window.addEventListener('DOMContentLoaded', function onload() {
  window.removeEventListener('DOMContentLoaded', onload);
  App.init();
});
