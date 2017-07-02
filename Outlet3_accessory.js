var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var err = null; // in case there were any problems
var Gpio = require('pigpio').Gpio,
	desktop = new Gpio(22, {mode:Gpio.OUTPUT});
	// here's a fake hardware device that we'll expose to HomeKit
var FAKE_OUTLET2 = {
    setPowerOn: function(on) {
    console.log("Turning the outlet %s!...", on ? "on" : "off");
    if (on) {
          FAKE_OUTLET2.powerOn = true;
          if(err) { return console.log(err); }
		  desktop.digitalWrite(0);
          console.log("...outlet is now on.");
    } else {
          FAKE_OUTLET2.powerOn = false;
		  desktop.digitalWrite(1);
          if(err) { return console.log(err); }
          console.log("...outlet is now off.");
    }
  },
    identify: function() {
    console.log("Identify the outlet.");
    }
}



// Generate a consistent UUID for our outlet Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the accessory name.
var outlet2UUID = uuid.generate('hap-nodejs:accessories:Outlet2');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake light.
var outlet2 = exports.accessory = new Accessory('Fan Outlet', outlet2UUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
outlet2.username = "1A:2B:3C:4D:5D:F3";
outlet2.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
outlet2
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "FASZ")
  .setCharacteristic(Characteristic.Model, "Rev-1")
  .setCharacteristic(Characteristic.SerialNumber, "A1S2NASF88EW2");

// listen for the "identify" event for this Accessory
outlet2.on('identify', function(paired, callback) {
  FAKE_OUTLET2.identify();
  callback(); // success
});

// Add the actual outlet Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
outlet2
  .addService(Service.Outlet, "Fake Outlet2") // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    FAKE_OUTLET2.setPowerOn(value);
    callback(); // Our fake Outlet is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
outlet2
  .getService(Service.Outlet)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {

    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.

    var err = null; // in case there were any problems

    if (FAKE_OUTLET2.powerOn) {
      console.log("Are we on? Yes.");
      callback(err, true);
    }
    else {
      console.log("Are we on? No.");
      callback(err, false);
    }
  }); 