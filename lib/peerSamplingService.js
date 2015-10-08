'use strict';

var winston = require('winston');
var View = require('./view');

var P_SELECT_OLDEST = 0.75;
var MAX_VIEW_SIZE = 10;
var HEAL_FACTOR = 2;
var SWAP_FACTOR = 2;
var TICK = 2000;

var REQUEST_HEADER = 'PSS_REQ';
var RESPONSE_HEADER = 'PSS_RES';

var PeerSamplingService = function(connectionManager) {
    // Service that gives access to the network
    this._connectionManager = connectionManager;

    // Each peer maintains a membership table representing
    // its partial knowledge of the network.
    this._view = new View();
};

// Initializes the service : starts active and passive threads
// and optionnally joins a remote peer
PeerSamplingService.prototype.init = function(host, port) {
    this._startPassiveThread();
    this._startActiveThread();

    if (host && port) {
        this._join(host, port);
    }
};

PeerSamplingService.prototype._startPassiveThread = function() {
    var self = this;

    this._connectionManager.addListener(REQUEST_HEADER, function(data, host, port) {
        var localInfo = self._connectionManager.getLocalInfo();
        var buffer = constructBuffer(self._view, localInfo.host,
            localInfo.port, host, port);

        self._connectionManager.send(host, port, RESPONSE_HEADER, {view: buffer});

        var remoteView = data.view;
        var newView = mergeViews(self._view, remoteView);
        self._view = newView.increaseAge();
    });
};

PeerSamplingService.prototype._startActiveThread = function() {
    var self = this;

    setInterval(function() {
        if (self._view.length() > 0) {
            var desc = selectPeer(self._view);
            var localInfo = self._connectionManager.getLocalInfo();
            var buffer = constructBuffer(self._view, localInfo.host,
                localInfo.port, desc.host, desc.port);

            self._connectionManager.send(desc.host, desc.port, REQUEST_HEADER,
                {view: buffer}, function() {

                pullView(self._view, desc.host, desc.port, self._connectionManager);
            });
        }
    }, TICK);
};

PeerSamplingService.prototype._join = function(host, port) {
    var self = this;

    var localInfo = this._connectionManager.getLocalInfo();
    var buffer = constructBuffer(self._view, localInfo.host,
                    localInfo.port, host, port);

    this._connectionManager.send(host, port, REQUEST_HEADER, {view: buffer},
        function() {

        pullView(self._view, host, port, self._connectionManager);
    });
};

// Selects a remote peer with which the local peer will exchange its view
function selectPeer(view) {
    var idx = 0;
    var k = Math.random();

    if (k < P_SELECT_OLDEST) {
        idx = view.getOldestItem();
    }
    else {
        idx = Math.floor(Math.random() * view.length());
    }

    return view.get(idx);
}

function constructBuffer(view, localHost, localPort, peerHost, peerPort) {
    winston.log('debug', 'view: ' + JSON.stringify(view));
    var buffer = [{
        host: localHost,
        port: localPort,
        age: 0
    }];

    var items = getItemsToSend(view, peerHost, peerPort);
    buffer = buffer.concat(items);

    return buffer;
}

function getItemsToSend(view, host, port) {
    var items = [];
    var i = 0;

    var newView = view.permute();
    newView = newView.moveOldestItems(HEAL_FACTOR);

    for (var idx = 0 ; idx < newView.length() && i < (MAX_VIEW_SIZE / 2) -1 ; ++idx) {
        if (newView.get(idx).host !== host || newView.get(idx).port !== port) {
            items.push(newView.get(idx));
            ++i;
        }
    }

    return items;
}

function pullView(view, host, port, connectionManager) {
    var callback = function(data, host, port) {
       connectionManager.removeListener(RESPONSE_HEADER, callback,
            host, port);

        var remoteView = data.view;
        var newView = mergeViews(view, remoteView);
        view = newView.increaseAge();
    };

    connectionManager.addListener(RESPONSE_HEADER, callback, host, port);
}

// Returns a new view in which local and remote views are merged
function mergeViews(localView, remoteView) {
    var newView = localView.copy();
    newView = newView.moveOldestItems(HEAL_FACTOR);
    newView = newView.pushAll(remoteView);
    newView = newView.removeDuplicates();
    newView = newView.removeOldestItems(Math.min(HEAL_FACTOR,
                newView.length() - MAX_VIEW_SIZE));
    newView = newView.removeHead(Math.min(SWAP_FACTOR,
                newView.length() - MAX_VIEW_SIZE));
    newView = newView.removeAtRandom(newView.length() - MAX_VIEW_SIZE);

    return newView;
}

module.exports = PeerSamplingService;