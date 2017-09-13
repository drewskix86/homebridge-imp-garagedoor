var Service, Characteristic, Accessory, loopTimer;
const https = require('https');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  Accessory = homebridge.hap.Accessory;
  DoorState = homebridge.hap.Characteristic.CurrentDoorState;
  homebridge.registerAccessory('homebridge-imp-garagedoor', 'GarageDoorImp', GarageImpAccessory);
};

function GarageImpAccessory(log, config) {
  this.log = log;
  this.name = config.name;
  this.url = config.url;
  this.sharedKey = config.sharedKey;
  this.statusUpdateDelay = config.status_update_delay || 15;
  this.getState();
};

GarageImpAccessory.prototype.processData = function(statesTable) {
  var accessory = this;
  accessory.log('processData');
  var doorCurrentState = statesTable["current"];
  var doorTargetState = statesTable["target"];
  console.log("Current State = " + doorCurrentState + ": Target State = " + doorTargetState);
};

GarageImpAccessory.prototype.setTargetState = function(state) {
  var accessory = this;
  switch(state){
    //new target door state: SECURED & UNSECURED
    case "OPEN":
      if(accessory.garageDoorService.getCharacteristic(Characteristic.TargetDoorState) != Characteristic.TargetDoorState.OPEN){
        accessory.garageDoorService.setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.OPEN);
      }
      break;
    case "CLOSED":
      if(accessory.garageDoorService.getCharacteristic(Characteristic.TargetDoorState) != Characteristic.TargetDoorState.CLOSED){
        accessory.garageDoorService.setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED);
      }
      break;
  }
  accessory.log(accessory.name + ' setTargetState: ' + state);
};

GarageImpAccessory.prototype.setCurrentState = function(state) {
  var accessory = this;
  switch(state){
    //new door state: SECURED & UNSECURED
    case "OPEN":
      accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
      break;
    case "CLOSED":
      accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
      break;
    case "OPENING":
      accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPENING);
      break;
    case "CLOSING":
      accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSING);
      break;
    default:
      accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.STOPPED);
      break;
  }
  accessory.log(accessory.name + ' setCurrentState: ' + state);
}

GarageImpAccessory.prototype.setState = function(isClosed, callback) {
  var accessory = this;
  var statusC;
  var state = isClosed ? 'CLOSED' : 'OPEN';
  var url = accessory.url + '?apikey=' + accessory.sharedKey + '&msg=' + state;

  //launch get request
  https.get(url,  (res) => {
    statusC = res.statusCode;
    accessory.log('setState: Commnand to run: ' + state + ' Status Code: ' + res.statusCode);
  }).on('error', (err) => {
    accessory.log('setState: https.get Error: ' + err);
    callback(err || new Error('Error setting state of ' + accessory.name));
  });

  callback(null, (cb) => {
  });

  clearTimeout(loopTimer);
  loopTimer = setTimeout(function() {
      accessory.getState();
  }, accessory.statusUpdateDelay * 500);
};

GarageImpAccessory.prototype.getState = function(callback) {
  var accessory = this;
  accessory.log('getState');

  var url = accessory.url + '?apikey=' + accessory.sharedKey + '&msg=CHECK';

  //launch get request
  https.get(url,  (res) => {
    res.on('data', (d) => {
      if (res.statusCode == 200 ) {
        accessory.log('Function getState: res Code ' + res.statusCode +', data ' + d)
        var states = JSON.parse(d);
        var doorCurrentState = states["current"];
        var doorTargetState = states["target"];
        accessory.setCurrentState(doorCurrentState);
        accessory.setTargetState(doorTargetState);
      }else{
        accessory.log('No state available');
      }
    });
  }).on('error', (err) => {
    accessory.log('Function getState: Error: ' + err);
    accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.UNKNOWN);
    callback(err || new Error('Error getting state of ' + accessory.name));
  });

  //RESET the timer to check statuses again to the status update delay from Config
  clearTimeout(loopTimer);
  loopTimer = setTimeout(function() {
      accessory.getState();
  }, accessory.statusUpdateDelay * 1000);

};

GarageImpAccessory.prototype.getServices = function() {
  this.informationService = new Service.AccessoryInformation();
  this.garageDoorService = new Service.GarageDoorOpener(this.name);

  this.informationService
  .setCharacteristic(Characteristic.Manufacturer, 'Garage Command')
  .setCharacteristic(Characteristic.Model, 'Homebridge Plugin')
  .setCharacteristic(Characteristic.SerialNumber, '001');

  this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
  .on('set', this.setState.bind(this));

  if (this.stateCommand) {
    this.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState)
    .on('get', this.getState.bind(this));
    this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
    .on('get', this.getState.bind(this));
  }

  return [this.informationService, this.garageDoorService];
};
