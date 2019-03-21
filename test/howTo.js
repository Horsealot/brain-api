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
describe('How To', () => {
    beforeEach((done) => { //Before each test we empty the database
        preTest.cleanDB().then(() => {
            done();
        });
    });

    /*
    * Test the /POST How To route
    */
    describe('/POST How to', () => {
        it('should not accept a POST when unauthentified', (done) => {
            chai.request(server)
                .post('/api/how-to')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should not accept a POST with a squadId for a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST with a squadId for a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a POST with a squadId for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('howTo');
                        res.body.howTo.should.be.a('object');
                        res.body.howTo.should.have.property('content').eql('<div>My best article</div>');
                        models.HowTos.findOne({where: {SquadId: squad1.id}}).then((howTo) => {
                            expect(howTo).to.be.an('object');
                            expect(howTo).to.have.property('content').eql('<div>My best article</div>');
                            expect(howTo).to.have.property('author').eql(user1.id);
                            expect(howTo).to.have.property('version').eql(1);
                            done();
                        });
                    });
            });
        });
        it('should accept a POST with a squadId for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('howTo');
                        res.body.howTo.should.be.a('object');
                        res.body.howTo.should.have.property('content').eql('<div>My best article</div>');
                        models.HowTos.findOne({where: {SquadId: squad1.id}}).then((howTo) => {
                            expect(howTo).to.be.an('object');
                            expect(howTo).to.have.property('content').eql('<div>My best article</div>');
                            expect(howTo).to.have.property('author').eql(user1.id);
                            expect(howTo).to.have.property('version').eql(1);
                            done();
                        });
                    });
            });
        });

        it('should return 404 for an unknown squad', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>', squadId: 1}})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });

        it('should not accept a POST on Brain how to for a non super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST on Brain how to for a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST on Brain how to for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a POST on Brain how to for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('howTo');
                        res.body.howTo.should.be.a('object');
                        res.body.howTo.should.have.property('content').eql('<div>My best article</div>');
                        models.HowTos.findOne({where: {SquadId: null}}).then((howTo) => {
                            expect(howTo).to.be.an('object');
                            expect(howTo).to.have.property('content').eql('<div>My best article</div>');
                            expect(howTo).to.have.property('author').eql(user1.id);
                            expect(howTo).to.have.property('version').eql(1);
                            done();
                        });
                    });
            });
        });

        it('should not accept an update with a squadId for a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                howTo.SquadId = squad1.id;
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept an update with a squadId for a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                howTo.SquadId = squad1.id;
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept an update with a squadId for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                howTo.SquadId = squad1.id;
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('howTo');
                        res.body.howTo.should.be.a('object');
                        res.body.howTo.should.have.property('content').eql('<div>My best article</div>');
                        models.HowTos.findOne({where: {SquadId: squad1.id}, order: [['version', 'DESC']]}).then((howTo) => {
                            expect(howTo).to.be.an('object');
                            expect(howTo).to.have.property('content').eql('<div>My best article</div>');
                            expect(howTo).to.have.property('author').eql(user1.id);
                            expect(howTo).to.have.property('version').eql(2);
                            done();
                        });
                    });
            });
        });
        it('should accept an update with a squadId for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                howTo.SquadId = squad1.id;
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('howTo');
                        res.body.howTo.should.be.a('object');
                        res.body.howTo.should.have.property('content').eql('<div>My best article</div>');
                        models.HowTos.findOne({where: {SquadId: squad1.id}, order: [['version', 'DESC']]}).then((howTo) => {
                            expect(howTo).to.be.an('object');
                            expect(howTo).to.have.property('content').eql('<div>My best article</div>');
                            expect(howTo).to.have.property('author').eql(user1.id);
                            expect(howTo).to.have.property('version').eql(2);
                            done();
                        });
                    });
            });
        });

        it('should not accept an update on Brain how to for a non super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept an update on Brain how to for a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept an update on Brain how to for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept an update on Brain how to for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .post('/api/how-to')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({howTo: {content: '<div>My best article</div>'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('howTo');
                        res.body.howTo.should.be.a('object');
                        res.body.howTo.should.have.property('content').eql('<div>My best article</div>');
                        models.HowTos.findOne({where: {SquadId: null}, order: [['version', 'DESC']]}).then((howTo) => {
                            expect(howTo).to.be.an('object');
                            expect(howTo).to.have.property('content').eql('<div>My best article</div>');
                            expect(howTo).to.have.property('author').eql(user1.id);
                            done();
                        });
                    });
            });
        });
    });

    /*
    * Test the /DELETE How to/:id route
    */
    describe('/DELETE How to/:id', () => {

        it('should return 404 for an unknown how to', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .delete('/api/how-to/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should not accept a DELETE on a tool belonging to a squad from a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                howTo.SquadId = squad1.id;
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .delete('/api/how-to/' + howTo.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a DELETE on a how to linked to a squad from a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                howTo.SquadId = squad1.id;
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .delete('/api/how-to/' + howTo.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.HowTos.findOne({where: {id: howTo.id}}).then((howTo) => {
                            expect(howTo).to.be.null;
                            done();
                        });
                    });
            });
        });
        it('should not accept a DELETE on a how to linked to a squad from a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                howTo.SquadId = squad1.id;
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .delete('/api/how-to/' + howTo.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a DELETE on a how to linked to a squad from a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                howTo.SquadId = squad1.id;
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .delete('/api/how-to/' + howTo.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.HowTos.findOne({where: {id: howTo.id}}).then((howTo) => {
                            expect(howTo).to.be.null;
                            done();
                        });
                    });
            });
        });


        it('should not accept a DELETE on the Brain How To from a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .delete('/api/how-to/' + howTo.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a DELETE on the Brain How To from a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .delete('/api/how-to/' + howTo.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a DELETE on the Brain How To from a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .delete('/api/how-to/' + howTo.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a DELETE on the Brain How To from a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let howTo = new models.HowTos({content: '<div>My new article</div>', version: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                return howTo.save();
            }).then((howTo) => {
                chai.request(server)
                    .delete('/api/how-to/' + howTo.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.HowTos.findOne({where: {id: howTo.id}}).then((howTo) => {
                            expect(howTo).to.be.null;
                            done();
                        });
                    });
            });
        });
    });


    /*
    * Test the /GET How to route
    */
    describe('/GET How to', () => {
        it('should not accept a GET when unauthentified', (done) => {
            chai.request(server)
                .get('/api/how-to')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should not accept a GET without a squad', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User', roles: ['ADMIN']});
            user.save().then((user) => {
                chai.request(server)
                    .get('/api/how-to')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            })
        });
        it('should not accept a GET on a squad if the user is not a member of it', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
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
            }).then((squad2) => {
                return user.save();
            }).then(() => {
                user.addSquad(squad1, {through: {role: 'USER'}});
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .get('/api/how-to')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .set('Brain-squad', squad2.id)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            })
        });
        it('should accept a GET from a squad member and return brain how to and squad how to', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            const squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            const squad2 = new models.Squads({
                name: 'squad2',
                slug: 'squad2'
            });
            let veryOldBrainHowTo = new models.HowTos({content: '<div>My very old brain how to</div>', version: 1});
            let oldbrainHowTo = new models.HowTos({content: '<div>My old brain how to</div>', version: 3});
            let brainHowTo = new models.HowTos({content: '<div>My brain how to</div>', version: 10});
            let veryOldHowTo = new models.HowTos({content: '<div>My very old squad how to</div>', version: 1});
            let oldHowTo = new models.HowTos({content: '<div>My old squad how to</div>', version: 9});
            let howTo = new models.HowTos({content: '<div>My squad how to</div>', version: 25});
            let otherSquadHowTo = new models.HowTos({content: '<div>My other squad how to</div>', version: 1});
            squad1.save().then((squad1) => {
                return squad2.save();
            }).then((squad2) => {
                return user.save();
            }).then(() => {
                user.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user.save();
            }).then(() => {
                return oldbrainHowTo.save();
            }).then((oldbrainHowTo) => {
                return brainHowTo.save();
            }).then((brainHowTo) => {
                return veryOldBrainHowTo.save();
            }).then((veryOldBrainHowTo) => {
                howTo.SquadId = squad1.id;
                return howTo.save();
            }).then((howTo) => {
                veryOldHowTo.SquadId = squad1.id;
                return veryOldHowTo.save();
            }).then((veryOldHowTo) => {
                oldHowTo.SquadId = squad1.id;
                return oldHowTo.save();
            }).then((oldHowTo) => {
                otherSquadHowTo.SquadId = squad2.id;
                return otherSquadHowTo.save();
            }).then((otherSquadHowTo) => {
                chai.request(server)
                    .get('/api/how-to')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .set('Brain-squad', squad1.id)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('howTo');
                        res.body.howTo.should.be.a('object');
                        res.body.howTo.should.have.property('content').eql('<div>My brain how to</div>');
                        res.body.howTo.should.have.property('version').eql(10);
                        res.body.should.have.property('squadHowTo');
                        res.body.squadHowTo.should.be.a('object');
                        res.body.squadHowTo.should.have.property('content').eql('<div>My squad how to</div>');
                        res.body.squadHowTo.should.have.property('version').eql(25);
                        done();
                    });
            })
        });
    });
});