var assert = require('assert');
var after = require('after');

var auth = require('./auth');
var Zuul = require('../');
var scout_browser = require('../lib/scout_browser');

test('mocha-bdd - phantom', function(done) {
    done = after(3, done);

    var config = {
        ui: 'mocha-bdd',
        prj_dir: __dirname + '/mocha-bdd',
        phantom: true,
        concurrency: 1,
        files: [__dirname + '/mocha-bdd/test.js']
    };

    var zuul = Zuul(config);

    // each browser we test will emit as a browser
    zuul.on('browser', function(browser) {
        browser.on('init', function() {
            done();
        });

        browser.on('done', function(results) {
            assert.equal(results.passed, 1);
            assert.equal(results.failed, 1);
            done();
        });
    });

    zuul.run(function(passed) {
        assert.ok(!passed);
        done();
    });
});

test('jasmine - phantom', function(done) {
    done = after(3, done);

    var config = {
        ui: 'jasmine',
        prj_dir: __dirname + '/jasmine',
        phantom: true,
        concurrency: 1,
        files: [__dirname + '/jasmine/test.js']
    };

    var zuul = Zuul(config);

    // each browser we test will emit as a browser
    zuul.on('browser', function(browser) {
        browser.on('init', function() {
            done();
        });

        browser.on('done', function(results) {
            assert.equal(results.passed, 1);
            assert.equal(results.failed, 1);
            done();
        });
    });

    zuul.run(function(passed) {
        assert.ok(!passed);
        done();
    });
});

test('mocha-qunit - phantom', function(done) {
    done = after(3, done);

    var config = {
        ui: 'mocha-qunit',
        prj_dir: __dirname + '/mocha-qunit',
        phantom: true,
        concurrency: 1,
        files: [__dirname + '/mocha-qunit/test.js']
    };
    var zuul = Zuul(config);

    zuul.on('browser', function(browser) {
        browser.once('start', function(reporter) {
            reporter.once('done', function(results) {
                assert.equal(results.passed, false);
                assert.equal(results.stats.passed, 1);
                assert.equal(results.stats.failed, 1);
                done();
            });
        });

        browser.on('done', function(results) {
            assert.equal(results.passed, 1);
            assert.equal(results.failed, 1);
            done();
        });
    });

    zuul.run(function(passed) {
        assert.ok(!passed);
        done();
    });
});

test('mocha-qunit - sauce', function(done) {
    var config = {
        ui: 'mocha-qunit',
        prj_dir: __dirname + '/mocha-qunit',
        files: [__dirname + '/mocha-qunit/test.js'],
        username: auth.username,
        concurrency: 1,
        key: auth.key
    };

    var zuul = Zuul(config);

    scout_browser(function(err, browsers) {
        assert.ifError(err);

        var total = 0;
        Object.keys(browsers).forEach(function(key) {
            var list = browsers[key];
            if (list.length === 1) {
                total++;
                return zuul.browser(list);
            }

            list.sort(function(a, b) {
                return a.version - b.version;
            });

            // test latest and oldest
            total += 2;
            zuul.browser(list.shift());
            zuul.browser(list.pop());
        });

        // N times per browser and once for all done
        done = after(total * 2 + 1, done);

        // each browser we test will emit as a browser
        zuul.on('browser', function(browser) {
            browser.on('init', function() {
                done();
            });

            browser.on('done', function(results) {
                assert.equal(results.passed, 1);
                assert.equal(results.failed, 1);
                done();
            });
        });

        zuul.on('error', function(err) {
            done(err);
        });

        zuul.run(function(passed) {
            assert.ok(!passed);
            done();
        });
    });
});

test('tape - phantom', function(done) {
    done = after(3, done);
    var consoleOutput = [];

    var config = {
        ui: 'tape',
        prj_dir: __dirname + '/tape',
        phantom: true,
        concurrency: 1,
        files: [__dirname + '/tape/test.js']
    };

    var zuul = Zuul(config);

    // each browser we test will emit as a browser
    zuul.on('browser', function(browser) {
        browser.on('start', function(reporter) {
            reporter.on('console', function(msg) {
                consoleOutput.push(msg.args);
            });
        });

        browser.on('init', function() {
            done();
        });

        browser.on('done', function(results) {
            var endOfOutput = consoleOutput.slice(-5);

            // check that we did output untill the end of the test suite
            // this is the number of asserts in tape
            assert.deepEqual(endOfOutput[0], ['1..9']);
            assert.deepEqual(endOfOutput[1], ['# tests 9']);
            assert.deepEqual(endOfOutput[2], ['# pass  5']);
            assert.deepEqual(endOfOutput[3], ['# fail  4']);
            assert.deepEqual(endOfOutput[4], ['']);

            // this is the number of passed/failed test() in tape
            assert.equal(results.passed, 3);
            assert.equal(results.failed, 3);
            done();
        });
    });

    zuul.run(function(passed) {
        assert.ok(!passed);
        done();
    });
});

test('capabilities config', function(done) {
    var config = {
        ui: 'mocha-bdd',
        capabilities: {
            public: 'private'
        }
    };

    var zuul = Zuul(config);

    zuul.browser({
        name: 'chrome',
        version: 'latest',
        platform: 'osx'
    });

    var browser = zuul._browsers[0];

    browser.on('init', function(config){
        assert.ok(config.capabilities);
        assert.equal(config.capabilities.public, 'private');
        done();
    });

    browser.start();
});
