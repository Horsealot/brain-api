const fftService = require("../services/fft.service");
var self = {
    get: async (req, res, next) => {
        fftService.getMedias().then((messages) => {
            res.json({messages});
        }).catch((err) => {
            res.sendStatus(500);
        });
    },
    deleteMessage: async (req, res, next) => {
        const {params: {id}} = req;
        fftService.deleteMedia(id).then(() => {
            res.json({});
        }).catch((err) => {
            res.sendStatus(500);
        });
    },
};

module.exports = self;