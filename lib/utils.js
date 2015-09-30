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
    }
};