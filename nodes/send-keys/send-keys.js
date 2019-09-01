module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function SendKeysNode(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);

        var node = this;
        node.on('input', function (msg) {

            var timer;
            var timeout_timer;

            var sended = false;
            var retry_count = 0;

            config.retry_limit = 2;

            if (typeof config.retry_limit === "undefined" || !config.retry_limit)
                config.retry_limit = 3;

            config.retry_limit = parseInt(config.retry_limit);

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
                }, 13 * 1000);
            };

            timeoutTimer(function () {
                if (!sended) {
                    sended = true;
                    node.status({fill: "orange", shape: "dot", text: 'timeout'});
                    timerStatus();
                    node.send([null, msg]);
                }
            });


            var appium_session_id = msg.appium_session_id || msg.payload.appium_session_id || null;
            var elment_id = msg.element_id || msg.payload.element_id || null;
            var server_address = msg.server_address || msg.payload.server_address || null;
            var send_key_value = msg.send_key_value || msg.payload.send_key_value || config.text_value || null;

            if (!server_address)
                return node.error('Session id required', msg);

            if (appium_session_id === null) {
                node.send([null, msg]);
                node.error('Session id required', msg);
                return;
            }
            if (send_key_value === null) {
                node.send([null, msg]);
                node.error('send_key_value required', msg);
                return;
            }
            if (typeof send_key_value !== 'string' || (typeof send_key_value !== 'string' && send_key_value.toString().length === 0)) {
                node.send([null, msg]);
                node.error('send_key_value required', msg);
                return;
            }



            var url = server_address + '/wd/hub/session/' + appium_session_id + '/element/' + elment_id + '/value';

            var call = function () {

                if (sended) return;

                node.status({fill: "yellow", shape: "dot", text: 'sending keys..'});

                request.post({
                    url: url,
                    json: {
                        value: send_key_value.toString().split('')
                    }
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
                        if (retry_count >= config.retry_limit) {
                            node.warn(body.value.message, msg);
                            node.send([null, msg]);
                        } else {
                            node.status({fill: "orange", shape: "dot", text: 'retrying'});
                            call();
                        }

                    } else {
                        sended = true;
                        node.status({fill: "green", shape: "dot", text: 'sended'});
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

    RED.nodes.registerType("send-keys", SendKeysNode);

};
