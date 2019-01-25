const producer = require('./index');
const config = require('config');

const queue = config.get('rabbitmq.queue_prefix') + "notifications";

module.exports = {
    signup: (basePath, invite) => {
        producer.publish(queue, {
            type: 'auth',
            payload: {
                type: 'signup_invite',
                email: invite.email,
                token: invite.token,
                basePath: basePath
            }
        });
    },
    passwordResetRequest: (basePath, user, passwordRequest) => {
        producer.publish(queue, {
            type: 'auth',
            payload: {
                type: 'password_reset_request',
                email: user.email,
                token: passwordRequest.token,
                name: `${user.firstname} ${user.lastname}`,
                basePath: basePath
            }
        });
    }
};