module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function StartSessionNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var timer;
        node.on('input', function (msg) {

            var url = msg.payload.url || msg.url;
            var appium_config = msg.payload.appium_config || msg.appium_config;
            node.status({fill: "yellow", shape: "dot", text: 'session create request sending..'});
            request.post({
                url: url,
                json: appium_config
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
