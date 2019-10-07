module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function StartSessionNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var timer;



        node.on('input', function (msg) {

            var sended = false;
            var server_address = msg.payload.url || msg.url;

            msg.server_address = server_address;
            var appium_config = msg.payload.appium_config || msg.appium_config;
            node.status({fill: "yellow", shape: "dot", text: 'session create request sending..'});


            var url = server_address + '/wd/hub/session';
            var call = function () {

                try {
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
                            node.status({fill: "green", shape: "dot", text: 'session created'});
                            node.send([msg]);
                        }

                    });
                }catch (e) {
                    node.status({fill: "red", shape: "dot", text: e});
                }

            };
            call();

        });

        node.on("close", function (done) {
            done()
        });




    }


    RED.nodes.registerType("start-session", StartSessionNode);

};
