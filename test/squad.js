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
describe('Squad', () => {
    beforeEach((done) => { //Before each test we empty the database
        models.PasswordRequests.destroy({where: {}}).then(() => {
            return models.Tools.destroy({where: {}});
        }).then(() => {
            return models.ToolCategories.destroy({where: {}});
        }).then(() => {
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
});