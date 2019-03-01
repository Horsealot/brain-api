const axios = require('axios');
const config = require('config');

module.exports = {
    getMedias: async () => {
        const instance = axios.create({
            baseURL: config.get('fft.host'),
            timeout: 2000,
        });
        return (await instance.get('/medias')).data.messages;
    },
    deleteMedia: async (id) => {
        const instance = axios.create({
            baseURL: config.get('fft.host'),
            timeout: 2000,
        });
        return (await instance.delete('/medias/' + id)).data;
    }
}