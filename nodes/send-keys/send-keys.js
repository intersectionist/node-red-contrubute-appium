module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function SendKeysNode(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        var timer;
        var node = this;
        node.on('input', function (msg) {
            node.status({fill: "yellow", shape: "dot", text: 'sending keys..'});
            var appium_session_id = msg.appium_session_id || msg.payload.appium_session_id || null;
            var elment_id = msg.element_id || msg.payload.element_id || null;
            var server_address = msg.server_address || msg.payload.server_address || null;
            var send_key_value = msg.send_key_value || msg.payload.send_key_value || config.text_value || null;

            if (!server_address)
                return node.error('Session id required', msg);

            if (appium_session_id === null) {
                node.error('Session id required', msg);
                return;
            }
            if (body.value === null) {
                node.error('body.value id required', msg);
                return;
            }

            var url = server_address + '/wd/hub/session/' + appium_session_id + '/element/' + elment_id + '/value';

            request.post({
                url: url,
                json: {
                    value: send_key_value.toString().split('')
                }
            }, function (e, r, body) {
                if (e) {
                    node.error(e, msg);
                } else if (r.statusCode !== 200) {
                    node.warn(body.value.message, msg);
                } else {
                    // msg.payload = {};
                    node.status({fill: "green", shape: "dot", text: 'sended'});
                    node.send(msg);
                }
                timerStatus()
            });
        });

        var timerStatus = function () {
            timer = setTimeout(function () {
                clearTimeout(timer);
                node.status({});
            }, 1000);
        };

        node.on("close", function (done) {
            done()
        });
    }

    RED.nodes.registerType("send-keys", SendKeysNode);

};
