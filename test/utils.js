'use strict';

var expect = require('chai').expect;
var utils = require('../lib/utils');

describe('Utilitary function', function() {
	describe('checkAddress', function() {
		it('should return true when the string is a valid IP address', function() {
			expect(utils.checkAddress('127.0.0.1')).to.be.true;
		});

		it('should return true when the string is \'localhost\'', function() {
			expect(utils.checkAddress('localhost')).to.be.true;
			expect(utils.checkAddress('LocalHost')).to.be.true;
		});

		it('should return false when the string is not a valid IP address nor \'localhost\'', function() {
			expect(utils.checkAddress('123.123.123')).to.be.false;
			expect(utils.checkAddress('123.123.123.a')).to.be.false;
			expect(utils.checkAddress('423.123.123.123')).to.be.false;
			expect(utils.checkAddress('localhostt')).to.be.false;
		});
	});

	describe('checkPort', function() {
		it('should return true when the string is a valid port number', function() {
			expect(utils.checkPort('8080')).to.be.true;
		});

		it('should return false when the string is not a valid port number', function() {
			expect(utils.checkPort('-1')).to.be.false;
			expect(utils.checkPort('1234567890')).to.be.false;
			expect(utils.checkPort('foo')).to.be.false;
		});
	});
});