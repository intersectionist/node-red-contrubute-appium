module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function ScreenShotNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var timer;



        node.on('input', function (msg) {

            var sended = false;
            var appium_session_id = msg.appium_session_id || msg.payload.appium_session_id || null;
            var server_address = msg.server_address || msg.payload.server_address || null;

            msg.server_address = server_address;
            var appium_config = msg.payload.appium_config || msg.appium_config;
            node.status({fill: "yellow", shape: "dot", text: 'session create request sending..'});



            var url = server_address + '/wd/hub/session/' + appium_session_id + '/screenshot';
            var call = function () {

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
                        node.status({fill: "red", shape: "ring", text: body.value.message});
                        node.send([null, msg]);

                    } else {
                        sended = true;
                        msg.appium_session_id = body.sessionId;
                        msg.server_address = server_address;
                        msg.payload = {
                            appium_session_id: body.sessionId
                        };
                        node.status({fill: "green", shape: "dot", text: 'screen shot started'});
                        node.send(msg);
                    }

                });
            };
            call();

        });

        node.on("close", function (done) {
            done()
        });




    }


    RED.nodes.registerType("screen-shot", ScreenShotNode);

};
