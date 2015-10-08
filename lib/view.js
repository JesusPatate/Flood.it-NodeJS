'use strict';

var winston = require('winston');
var utils = require('./utils');

// An immutable list of peer descriptors.
// `descriptors` is an array of peer descriptors
var View = function(descriptors) {
    this._descriptors = [];

    if (descriptors) {
        this._descriptors = this._descriptors.concat(descriptors);
    }
};

// Returns the number of items in the view
View.prototype.length = function() {
    return this._descriptors.length;
};

// Returns the descriptor at the given index of the view
View.prototype.get = function(index) {
    return this._descriptors[index];
};

// Returns a shallow copy of the view
View.prototype.copy = function() {
    return new View(this._descriptors);
};

// Returns a shallow copy of the view in which `descriptor`
// is inserted at the end
View.prototype.push = function(descriptor) {
    var array = descriptor ? [descriptor] : [];
    return new View(this._descriptors.concat(array));
};

// Returns a shallow copy of the view in which the items of `descriptors`
// have been inserted at the end
View.prototype.pushAll = function(descriptors) {
    descriptors = descriptors || [];
   return new View(this._descriptors.concat(descriptors));
};

// Returns a shallow copy of the view in in which
// `n` consecutive items (default: 1) have been removed starting from
// the given index (default: 0)
View.prototype.remove = function(n, index) {
    n = n || 1;
    index = index || 0;

    var array = [].concat(this._descriptors);
    array.splice(index, n);
    return new View(array);
};

// Returns a shallow copy of the view in which items
// items have been permuted randomly
View.prototype.permute = function() {
     var newView = this.copy();
     var nbSwaps = Math.pow(newView._descriptors.length, 2);
     var i = 0;

     while (i < nbSwaps) {
            var idx1 = Math.floor(Math.random() * newView._descriptors.length);
            var idx2 = Math.floor(Math.random() * newView._descriptors.length);
            utils.swap(newView._descriptors, idx1, idx2);
            ++i;
        }

    return newView;
};

// Returns a shallow copy of the view in which the age of all descriptors
// have been increased by one
View.prototype.increaseAge = function() {
    var array = this._descriptors.map(function(desc) {
        return {host: desc.host, port: desc.port, age: desc.age + 1};
    });

    return new View(array);
};

// Returns the oldest descriptor of the view
View.prototype.getOldestItem = function() {
    var maxAge = 0;
    var maxIdx = -1;

    for (var idx = 0 ; idx < this._descriptors.length ; ++idx) {
        if (this._descriptors[idx].age > maxAge) {
            maxAge = this._descriptors[idx].age;
            maxIdx = idx;
        }
    }

    return maxIdx;
};

// Returns a shallow copy of the view in which the n oldest descriptors
// have been moved at the tail
View.prototype.moveOldestItems = function(n) {
    n = n || 0;
    n = Math.min(n, this.length());

    var newView = this.copy();
    var buffer = [];

    for (var i = 0 ; i < n ; ++i) {
        var idx = newView.getOldestItem();
        buffer.splice(0, 0, newView.get(idx));
        newView = newView.remove(1, idx);
    }

    return newView.pushAll(buffer);
};

// Returns a shallow copy of the view in which duplicates have been removed:
// only the freshest descriptor of each peer is kept
View.prototype.removeDuplicates = function() {
    var freshestItems = {};

    this._descriptors.forEach(function(desc) {
        var key = desc.host + desc.port;
        var minAge = freshestItems.hasOwnProperty(key) ? freshestItems[key] : -1;

        if ((minAge === -1) || (desc.age < minAge)) {
            freshestItems[key] = desc.age;
        }
    });

    var array = this._descriptors.filter(function(desc) {
        var key = desc.host + desc.port;
        return (desc.age === freshestItems[key]) && (delete freshestItems[key]);
    });

    return new View(array);
};

// Returns a shallow copy of the view in which the n oldest descriptors
// have been removed
View.prototype.removeOldestItems = function(n) {
    n = n || 0;
    n = Math.min(n, this.length());

    var newView = this.copy();

    for (var i = 0 ; i < n ; ++i) {
        var idxOldest = newView.getOldestItem();
        newView = newView.remove(1, idxOldest);
    }

    return newView;
};

// Returns a shallow copy of the view in which the n first descriptors
// have been removed
View.prototype.removeHead = function(n) {
    var newView = this.copy();

    if (n > 0) {
        newView = newView.remove(n);
    }

    return newView;
};

// Returns a shallow copy of the view in which the n descriptors
// have been removed randomly
View.prototype.removeAtRandom = function(n) {
    var newView = this.copy();

    n = Math.min(n, newView.length());

    for (var i = 0 ; i < n ; ++i) {
        var idx = Math.floor(Math.random() * newView.length());
        newView = newView.remove(1, idx);
    }

    return newView;
};

module.exports = View;