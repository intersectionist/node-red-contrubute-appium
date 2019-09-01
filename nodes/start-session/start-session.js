module.exports = function (RED) {
    "use strict";

    var request = require('request');

    function StartSessionNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var timer;



        node.on('input', function (msg) {

            var sended = false;
            var retry_count = 0;
            var server_address = msg.payload.url || msg.url;

            msg.server_address = server_address;
            var appium_config = msg.payload.appium_config || msg.appium_config;
            node.status({fill: "yellow", shape: "dot", text: 'session create request sending..'});

            config.retry_limit = 1;

            if (typeof config.retry_limit === "undefined" || !config.retry_limit)
                config.retry_limit = 1;

            config.retry_limit = parseInt(config.retry_limit);


            var timerStatus = function () {
                timer = setTimeout(function () {
                    clearTimeout(timer);
                    node.status({});
                }, 1000);
            };


            var url = server_address + '/wd/hub/session';
            var call = function () {

                request.post({
                    url: url,
                    json: appium_config
                }, function (e, r, body) {
                    if (e) {
                        if (retry_count >= config.retry_limit) {
                            node.error(e, msg);
                            node.send([null, msg]);
                            node.status({fill: "red", shape: "dot", text: e});
                        } else {
                            node.status({fill: "orange", shape: "dot", text: 'retrying'});
                            call();
                        }
                    } else if (r.statusCode !== 200) {
                        if (retry_count >= config.retry_limit) {
                            node.warn(body.value.message, msg);
                            node.status({fill: "red", shape: "ring", text: body.value.message});
                            node.send([null, msg]);
                        } else {
                            node.status({fill: "orange", shape: "dot", text: 'retrying'});
                            call();
                        }


                    } else {
                        sended = true;
                        msg.appium_session_id = body.sessionId;
                        msg.server_address = server_address;
                        msg.payload = {
                            appium_session_id: body.sessionId
                        };
                        node.status({fill: "green", shape: "dot", text: 'session created'});
                        node.send(msg);
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


    RED.nodes.registerType("start-session", StartSessionNode);

};
