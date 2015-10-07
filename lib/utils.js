'use strict';

var MAX_PORT = 65535;

module.exports = {
    // Checks that a string represents a valid IP adress or that it is equal
    // to 'localhost'.
    checkAddress: function(str) {
        var re = new RegExp('^(\\d|[1-9]\\d|1\\d\\d|2([0-4]\\d|5[0-5]))' +
            '\\.(\\d|[1-9]\\d|1\\d\\d|2([0-4]\\d|5[0-5]))' +
            '\\.(\\d|[1-9]\\d|1\\d\\d|2([0-4]\\d|5[0-5]))' +
            '\\.(\\d|[1-9]\\d|1\\d\\d|2([0-4]\\d|5[0-5]))$');

        return (str.toLowerCase() === 'localhost') || re.test(str);
    },
    // Checks that a string represents a valid port number.
    checkPort: function(str) {
        return str.match(/\d*/) && (parseInt(str) > 0) &&
            (parseInt(str) < MAX_PORT);
    },
    // Parses data received from a stream. `data` is a Buffer instance
    // containing the data to be parsed. `buffer` is another Buffer instance
    // that holds  incomplete data which was received previously. `delimiter`
    // is a character that signals the end of a message. `callback` is a function
    // that is called each time a message is parsed successfully.
    consumeStream: function(data, buffer, delimiter, callback) {
        var buff;

        if (buffer) {
            buff = Buffer.concat([buffer, data]);
        } else {
            buff = data;
        }

        var idx = buff.indexOf(delimiter);

        while (idx > -1) {
            var msgBytes = buff.slice(0, idx);
            buff = buff.slice(idx + 1);
            idx = buff.indexOf(delimiter);
            callback(msgBytes.toString());
        }

        return buff;
    },
    swap: function(array, idx1, idx2) {
        array[idx1] = [array[idx2],array[idx2]=array[idx1]][0];
    }
};