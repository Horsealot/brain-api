const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema } = mongoose;

const InvitesSchema = new Schema({
    email: String,
    token: String,
    expiredAt: Date
});


InvitesSchema.methods.isExpired = function() {
    return this.expiredAt < new Date();
};

InvitesSchema.pre('save', function(next) {
    if(!this.token) {
        this.token = crypto.randomBytes(16).toString('hex');
    }
    if(!this.expiredAt) {
        // Expired in 24h
        this.expiredAt = new Date(new Date().getTime() + 60 * 60 * 24 * 1000);
    }
    next();
});

mongoose.model('Invites', InvitesSchema);