const ADMIN = "ADMIN";
const USER = "USER";

const roles = [
    ADMIN,
    USER
];

const superadmins = [
    ADMIN
];

module.exports = {
    cleanRole: function(role) {
        if(roles.indexOf(role) < 0) {
            return USER;
        }
        return role;
    },
    isSuperAdmin: (user) => {
        if(!user || !Array.isArray(user.roles)) return false;
        let isSuperAdmin = false;
        superadmins.forEach(function(role) {
            if(user.roles.indexOf(role) >= 0) isSuperAdmin = true;
        });
        return isSuperAdmin;
    }
};