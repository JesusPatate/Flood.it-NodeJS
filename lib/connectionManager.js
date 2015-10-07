'use strict';

var net = require('net');
var winston = require('winston');
var utils = require('./utils');

// Manages network connections
var ConnectionManager = function(host, port) {
    // IP address on which the server listens for incoming connections
    this._host = host;
    // Port on which the server listens for incoming connections
    this._port = port;
    // Server listening for incoming connections
    this._server = null;
    // Open connections to remote peers
    this._connections = {};
    // Callbacks triggered when receiving messages
    this._listeners = {};
};

// Delimiter used to indicate the end of a message
ConnectionManager.MSG_DELIMITER = String.fromCharCode(4);

// Starts server which listens for incoming connections.
// `socketCallbacks` is a literal object whose properties are functions
// and/or arrays of functions that are triggered when socket events
// are fired up. `serverCallbacks` is similar aside from it holds callbacks
// for server events.
ConnectionManager.prototype.start = function(socketCallbacks, serverCallbacks) {
    var self = this;

    this._server = net.createServer(function(socket) {
        winston.log('info', 'New incoming connection');

        var remoteAddress = socket.remoteAddress;
        var remotePort = socket.remotePort;
        var buffer = null;

        setupSocketCallbacks(socket, socketCallbacks, remoteAddress, remotePort);

        socket.on('data', function(data) {
            buffer = utils.consumeStream(data, buffer, ConnectionManager.MSG_DELIMITER,
                function(message) {
                    handleIncomingData(message, self._listeners);
            });
        });

        socket.on('error', function(err) {
            winston.log('info', 'Error with connection to ' +
                remoteAddress + ':' + remotePort + ' : ' + err);
        });

        socket.on('close', function() {
            winston.log('info', 'Connection to ' +
                remoteAddress + ':' + remotePort + ' closed');
        });
    });

    this._server.on('listening', function() {
        winston.log('info', 'Listening for incoming connections on ' +
            self._host + ':' + self._port);
    });

    setupServerCallbacks(this._server, serverCallbacks);

    this._server.listen(this._port, this._host);
};

ConnectionManager.prototype.stop = function(callback) {
    this._server.close(callback);
};

// Establishes a connection with a remote peer at the adress `host`
// and the port `port`. `callbacks` is a literal object whose properties
// are functions and/or arrays of functions that are triggered when socket
// events are fired up.
ConnectionManager.prototype.connect = function(host, port, callbacks) {
    var self = this;
    var socket = this._connections[host + port];

    if (!socket) {
        socket = net.createConnection(port, host);
        this._connections[host + port] = socket;

        socket.on('connect', function() {
            winston.log('info', 'Connected to ' + socket.remoteAddress + ':' +
                socket.remotePort);
        });

        socket.on('data', function(message) {
            handleIncomingData(message, self._listeners);
        });

        socket.on('error', function(err) {
            winston.log('info', 'Error with connection to ' + host + ':' +
                port + ' : ' + err);
        });

        socket.on('close', function() {
            winston.log('info', 'Connection to ' + host + ':' + port + ' closed');
            delete self._connections[host + port];
        });

        setupSocketCallbacks(socket, callbacks, host, port);
    }
};

// Registers a new listener for incoming messages. The callback is triggered
// when a message with the header `header` is received. If `host`
// and `port` are specified, the listener will be attached only
// to the corresponding connection. Otherwise, it is attached to all
// opened connections. A listener registered twice will be triggered twice.
ConnectionManager.prototype.addListener = function(header, callback, host,
    port) {

    var key = host && port ? header + host + port : header;

    if (!this._listeners[key]) {
        this._listeners[key] = [];
    }

    this._listeners[key].push(callback);
};

// Removes a listener for incoming messages whose header is `header`. `callback`
// is the listener's callback to be removed. If the listener is registered for
// a particular connection, `host` and `port` must be specified.
ConnectionManager.prototype.removeListener = function(header, callback, host,
    port) {

    var key = host ? header + host + port : header;

    if (this._listeners[key]) {
        var idx = this._listeners[key].indexOf(callback);

        if (idx > -1) {
            this._listeners[key].splice(idx, 1);
        }

        if(this._listeners[key].length === 0) {
            delete this._listeners[key];
        }
    }
};

// Sends a message on the connection specified by `host` and `port`.
// The callback is triggered when the data are actually written out.
ConnectionManager.prototype.send = function(host, port, header, data, callback) {
    var self = this;
    var connection = this._connections[host + port];

    var message = {header: header, data: data};
    message.host = this._host;
    message.port = this._port;

    if (connection) {
        winston.log('debug', 'Sending message to ' + host + ':' + port + ' : ' +
            JSON.stringify(message));

        connection.write(JSON.stringify(message) +
            ConnectionManager.MSG_DELIMITER, callback);
    } else {
        this.connect(host, port, {
            connect: function() {
                self.send(host, port, header, data, callback);
            }
        });
    }
};

// Returns a literal object containing the IP address and port
// on which the server is (or will be) listening.
ConnectionManager.prototype.getLocalInfo = function() {
    return {host: this._host, port: this._port};
};

// Called when receiving data to notify proper listeners.
// `data` is the received data and `listeners` is a literal object
// whose properties are arrays of functions.
function handleIncomingData(data, listeners) {
    try {
        var message = JSON.parse(data);
        var host = message.host;
        var port = message.port;
        var msgHeader = message.header;
        var msgData = message.data;

        winston.log('debug', 'Received from ' + host + ':' + port + ' : ' +
            JSON.stringify(message));

        triggerListeners(listeners, msgHeader, host, port, msgData);
        triggerListeners(listeners, msgHeader + host + port, host, port,
            msgData);
    } catch (exception) {
            winston.log('warning', 'Failed to read incoming data.' +
                ' Ignoring them.');
    }
}

// Attaches callbacks to events fired up by a server.
function setupServerCallbacks(server, callbacks) {
    if (callbacks) {
        server.on('listening', function() {
            triggerCallbacks(callbacks.listening);
        });

        server.on('connection', function(socket) {
            triggerCallbacks(callbacks.connection, [socket]);
        });

        server.on('close', function() {
            triggerCallbacks(callbacks.close);
        });

        server.on('error', function(error) {
            triggerCallbacks(callbacks.error, [error]);
        });
    }
}

// Attaches callbacks to events fired up by a socket.
// `host` and `port` are those of the remote end of the socket.
function setupSocketCallbacks(socket, callbacks, host, port) {
    if (callbacks) {
        socket.on('lookup', function() {
            triggerCallbacks(callbacks.lookup, [host, port]);
        });

        socket.on('connect', function() {
            triggerCallbacks(callbacks.connect, [host, port]);
        });

        socket.on('data', function(message) {
            triggerCallbacks(callbacks.data, [host, port, message]);
        });

        socket.on('end', function() {
            triggerCallbacks(callbacks.end, [host, port]);
        });

        socket.on('drain', function() {
            triggerCallbacks(callbacks.drain, [host, port]);
        });

        socket.on('error', function(err) {
            triggerCallbacks(callbacks.error, [host, port, err]);
        });

        socket.on('close', function() {
            triggerCallbacks(callbacks.close, [host, port]);
        });
    }
}

// Simply calls a set of callbacks. `callbacks` can be one function or
// an array of functions. `args` is an array of arguments passed to the
// callbacks.
function triggerCallbacks(callbacks, args) {
    if (callbacks) {
        args = args || [];

        if (Array.isArray(callbacks)) {
            for (var i = 0 ; i < callbacks.length ; ++i) {
                callbacks[i].apply(null, args);
            }
        } else {
            callbacks.apply(null, args);
        }
    }
}

// Called to trigger listeners' callbacks when a message is received.
// `listeners` is a literal object whose properties are arrays
// of functions. `host`, `port` and `data` are passed as arguments
// to the callbacks.
function triggerListeners(listeners, key, host, port, data) {
    if (listeners[key]) {
        for (var i = 0 ; i < listeners[key].length ; ++i) {
            listeners[key][i](host, port, data);
        }
    }
}

module.exports = ConnectionManager;