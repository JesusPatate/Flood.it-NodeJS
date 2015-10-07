'use strict';

var expect = require('chai').expect;
var net = require('net');
var winston = require('winston');

var ConnectionManager = require('../lib/connectionManager');

winston.level = 'warn';

describe('connectionManager', function() {
    var cb = function() {};
    var host = 'localhost';
    var port = 8080;
    var header1 = 'foo';
    var header2 = 'bar';

    describe('#start', function() {
        var manager = null;

        afterEach(function() {
            manager.stop();
        });

        it('should start a server listening at specified host and port',
            function(done) {

            manager = new ConnectionManager(host, port);
            manager.start();

            var connection = net.createConnection(port, host);

            connection.on('connect', function() {
                connection.end();
                manager.stop(done);
            });
        });

        it('should trigger proper listeners when receiving messages from' +
            ' remote peers', function(done) {

            manager = new ConnectionManager(host, port);
            manager.start();

            manager.addListener(header1, function(data) {
                expect(data).to.equal('data');
                connection.end();
                done();
            });

            var connection = net.createConnection(port, host);

            connection.on('connect', function() {
                connection.write(JSON.stringify({
                    header: header1,
                    data: 'data'
                }) + ConnectionManager.MSG_DELIMITER);
            });
        });
    });

    describe('#connect', function() {
        var server = null;

        afterEach(function() {
            server.close();
        });

        it('should establish a connection with the peer' +
            ' at specified address and port', function(done) {

            var manager = new ConnectionManager();

            server = net.createServer(function(socket) {
                socket.end();
                done();
            });

            server.on('listening', function() {
                manager.connect(host, port);
            });

            server.listen(port, host);
        });

        it('should add the new connection to the list of open connections',
            function(done) {

            var manager = new ConnectionManager();

            server = net.createServer(function(socket) {
                expect(manager._connections).to.have.ownProperty(host + port);
                expect(manager._connections[host + port]).to.not.be.empty;
                expect(manager._connections[host + port]).to.be.an.instanceOf(
                    net.Socket);
                socket.end();
                done();
            });

            server.on('listening', function() {
                manager.connect(host, port);
            });

            server.listen(port, host);
        });

        it('should remove the connection from the list of open connections' +
            ' when it is closed', function(done) {

            var manager = new ConnectionManager();

            server = net.createServer(function(socket) {
                socket.end();
            });

            server.on('listening', function() {
                manager.connect(host, port, {
                    'close' : function() {
                        expect(manager._connections[host + port]).to.not.exist;
                        done();
                    }
                });
            });

            server.listen(port, host);
        });

        it('should trigger callbacks when the corresponding socket event' +
            ' is fired up', function(done) {

            var manager = new ConnectionManager();
            var n = 0;

            server = net.createServer(function(socket) {
                socket.write('test');
                socket.end();
                server.close();
            });

            server.on('listening', function() {
                manager.connect(host, port, {
                    'data' : [
                        function() {
                            ++n;
                        },
                        function() {
                            n *= 2;
                        }
                    ],
                    'close' : function() {
                        ++n;

                        manager.connect(host, port, {
                            'error': function() {
                                ++n;
                                expect(n).to.equal(4);
                                done();
                            }
                        });
                    }
                });
            });

            server.listen(port, host);
        });

        // TODO It should trigger proper listeners when receiving data
    });

    describe('#addListener', function() {
        it('should register the listener for the given message header' +
            ' from all connections when host and port are not specified',
            function() {

            var manager = new ConnectionManager();
            manager.addListener(header1, cb);

            expect(manager._listeners).to.have.ownProperty(header1);
            expect(manager._listeners.foo).to.include(cb);
        });

        it('should register the listener for the given message header ' +
            'from proper connection when host and port are not specified',
            function() {

            var manager = new ConnectionManager();
            manager.addListener(header1, cb, host, port);

            expect(manager._listeners).to.have.ownProperty(header1 + host + port);
            expect(manager._listeners[header1 + host + port]).to.include(cb);
        });
    });

    describe('#removeListener', function() {
        it('should remove the listener for the given message header from' +
            ' all connections when no host and port are specified', function() {

            var manager = new ConnectionManager();
            manager.addListener(header1, cb);
            manager.addListener(header1, cb);

            manager.removeListener(header1, cb);
            expect(manager._listeners.foo).to.have.length(1);

            manager.removeListener(header1, cb);
            expect(manager._listeners.foo).to.not.exist;
        });

        it('should remove the listener for the given message header from' +
            ' proper connection when host and port are specified', function() {

            var manager = new ConnectionManager();
            manager.addListener(header1, cb, host, port);
            manager.addListener(header1, cb, host, port);

            manager.removeListener(header1, cb, host, port);
            expect(manager._listeners).to.have.ownProperty(header1 + host + port);
            expect(manager._listeners[header1 + host + port]).to.have.length(1);

            manager.removeListener(header1, cb, host, port);
            expect(manager._listeners).to.not.have.ownProperty(
                header1 + host + port);
        });

        it('should do nothing when the listener is not registered',
            function() {

            var manager = new ConnectionManager();
            manager.addListener(header1, cb, host, port);
            manager.removeListener(header1, cb);
            manager.removeListener(header1, function() {}, host, port);
            manager.removeListener(header2, cb, host, port);
            expect(manager._listeners).to.have.ownProperty(header1 + host + port);
            expect(manager._listeners[header1 + host + port]).to.have.length(1);
        });
    });
});
