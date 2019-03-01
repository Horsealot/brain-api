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
describe('Okrs', () => {
    let period;
    beforeEach((done) => { //Before each test we empty the database
        preTest.cleanDB().then(() => {
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 60);
            endDate.setDate(endDate.getDate() + 60);
            period = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});
            return period.save();
        }).then((dbPeriod) => {
            period = dbPeriod;
            done();
        });
    });

    /*
    * Test the /POST OKR route
    */
    describe('/POST okr', () => {
        it('should not accept a POST when unauthentified', (done) => {
            chai.request(server)
                .post('/api/okrs')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should not accept a POST for a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/okrs')
                    .set('Brain-squad', squad1.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST for a simple squad member', (done) => {
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
                    .post('/api/okrs')
                    .set('Brain-squad', squad1.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a POST squad OKR for a squad admin', (done) => {
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
                    .post('/api/okrs')
                    .set('Brain-squad', squad1.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('link').eql('OKR Link');
                        res.body.okr.should.have.property('picture').eql('OKR picture');
                        res.body.okr.should.have.property('period');
                        res.body.okr.period.should.have.property('id').eql(period.id);
                        models.Okrs.findOne({where: {SquadId: squad1.id, PeriodId: period.id}}).then((okr) => {
                            expect(okr).to.be.an('object');
                            okr = okr.toJSON();
                            okr.should.have.property('link').eql('OKR Link');
                            okr.should.have.property('picture').eql('OKR picture');
                            done();
                        });
                    });
            });
        });
        it('should accept a POST squad OKR for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/okrs')
                    .set('Brain-squad', squad1.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('link').eql('OKR Link');
                        res.body.okr.should.have.property('picture').eql('OKR picture');
                        res.body.okr.should.have.property('period');
                        res.body.okr.period.should.have.property('id').eql(period.id);
                        models.Okrs.findOne({where: {SquadId: squad1.id, PeriodId: period.id}}).then((okr) => {
                            expect(okr).to.be.an('object');
                            okr = okr.toJSON();
                            okr.should.have.property('link').eql('OKR Link');
                            okr.should.have.property('picture').eql('OKR picture');
                            done();
                        });
                    });
            });
        });
        it('should return 409 conflict on a squad OKR if there is already one for the period', (done) => {
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
                    .post('/api/okrs')
                    .set('Brain-squad', squad1.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('link').eql('OKR Link');
                        res.body.okr.should.have.property('picture').eql('OKR picture');
                        res.body.okr.should.have.property('period');
                        res.body.okr.period.should.have.property('id').eql(period.id);
                        models.Okrs.findOne({where: {SquadId: squad1.id, PeriodId: period.id}}).then((okr) => {
                            expect(okr).to.be.an('object');
                            okr = okr.toJSON();
                            okr.should.have.property('link').eql('OKR Link');
                            okr.should.have.property('picture').eql('OKR picture');
                            chai.request(server)
                                .post('/api/okrs')
                                .set('Brain-squad', squad1.id)
                                .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                                .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                                .end((err, res) => {
                                    res.should.have.status(409);
                                    done();
                                });
                        });
                    });
            });
        });
        it('should not accept a POST brain OKR for a non super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/okrs')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST brain OKR for a squad member non super admin', (done) => {
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
                    .post('/api/okrs')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST brain OKR for a squad admin non super admin', (done) => {
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
                    .post('/api/okrs')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a POST brain OKR for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/okrs')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('link').eql('OKR Link');
                        res.body.okr.should.have.property('picture').eql('OKR picture');
                        res.body.okr.should.have.property('period');
                        res.body.okr.period.should.have.property('id').eql(period.id);
                        models.Okrs.findOne({where: {SquadId: null, PeriodId: period.id}}).then((okr) => {
                            expect(okr).to.be.an('object');
                            okr = okr.toJSON();
                            okr.should.have.property('link').eql('OKR Link');
                            okr.should.have.property('picture').eql('OKR picture');
                            done();
                        });
                    });
            });
        });
        it('should return 409 conflict on a brain OKR if there is already one for the period', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/okrs')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('link').eql('OKR Link');
                        res.body.okr.should.have.property('picture').eql('OKR picture');
                        res.body.okr.should.have.property('period');
                        res.body.okr.period.should.have.property('id').eql(period.id);
                        models.Okrs.findOne({where: {SquadId: null, PeriodId: period.id}}).then((okr) => {
                            expect(okr).to.be.an('object');
                            okr = okr.toJSON();
                            okr.should.have.property('link').eql('OKR Link');
                            okr.should.have.property('picture').eql('OKR picture');
                            chai.request(server)
                                .post('/api/okrs')
                                .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                                .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                                .end((err, res) => {
                                    res.should.have.status(409);
                                    done();
                                });
                        });
                    });
            });
        });
    });

    /*
    * Test the /POST update OKR route
    */
    describe('/POST okrs/:id', () => {
        it('should not accept a POST when unauthentified', (done) => {
            chai.request(server)
                .post('/api/okrs/1')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return 404 on an unknown OKR', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/okrs/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'OKR Link', picture: 'OKR picture'}})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should return 403 for a non squad admin nor super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                okr.SquadId = squad1.id;
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .post('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'link 2', picture: 'picture 2'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return 403 for a simple squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                okr.SquadId = squad1.id;
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .post('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'link 2', picture: 'picture 2'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should update a Squad OKR for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                okr.SquadId = squad1.id;
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .post('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'link 2', picture: 'picture 2'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('link').eql('link 2');
                        res.body.okr.should.have.property('picture').eql('picture 2');
                        res.body.okr.should.have.property('period');
                        res.body.okr.period.should.have.property('id').eql(period.id);
                        models.Okrs.findOne({where: {SquadId: squad1.id, PeriodId: period.id}}).then((okr) => {
                            expect(okr).to.be.an('object');
                            okr = okr.toJSON();
                            okr.should.have.property('link').eql('link 2');
                            okr.should.have.property('picture').eql('picture 2');
                            done();
                        });
                    });
            });
        });
        it('should update a Squad OKR for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                okr.SquadId = squad1.id;
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .post('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'link 2', picture: 'picture 2'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('link').eql('link 2');
                        res.body.okr.should.have.property('picture').eql('picture 2');
                        res.body.okr.should.have.property('period');
                        res.body.okr.period.should.have.property('id').eql(period.id);
                        models.Okrs.findOne({where: {SquadId: squad1.id, PeriodId: period.id}}).then((okr) => {
                            expect(okr).to.be.an('object');
                            okr = okr.toJSON();
                            okr.should.have.property('link').eql('link 2');
                            okr.should.have.property('picture').eql('picture 2');
                            done();
                        });
                    });
            });
        });

        it('should return 403 for a non super admin on a brain okr', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .post('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'link 2', picture: 'picture 2'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return 403 for a simple squad member on a brain okr', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .post('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'link 2', picture: 'picture 2'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return 403 for a squad admin on a brain okr', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .post('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'link 2', picture: 'picture 2'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should update a brain OKR for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .post('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({okr: {link: 'link 2', picture: 'picture 2'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('link').eql('link 2');
                        res.body.okr.should.have.property('picture').eql('picture 2');
                        res.body.okr.should.have.property('period');
                        res.body.okr.period.should.have.property('id').eql(period.id);
                        models.Okrs.findOne({where: {SquadId: null, PeriodId: period.id}}).then((okr) => {
                            expect(okr).to.be.an('object');
                            okr = okr.toJSON();
                            okr.should.have.property('link').eql('link 2');
                            okr.should.have.property('picture').eql('picture 2');
                            done();
                        });
                    });
            });
        });
    });


    /*
    * Test the /DELETE Okrs/:id route
    */
    describe('/DELETE Okrs/:id', () => {

        it('should return 401 for unauthentified', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .delete('/api/okrs/1')
                    .send()
                    .end((err, res) => {
                        res.should.have.status(401);
                        done();
                    });
            });
        });

        it('should return 404 for an unknown okr', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .delete('/api/okrs/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should return 403 for a non squad admin nor superadmin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                okr.SquadId = squad1.id;
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .delete('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return 403 for a simple squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                okr.SquadId = squad1.id;
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .delete('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should DELETE an existing squad okr for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                okr.SquadId = squad1.id;
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .delete('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Okrs.findOne({where: {id: okr.id}}).then((okr) => {
                            expect(okr).to.be.null;
                            done();
                        });
                    });
            });
        });
        it('should DELETE an existing squad okr for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                okr.SquadId = squad1.id;
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .delete('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Okrs.findOne({where: {id: okr.id}}).then((okr) => {
                            expect(okr).to.be.null;
                            done();
                        });
                    });
            });
        });

        it('should return 403 for a non squad admin nor superadmin on a brain okr', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .delete('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return 403 for a simple squad member on a brain okr', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .delete('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return 403 for a squad admin on a brain okr', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .delete('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should DELETE an existing brain okr for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let okr = new models.Okrs({link: 'link1', picture: 'picture1'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                okr.PeriodId = period.id;
                return okr.save();
            }).then((okr) => {
                chai.request(server)
                    .delete('/api/okrs/' + okr.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Okrs.findOne({where: {id: okr.id}}).then((okr) => {
                            expect(okr).to.be.null;
                            done();
                        });
                    });
            });
        });
    });




    /*
    * Test the /GET Okrs route
    */
    describe('/GET Okrs', () => {

        it('should return 401 for unauthentified', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .get('/api/okrs')
                    .send()
                    .end((err, res) => {
                        res.should.have.status(401);
                        done();
                    });
            });
        });

        it('should return both squad and brain current okr', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            let expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});

            let squad = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let expiredBrainOkr = new models.Okrs({link: 'link1', picture: 'picture1'});
            let expiredSquadOkr = new models.Okrs({link: 'link2', picture: 'picture2'});
            let currentBrainOkr = new models.Okrs({link: 'link3', picture: 'picture3'});
            let currentSquadOkr = new models.Okrs({link: 'link4', picture: 'picture4'});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                return squad.save();
            }).then((squad) => {
                currentSquadOkr.SquadId = squad.id;
                currentSquadOkr.PeriodId = period.id;
                return currentSquadOkr.save();
            }).then((currentSquadOkr) => {
                expiredSquadOkr.SquadId = squad.id;
                expiredSquadOkr.PeriodId = expiredPeriod.id;
                return expiredSquadOkr.save();
            }).then((expiredSquadOkr) => {
                expiredBrainOkr.PeriodId = expiredPeriod.id;
                return expiredBrainOkr.save();
            }).then((expiredBrainOkr) => {
                currentBrainOkr.PeriodId = period.id;
                return currentBrainOkr.save();
            }).then((currentBrainOkr) => {
                chai.request(server)
                    .get('/api/okrs')
                    .set('Brain-squad', squad.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.should.have.property('squadOkr');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('id').eql(currentBrainOkr.id);
                        res.body.okr.should.have.property('link').eql(currentBrainOkr.link);
                        res.body.okr.should.have.property('picture').eql(currentBrainOkr.picture);
                        res.body.okr.should.have.property('isSquad').eql(false);
                        res.body.okr.should.have.property('period');
                        res.body.squadOkr.should.be.a('object');
                        res.body.squadOkr.should.have.property('id').eql(currentSquadOkr.id);
                        res.body.squadOkr.should.have.property('link').eql(currentSquadOkr.link);
                        res.body.squadOkr.should.have.property('picture').eql(currentSquadOkr.picture);
                        res.body.squadOkr.should.have.property('isSquad').eql(true);
                        res.body.squadOkr.should.have.property('period');
                        done();
                    });
            });
        });

        it('should 403 for a non member of the squad nor non superadmin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            let expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});

            let squad = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let expiredBrainOkr = new models.Okrs({link: 'link1', picture: 'picture1'});
            let expiredSquadOkr = new models.Okrs({link: 'link2', picture: 'picture2'});
            let currentBrainOkr = new models.Okrs({link: 'link3', picture: 'picture3'});
            let currentSquadOkr = new models.Okrs({link: 'link4', picture: 'picture4'});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                return squad.save();
            }).then((squad) => {
                currentSquadOkr.SquadId = squad.id;
                currentSquadOkr.PeriodId = period.id;
                return currentSquadOkr.save();
            }).then((currentSquadOkr) => {
                expiredSquadOkr.SquadId = squad.id;
                expiredSquadOkr.PeriodId = expiredPeriod.id;
                return expiredSquadOkr.save();
            }).then((expiredSquadOkr) => {
                expiredBrainOkr.PeriodId = expiredPeriod.id;
                return expiredBrainOkr.save();
            }).then((expiredBrainOkr) => {
                currentBrainOkr.PeriodId = period.id;
                return currentBrainOkr.save();
            }).then((currentBrainOkr) => {
                chai.request(server)
                    .get('/api/okrs')
                    .set('Brain-squad', squad.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        it('should return both squad and brain current okr for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            let expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});

            let squad = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let expiredBrainOkr = new models.Okrs({link: 'link1', picture: 'picture1'});
            let expiredSquadOkr = new models.Okrs({link: 'link2', picture: 'picture2'});
            let currentBrainOkr = new models.Okrs({link: 'link3', picture: 'picture3'});
            let currentSquadOkr = new models.Okrs({link: 'link4', picture: 'picture4'});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                return squad.save();
            }).then((squad) => {
                user1.addSquad(squad, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                currentSquadOkr.SquadId = squad.id;
                currentSquadOkr.PeriodId = period.id;
                return currentSquadOkr.save();
            }).then((currentSquadOkr) => {
                expiredSquadOkr.SquadId = squad.id;
                expiredSquadOkr.PeriodId = expiredPeriod.id;
                return expiredSquadOkr.save();
            }).then((expiredSquadOkr) => {
                expiredBrainOkr.PeriodId = expiredPeriod.id;
                return expiredBrainOkr.save();
            }).then((expiredBrainOkr) => {
                currentBrainOkr.PeriodId = period.id;
                return currentBrainOkr.save();
            }).then((currentBrainOkr) => {
                chai.request(server)
                    .get('/api/okrs')
                    .set('Brain-squad', squad.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.should.have.property('squadOkr');
                        res.body.should.have.property('period');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('id').eql(currentBrainOkr.id);
                        res.body.okr.should.have.property('link').eql(currentBrainOkr.link);
                        res.body.okr.should.have.property('picture').eql(currentBrainOkr.picture);
                        res.body.okr.should.have.property('isSquad').eql(false);
                        res.body.okr.should.have.property('period');
                        res.body.squadOkr.should.be.a('object');
                        res.body.squadOkr.should.have.property('id').eql(currentSquadOkr.id);
                        res.body.squadOkr.should.have.property('link').eql(currentSquadOkr.link);
                        res.body.squadOkr.should.have.property('picture').eql(currentSquadOkr.picture);
                        res.body.squadOkr.should.have.property('isSquad').eql(true);
                        res.body.squadOkr.should.have.property('period');
                        done();
                    });
            });
        });

        it('should return both squad and brain current okr for a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            let expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});

            let squad = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let expiredBrainOkr = new models.Okrs({link: 'link1', picture: 'picture1'});
            let expiredSquadOkr = new models.Okrs({link: 'link2', picture: 'picture2'});
            let currentBrainOkr = new models.Okrs({link: 'link3', picture: 'picture3'});
            let currentSquadOkr = new models.Okrs({link: 'link4', picture: 'picture4'});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                return squad.save();
            }).then((squad) => {
                user1.addSquad(squad, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                currentSquadOkr.SquadId = squad.id;
                currentSquadOkr.PeriodId = period.id;
                return currentSquadOkr.save();
            }).then((currentSquadOkr) => {
                expiredSquadOkr.SquadId = squad.id;
                expiredSquadOkr.PeriodId = expiredPeriod.id;
                return expiredSquadOkr.save();
            }).then((expiredSquadOkr) => {
                expiredBrainOkr.PeriodId = expiredPeriod.id;
                return expiredBrainOkr.save();
            }).then((expiredBrainOkr) => {
                currentBrainOkr.PeriodId = period.id;
                return currentBrainOkr.save();
            }).then((currentBrainOkr) => {
                chai.request(server)
                    .get('/api/okrs')
                    .set('Brain-squad', squad.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okr');
                        res.body.should.have.property('squadOkr');
                        res.body.should.have.property('period');
                        res.body.okr.should.be.a('object');
                        res.body.okr.should.have.property('id').eql(currentBrainOkr.id);
                        res.body.okr.should.have.property('link').eql(currentBrainOkr.link);
                        res.body.okr.should.have.property('picture').eql(currentBrainOkr.picture);
                        res.body.okr.should.have.property('isSquad').eql(false);
                        res.body.okr.should.have.property('period');
                        res.body.squadOkr.should.be.a('object');
                        res.body.squadOkr.should.have.property('id').eql(currentSquadOkr.id);
                        res.body.squadOkr.should.have.property('link').eql(currentSquadOkr.link);
                        res.body.squadOkr.should.have.property('picture').eql(currentSquadOkr.picture);
                        res.body.squadOkr.should.have.property('isSquad').eql(true);
                        res.body.squadOkr.should.have.property('period');
                        done();
                    });
            });
        });
    });

    /*
    * Test the /GET Okrs/past route
    */
    describe('/GET Okrs/past', () => {

        it('should return 401 for unauthentified', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .get('/api/okrs/past')
                    .send()
                    .end((err, res) => {
                        res.should.have.status(401);
                        done();
                    });
            });
        });

        it('should return both squad and brain current okr', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            let expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});

            let squad = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let expiredBrainOkr = new models.Okrs({link: 'link1', picture: 'picture1'});
            let expiredSquadOkr = new models.Okrs({link: 'link2', picture: 'picture2'});
            let currentBrainOkr = new models.Okrs({link: 'link3', picture: 'picture3'});
            let currentSquadOkr = new models.Okrs({link: 'link4', picture: 'picture4'});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                return squad.save();
            }).then((squad) => {
                currentSquadOkr.SquadId = squad.id;
                currentSquadOkr.PeriodId = period.id;
                return currentSquadOkr.save();
            }).then((currentSquadOkr) => {
                expiredSquadOkr.SquadId = squad.id;
                expiredSquadOkr.PeriodId = expiredPeriod.id;
                return expiredSquadOkr.save();
            }).then((expiredSquadOkr) => {
                expiredBrainOkr.PeriodId = expiredPeriod.id;
                return expiredBrainOkr.save();
            }).then((expiredBrainOkr) => {
                currentBrainOkr.PeriodId = period.id;
                return currentBrainOkr.save();
            }).then((currentBrainOkr) => {
                chai.request(server)
                    .get('/api/okrs/past')
                    .set('Brain-squad', squad.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okrs');
                        res.body.okrs.should.be.a('array');
                        res.body.okrs[0].should.be.a('object');
                        res.body.okrs[0].should.have.property('okr');
                        res.body.okrs[0].should.have.property('squadOkr');
                        res.body.okrs[0].should.have.property('period');
                        res.body.okrs[0].okr.should.be.a('object');
                        res.body.okrs[0].okr.should.have.property('id').eql(currentBrainOkr.id);
                        res.body.okrs[0].okr.should.have.property('link').eql(currentBrainOkr.link);
                        res.body.okrs[0].okr.should.have.property('picture').eql(currentBrainOkr.picture);
                        res.body.okrs[0].okr.should.have.property('isSquad').eql(false);
                        res.body.okrs[0].okr.should.have.property('period');
                        res.body.okrs[0].squadOkr.should.be.a('object');
                        res.body.okrs[0].squadOkr.should.have.property('id').eql(currentSquadOkr.id);
                        res.body.okrs[0].squadOkr.should.have.property('link').eql(currentSquadOkr.link);
                        res.body.okrs[0].squadOkr.should.have.property('picture').eql(currentSquadOkr.picture);
                        res.body.okrs[0].squadOkr.should.have.property('isSquad').eql(true);
                        res.body.okrs[0].squadOkr.should.have.property('period');
                        res.body.okrs[1].should.be.a('object');
                        res.body.okrs[1].should.have.property('okr');
                        res.body.okrs[1].should.have.property('squadOkr');
                        res.body.okrs[1].should.have.property('period');
                        res.body.okrs[1].okr.should.be.a('object');
                        res.body.okrs[1].okr.should.have.property('id').eql(expiredBrainOkr.id);
                        res.body.okrs[1].okr.should.have.property('link').eql(expiredBrainOkr.link);
                        res.body.okrs[1].okr.should.have.property('picture').eql(expiredBrainOkr.picture);
                        res.body.okrs[1].okr.should.have.property('isSquad').eql(false);
                        res.body.okrs[1].okr.should.have.property('period');
                        res.body.okrs[1].squadOkr.should.be.a('object');
                        res.body.okrs[1].squadOkr.should.have.property('id').eql(expiredSquadOkr.id);
                        res.body.okrs[1].squadOkr.should.have.property('link').eql(expiredSquadOkr.link);
                        res.body.okrs[1].squadOkr.should.have.property('picture').eql(expiredSquadOkr.picture);
                        res.body.okrs[1].squadOkr.should.have.property('isSquad').eql(true);
                        res.body.okrs[1].squadOkr.should.have.property('period');
                        done();
                    });
            });
        });

        it('should 403 for a non member of the squad nor non superadmin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            let expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});

            let squad = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let expiredBrainOkr = new models.Okrs({link: 'link1', picture: 'picture1'});
            let expiredSquadOkr = new models.Okrs({link: 'link2', picture: 'picture2'});
            let currentBrainOkr = new models.Okrs({link: 'link3', picture: 'picture3'});
            let currentSquadOkr = new models.Okrs({link: 'link4', picture: 'picture4'});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                return squad.save();
            }).then((squad) => {
                currentSquadOkr.SquadId = squad.id;
                currentSquadOkr.PeriodId = period.id;
                return currentSquadOkr.save();
            }).then((currentSquadOkr) => {
                expiredSquadOkr.SquadId = squad.id;
                expiredSquadOkr.PeriodId = expiredPeriod.id;
                return expiredSquadOkr.save();
            }).then((expiredSquadOkr) => {
                expiredBrainOkr.PeriodId = expiredPeriod.id;
                return expiredBrainOkr.save();
            }).then((expiredBrainOkr) => {
                currentBrainOkr.PeriodId = period.id;
                return currentBrainOkr.save();
            }).then((currentBrainOkr) => {
                chai.request(server)
                    .get('/api/okrs/past')
                    .set('Brain-squad', squad.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        it('should return both squad and brain current okr for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            let expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});

            let squad = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let expiredBrainOkr = new models.Okrs({link: 'link1', picture: 'picture1'});
            let expiredSquadOkr = new models.Okrs({link: 'link2', picture: 'picture2'});
            let currentBrainOkr = new models.Okrs({link: 'link3', picture: 'picture3'});
            let currentSquadOkr = new models.Okrs({link: 'link4', picture: 'picture4'});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                return squad.save();
            }).then((squad) => {
                user1.addSquad(squad, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                currentSquadOkr.SquadId = squad.id;
                currentSquadOkr.PeriodId = period.id;
                return currentSquadOkr.save();
            }).then((currentSquadOkr) => {
                expiredSquadOkr.SquadId = squad.id;
                expiredSquadOkr.PeriodId = expiredPeriod.id;
                return expiredSquadOkr.save();
            }).then((expiredSquadOkr) => {
                expiredBrainOkr.PeriodId = expiredPeriod.id;
                return expiredBrainOkr.save();
            }).then((expiredBrainOkr) => {
                currentBrainOkr.PeriodId = period.id;
                return currentBrainOkr.save();
            }).then((currentBrainOkr) => {
                chai.request(server)
                    .get('/api/okrs/past')
                    .set('Brain-squad', squad.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okrs');
                        res.body.okrs.should.be.a('array');
                        res.body.okrs[0].should.be.a('object');
                        res.body.okrs[0].should.have.property('okr');
                        res.body.okrs[0].should.have.property('squadOkr');
                        res.body.okrs[0].should.have.property('period');
                        res.body.okrs[0].okr.should.be.a('object');
                        res.body.okrs[0].okr.should.have.property('id').eql(currentBrainOkr.id);
                        res.body.okrs[0].okr.should.have.property('link').eql(currentBrainOkr.link);
                        res.body.okrs[0].okr.should.have.property('picture').eql(currentBrainOkr.picture);
                        res.body.okrs[0].okr.should.have.property('isSquad').eql(false);
                        res.body.okrs[0].okr.should.have.property('period');
                        res.body.okrs[0].squadOkr.should.be.a('object');
                        res.body.okrs[0].squadOkr.should.have.property('id').eql(currentSquadOkr.id);
                        res.body.okrs[0].squadOkr.should.have.property('link').eql(currentSquadOkr.link);
                        res.body.okrs[0].squadOkr.should.have.property('picture').eql(currentSquadOkr.picture);
                        res.body.okrs[0].squadOkr.should.have.property('isSquad').eql(true);
                        res.body.okrs[0].squadOkr.should.have.property('period');
                        res.body.okrs[1].should.be.a('object');
                        res.body.okrs[1].should.have.property('okr');
                        res.body.okrs[1].should.have.property('squadOkr');
                        res.body.okrs[1].should.have.property('period');
                        res.body.okrs[1].okr.should.be.a('object');
                        res.body.okrs[1].okr.should.have.property('id').eql(expiredBrainOkr.id);
                        res.body.okrs[1].okr.should.have.property('link').eql(expiredBrainOkr.link);
                        res.body.okrs[1].okr.should.have.property('picture').eql(expiredBrainOkr.picture);
                        res.body.okrs[1].okr.should.have.property('isSquad').eql(false);
                        res.body.okrs[1].okr.should.have.property('period');
                        res.body.okrs[1].squadOkr.should.be.a('object');
                        res.body.okrs[1].squadOkr.should.have.property('id').eql(expiredSquadOkr.id);
                        res.body.okrs[1].squadOkr.should.have.property('link').eql(expiredSquadOkr.link);
                        res.body.okrs[1].squadOkr.should.have.property('picture').eql(expiredSquadOkr.picture);
                        res.body.okrs[1].squadOkr.should.have.property('isSquad').eql(true);
                        res.body.okrs[1].squadOkr.should.have.property('period');
                        done();
                    });
            });
        });

        it('should return both squad and brain current okr for a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            let expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});

            let squad = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let expiredBrainOkr = new models.Okrs({link: 'link1', picture: 'picture1'});
            let expiredSquadOkr = new models.Okrs({link: 'link2', picture: 'picture2'});
            let currentBrainOkr = new models.Okrs({link: 'link3', picture: 'picture3'});
            let currentSquadOkr = new models.Okrs({link: 'link4', picture: 'picture4'});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                return squad.save();
            }).then((squad) => {
                user1.addSquad(squad, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                currentSquadOkr.SquadId = squad.id;
                currentSquadOkr.PeriodId = period.id;
                return currentSquadOkr.save();
            }).then((currentSquadOkr) => {
                expiredSquadOkr.SquadId = squad.id;
                expiredSquadOkr.PeriodId = expiredPeriod.id;
                return expiredSquadOkr.save();
            }).then((expiredSquadOkr) => {
                expiredBrainOkr.PeriodId = expiredPeriod.id;
                return expiredBrainOkr.save();
            }).then((expiredBrainOkr) => {
                currentBrainOkr.PeriodId = period.id;
                return currentBrainOkr.save();
            }).then((currentBrainOkr) => {
                chai.request(server)
                    .get('/api/okrs/past')
                    .set('Brain-squad', squad.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('okrs');
                        res.body.okrs.should.be.a('array');
                        res.body.okrs[0].should.be.a('object');
                        res.body.okrs[0].should.have.property('okr');
                        res.body.okrs[0].should.have.property('squadOkr');
                        res.body.okrs[0].should.have.property('period');
                        res.body.okrs[0].okr.should.be.a('object');
                        res.body.okrs[0].okr.should.have.property('id').eql(currentBrainOkr.id);
                        res.body.okrs[0].okr.should.have.property('link').eql(currentBrainOkr.link);
                        res.body.okrs[0].okr.should.have.property('picture').eql(currentBrainOkr.picture);
                        res.body.okrs[0].okr.should.have.property('isSquad').eql(false);
                        res.body.okrs[0].okr.should.have.property('period');
                        res.body.okrs[0].squadOkr.should.be.a('object');
                        res.body.okrs[0].squadOkr.should.have.property('id').eql(currentSquadOkr.id);
                        res.body.okrs[0].squadOkr.should.have.property('link').eql(currentSquadOkr.link);
                        res.body.okrs[0].squadOkr.should.have.property('picture').eql(currentSquadOkr.picture);
                        res.body.okrs[0].squadOkr.should.have.property('isSquad').eql(true);
                        res.body.okrs[0].squadOkr.should.have.property('period');
                        res.body.okrs[1].should.be.a('object');
                        res.body.okrs[1].should.have.property('okr');
                        res.body.okrs[1].should.have.property('squadOkr');
                        res.body.okrs[1].should.have.property('period');
                        res.body.okrs[1].okr.should.be.a('object');
                        res.body.okrs[1].okr.should.have.property('id').eql(expiredBrainOkr.id);
                        res.body.okrs[1].okr.should.have.property('link').eql(expiredBrainOkr.link);
                        res.body.okrs[1].okr.should.have.property('picture').eql(expiredBrainOkr.picture);
                        res.body.okrs[1].okr.should.have.property('isSquad').eql(false);
                        res.body.okrs[1].okr.should.have.property('period');
                        res.body.okrs[1].squadOkr.should.be.a('object');
                        res.body.okrs[1].squadOkr.should.have.property('id').eql(expiredSquadOkr.id);
                        res.body.okrs[1].squadOkr.should.have.property('link').eql(expiredSquadOkr.link);
                        res.body.okrs[1].squadOkr.should.have.property('picture').eql(expiredSquadOkr.picture);
                        res.body.okrs[1].squadOkr.should.have.property('isSquad').eql(true);
                        res.body.okrs[1].squadOkr.should.have.property('period');
                        done();
                    });
            });
        });
    });
});