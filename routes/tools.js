const auth = require('./tools/auth');

const toolcontroller = require('./../controllers/tool.ctrl');

module.exports = (router) => {

    /**
     * Create a tool category
     */
    router.post('/tools/category', auth.required, auth.loadUser,(req, res, next) => {
        toolcontroller.postCategory(req, res, next);
    });

    /**
     * Update a tools category
     */
    router.post('/tools/category/:id', auth.required, auth.loadUser, (req, res, next) => {
        toolcontroller.updateCategory(req, res, next);
    });

    /**
     * Delete a tools category
     */
    router.delete('/tools/category/:id', auth.required, auth.loadUser, (req, res, next) => {
        toolcontroller.deleteCategory(req, res, next);
    });

    /**
     * Get user tools
     */
    router.get('/tools', auth.required, auth.loadUser, auth.loadSquadId, (req, res, next) => {
        toolcontroller.getTools(req, res, next);
    });

    /**
     * Create a new tool
     */
    router.post('/tools', auth.required, auth.loadUser, (req, res, next) => {
        toolcontroller.postTools(req, res, next);
    });

    /**
     * Update a tool
     */
    router.post('/tools/:id', auth.required, auth.loadUser, (req, res, next) => {
        toolcontroller.updateTools(req, res, next);
    });

    /**
     * Delete a tool
     */
    router.delete('/tools/:id', auth.required, auth.loadUser, (req, res, next) => {
        toolcontroller.deleteTool(req, res, next);
    });
};