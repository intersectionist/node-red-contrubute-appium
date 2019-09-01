module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function SearchElementNode(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        var node = this;

        node.on('input', function (msg) {
            var timer;
            var retry_count = 0;

            var appium_session_id = msg.appium_session_id || msg.payload.appium_session_id || null;
            var server_address = msg.server_address || msg.payload.server_address || null;
            var implicit_wait = msg.implicit_wait || msg.payload.implicit_wait || null;

            if (!server_address)
                return node.error('server_address required', msg);

            if (appium_session_id === null) {
                node.error('Session id required', msg);
                return;
            }

            if (typeof config.retry_limit === "undefined" || !config.retry_limit)
                config.retry_limit = 3;


            if (typeof config.implicit_wait === "undefined" || !config.implicit_wait)
                config.implicit_wait = 1000;


            config.retry_limit = parseInt(config.retry_limit);
            config.implicit_wait = parseInt(config.implicit_wait);
            node.status({fill: "yellow", shape: "dot", text: 'Searching...'});


            var url = server_address + '/wd/hub/session/' + appium_session_id + '/timeouts/implicit_wait';
            // node.log('url ' + url, msg);

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
                        if (e) {
                            node.status({fill: "red", shape: "dot", text: e.message});
                            node.error(e.message, msg);
                            node.send([null, msg]);

                            timerStatus();
                        } else if (r.statusCode !== 200) {
                            node.status({fill: "red", shape: "dot", text: body});
                            node.error(body, msg);
                            node.send([null, msg]);

                            timerStatus();
                        } else {
                            // node.warn('Set timeout to ' + config.implicit_wait, msg);
                            cb();
                        }
                    });
                }

            };

            var search = function () {
                node.status({fill: "yellow", shape: "dot", text: 're finding...'});
                msg.payload = {
                    retry_count: retry_count
                };

                var endpoint = '/element';

                if (config.multiple_search) {
                    endpoint = '/elements';
                }

                var url = server_address + '/wd/hub/session/' + appium_session_id + endpoint;
                // node.log('url ' + url, msg);
                request.post({
                    url: url,
                    json: {
                        "using": "-android uiautomator",
                        "value": 'new UiSelector().' + config.selector_type + '("' + config.selector_value + '")'
                    }
                }, function (e, r, body) {
                    if (e) {
                        //node.error(e, msg);
                        retry_count++;
                        msg.payload = {
                            error: e,
                            retry_count: retry_count
                        };

                        node.error(e.message, msg);
                        if (retry_count >= config.retry_limit) {
                            node.status({fill: "red", shape: "dot", text: e.message});
                            node.send([null, msg]);
                        } else {
                            node.status({fill: "orange", shape: "dot", text: 'retrying'});
                            search();
                        }
                    } else if (r.statusCode !== 200) {
                        // node.warn(body.value.message, msg);
                        msg.payload = {
                            error: body.value.message
                        };
                        // node.log('response: ' + body.value.message + ', status_code:' + r.statusCode, msg);
                        retry_count++;
                        if (retry_count >= config.retry_limit) {
                            node.status({fill: "red", shape: "dot", text: body.value.message});
                            node.send([null, msg]);
                        } else {
                            node.status({fill: "orange", shape: "dot", text: 'retrying'});
                            search();
                        }
                    } else if (body.status !== 0) {
                        //  node.warn(body.value.message, msg);
                        msg.payload = {
                            error: body.value.message
                        };

                        retry_count++;
                        if (retry_count >= config.retry_limit) {
                            node.status({fill: "red", shape: "dot", text: body.value.message});
                            node.send([null, msg]);
                        } else {
                            node.status({fill: "orange", shape: "dot", text: 'retrying'});
                            search();
                        }
                    } else {
                        // msg.appium_session_id = body.sessionId;
                        if (typeof body.value !== "object") {
                            retry_count++;
                            if (retry_count >= config.retry_limit) {
                                msg.payload = {
                                    error: body.value
                                };
                                node.status({fill: "red", shape: "dot", text: body});
                                node.send([null, msg]);
                            } else {
                                node.status({fill: "orange", shape: "dot", text: 'retrying'});
                                search();
                            }
                        } else {
                            if (config.multiple_search) {
                                //msg.element_id = body.value.ELEMENT;
                                msg.payload = body.value;
                                node.status({fill: "green", shape: "dot", text: 'Founded!'});
                                node.send([msg]);
                            } else {
                                msg.element_id = body.value.ELEMENT;
                                msg.payload = {
                                    session_id: body.sessionId,
                                    element_id: body.value.ELEMENT,
                                };
                                node.status({fill: "green", shape: "dot", text: 'Founded!'});
                                node.send([msg]);
                            }
                        }


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
