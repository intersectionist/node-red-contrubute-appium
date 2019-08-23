module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function StartSessionNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var timer;
        node.on('input', function (msg) {

            var server_address = msg.server_address || msg.payload.server_address || config.server_address;
            var url = server_address + '/wd/hub/session';

            var platform = msg.platform || msg.payload.platform || config.platform;
            var platform_version = msg.platform_version || msg.payload.platform_version || config.platform_version;
            var device_name = msg.device_name || msg.payload.device_name || config.device_name;
            var app = msg.app || config.app;
            var new_command_timeout = msg.new_command_timeout || msg.payload.new_command_timeout || config.new_command_timeout;

            node.status({fill: "yellow", shape: "dot", text: 'session create request sending..'});
            request.post({
                url: url,
                json: {
                    "desiredCapabilities": {
                        "platformName": platform,
                        "platformVersion": platform_version,
                        "deviceName": device_name,
                        "app": app,
                        "automationName": "UiAutomator2",
                        "newCommandTimeout": new_command_timeout,
                    }
                }
            }, function (e, r, body) {
                if (e) {
                    node.error(e, msg);
                    node.send([null, msg]);
                    node.status({fill: "red", shape: "dot", text: e});
                } else if (r.statusCode !== 200) {
                    node.warn(body.value.message, msg);
                    node.status({fill: "red", shape: "dot", text: body.value.message});
                    node.send([null, msg]);
                } else {
                    msg.appium_session_id = body.sessionId;
                    msg.server_address = server_address;
                    msg.payload = {
                        session_id: body.sessionId
                    };

                    // FOR DEVELOPLEMT
                    // @todo delete it

                    // flow.set("server_address", server_address);
                    // flow.set("appium_session_id", appium_session_id);

                    node.status({fill: "green", shape: "dot", text: 'session created'});
                    node.send(msg);
                }
                timerStatus();
            });
        });

        node.on("close", function (done) {
            done()
        });

        var timerStatus = function () {
            timer = setTimeout(function () {
                clearTimeout(timer);
                node.status({});
            }, 1000);
        };
    }


    RED.nodes.registerType("start-session", StartSessionNode);

};
