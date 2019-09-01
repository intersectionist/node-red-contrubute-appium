module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function ClickElementNode(config) {
        RED.nodes.createNode(this, config);


        var node = this;

        node.on('input', function (msg) {

            var retry_count = 0;
            var timer;
            var timeout_timer;
            var sended = false;


            var timerStatus = function () {
                timer = setTimeout(function () {
                    clearTimeout(timer);
                    node.status({});
                }, 1000);
            };

            var timeoutTimer = function (cb) {
                timeout_timer = setTimeout(function () {
                    clearTimeout(timeout_timer);
                    cb();
                }, 10 * 1000);
            };


            var server_address = msg.server_address || msg.payload.server_address || null;
            if (!server_address)
                return node.error('server_address id required', msg);

            var appium_session_id = msg.appium_session_id || msg.payload.appium_session_id || null;
            if (!appium_session_id)
                return node.error('appium_session_id id required', msg);


            var element_id = msg.element_id || msg.payload.element_id || null;
            if (!element_id)
                return node.error('element_id id required', msg);

            var url = server_address + '/wd/hub/session/' + appium_session_id + '/element/' + element_id + '/click';


            config.retry_limit = 2;

            if (typeof config.retry_limit === "undefined" || !config.retry_limit)
                config.retry_limit = 3;

            config.retry_limit = parseInt(config.retry_limit);

            timeoutTimer(function () {
                if (!sended) {
                    sended = true;
                    node.status({fill: "orange", shape: "dot", text: 'timeout'});
                    timerStatus();
                    node.send([null, msg]);
                }
            });

            var call = function () {
                if (sended) return;

                node.status({fill: "yellow", shape: "dot", text: 'clicking...'});
                request.post({
                    url: url,
                    json: {}
                }, function (e, r, body) {
                    if (e) {

                        if (retry_count >= config.retry_limit) {
                            node.error(e, msg);
                            node.send([null, msg]);
                        } else {
                            node.status({fill: "orange", shape: "dot", text: 'retrying'});
                            call();
                        }

                    } else if (r.statusCode !== 200) {
                        // node.error(body.value.message, msg);
                        // node.status({fill: "red", shape: "ring", text: body.value.message});
                        if (retry_count >= config.retry_limit) {
                            node.warn(body.value.message, msg);
                            node.status({fill: "red", shape: "ring", text: body.value.message});
                            node.send([null, msg]);
                        } else {
                            node.status({fill: "orange", shape: "dot", text: 'retrying'});
                            call();
                        }

                    } else if (body.value !== true) {
                        // node.error(body.value.message, msg);
                        // node.status({fill: "red", shape: "ring", text: body.value.message});

                        if (retry_count >= config.retry_limit) {
                            node.warn(body.value.message, msg);
                            node.status({fill: "red", shape: "ring", text: body.value.message});
                            node.send([null, msg]);
                        } else {
                            node.status({fill: "orange", shape: "dot", text: 'retrying'});
                            call();
                        }

                    } else {
                        // msg.payload = {};
                        sended = true;
                        node.status({fill: "green", shape: "ring", text: 'Clicked'});
                        node.send([msg]);
                    }
                    timerStatus();
                });
            };
            call();



        });

        node.on("close", function (done) {
            done()
        });


    }

    RED.nodes.registerType("click-element", ClickElementNode);

};
