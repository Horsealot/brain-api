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
const preTest = require('./preTest');

chai.use(chaiHttp);
//Our parent block
describe('Squad', () => {
    beforeEach((done) => { //Before each test we empty the database
        preTest.cleanDB().then(() => {
            done();
        });
    });

    /*
    * Test the /POST squads route
    */
    describe('/POST squads', () => {
        it('should not accept a POST when unauthentified', (done) => {
            chai.request(server)
                .post('/api/squads')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should not accept accept a POST from a non super admin', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                chai.request(server)
                    .post('/api/squads')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            })
        });
        it('should not accept accept a POST with missing data', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User', roles: ['ADMIN']});
            user.save().then((user) => {
                chai.request(server)
                    .post('/api/squads')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    // .send({name: 'New squad'})
                    .end((err, res) => {
                        res.should.have.status(422);
                        done();
                    });
            })
        });
        it('should accept a POST', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User', roles: ['ADMIN']});
            user.save().then((user) => {
                chai.request(server)
                    .post('/api/squads')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {name: 'New squad'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('squad');
                        res.body.squad.should.have.property('id');
                        res.body.squad.should.have.property('name').eql("New squad");
                        res.body.squad.should.have.property('slug').eql("new-squad");
                        done();
                    });
            })
        });
        it('should not accept a POST on an existing squad', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User', roles: ['ADMIN']});
            let squad = new models.Squads({ slug: "new-squad", name: "New squad"});
            user.save().then((user) => {
                return squad.save();
            }).then((squad) => {
                chai.request(server)
                    .post('/api/squads')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {name: 'New squad'}})
                    .end((err, res) => {
                        res.should.have.status(409);
                        done();
                    });
            })
        });
    });

    /*
    * Test the /POST squads/:id route
    */
    describe('/POST squads/:id', () => {
        it('should not accept a POST when unauthentified', (done) => {
            chai.request(server)
                .post('/api/squads/1')
                .send({squad: {}})
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return 404 on an unknown squad', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                chai.request(server)
                    .post('/api/squads/1')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {}})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            })
        });
        it('should not accept from a non squad admin nor superadmin', (done) => {
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/squads/' + squad1.id)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            })
        });
        it('should not accept from a simple squad member', (done) => {
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                return squad1.save();
            }).then((squad1) => {
                user.addSquad(squad1, {through: {role: 'USER'}});
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .post('/api/squads/' + squad1.id)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            })
        });
        it('should not accept from another squad admin', (done) => {
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let squad2 = new models.Squads({
                name: 'squad2',
                slug: 'squad2'
            });
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                return squad1.save();
            }).then((squad1) => {
                return squad2.save();
            }).then((squad2) => {
                user.addSquad(squad2, {through: {role: 'ADMIN'}})
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .post('/api/squads/' + squad1.id)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            })
        });
        it('should accept from a squad admin', (done) => {
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                return squad1.save();
            }).then((squad1) => {
                user.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .post('/api/squads/' + squad1.id)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {name: 'New squad name', asanaProjectId: '1', unauthorizedField: 'bla'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('squad');
                        res.body.squad.should.have.property('name').eql("updated");
                        res.body.squad.should.have.property('asanaProjectId').eql("updated");
                        res.body.squad.should.have.property('unauthorizedField').eql("not allowed");
                        models.Squads.findOne({where: {id: squad1.id}}).then((squad) => {
                            expect(squad).to.be.an('object');
                            expect(squad.name).to.be.eql('New squad name');
                            expect(squad.asanaProjectId).to.be.eql('1');
                            done();
                        });
                    });
            })
        });
        it('should accept from a super admin', (done) => {
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User', roles: ['ADMIN']});
            user.save().then((user) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/squads/' + squad1.id)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {name: 'New squad name', asanaProjectId: '1', unauthorizedField: 'bla'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('squad');
                        res.body.squad.should.have.property('name').eql("updated");
                        res.body.squad.should.have.property('asanaProjectId').eql("updated");
                        res.body.squad.should.have.property('unauthorizedField').eql("not allowed");
                        models.Squads.findOne({where: {id: squad1.id}}).then((squad) => {
                            expect(squad).to.be.an('object');
                            expect(squad.name).to.be.eql('New squad name');
                            expect(squad.asanaProjectId).to.be.eql('1');
                            done();
                        });
                    });
            })
        });
        it('should not update the name if another one is already existing', (done) => {
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let squad2 = new models.Squads({
                name: 'existingSquadName',
                slug: 'existingSquadName'
            });
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                return squad2.save();
            }).then((squad2) => {
                return squad1.save();
            }).then((squad1) => {
                user.addSquad(squad1, {through: {role: 'ADMIN'}})
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .post('/api/squads/' + squad1.id)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {name: 'existingSquadName', asanaProjectId: '1', unauthorizedField: 'bla'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('squad');
                        res.body.squad.should.have.property('name').eql("conflict");
                        res.body.squad.should.have.property('asanaProjectId').eql("updated");
                        res.body.squad.should.have.property('unauthorizedField').eql("not allowed");
                        models.Squads.findOne({where: {id: squad1.id}}).then((squad) => {
                            expect(squad).to.be.an('object');
                            expect(squad.name).to.be.eql('squad1');
                            expect(squad.asanaProjectId).to.be.eql('1');
                            done();
                        });
                    });
            })
        });
        it('should not update asanaProjectId', (done) => {
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1',
                asanaProjectId: 'toto'
            });
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                return squad1.save();
            }).then((squad1) => {
                user.addSquad(squad1, {through: {role: 'ADMIN'}})
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .post('/api/squads/' + squad1.id)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send({squad: {asanaProjectId: '1'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('squad');
                        res.body.squad.should.have.property('asanaProjectId').eql("updated");
                        models.Squads.findOne({where: {id: squad1.id}}).then((squad) => {
                            expect(squad).to.be.an('object');
                            expect(squad.name).to.be.eql('squad1');
                            expect(squad.asanaProjectId).to.be.eql('1');
                            done();
                        });
                    });
            })
        });
    });
});