//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let expect = chai.expect;
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
let sinon = require('sinon');

const models = require('./../models');

chai.use(chaiHttp);
//Our parent block
describe('Auth', () => {
    beforeEach((done) => { //Before each test we empty the database
        models.PasswordRequests.destroy({where: {}}).then(() => {
            return models.Invites.destroy({where: {}});
        }).then(() => {
            return models.UserSquads.destroy({where: {}});
        }).then(() => {
            return models.Users.destroy({where: {}});
        }).then(() => {
            return models.Squads.destroy({where: {}});
        }).then(() => {
            done();
        })
    });

    /*
    * Test the /GET users route
    */
    describe('/GET users', () => {
        it('should not accept a GET when unauthentified', (done) => {
            chai.request(server)
                .get('/api/users')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should not accept a GET from a user not admin', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                chai.request(server)
                    .get('/api/users')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            })
        });
        it('should accept a GET from an admin', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            let user2 = new models.Users({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            user.setRoles("ADMIN");
            user.save().then((user) => {
                return user2.save();
            }).then(() => {
                chai.request(server)
                    .get('/api/users')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('users');
                        res.body.users.should.be.a('array');
                        res.body.users[0].should.have.property('email').eql(user.email);
                        res.body.users[0].should.have.property('firstname').eql(user.firstname);
                        res.body.users[0].should.have.property('lastname').eql(user.lastname);
                        // res.body.users[0].should.have.property('squads').eql(user.squads);
                        // res.body.users[0].should.have.property('roles').eql(user.roles);
                        res.body.users[0].should.not.have.property('token');
                        // res.body.users[0].should.have.property('id').eql(user.publicId);
                        res.body.users[1].should.have.property('email').eql(user2.email);
                        res.body.users[1].should.have.property('firstname').eql(user2.firstname);
                        res.body.users[1].should.have.property('lastname').eql(user2.lastname);
                        // res.body.users[1].should.have.property('squads').eql(user2.squads);
                        // res.body.users[1].should.have.property('roles').eql(user2.roles);
                        res.body.users[1].should.not.have.property('token');
                        res.body.users[1].should.have.property('id').eql(user2.publicId);
                        done();
                    });
            })
        });
    });

    /*
    * Test the /GET squads route
    */
    describe('/GET squads', () => {
        it('should not accept a GET when unauthentified', (done) => {
            chai.request(server)
                .get('/api/squads')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should accept a GET when authentified', (done) => {
            let user = new models.Users({ email: "test@testuser.com", picture: 'picture1', password: "testpassword", firstname: 'Test', lastname: 'User'});
            let user2 = new models.Users({ email: "test2@testuser.com", picture: 'picture2', password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            const squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            const squad2 = new models.Squads({
                name: 'squad2',
                slug: 'squad2'
            });
            squad1.save().then((squad1) => {
                return squad2.save();
            }).then(() => {
                return user.save();
            }).then(() => {
                return user2.save();
            }).then(() => {
                user.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user.save();
            }).then(() => {
                user2.addSquad(squad2, {through: {role: 'ADMIN'}});
                return user2.save();
            }).then(() => {
                chai.request(server)
                    .get('/api/squads')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('squads');
                        res.body.squads.should.be.a('object');
                        res.body.squads.should.have.property('squad1');
                        res.body.squads.squad1.should.be.a('array');
                        res.body.squads.should.have.property('squad2');
                        res.body.squads.squad2.should.be.a('array');
                        // User 1
                        res.body.squads.squad1[0].should.not.have.property('email');
                        res.body.squads.squad1[0].should.have.property('firstname').eql(user.firstname);
                        res.body.squads.squad1[0].should.have.property('lastname').eql(user.lastname);
                        res.body.squads.squad1[0].should.have.property('picture').eql(user.picture);
                        res.body.squads.squad1[0].should.have.property('squads');
                        res.body.squads.squad1[0].should.not.have.property('roles');
                        res.body.squads.squad1[0].should.not.have.property('token');
                        res.body.squads.squad1[0].should.have.property('id').eql(user.publicId);
                        // User 2
                        res.body.squads.squad2[0].should.not.have.property('email');
                        res.body.squads.squad2[0].should.have.property('firstname').eql(user2.firstname);
                        res.body.squads.squad2[0].should.have.property('lastname').eql(user2.lastname);
                        res.body.squads.squad2[0].should.have.property('picture').eql(user2.picture);
                        res.body.squads.squad2[0].should.have.property('squads');
                        res.body.squads.squad2[0].should.not.have.property('roles');
                        res.body.squads.squad2[0].should.not.have.property('token');
                        res.body.squads.squad2[0].should.have.property('id').eql(user2.publicId);
                        done();
                    });
            })
        });
    });

    /*
    * Test the /GET users route
    */
    describe('/GET user', () => {
        it('should not accept a GET when unauthentified', (done) => {
            chai.request(server)
                .get('/api/users/1')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return 400 on a bad id', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                chai.request(server)
                    .get('/api/users/1')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            })
        });
        it('should return 404 on a not found', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                chai.request(server)
                    .get('/api/users/f421f06e-8af2-4a3b-a64e-01725e46368a')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            })
        });
        it('should return the user', (done) => {
            let user = new models.Users({
                email: "test@testuser.com",
                password: "testpassword",
                firstname: 'Test',
                lastname: 'User',
                picture: 'picture1',
                description: 'description1',
                scorecard: 'scorecard1',
                birthdate: new Date(),
                jobTitle: 'jobTitle1',
                phoneNumber: 'phoneNumber',
                administrativeLink: 'administrativeLink'
            });
            let user2 = new models.Users({
                email: 'test2@testuser.com',
                password: 'testpassword2',
                firstname: 'Test2',
                lastname: 'User2',
                picture: 'picture2',
                description: 'description2',
                scorecard: 'scorecard2',
                birthdate: new Date(),
                jobTitle: 'jobTitle2',
                phoneNumber: 'phoneNumber2',
                administrativeLink: 'administrativeLink2'
            });
            const squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            const squad2 = new models.Squads({
                name: 'squad2',
                slug: 'squad2'
            });
            squad1.save().then((squad1) => {
                return squad2.save();
            }).then(() => {
                return user.save();
            }).then(() => {
                return user2.save();
            }).then(() => {
                user.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user.save();
            }).then(() => {
                user2.addSquad(squad2, {through: {role: 'ADMIN'}});
                return user2.save();
            }).then(() => {
                chai.request(server)
                    .get('/api/users/' + user2.publicId)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('user');
                        res.body.user.should.have.property('createdAt').eql(user2.createdAt.toISOString());
                        res.body.user.should.have.property('firstname').eql(user2.firstname);
                        res.body.user.should.have.property('lastname').eql(user2.lastname);
                        res.body.user.should.have.property('picture').eql(user2.picture);
                        res.body.user.should.have.property('description').eql(user2.description);
                        res.body.user.should.have.property('scorecard').eql(user2.scorecard);
                        res.body.user.should.have.property('birthdate').eql(user2.birthdate);
                        res.body.user.should.have.property('jobTitle').eql(user2.jobTitle);
                        res.body.user.should.have.property('phoneNumber').eql(user2.phoneNumber);
                        res.body.user.should.have.property('squads');
                        res.body.user.should.have.not.property('email');
                        res.body.user.should.have.not.property('roles');
                        res.body.user.should.have.not.property('administrativeLink');
                        res.body.user.should.have.not.property('token');
                        res.body.user.should.have.property('id').eql(user2.publicId);
                        done();
                    });
            })
        });


        it('should return my user with extended parameters', (done) => {
            let user = new models.Users({
                email: "test@testuser.com",
                password: "testpassword",
                firstname: 'Test',
                lastname: 'User',
                picture: 'picture1',
                description: 'description1',
                scorecard: 'scorecard1',
                birthdate: new Date(),
                jobTitle: 'jobTitle1',
                phoneNumber: 'phoneNumber',
                administrativeLink: 'administrativeLink'
            });
            let user2 = new models.Users({
                email: 'test2@testuser.com',
                password: 'testpassword2',
                firstname: 'Test2',
                lastname: 'User2',
                picture: 'picture2',
                description: 'description2',
                scorecard: 'scorecard2',
                birthdate: new Date(),
                jobTitle: 'jobTitle2',
                phoneNumber: 'phoneNumber2',
                administrativeLink: 'administrativeLink2'
            });
            const squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            const squad2 = new models.Squads({
                name: 'squad2',
                slug: 'squad2'
            });
            squad1.save().then((squad1) => {
                return squad2.save();
            }).then(() => {
                return user.save();
            }).then(() => {
                return user2.save();
            }).then(() => {
                user.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user.save();
            }).then(() => {
                user2.addSquad(squad2, {through: {role: 'ADMIN'}});
                return user2.save();
            }).then(() => {
                chai.request(server)
                    .get('/api/users/' + user2.publicId)
                    .set('Authorization', 'Bearer ' + user2.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('user');
                        res.body.user.should.have.property('createdAt').eql(user2.createdAt.toISOString());
                        res.body.user.should.have.property('firstname').eql(user2.firstname);
                        res.body.user.should.have.property('lastname').eql(user2.lastname);
                        res.body.user.should.have.property('picture').eql(user2.picture);
                        res.body.user.should.have.property('description').eql(user2.description);
                        res.body.user.should.have.property('scorecard').eql(user2.scorecard);
                        res.body.user.should.have.property('birthdate').eql(user2.birthdate);
                        res.body.user.should.have.property('jobTitle').eql(user2.jobTitle);
                        res.body.user.should.have.property('phoneNumber').eql(user2.phoneNumber);
                        res.body.user.should.have.property('squads');
                        res.body.user.should.have.property('email');
                        res.body.user.should.have.property('roles');
                        res.body.user.should.have.property('administrativeLink');
                        res.body.user.should.have.not.property('token');
                        res.body.user.should.have.property('id').eql(user2.publicId);
                        done();
                    });
            })
        });
    });

    /*
    * Test the /POST user route
    */
    describe('/POST user', () => {
        it('should not accept a POST when unauthentified', (done) => {
            chai.request(server)
                .post('/api/users/1')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return 400 on a bad id', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                chai.request(server)
                    .post('/api/users/1')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            })
        });
        it('should return 404 on a not found', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                let body = {
                    user: {
                        firstname: 'fn',
                        lastname: 'ln'
                    }
                };
                chai.request(server)
                    .post('/api/users/f421f06e-8af2-4a3b-a64e-01725e46368a')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            })
        });
        it('should update when the request come from a user', (done) => {
            let user = new models.Users({
                email: "test@testuser.com",
                password: "testpassword",
                firstname: 'Test',
                lastname: 'User',
                picture: 'picture',
                description: 'description',
                jobTitle: 'jobTitle',
                scorecard: 'scorecard',
                roles: ['USER'],
            });
            const squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            const squad2 = new models.Squads({
                name: 'squad2',
                slug: 'squad2'
            });
            squad1.save().then(() => {
                return user.save();
            }).then(() => {
                return squad2.save();
            }).then(() => {
                user.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user.save();
            }).then((user) => {
                let body = {
                    user: {
                        firstname: 'newfirstname',
                        lastname: 'newlastname',
                        picture: 'newPicture',
                        description: 'newDescription',
                        jobTitle: 'newJobTitle',
                        scorecard: 'newScorecard',
                        roles: ['USER', 'ADMIN', 'OTHER'],
                        squads: [{name: 'squad1', role: 'USER'}, {name: 'squad2', role: 'USER'}],
                    }
                };
                chai.request(server)
                    .post('/api/users/' + user.publicId)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('user');
                        res.body.user.should.have.property('firstname').eql("updated");
                        res.body.user.should.have.property('lastname').eql("updated");
                        res.body.user.should.have.property('picture').eql("updated");
                        res.body.user.should.have.property('description').eql("updated");
                        res.body.user.should.have.property('jobTitle').eql("not allowed");
                        res.body.user.should.have.property('scorecard').eql("not allowed");
                        res.body.user.should.have.property('roles').eql("not allowed");
                        res.body.user.should.have.property('squads').eql("not allowed");
                        res.body.user.should.have.not.property('token');
                        res.body.user.should.have.not.property('email');

                        models.Users.findOne({where: {id: user.id}, include: ['squads']}).then((user) => {
                            user = user.toAdminJSON();
                            user.should.be.a('object');
                            user.should.have.property('firstname').eql("newfirstname");
                            user.should.have.property('lastname').eql("newlastname");
                            user.should.have.property('picture').eql("newPicture");
                            user.should.have.property('description').eql("newDescription");
                            user.should.have.property('jobTitle').eql("jobTitle");
                            user.should.have.property('scorecard').eql("scorecard");
                            user.should.have.property('roles').that.includes("USER");
                            user.should.have.property('roles').that.not.includes("ADMIN");
                            user.should.have.property('roles').that.not.includes("OTHER");
                            user.should.have.property('squads');
                            user.squads[0].should.be.eql({ name: 'squad1', role: 'ADMIN' });
                            // user.should.have.property('roles').that.not.includes("SQUAD2");
                            done();
                        });
                    });
            });
        });
        it('should update when the request come from an admin', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User', roles: ["ADMIN"]});
            let user2 = new models.Users({
                email: "test2@testuser.com",
                password: "testpassword2",
                firstname: 'Test2',
                lastname: 'User2',
                picture: 'picture2',
                description: 'description2',
                jobTitle: 'jobTitle2',
                scorecard: 'scorecard2',
                roles: ['USER'],
            });
            const squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            const squad2 = new models.Squads({
                name: 'squad2',
                slug: 'squad2'
            });
            const squad3 = new models.Squads({
                name: 'squad3',
                slug: 'squad3'
            });
            squad1.save().then(() => {
                return user.save();
            }).then(() => {
                return user2.save();
            }).then(() => {
                return squad2.save();
            }).then(() => {
                return squad3.save();
            }).then(() => {
                user2.addSquad(squad1, {through: {role: 'ADMIN'}});
                user2.addSquad(squad3, {through: {role: 'USER'}});
                return user2.save();
            }).then((user2) => {
                let body = {
                    user: {
                        firstname: 'newfirstname',
                        lastname: 'newlastname',
                        picture: 'newPicture',
                        description: 'newDescription',
                        jobTitle: 'newJobTitle',
                        scorecard: 'newScorecard',
                        roles: ['USER', 'ADMIN', 'OTHER'],
                        squads: [{name: 'squad1', role: 'USER'}, {name: 'squad2', role: 'USER'}],
                    }
                };
                chai.request(server)
                    .post('/api/users/' + user2.publicId)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('user');
                        res.body.user.should.have.property('firstname').eql("not allowed");
                        res.body.user.should.have.property('lastname').eql("not allowed");
                        res.body.user.should.have.property('picture').eql("not allowed");
                        res.body.user.should.have.property('description').eql("not allowed");
                        res.body.user.should.have.property('jobTitle').eql("updated");
                        res.body.user.should.have.property('scorecard').eql("updated");
                        res.body.user.should.have.property('roles').eql("updated");
                        res.body.user.should.have.property('squads').eql("updated");
                        res.body.user.should.have.not.property('token');
                        res.body.user.should.have.not.property('email');

                        models.Users.findOne({where: {id: user2.id}, include: ['squads']}).then((user) => {
                            user = user.toAdminJSON();
                            user.should.be.a('object');
                            user.should.have.property('firstname').eql("Test2");
                            user.should.have.property('lastname').eql("User2");
                            user.should.have.property('picture').eql("picture2");
                            user.should.have.property('description').eql("description2");
                            user.should.have.property('jobTitle').eql("newJobTitle");
                            user.should.have.property('scorecard').eql("newScorecard");
                            user.should.have.property('roles').that.includes("USER");
                            user.should.have.property('roles').that.includes("ADMIN");
                            user.should.have.property('roles').that.not.includes("OTHER");
                            user.should.have.property('squads');
                            user.squads[0].should.be.eql({ name: 'squad1', role: 'USER' });
                            user.squads[1].should.be.eql({ name: 'squad2', role: 'USER' });
                            done();
                        });
                    });
            })
        });
    });
});