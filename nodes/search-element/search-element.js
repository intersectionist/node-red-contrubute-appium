module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function SearchElementNode(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        var node = this;

        node.on('input', function (msg) {
            var timer;

            var appium_session_id = msg.appium_session_id || msg.payload.appium_session_id || null;
            var server_address = msg.server_address || msg.payload.server_address || null;
            var implicit_wait = msg.implicit_wait || msg.payload.implicit_wait || null;

            if (!server_address) {
                node.warn('server_address required', msg);
                return;
            }


            if (appium_session_id === null) {
                node.warn('Session id required', msg);
                return;
            }


            if (typeof config.implicit_wait === "undefined" || !config.implicit_wait)
                config.implicit_wait = 1000;


            config.implicit_wait = parseInt(config.implicit_wait);
            node.status({fill: "yellow", shape: "dot", text: 'Searching...'});

            var url = server_address + '/wd/hub/session/' + appium_session_id + '/timeouts/implicit_wait';

            var timerStatus = function () {
                timer = setTimeout(function () {
                    clearTimeout(timer);
                    node.status({});
                }, 1000);
            };

            var set_implicit_wait = function (cb) {
                if (implicit_wait === config.implicit_wait) {
                    cb();
                } else {
                    request.post({
                        url: url,
                        json: {
                            "ms": config.implicit_wait
                        }
                    }, function (e, r, body) {
                        if (!r.statusCode || r.statusCode !== 200) {
                            node.send([null, msg]);

                            timerStatus();
                        } else {
                            cb();
                        }
                    });
                }
            };

            var search = function () {
                node.status({fill: "yellow", shape: "dot", text: 're finding...'});
                msg.payload = {};

                var endpoint = '/element';

                if (config.multiple_search) {
                    endpoint = '/elements';
                }

                var url = server_address + '/wd/hub/session/' + appium_session_id + endpoint;
                request.post({
                    url: url,
                    json: {
                        "using": "-android uiautomator",
                        "value": 'new UiSelector().' + config.selector_type + '("' + config.selector_value + '")'
                    }
                }, function (e, r, body) {
                    if (r.statusCode !== 200) {

                        if (typeof body.value !== "object") {
                            msg.payload = {
                                error: body.value
                            };
                            node.send([null, msg]);
                        } else {
                            if (config.multiple_search) {
                                msg.payload = body.value;
                                node.send([msg]);
                            } else {
                                msg.element_id = body.value.ELEMENT;
                                msg.payload = {
                                    appium_session_id: body.sessionId,
                                    element_id: body.value.ELEMENT,
                                };
                                node.status({fill: "green", shape: "dot", text: 'Founded!'});
                                node.send([msg]);
                            }
                        }
                    } else {
                        msg.payload = {
                            error: body
                        };
                        node.send([null, msg]);
                    }

                    timerStatus();

                });
            };
            set_implicit_wait(search);

        });

        node.on("close", function (done) {
            done()
        });


    }

    RED.nodes.registerType("search-element", SearchElementNode);

};
