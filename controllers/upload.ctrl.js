const cloudinary = require('cloudinary');
const config = require('config');

cloudinary.config({
    cloud_name: config.get('cloudinary.cloud_name'),
    api_key: config.get('cloudinary.api_key'),
    api_secret: config.get('cloudinary.api_secret')
})

module.exports = {
    postPicture: (req, res, next) => {
        const path = Object.values(req.files)[0].path;
        cloudinary.v2.uploader.upload(path, {width: 500, height: 500, crop: "fill", format: "jpg" })
            .then(image => res.json(image))
            .catch((err) => {
                res.json({err: err})
            })
        ;
    },
};