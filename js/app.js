/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var App = {
  init: function init() {
    // Discover form
    this.serverUrl = document.getElementById('server-url');
    this.discoverForm = document.getElementById('discover-form');
    this.msisdn = document.getElementById('msisdn');
    this.mcc = document.getElementById('mcc');
    this.mnc = document.getElementById('mnc');
    this.discoverButton = document.getElementById('discover-button');
    this.discoverButton.addEventListener('click', this.discover.bind(this));

    // MOMT Info
    this.momtInfo = document.getElementById('momt-info');
    this.momtCode = document.getElementById('momt-code');
    this.momtNumber = document.getElementById('momt-number');
    this.mtNumber = document.getElementById('mt-number');

    // MT Info
    this.mtInfo = document.getElementById('mt-info');
    this.mtInfoNumber = document.getElementById('mtinfo-number');
    this.registerMsisdn = document.getElementById('register-msisdn');
    this.registerButton = document.getElementById('register-button');
    this.registerButton.addEventListener('click', this.smsVerify.bind(this));

    // Verify form
    this.verifyForm = document.getElementById('verify-form');
    this.verificationCode = document.getElementById('verification-code');
    this.verifyButton = document.getElementById('verify-button');
    this.verifyButton.addEventListener('click', this.smsVerifyCode.bind(this));

    // Verified
    this.verified = document.getElementById('verified');

    // Reset
    this.resetButton = document.getElementById('reset-button');
    this.resetButton.addEventListener('click', this.reset.bind(this));

    toastr.options = {
      "closeButton": false,
      "debug": false,
      "positionClass": "toast-bottom-full-width",
      "onclick": null,
      "showDuration": "300",
      "hideDuration": "1000",
      "timeOut": "5000",
      "extendedTimeOut": "1000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut"
    };
  },

  hideAllForms: function hideAllForm() {
    this.discoverForm.classList.add('hidden');
    this.momtInfo.classList.add('hidden');
    this.mtInfo.classList.add('hidden');
    this.verifyForm.classList.add('hidden');
    this.verified.classList.add('hidden'); 
    this.resetButton.textContent = 'Reset';
  },

  showDiscoverForm: function showRegistrationForm() {
    this.hideAllForms();
    this.discoverForm.classList.remove('hidden');
  },

  showMoMtInfo: function showMoMtInfo() {
    this.hideAllForms();
    this.momtInfo.classList.remove('hidden');
    this.verifyForm.classList.remove('hidden');
    toastr.info(this.flow);
  },

  showMtInfo: function showMtInfo() {
    this.hideAllForms();
    this.mtInfo.classList.remove('hidden');
    toastr.info(this.flow);
  },

  showVerificationForm: function showVerificationForm() {
    this.hideAllForms();
    this.verifyForm.classList.remove('hidden');
    toastr.info(this.flow);
  },

  showVerified: function showVerified() {
    this.hideAllForms();
    this.verified.classList.remove('hidden');
    this.resetButton.textContent = 'Restart';
    toastr.info(this.flow);
  },

  discover: function discover() {
    var self = this;
    ClientRequestHelper.discover(
      self.serverUrl.value, self.msisdn.value, self.mcc.value, self.mnc.value, false,
      function(result) {
        console.log('Discover: ' + JSON.stringify(result));
        if (!result.verificationMethods ||
            result.verificationMethods.length === 0) {
          toastr.error('No verification methods available.');
          return;
        }

        // Start the MT Flow
        if (result.verificationMethods[0] === "sms/mt") {
          self.registerMsisdn.value = self.msisdn.value;
          self.mtInfoNumber.value = result.verificationDetails["sms/mt"].mtSender;
          self.flow = "SMS MT flow";
          self.showMtInfo();
          return;
        }

        // Start the MOMT Flow
        if (result.verificationMethods[0] === "sms/momt") {
          var details = result.verificationDetails["sms/momt"];
          self.register(function (err, msisdnSessionToken) {
            if (err) {
              toastr.error(err);
              return;
            }
            deriveHawkCredentials(
              msisdnSessionToken, 'sessionToken', 2 * 32,
              function(hawkCredentials) {
                self.momtCode.value = hawkCredentials.id;
                self.momtNumber.value = details.moVerifier;
                self.mtNumber.value = details.mtSender;
                self.flow = "SMS MOMT flow";
                self.showMoMtInfo();
              });
          });
          return;
        }

        // Error if verification methods not known
        toastr.error(
          result.verificationMethods[0] + " not handled by self tool."
        );
        self.reset();
    }, function(error) {
      console.error('Discover Error ' + JSON.stringify(error));
      toastr.error(JSON.stringify(error));
    });
  },

  register: function register(callback) {
    var self = this;
    ClientRequestHelper.register(self.serverUrl.value, function(result) {
      console.log('Register ' + JSON.stringify(result));
      if (!result.msisdnSessionToken) {
        callback(new Error("No session token"));
        return;
      }
      self.sessionToken = result.msisdnSessionToken;
      callback(null, self.sessionToken);
    }, function(error) {
      console.error('Register Error ' + JSON.stringify(error));
      callback(new Error(JSON.stringify(error)));
    });
  },

  reset: function reset() {
    this.sessionToken = null;
    this.server = "";
    this.msisdn.value = "";
    this.mcc.value = "";
    this.mnc.value = "";
    this.momtCode.value = "";
    this.momtNumber.value = "";
    this.mtNumber.value = "";
    this.mtInfoNumber.value = "";
    this.registerMsisdn.value = "";
    this.verificationCode.value = "";
    this.flow = null;
    this.showDiscoverForm();
  },

  smsVerify: function smsVerify() {
    this.register((function(err, msisdnSessionToken) {
      ClientRequestHelper.smsVerify(
        this.serverUrl.value, this.registerMsisdn.value, this.sessionToken, (function(result) {
          console.log('Verify ' + JSON.stringify(result));
          this.showVerificationForm();
        }).bind(this), function(error) {
          console.error('Verify Error ' + JSON.stringify(error));
          toastr.error(JSON.stringify(error));
        });
    }).bind(this));
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
      var self = this;
      ClientRequestHelper.smsVerifyCode(
        this.serverUrl.value,
        this.verificationCode.value,
        this.sessionToken,
        (function(result) {
          console.log('verify_code ' + JSON.stringify(result));
          ClientRequestHelper.certificateSign(self.serverUrl.value, publicKey, 86400000,
            this.sessionToken, (function(result) {
              console.log('certificateSign ' + JSON.stringify(result));
              this.showVerified();
            }).bind(this), function(error) {
              console.log('certificateSign Error: ' + JSON.stringify(error));
              toastr.error(JSON.stringify(error));
            }
          );
        }).bind(this), function(error) {
          console.log('verify_code Error: ' + JSON.stringify(error));
          toastr.error(JSON.stringify(error));
        }
      );
    }).bind(this));
  }
};

window.addEventListener('DOMContentLoaded', function onload() {
  window.removeEventListener('DOMContentLoaded', onload);
  App.init();
});
