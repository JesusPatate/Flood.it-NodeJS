'use strict';

var expect = require('chai').expect;
var winston = require('winston');
var View = require('../lib/view');

describe('View', function() {
    var host1 = 'localhost';
    var host2 = '255.255.255.255';
    var port1 = 8080;
    var port2 = 8181;

    describe('#length()', function() {
        it('should reflect the actual length of the view', function() {
            var view = new View();
            expect(view.length()).to.equal(0);

            view = view.push({host: host1, port: port1, age: 0});
            expect(view.length()).to.equal(1);

            view = view.removeHead(1);
            expect(view.length()).to.equal(0);
        });
    });

    describe('#get()', function() {
        it('should return the item at the given index of the view', function() {
            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View([desc1, desc2]);

            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
        });
    });

    describe('#copy()', function() {
        it('should return a shallow copy of the view', function() {
            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View([desc1, desc2]);

            var copy = view.copy();
            copy = copy.removeHead(1);

            expect(view.length()).to.equal(2);
        });
    });

    describe('#push()', function() {
        it('should add the given descriptor to the end of the view',
            function() {

            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View();

            view = view.push(desc1);
            view = view.push(desc2);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
        });

        it('should do nothing if no (or null/undefined) argument is passed',
            function() {

            var view = new View();
            view = view.push();
            view = view.push(null);
            view = view.push(undefined);
            expect(view.length()).to.equal(0);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View([desc1]);

            view.push(desc2);
            expect(view.length()).to.equal(1);
            expect(view.get(0)).to.equal(desc1);
        });
    });

    describe('#pushAll()', function() {
        it('should add the given descriptors to the end of the view',
            function() {

            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View();

            view = view.pushAll([desc1, desc2]);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
        });

        it('should do nothing if no (or null/undefined) argument is passed',
            function() {

            var view = new View();
            view = view.pushAll();
            view = view.pushAll(null);
            view = view.pushAll(undefined);
            expect(view.length()).to.equal(0);
        });

        it('should do nothing if an empty array is passed as argument',
            function() {

            var view = new View();
            view = view.pushAll([]);
            expect(view.length()).to.equal(0);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View([desc1]);

            view.pushAll([desc2]);
            expect(view.length()).to.equal(1);
            expect(view.get(0)).to.equal(desc1);
        });
    });

    describe('#remove()', function() {
        it('should remove the first item of the view when no arguments' +
            ' are passed', function() {

            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View([desc1, desc2]);

            var newView = view.remove();
            expect(newView.length()).to.equal(1);
            expect(newView.get(0)).to.equal(desc2);
        });

        it('should remove from the view the given number of items' +
            ' starting from the given index', function() {

            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var desc3 = {host: host1, port: port2, age: 5};
            var view = new View([desc1, desc2, desc3]);

            var newView = view.remove(2, 1);
            expect(newView.length()).to.equal(1);
            expect(newView.get(0)).to.equal(desc1);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View([desc1, desc2]);

            view.remove(2);
            expect(view.length()).to.equal(2);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
        });
    });

    describe('#permute', function() {
        it('should permute view items randomly', function() {
            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var desc3 = {host: host1, port: port2, age: 5};
            var view = new View([desc1, desc2, desc3]);

            var newView = view.permute();
            expect(newView.length()).to.equal(3);
            expect(newView._descriptors.indexOf(desc1)).to.be.above(-1);
            expect(newView._descriptors.indexOf(desc2)).to.be.above(-1);
            expect(newView._descriptors.indexOf(desc3)).to.be.above(-1);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var desc3 = {host: host1, port: port2, age: 5};
            var view = new View([desc1, desc2, desc3]);

            view.permute();
            expect(view.length()).to.equal(3);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
            expect(view.get(2)).to.equal(desc3);
        });
    });

    describe('#increaseAge()', function() {
        it('should increase the age of all the descriptors by one', function() {
            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View([desc1, desc2]);

            var newView = view.increaseAge();
            expect(newView.length()).to.equal(2);
            expect(newView.get(0).age).to.equal(desc1.age + 1);
            expect(newView.get(1).age).to.equal(desc2.age + 1);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 0};
            var desc2 = {host: host2, port: port2, age: 10};
            var view = new View([desc1, desc2]);

            view.increaseAge();
            expect(view.length()).to.equal(2);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
        });
    });

    describe('#getOldestItem()', function() {
        it('should return the index of the first item of the view' +
            ' with the greatest age', function() {

            var desc1 = {host: host2, port: port2, age: 0};
            var desc2 = {host: host1, port: port1, age: 10};
            var desc3 = {host: host2, port: port1, age: 10};
            var view = new View([desc1, desc2, desc3]);

            expect(view.getOldestItem()).to.equal(1);
        });

        it('should return -1 when the view is empty',
            function() {

            var view = new View();
            expect(view.getOldestItem()).to.equal(-1);
        });
    });

    describe('#moveOldestItems()', function() {
        it('should move the given number of the oldest items to the end' +
            ' of the view', function() {

            var desc1 = {host: host1, port: port1, age: 3};
            var desc2 = {host: host2, port: port1, age: 5};
            var desc3 = {host: host1, port: port2, age: 10};
            var desc4 = {host: host2, port: port2, age: 0};
            var view = new View([desc1, desc2, desc3, desc4]);

            var newView = view.moveOldestItems(2);
            expect(newView.length()).to.equal(4);
            expect(newView.get(0)).to.equal(desc1);
            expect(newView.get(1)).to.equal(desc4);
            expect(newView.get(2)).to.equal(desc2);
            expect(newView.get(3)).to.equal(desc3);
        });

        it('should do nothing if no (or null/undefined) argument is passed',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port2, age: 0};

            var view = new View([desc1, desc2]);
            view = view.moveOldestItems();
            view = view.moveOldestItems(null);
            view = view.moveOldestItems(undefined);

            expect(view.length()).to.equal(2);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port2, age: 0};
            var view = new View([desc1, desc2]);

            view.moveOldestItems(1);
            expect(view.length()).to.equal(2);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
        });
    });

    describe('#removeDuplicates()', function() {
        it('should keep in the view only the freshest of the items' +
            ' that correspond to a same peer', function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host1, port: port1, age: 0};
            var desc3 = {host: host1, port: port2, age: 20};
            var view = new View([desc1, desc2, desc2, desc3]);

            var newView = view.removeDuplicates();
            expect(newView.length()).to.equal(2);
            expect(newView.get(0)).to.equal(desc2);
            expect(newView.get(1)).to.equal(desc3);
        });
        it('should do nothing when the view does not contain duplicates',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 0};
            var desc3 = {host: host1, port: port2, age: 20};
            var view = new View([desc1, desc2, desc3]);

            var newView = view.removeDuplicates();
            expect(newView.length()).to.equal(3);
            expect(newView.get(0)).to.equal(desc1);
            expect(newView.get(1)).to.equal(desc2);
            expect(newView.get(2)).to.equal(desc3);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host1, port: port1, age: 0};
            var desc3 = {host: host1, port: port2, age: 20};
            var view = new View([desc1, desc2, desc3]);

            view.removeDuplicates();
            expect(view.length()).to.equal(3);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
            expect(view.get(2)).to.equal(desc3);
        });
    });

    describe('#removeOldestItems()', function() {
        it('should remove from the view the given number of the oldest items',
            function() {

            var desc1 = {host: host1, port: port1, age: 3};
            var desc2 = {host: host2, port: port1, age: 5};
            var desc3 = {host: host1, port: port2, age: 10};
            var desc4 = {host: host2, port: port2, age: 0};
            var view = new View([desc1, desc2, desc3, desc4]);

            var newView = view.removeOldestItems(2);
            expect(newView.length()).to.equal(2);
            expect(newView.get(0)).to.equal(desc1);
            expect(newView.get(1)).to.equal(desc4);
        });

        it('should remove the first oldest item when several items' +
            ' have the greatest age', function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 5};
            var desc3 = {host: host1, port: port2, age: 10};
            var desc4 = {host: host2, port: port2, age: 0};
            var view = new View([desc1, desc2, desc3, desc4]);

            var newView = view.removeOldestItems(1);
            expect(newView.length()).to.equal(3);
            expect(newView.get(0)).to.equal(desc2);
            expect(newView.get(1)).to.equal(desc3);
            expect(newView.get(2)).to.equal(desc4);
        });

        it('should return an empty view when the given number is greater' +
            ' than the view size (and do not crash)', function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 5};
            var view = new View([desc1, desc2]);

            expect(view.removeOldestItems(34).length()).to.equal(0);
        });

        it('should do nothing if no (or null/undefined) argument is passed',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 0};
            var desc3 = {host: host1, port: port2, age: 20};
            var view = new View([desc1, desc2, desc3]);

            view = view.removeOldestItems();
            view = view.removeOldestItems(null);
            view = view.removeOldestItems(undefined);

            expect(view.length()).to.equal(3);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
            expect(view.get(2)).to.equal(desc3);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 0};
            var desc3 = {host: host1, port: port2, age: 20};
            var view = new View([desc1, desc2, desc3]);

            view.removeOldestItems(2);
            expect(view.length()).to.equal(3);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
            expect(view.get(2)).to.equal(desc3);
        });
    });

    describe('#removeHead()', function() {
        it('should remove the given number of the first items of the view',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 0};
            var desc3 = {host: host1, port: port2, age: 20};
            var view = new View([desc1, desc2, desc3]);

            var newView = view.removeHead(2);
            expect(newView.length()).to.equal(1);
            expect(newView.get(0)).to.equal(desc3);
        });

        it('should return an empty view when the given number is greater' +
            ' than the view size (and do not crash)', function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 5};
            var view = new View([desc1, desc2]);

            expect(view.removeHead(34).length()).to.equal(0);
        });

        it('should do nothing if no (or null/undefined) argument is passed',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 5};
            var view = new View([desc1, desc2]);

            view = view.removeHead();
            view = view.removeHead(null);
            view = view.removeHead(undefined);

            expect(view.length()).to.equal(2);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 0};
            var desc3 = {host: host1, port: port2, age: 20};
            var view = new View([desc1, desc2, desc3]);

            view.removeHead(2);
            expect(view.length()).to.equal(3);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
            expect(view.get(2)).to.equal(desc3);
        });
    });

    describe('#removeAtRandom()', function() {
        it('should remove randomly the given number of items from the view',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 0};
            var desc3 = {host: host1, port: port2, age: 20};
            var view = new View([desc1, desc2, desc3]);

            var newView = view.removeAtRandom(2);
            expect(newView.length()).to.equal(1);
        });

        it('should return an empty view when the given number is greater' +
            ' than the view size (and do not crash)', function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 5};
            var view = new View([desc1, desc2]);

            expect(view.removeAtRandom(34).length()).to.equal(0);
        });

        it('should do nothing if no (or null/undefined) argument is passed',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 5};
            var view = new View([desc1, desc2]);

            view = view.removeAtRandom();
            view = view.removeAtRandom(null);
            view = view.removeAtRandom(undefined);

            expect(view.length()).to.equal(2);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
        });

        it('should not modify the view on which it is called but a copy',
            function() {

            var desc1 = {host: host1, port: port1, age: 10};
            var desc2 = {host: host2, port: port1, age: 0};
            var desc3 = {host: host1, port: port2, age: 20};
            var view = new View([desc1, desc2, desc3]);

            view.removeAtRandom(2);
            expect(view.length()).to.equal(3);
            expect(view.get(0)).to.equal(desc1);
            expect(view.get(1)).to.equal(desc2);
            expect(view.get(2)).to.equal(desc3);
        });
    });
});