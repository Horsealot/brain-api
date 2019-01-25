var amqp = require('amqplib/callback_api');
var amqpConn = null;
var config = require('config');

function connectRabbitMq() {
    amqp.connect(config.get('rabbitmq.host') + "?heartbeat=60", function(err, conn) {
        if (err) {
            console.error("[AMQP]", err.message);
            return setTimeout(connectRabbitMq, 1000);
        }
        conn.on("error", function(err) {
            if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error", err.message);
            }
        });
        conn.on("close", function() {
            console.error("[AMQP] reconnecting");
            return setTimeout(connectRabbitMq, 1000);
        });
        console.error("[AMQP] connected");
        amqpConn = conn;
    });
}

module.exports = {
    start: () => {
        connectRabbitMq();
    },
    publish: (queue, content) => {
        amqpConn.createChannel(function(err, ch) {
            ch.assertQueue(queue, {durable: true});
            ch.sendToQueue(queue, Buffer.from(JSON.stringify(content)), {persistent: true});
        });
    }
};