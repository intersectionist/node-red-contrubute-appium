module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function EndSessionNode(config) {
        RED.nodes.createNode(this, config);


        var node = this;

        node.on('input', function (msg) {
            var timer;
            node.status({fill: "yellow", shape: "dot", text: 'ending...'});
            var server_address = msg.server_address || msg.payload.server_address || null;
            if (!server_address) {
                node.send([null, msg]);
                return node.error('server_address id required', msg);
            }

            var appium_session_id = msg.appium_session_id || msg.payload.appium_session_id || null;
            if (!appium_session_id) {
                node.send([null, msg]);
                return node.error('appium_session_id id required', msg);
            }


            var url = server_address + '/wd/hub/session/' + appium_session_id;

            request.delete({
                url: url
            }, function (e, r, body) {
                node.status({fill: "green", shape: "ring", text: 'Session ended'});
                timerStatus();
                node.send([msg]);
            });

            var timerStatus = function () {
                timer = setTimeout(function () {
                    clearTimeout(timer);
                    node.status({});
                }, 1000);
            };
        });

        node.on("close", function (done) {
            done()
        });


    }

    RED.nodes.registerType("end-session", EndSessionNode);

};
