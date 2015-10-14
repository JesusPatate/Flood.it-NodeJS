'use strict';

var winston = require('winston');
var commandLine = require('commander');

var ConnectionManager = require('./connectionManager');
var PeerSamplingService = require('./peerSamplingService');
var utils = require('./utils');

winston.level = 'info';

var localAddress = null;
var localPort = null;

commandLine.version('0.0.1')
    .description('Launches a Flood.it local peer. It listens' +
        ' for incoming connections on the IP address <local_address>' +
        ' and the port <local_port>.');

commandLine.arguments('<local_address> <local_port>')
    .action(function(local_address, local_port) {
        if (!utils.checkAddress(local_address)) {
            winston.log('error', 'Wrong local IP address.');
            process.exit(1);
        }

        if (!utils.checkPort(local_port)) {
            winston.log('error', 'Wrong local port number.');
            process.exit(1);
        }

        localAddress = local_address;
        localPort = local_port;
    });

commandLine.option('-a, --remoteAddress <address>',
        'IP address at which a remote peer must be joined')
    .option('-p, --remotePort <port> ',
        'port at which a remote peer must be joined' +
        ' - must be an integer');

commandLine.parse(process.argv);

if (!localAddress || !localPort) {
    winston.log('error', 'Local address and port are required.' +
        ' Use the option -h to display help section.');
    process.exit(1);
}

if (commandLine.remoteAddress) {
    if (commandLine.remotePort) {
        if (!utils.checkAddress(commandLine.remoteAddress)) {
            winston.log('error', 'Wrong remote IP address.');
            process.exit(1);
        }
        if (!utils.checkPort(commandLine.remotePort)) {
            winston.log('error', 'Wrong remote port number.');
            process.exit(1);
        }
    } else {
        winston.log('error', 'Remote address and port number must be specified',
            ' both.');
        process.exit(1);
    }
}

var connectionManager = new ConnectionManager(localAddress, localPort);
connectionManager.start();

var peerSamplingService = new PeerSamplingService(connectionManager);
peerSamplingService.init(commandLine.remoteAddress, commandLine.remotePort);