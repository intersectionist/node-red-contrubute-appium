module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function ClickElementNode(config) {
        RED.nodes.createNode(this, config);


        var node = this;

        node.on('input', function (msg) {

            var server_address = msg.server_address || msg.payload.server_address || null;
            if (!server_address) {
                return node.send([null, true]);
            }

            var appium_session_id = msg.appium_session_id || msg.payload.appium_session_id || null;
            if (!appium_session_id) {
                return node.send([null, true]);
            }


            var element_id = msg.element_id || msg.payload.element_id || null;
            if (!element_id) {
                return node.send([null, true]);
            }

            var url = server_address + '/wd/hub/session/' + appium_session_id + '/element/' + element_id + '/click';

            var call = function () {


                console.log(server_address)

                node.status({fill: "yellow", shape: "dot", text: 'clicking...'});
                try {
                    request.post({
                        url: url,
                        json: {}
                    }, function (e, r, body) {


                        console.log('e',e)
                        console.log('r',r)
                        console.log('body',body)

                        if (e) {
                            // node.error(e, msg);
                            node.send([null, msg]);

                        } else if (r.statusCode !== 200) {
                            // node.error(body.value.message, msg);
                            // node.status({fill: "red", shape: "ring", text: body.value.message});
                            // node.warn(body.value.message, msg);
                            // node.status({fill: "red", shape: "ring", text: body.value.message});
                            node.send([null, msg]);

                        } else if (body.value !== true) {
                            // node.error(body.value.message, msg);
                            // node.status({fill: "red", shape: "ring", text: body.value.message});

                            // node.warn(body.value.message, msg);
                            // node.status({fill: "red", shape: "ring", text: body.value.message});
                            node.send([null, msg]);

                        } else {
                            // msg.payload = {};
                            // node.status({fill: "green", shape: "ring", text: 'Clicked'});
                            node.send(msg);
                        }
                    });
                    node.status({fill: "green", shape: "dot", text: 'clicked'});
                } catch (e) {
                    node.status({fill: "yellow", shape: "dot", text: 'error'});
                    node.send([null, e]);
                }
            };
            call();


        });

        node.on("close", function (done) {
            done()
        });


    }

    RED.nodes.registerType("click-element", ClickElementNode);

};
