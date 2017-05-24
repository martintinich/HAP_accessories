var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var Gpio = require('pigpio').Gpio,
	green = new Gpio(21, {mode:Gpio.OUTPUT}),
	red = new Gpio(16, {mode:Gpio.OUTPUT}),
	blue = new Gpio(20, {mode:Gpio.OUTPUT}),
	tap = new Gpio(12, {mode:Gpio.OUTPUT}),
	button = new Gpio(5, {mode: Gpio.INPUT,pullUpDown: Gpio.PUD_UP,edge: Gpio.RISING_EDGE });
var R=255,G=255,B=255;

button.on('interrupt', function (level) {
console.log("Interrupt!");
if (LightController.getPower()==true){
lightAccessory
	.getService(Service.Lightbulb)
	.getCharacteristic(Characteristic.On)
	.updateValue(false);
LightController.setPower(false);
}
else{
lightAccessory
        .getService(Service.Lightbulb)
        .getCharacteristic(Characteristic.On)
        .updateValue(true);
LightController.setPower(true);
}
});


function RGBtoPIN(){
	red.pwmWrite(R);
	green.pwmWrite(G);
	blue.pwmWrite(B);
}
function HSVtoRGB(h,a,br){
	var r,g,b;
    var s=a/100;
    var v=br/100;
    var c=v*s;
    x=c*(1-Math.abs((h/60)%2-1));
    var m=v-c;	
    if (0<=h && h<60){
        r=c;
        g=x;
        b=0;
	}
    else if (60<=h && h<120){
        r=x;
        g=c;
        b=0;
	}
    else if (120<=h && h<180){
        r=0;
        g=c;
        b=x;
	}
    else if (180<=h && h<240){
        r=0;
        g=x;
        b=c;
	}
    else if (240<=h && h<300){
        r=x;
        g=0;
        b=c;
	}
    else if (300<=h && h<360){
        r=c;
        g=0;
        b=x;
	}
    R=Math.round((r+m)*255);
    G=Math.round((g+m)*255);
    B=Math.round((b+m)*255);
}

var LightController = {
  name: "Simple Light", //name of accessory
  pincode: "031-45-154",
  username: "FA:3C:ED:5A:1A:1A", // MAC like address used by HomeKit to differentiate accessories. 
  manufacturer: "HAP-NodeJS", //manufacturer (optional)
  model: "v1.0", //model (optional)
  serialNumber: "A12S345KGB", //serial number (optional)

  power: false, //curent power status
  brightness: 100, //current brightness
  hue: 0, //current hue
  saturation: 0, //current saturation

  outputLogs: true, //output logs

  setPower: function(status) { //set power of accessory
    if(this.outputLogs) console.log("Turning the '%s' %s", this.name, status ? "on" : "off");
    this.power = status;
	if (status)
		{
		tap.digitalWrite(0);
		}
	if(!status)
		{
		tap.digitalWrite(1);			
		}
  },

  getPower: function() { //get power of accessory
    if(this.outputLogs) console.log("'%s' is %s.", this.name, this.power ? "on" : "off");
    return this.power;
  },

  setBrightness: function(brightness) { //set brightness
    if(this.outputLogs) console.log("Setting '%s' brightness to %s", this.name, brightness);
    this.brightness = brightness;
	HSVtoRGB(this.hue,this.saturation,this.brightness);
	RGBtoPIN();
	
	
  },

  getBrightness: function() { //get brightness
    if(this.outputLogs) console.log("'%s' brightness is %s", this.name, this.brightness);
    return this.brightness;
  },

  setSaturation: function(saturation) { //set brightness
    if(this.outputLogs) console.log("Setting '%s' saturation to %s", this.name, saturation);
    this.saturation = saturation;
	HSVtoRGB(this.hue,this.saturation,this.brightness);
	RGBtoPIN();
  },

  getSaturation: function() { //get brightness
    if(this.outputLogs) console.log("'%s' saturation is %s", this.name, this.saturation);
    return this.saturation;
  },

  setHue: function(hue) { //set brightness
    if(this.outputLogs) console.log("Setting '%s' hue to %s", this.name, hue);
    this.hue = hue;
	HSVtoRGB(this.hue,this.saturation,this.brightness);
	RGBtoPIN();
  },

  getHue: function() { //get hue
    if(this.outputLogs) console.log("'%s' hue is %s", this.name, this.hue);
    return this.hue;
  },

  identify: function() { //identify the accessory
    if(this.outputLogs) console.log("Identify the '%s'", this.name);
  }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "light".
var lightUUID = uuid.generate('hap-nodejs:accessories:light' + LightController.name);

// This is the Accessory that we'll return to HAP-NodeJS that represents our light.
var lightAccessory = exports.accessory = new Accessory(LightController.name, lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
lightAccessory.username = LightController.username;
lightAccessory.pincode = LightController.pincode;

// set some basic properties (these values are arbitrary and setting them is optional)
lightAccessory
  .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, LightController.manufacturer)
    .setCharacteristic(Characteristic.Model, LightController.model)
    .setCharacteristic(Characteristic.SerialNumber, LightController.serialNumber);

// listen for the "identify" event for this Accessory
lightAccessory.on('identify', function(paired, callback) {
  LightController.identify();
  callback();
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
lightAccessory
  .addService(Service.Lightbulb, LightController.name) // services exposed to the user should have "names" like "Light" for this case
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    LightController.setPower(value);

    // Our light is synchronous - this value has been successfully set
    // Invoke the callback when you finished processing the request
    // If it's going to take more than 1s to finish the request, try to invoke the callback
    // after getting the request instead of after finishing it. This avoids blocking other
    // requests from HomeKit.
    callback();
  })
  // We want to intercept requests for our current power state so we can query the hardware itself instead of
  // allowing HAP-NodeJS to return the cached Characteristic.value.
  .on('get', function(callback) {
    callback(null, LightController.getPower());
  });

// To inform HomeKit about changes occurred outside of HomeKit (like user physically turn on the light)
// Please use Characteristic.updateValue
// 
// lightAccessory
//   .getService(Service.Lightbulb)
//   .getCharacteristic(Characteristic.On)
//   .updateValue(true);

// also add an "optional" Characteristic for Brightness
lightAccessory
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Brightness)
  .on('set', function(value, callback) {
    LightController.setBrightness(value);
    callback();
  })
  .on('get', function(callback) {
    callback(null, LightController.getBrightness());
  });

// also add an "optional" Characteristic for Saturation
lightAccessory
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Saturation)
  .on('set', function(value, callback) {
    LightController.setSaturation(value);
    callback();
  })
  .on('get', function(callback) {
    callback(null, LightController.getSaturation());
  });

// also add an "optional" Characteristic for Hue
lightAccessory
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Hue)
  .on('set', function(value, callback) {
    LightController.setHue(value);
    callback();
  })
  .on('get', function(callback) {
    callback(null, LightController.getHue());
  });
