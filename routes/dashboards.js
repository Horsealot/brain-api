const auth = require('./tools/auth');

const dashboardcontroller = require('./../controllers/dashboard.ctrl');

module.exports = (router) => {

    /**
     * Create a dashboard
     */
    router.post('/dashboards', auth.required, auth.loadUser,(req, res, next) => {
        dashboardcontroller.postDashboard(req, res, next);
    });

    /**
     * Update a dashboard
     */
    router.post('/dashboards/:id', auth.required, auth.loadUser, (req, res, next) => {
        dashboardcontroller.updateDashboard(req, res, next);
    });

    /**
     * Delete a dashboard
     */
    router.delete('/dashboards/:id', auth.required, auth.loadUser, (req, res, next) => {
        dashboardcontroller.deleteDashboard(req, res, next);
    });

    /**
     * Get all available kpis
     */
    router.get('/dashboards/kpis', auth.required, auth.loadUser, auth.loadSquadId, (req, res, next) => {
        dashboardcontroller.getKpis(req, res, next);
    });

    /**
     * Create kpis
     */
    router.post('/dashboards/kpis', auth.required, auth.loadUser, auth.loadSquadId, (req, res, next) => {
        dashboardcontroller.postKpis(req, res, next);
    });

    /**
     * Update kpis
     */
    router.post('/dashboards/kpis/:id', auth.required, auth.loadUser, auth.loadSquadId, (req, res, next) => {
        dashboardcontroller.updateKpis(req, res, next);
    });

    /**
     * Delete kpis
     */
    router.delete('/dashboards/kpis/:id', auth.required, auth.loadUser, auth.loadSquadId, (req, res, next) => {
        dashboardcontroller.deleteKpis(req, res, next);
    });

    /**
     * Get a dashboard
     */
    router.get('/dashboards/:id', auth.required, auth.loadUser, (req, res, next) => {
        dashboardcontroller.getDashboard(req, res, next);
    });

    /**
     * Get all available dashboards
     */
    router.get('/dashboards', auth.required, auth.loadUser, auth.loadSquadId, (req, res, next) => {
        dashboardcontroller.getDashboards(req, res, next);
    });

};