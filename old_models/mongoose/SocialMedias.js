const mongoose = require('mongoose');

const { Schema } = mongoose;

const allowedSocialMedias = [
    'facebook',
    'twitter',
    'instagram',
    'linkedin',
    'website'
];

const SocialMedias = new Schema({
    social: String,
    link: String
});

const validateSocialMedia = function(socialMedia) {
    return allowedSocialMedias.indexOf(socialMedia) < 0;

};

module.exports = {
    SocialMedias,
    validateSocialMedia
};