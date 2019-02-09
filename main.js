/**
 *
 * powerdog adapter
 *
 *
 *  file io-package.json comments:
 *
 *  {
 *      "common": {
 *          "name":         "powerdog",                  // name has to be set and has to be equal to adapters folder name and main file name excluding extension
 *          "version":      "0.0.0",                    // use "Semantic Versioning"! see http://semver.org/
 *          "title":        "Node.js powerdog Adapter",  // Adapter title shown in User Interfaces
 *          "authors":  [                               // Array of authord
 *              "name <mail@powerdog.com>"
 *          ]
 *          "desc":         "powerdog adapter",          // Adapter description shown in User Interfaces. Can be a language object {de:"...",ru:"..."} or a string
 *          "platform":     "Javascript/Node.js",       // possible values "javascript", "javascript/Node.js" - more coming
 *          "mode":         "daemon",                   // possible values "daemon", "schedule", "subscribe"
 *          "materialize":  true,                       // support of admin3
 *          "schedule":     "0 0 * * *"                 // cron-style schedule. Only needed if mode=schedule
 *          "loglevel":     "info"                      // Adapters Log Level
 *      },
 *      "native": {                                     // the native object is available via adapter.config in your adapters code - use it for configuration
 *          "test1": true,
 *          "test2": 42,
 *          "mySelect": "auto"
 *      }
 *  }
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

// you have to require the utils module and call adapter function
const utils =    require(__dirname + '/lib/utils'); // Get common adapter utils

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.powerdog.0
const adapter = new utils.Adapter('powerdog');

var xmlrpc = require('xmlrpc');
var clientOptions = 'http://192.168.67.25:20000/';


/*Variable declaration, since ES6 there are let to declare variables. Let has a more clearer definition where 
it is available then var.The variable is available inside a block and it's childs, but not outside. 
You can define the same variable name inside a child without produce a conflict with the variable of the parent block.*/
let variable = 1234;

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // Warning, state can be null if it was deleted
    adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        adapter.log.info('ack is not set!');
    }
});

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    if (typeof obj === 'object' && obj.message) {
        if (obj.command === 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    main();
});

function main() {

    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    adapter.log.debug('IP-Address of Powerdog: ' + adapter.config.IpAddress);
    adapter.log.debug('Port of Powerdog: '    + adapter.config.Port);
    adapter.log.debug('API-Key of Powerdog: ' + adapter.config.ApiKey);

    /**
     *
     *      For every state in the system there has to be also an object of type state
     *
     *      Here a simple powerdog for a boolean variable named "testVariable"
     *
     *      Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
     *
     */
	// Creates an XML-RPC client. Passes the host information on where to
	// make the XML-RPC calls.
	var client = xmlrpc.createClient({ host: adapter.config.IpAddress, port: 20000, path: '/'})
						
	// Sends a method call to the XML-RPC server
	client.methodCall('getPowerDogInfo',[adapter.config.ApiKey], function(error, obj, reply) {
	// Results of the method response
		if(error) 
			adapter.log.error('Fehler PowerDog: ' + error);
		else 
		{
			for (let key in obj) {
				// checking if it's nested
				if (key === 'Reply' && obj.hasOwnProperty(key) && (typeof obj[key] === "object")) {
					let objInfo = obj[key];
					for (let keyInfo in objInfo) {
						adapter.log.debug(keyInfo + ': ' + objInfo[keyInfo]);
						adapter.setObjectNotExists('Info.' + keyInfo, {
							type: 'state',
							common: {
								name: keyInfo,
								type: 'state'
							},
							native: {}
						});
						adapter.setState('Info.' + keyInfo, {val: objInfo[keyInfo], ack: true});
					}
				}
			}
		}
//		adapter.log.info(JSON.stringify(obj));
	}); 

	// Sends a method call to the XML-RPC server
	client.methodCall('getSensors',['ed2hab'], function(error, obj, reply) {
		// Results of the method response
		if(error) 
		  adapter.log.error('Fehler PowerDog: ' + error);
		else 
		{
			for (let key in obj) {
				// checking if it's nested
				if (key === 'Reply' && obj.hasOwnProperty(key) && (typeof obj[key] === "object")) {
					let objSensor = obj[key];
					for (let keySensor in objSensor) {
						adapter.log.debug(keySensor);
						if (objSensor.hasOwnProperty(keySensor) && (typeof objSensor[keySensor] === "object")) {
							let objSensorInfo = objSensor[keySensor];
							adapter.log.debug(objSensorInfo);
							for (let keyInfo in objSensorInfo) {
								adapter.log.debug(keyInfo + ': ' + objSensorInfo[keyInfo]);
								adapter.setObjectNotExists('Sensors.' + keySensor + '.' + keyInfo, {
									type: 'state',
									common: {
										name: keyInfo,
										type: 'state'
									},
									native: {}
								});
								adapter.setState('Sensors.' + keySensor + '.' + keyInfo, {val: objSensorInfo[keyInfo], ack: true});
							}
						}
					}
				}
			}
//			adapter.log.info('PowerDog sensor data: ' + JSON.stringify(obj));
		}
	}); 
	
	// Sends a method call to the XML-RPC server
	client.methodCall('getCounters',['ed2hab'], function(error, obj, reply) {
		// Results of the method response
		if(error) 
		  adapter.log.error('Fehler PowerDog: ' + error);
		else 
		{
			for (let key in obj) {
				// checking if it's nested
				if (key === 'Reply' && obj.hasOwnProperty(key) && (typeof obj[key] === "object")) {
					let objSensor = obj[key];
					for (let keySensor in objSensor) {
						adapter.log.debug(keySensor);
						if (objSensor.hasOwnProperty(keySensor) && (typeof objSensor[keySensor] === "object")) {
							let objSensorInfo = objSensor[keySensor];
							adapter.log.debug(objSensorInfo);
							for (let keyInfo in objSensorInfo) {
								adapter.log.debug(keyInfo + ': ' + objSensorInfo[keyInfo]);
								adapter.setObjectNotExists('Counters.' + keySensor + '.' + keyInfo, {
									type: 'state',
									common: {
										name: keyInfo,
										type: 'state'
									},
									native: {}
								});
								adapter.setState('Counters.' + keySensor + '.' + keyInfo, {val: objSensorInfo[keyInfo], ack: true});
							}
						}
					}
				}
			}
//			adapter.log.info('PowerDog sensor data: ' + JSON.stringify(obj));
		}
	}); 
 
    // in this powerdog all states changes inside the adapters namespace are subscribed
//  adapter.subscribeStates('*');
 
	setTimeout( function () {
		adapter.stop();
	}, 10000);

}
