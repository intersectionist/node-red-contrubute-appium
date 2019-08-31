module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function ClickElementNode(config) {
        RED.nodes.createNode(this, config);


        var node = this;
        var timer;
        node.on('input', function (msg) {
            node.status({fill: "yellow", shape: "dot", text: 'clicking...'});
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

            request.post({
                url: url,
                json: {}
            }, function (e, r, body) {
                if (e) {
                    node.error(e, msg);
                    node.status({fill: "red", shape: "ring", text: "e"});
                } else if (r.statusCode !== 200) {
                    // node.error(body.value.message, msg);
                    node.status({fill: "red", shape: "ring", text: body.value.message});
                } else if (body.value !== true) {
                    // node.error(body.value.message, msg);
                    node.status({fill: "red", shape: "ring", text: body.value.message});
                } else {
                    // msg.payload = {};
                    node.status({fill: "green", shape: "ring", text: 'Clicked'});
                    timerStatus();
                    node.send(msg);
                }
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

    RED.nodes.registerType("click-element", ClickElementNode);

};
