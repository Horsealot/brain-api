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
    if(allowedSocialMedias.indexOf(socialMedia) < 0) {
        return true;
    }
    return false;
};

module.exports = {
    SocialMedias,
    validateSocialMedia
}