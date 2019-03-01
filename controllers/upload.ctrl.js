const cloudinary = require('cloudinary');
const config = require('config');

cloudinary.config({
    cloud_name: config.get('cloudinary.cloud_name'),
    api_key: config.get('cloudinary.api_key'),
    api_secret: config.get('cloudinary.api_secret')
});

const self = {
    postProfile: (req, res, next) => {
        req.query.options = {
            width: 500,
            height: 500,
        };
        self.postPicture(req, res, next);
    },
    postPicture: (req, res, next) => {
        const path = Object.values(req.files)[0].path;
        const options = req.query;
        cloudinary.v2.uploader.upload(path, {...options, crop: "fill", format: "jpg" })
            .then(image => res.json(image))
            .catch((err) => {
                res.json({err: err})
            })
        ;
    },
};

module.exports = self;