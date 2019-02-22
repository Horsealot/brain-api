const kpiService = require('./kpi.service');

const self = {
    loadModuleStats: (loggedUser, module) => {
        switch (module.type) {
            case 'chart':
                return self.loadChartStats(loggedUser, module);
            case 'goal':
                return self.loadGoalStats(loggedUser, module);
            case 'period':
                return self.loadPeriodStats(loggedUser, module);
        }
    },
    loadChartStats: (loggedUser, module) => {
        let parameters = kpiService.buildParametersForChart();
        return kpiService.getKpi(loggedUser, module.properties.kpi, parameters).then((data) => {
            let stats = [];
            if(data.kpi && data.kpi.stats) {
                stats = data.kpi.stats;
            }
            module.stats = stats;
            return module;
        });
    },
    loadGoalStats: (module) => {

    },
    loadPeriodStats: (module) => {

    }
};

module.exports = self;