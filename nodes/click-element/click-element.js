module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function ClickElementNode(config) {
        RED.nodes.createNode(this, config);


        var node = this;

        node.on('input', function (msg) {

            var retry_count = 0;
            var sended = false;


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



            var call = function () {
                if (sended) return;

                node.status({fill: "yellow", shape: "dot", text: 'clicking...'});
                request.post({
                    url: url,
                    json: {}
                }, function (e, r, body) {
                    if (e) {

                        node.error(e, msg);
                        node.send([null, msg]);

                    } else if (r.statusCode !== 200) {
                        // node.error(body.value.message, msg);
                        // node.status({fill: "red", shape: "ring", text: body.value.message});
                        node.warn(body.value.message, msg);
                        node.status({fill: "red", shape: "ring", text: body.value.message});
                        node.send([null, msg]);

                    } else if (body.value !== true) {
                        // node.error(body.value.message, msg);
                        // node.status({fill: "red", shape: "ring", text: body.value.message});

                        node.warn(body.value.message, msg);
                        node.status({fill: "red", shape: "ring", text: body.value.message});
                        node.send([null, msg]);

                    } else {
                        // msg.payload = {};
                        sended = true;
                        node.status({fill: "green", shape: "ring", text: 'Clicked'});
                        node.send([msg]);
                    }
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
