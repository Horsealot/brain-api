const axios = require('axios');
const config = require('config');

module.exports = {
    getKpis: async (user) => {
        const instance = axios.create({
            baseURL: config.get('kpi-board.host'),
            timeout: 2000,
            headers: {'Authorization': 'Bearer ' + user.generateMicroserviceJWT()}
        });
        return (await instance.get(config.get('kpi-board.host') + '/kpis')).data.kpis;
    },
    postKpis: async (user, body) => {
        const instance = axios.create({
            baseURL: config.get('kpi-board.host'),
            timeout: 2000,
            headers: {'Authorization': 'Bearer ' + user.generateMicroserviceJWT()}
        });
        return await instance.post('/kpis', body).data;
    },
    updateKpis: async (user, kpiId, body) => {
        const instance = axios.create({
            baseURL: config.get('kpi-board.host'),
            timeout: 2000,
            headers: {'Authorization': 'Bearer ' + user.generateMicroserviceJWT()}
        });
        return await instance.post('/kpis/' + kpiId, body).data;
    },
    deleteKpis: async (user, kpiId) => {
        const instance = axios.create({
            baseURL: config.get('kpi-board.host'),
            timeout: 2000,
            headers: {'Authorization': 'Bearer ' + user.generateMicroserviceJWT()}
        });
        return await instance.delete('/kpis/' + kpiId).data;
    }
}