
'use strict';

/*
 * Created with @iobroker/create-adapter v1.31.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
var xmlrpc = require('xmlrpc');

class PowerDog extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'template',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here    
    	// The adapters config (in the instance object everything under the attribute "native") is accessible via
		this.log.debug('IP-Address of Powerdog: ' + this.config.IpAddress);
		this.log.debug('Port of Powerdog: '    + this.config.Port);
		this.log.debug('API-Key of Powerdog: ' + this.config.ApiKey);
		if(this.config.Answertime < 2)
			this.config.Answertime = 2;
		this.log.debug('Wait for Answer: ' + this.config.Answertime);

		/**
		*
		*      For every state in the system there has to be also an object of type state
		*      Here a simple powerdog for a boolean variable named "testVariable"
		*      Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		// Creates an XML-RPC client. Passes the host information on where to
		// make the XML-RPC calls.
		var client = xmlrpc.createClient({ host: this.config.IpAddress, port: 20000, path: '/'})
							
		// Sends a method call to the XML-RPC server
		client.methodCall('getPowerDogInfo',[this.config.ApiKey], function(error, obj, reply) {
		// Results of the method response
			if(error) 
				this.log.error('Error PowerDog: ' + error);
			else 
			{
				for (let key in obj) {
					// checking if it's nested
					if (key === 'Reply' && obj.hasOwnProperty(key) && (typeof obj[key] === "object")) {
						let objInfo = obj[key];
						for (let keyInfo in objInfo) {
							this.log.debug(keyInfo + ': ' + objInfo[keyInfo]);
							await this.setObjectNotExists('Info.' + keyInfo, {
								type: 'state',
								common: {
									name: keyInfo,
									type: 'state'
								},
								native: {}
							});
							await this.setState('Info.' + keyInfo, {val: objInfo[keyInfo], ack: true});
						}
					}
				}
			}
	//		this.log.debug(JSON.stringify(obj));
		}); 

		// Sends a method call to the XML-RPC server
		client.methodCall('getSensors',[this.config.ApiKey], function(error, obj, reply) {
			// Results of the method response
			if(error) 
			this.log.error('Fehler PowerDog: ' + error);
			else 
			{
				for (let key in obj) {
					// checking if it's nested
					if (key === 'Reply' && obj.hasOwnProperty(key) && (typeof obj[key] === "object")) {
						let objSensor = obj[key];
						for (let keySensor in objSensor) {
							this.log.debug(keySensor);
							if (objSensor.hasOwnProperty(keySensor) && (typeof objSensor[keySensor] === "object")) {
								let objSensorInfo = objSensor[keySensor];
								this.log.debug(objSensorInfo);
								for (let keyInfo in objSensorInfo) {
									this.log.debug(keyInfo + ': ' + objSensorInfo[keyInfo]);
									await this.setObjectNotExists('Sensors.' + keySensor + '.' + keyInfo, {
										type: 'state',
										common: {
											name: keyInfo,
											type: 'state'
										},
										native: {}
									});
									await this.setState('Sensors.' + keySensor + '.' + keyInfo, {val: objSensorInfo[keyInfo], ack: true});
								}
							}
						}
					}
				}
	//			this.log.debug('PowerDog sensor data: ' + JSON.stringify(obj));
			}
		}); 
		
		// Sends a method call to the XML-RPC server
		client.methodCall('getCounters',[this.config.ApiKey], function(error, obj, reply) {
			// Results of the method response
			if(error) 
			this.log.error('Fehler PowerDog: ' + error);
			else 
			{
				for (let key in obj) {
					// checking if it's nested
					if (key === 'Reply' && obj.hasOwnProperty(key) && (typeof obj[key] === "object")) {
						let objSensor = obj[key];
						for (let keySensor in objSensor) {
							this.log.debug(keySensor);
							if (objSensor.hasOwnProperty(keySensor) && (typeof objSensor[keySensor] === "object")) {
								let objSensorInfo = objSensor[keySensor];
								this.log.debug(objSensorInfo);
								for (let keyInfo in objSensorInfo) {
									this.log.debug(keyInfo + ': ' + objSensorInfo[keyInfo]);
									await this.setObjectNotExists('Counters.' + keySensor + '.' + keyInfo, {
										type: 'state',
										common: {
											name: keyInfo,
											type: 'state'
										},
										native: {}
									});
									await this.setState('Counters.' + keySensor + '.' + keyInfo, {val: objSensorInfo[keyInfo], ack: true});
								}
							}
						}
					}
				}
	//			this.log.debug('PowerDog sensor data: ' + JSON.stringify(obj));
			}
		}); 
	
		// in this powerdog all states changes inside the adapters namespace are subscribed
	//  this.subscribeStates('*');
	
		setTimeout( function () {
			this.stop();
		}, this.config.Answertime);
	}
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new PowerDog(options);
} else {
    // otherwise start the instance directly
    new PowerDog();
}