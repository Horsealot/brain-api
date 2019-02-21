//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let expect = chai.expect;
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
let sinon = require('sinon');

const notificationProducer = require('./../producers/notifications');

const models = require('./../models');
const preTest = require('./preTest');

chai.use(chaiHttp);
//Our parent block
describe('Auth', () => {
    beforeEach((done) => { //Before each test we empty the database
        preTest.cleanDB(done);
    });

    /*
    * Test the /POST invite route
    */
    describe('/POST invite', () => {
        const signupProducerStub = sinon.stub(notificationProducer, "signup").returns();
        it('should not accept a POST invite when not identified', (done) => {
            let body = {
                user: {
                    password: "test_password"
                }
            };
            chai.request(server)
                .post('/api/invite')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should not accept a POST invite from a non superadmin or squad admin', (done) => {
            let body = {
                email: "test@testuser.com"
            };
            let user = new models.Users({email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                chai.request(server)
                    .post('/api/invite')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            })
        });
        it('should return 404 on an unknown squad', (done) => {
            let user = new models.Users({email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            let squad = new models.Squads({name: 'Horsealot', slug: 'horsealot'});
            user.setRoles("ADMIN");
            squad.save().then(() => {
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .post('/api/invite')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .set('Brain-squad', -1)
                    .send({email: 'new@testuser.com'})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            })
        });
        it('should accept a POST invite from a super admin on an existing user and add him to the squad', (done) => {
            let user = new models.Users({email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            let user2 = new models.Users({email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            let squad = new models.Squads({name: 'Horsealot', slug: 'horsealot'});
            user.setRoles("ADMIN");
            squad.save().then((squad) => {
                return user.save();
            }).then((user) => {
                return user2.save();
            }).then((user2) => {
                chai.request(server)
                    .post('/api/invite')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .set('Brain-squad', squad.id)
                    .send({email: user2.email})
                    .end((err, res) => {
                        res.should.have.status(200);
                        expect(signupProducerStub.calledOnce).to.be.false;
                        signupProducerStub.resetHistory();
                        models.UserSquads.findOne({where: {UserId: user2.id, SquadId: squad.id}}).then((userSquad) => {
                            userSquad = userSquad.toJSON();
                            userSquad.should.have.property('UserId').eql(user2.id);
                            userSquad.should.have.property('SquadId').eql(squad.id);
                            userSquad.should.have.property('role').eql('USER');
                            done();
                        });
                    });
            })
        });
        it('should accept a POST invite from a superadmin', (done) => {
            let body = {
                email: "new@testuser.com"
            };
            let user = new models.Users({email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            let squad = new models.Squads({name: 'Horsealot', slug: 'horsealot'});
            user.setRoles("ADMIN");
            squad.save().then(() => {
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .post('/api/invite')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .set('Brain-squad', squad.id)
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(200);
                        expect(signupProducerStub.calledOnce).to.be.true;
                        signupProducerStub.resetHistory();
                        models.Invites.findOne({where: {email: 'new@testuser.com', squadId: squad.id}}).then((invite) => {
                            invite = invite.toJSON();
                            invite.should.have.property('email').eql('new@testuser.com');
                            invite.should.have.property('squadId').eql(squad.id);
                            done();
                        });
                    });
            })
        });
        it('should accept a POST invite from a squad admin', (done) => {
            let body = {
                email: "new@testuser.com"
            };
            let user = new models.Users({email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            let squad = new models.Squads({name: 'Horsealot', slug: 'horsealot'});
            squad.save().then((squad) => {
                return user.save();
            }).then((user) => {
                user.addSquad(squad, {through: {role: 'ADMIN'}});
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .post('/api/invite')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .set('Brain-squad', squad.id)
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(200);
                        expect(signupProducerStub.calledOnce).to.be.true;
                        signupProducerStub.resetHistory();
                        models.Invites.findOne({where: {email: "new@testuser.com", squadId: squad.id}}).then((invite) => {
                            invite = invite.toJSON();
                            invite.should.have.property('email').eql('new@testuser.com');
                            invite.should.have.property('squadId').eql(squad.id);
                            done();
                        });
                    });
            })
        });
        it('should not accept a POST invite from an admin of another squad', (done) => {
            let body = {
                email: "new@testuser.com"
            };
            let user = new models.Users({email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            let squad = new models.Squads({name: 'Horsealot', slug: 'horsealot'});
            let squad2 = new models.Squads({name: 'Horsealot2', slug: 'horsealot2'});
            squad.save().then(() => {
                return squad2.save();
            }).then(() => {
                return user.save();
            }).then((user) => {
                user.addSquad(squad, {through: {role: 'ADMIN'}});
                return user.save();
            }).then((user) => {
                chai.request(server)
                    .post('/api/invite')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .set('Brain-squad', squad2.id)
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(403);
                        expect(signupProducerStub.calledOnce).to.be.false;
                        signupProducerStub.resetHistory();
                        done();
                    });
            })
        });
    });

    /*
    * Test the /POST signup route
    */
    describe('/POST signup', () => {
        it('signup should not accept a POST with missing parameters', (done) => {
            let body = {
                user: {
                    password: "test_password"
                }
            };
            chai.request(server)
                .post('/api/signup')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(422);
                    done();
                });
        });
        it('signup should not accept a POST with an unknown token', (done) => {
            let body = {
                user: {
                    password: "test_password",
                    token: 'unknown',
                    firstname: 'Test',
                    lastname: 'User',
                }
            };
            chai.request(server)
                .post('/api/signup')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });
        it('it should signup the user', (done) => {
            let invite = new models.Invites({ email: "test@testuser.com", token: "testtoken"});
            invite.save().then((invite) => {
                let body = {
                    user: {
                        password: "test_password",
                        token: invite.token,
                        firstname: 'Test',
                        lastname: 'User',
                    }
                };
                chai.request(server)
                    .post('/api/signup')
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('user');
                        res.body.user.should.have.property('email').eql(invite.email);
                        res.body.user.should.have.property('firstname').eql('Test');
                        res.body.user.should.have.property('lastname').eql('User');
                        res.body.user.should.have.property('token');
                        res.body.user.should.have.property('id');
                        done();
                    });
            });

        });
    });

    /*
    * Test the /POST login route
    */
    describe('/POST login', () => {
        it('should not accept a POST with missing parameters', (done) => {
            let body = {
                user: {
                    password: "test_password"
                }
            };
            chai.request(server)
                .post('/api/login')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(422);
                    done();
                });
        });
        it('should return not found for unknown user', (done) => {
            let body = {
                user: {
                    password: "badpassword",
                    email: 'test@testuser.com',
                }
            };
            chai.request(server)
                .post('/api/login')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return unauthorized for bad credentials', (done) => {
            let user = new models.Users({ email: "test@testuser.com", firstname: 'Test', lastname: 'User'});
            user.setPassword('testpassword');
            let body = {
                user: {
                    password: "badpassword",
                    email: 'test@testuser.com',
                }
            };
            user.save().then(() => {
                chai.request(server)
                    .post('/api/login')
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(401);
                        done();
                    });
            })
        });
        it('should return a jwt token for good credentials', (done) => {
            let user = new models.Users({ email: "test@testuser.com", firstname: 'Test', lastname: 'User'});
            user.setPassword('testpassword');
            let body = {
                user: {
                    password: "testpassword",
                    email: 'test@testuser.com',
                }
            };
            user.save().then(() => {
                chai.request(server)
                    .post('/api/login')
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('user');
                        res.body.user.should.have.property('email').eql(user.email);
                        res.body.user.should.have.property('firstname').eql('Test');
                        res.body.user.should.have.property('lastname').eql('User');
                        res.body.user.should.have.property('token');
                        res.body.user.should.have.property('id');
                        done();
                    });
            })
        });
    });

    /*
    * Test the /POST request reset password
    */
    describe('/POST request reset password', () => {
        const passwordResetRequestProducerStub = sinon.stub(notificationProducer, "passwordResetRequest").returns();
        it('should not accept a POST without a mail', (done) => {
            let body = {
            };
            chai.request(server)
                .post('/api/reset/request')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(422);
                    done();
                });
        });
        it('should not accept a POST with an unknown email', (done) => {
            let body = {
                email: 'unknown@mail.com'
            };
            chai.request(server)
                .post('/api/reset/request')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });
        it('should produce a passwordResetRequest event', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then(() => {
                let body = {
                    email: 'test@testuser.com'
                };
                chai.request(server)
                    .post('/api/reset/request')
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(200);
                        expect(passwordResetRequestProducerStub.calledOnce).to.be.true;
                        passwordResetRequestProducerStub.resetHistory();
                        done();
                    });
            })
        });
        it('should not accept a second request', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                return models.PasswordRequests.create({
                    UserId: user.id
                });
            }).then(() => {
                let body = {
                    email: 'test@testuser.com'
                };
                chai.request(server)
                    .post('/api/reset/request')
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(409);
                        expect(passwordResetRequestProducerStub.calledOnce).to.be.false;
                        passwordResetRequestProducerStub.resetHistory();
                        done();
                    });
            })
        });
        it('should not accept a request when an expired one exist', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then(() => {
                return models.PasswordRequests.create({
                    UserId: user.id,
                    expiredAt: new Date(new Date().getTime() - 60 * 60 * 48 * 1000)
                });
            }).then(() => {
                let body = {
                    email: 'test@testuser.com'
                };
                chai.request(server)
                    .post('/api/reset/request')
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(200);
                        expect(passwordResetRequestProducerStub.calledOnce).to.be.true;
                        passwordResetRequestProducerStub.resetHistory();
                        done();
                    });
            })
        });
    });

    /*
    * Test the /POST reset password
    */
    describe('/POST reset password', () => {
        it('should not accept a POST with an unknown id', (done) => {
            let body = {
                password: 'newtestpassword',
                token: 'unknownid'
            };
            chai.request(server)
                .post('/api/reset')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });
        it('should not accept a POST without a password', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then(() => {
                return models.PasswordRequests.create({
                    UserId: user.id
                });
            }).then((passwordRequest) => {
                let body = {
                    token: passwordRequest.token
                };
                chai.request(server)
                    .post('/api/reset')
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(422);
                        done();
                    });
            })
        });
        it('should not accept an expired token', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            const twentyFiveHoursAgo = new Date(new Date() - 1000 * 60 * 60 * 25 * 2);
            user.save().then(() => {
                return models.PasswordRequests.create({
                    UserId: user.id,
                    expiredAt: twentyFiveHoursAgo
                });
            }).then((passwordRequest) => {
                let body = {
                    password: 'newtestpassword',
                    token: passwordRequest.token
                };
                chai.request(server)
                    .post('/api/reset')
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(410);
                        done();
                    });
            })
        });
        it('should modify the user password', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then(() => {
                return models.PasswordRequests.create({
                    UserId: user.id,
                });
            }).then((passwordRequest) => {
                let body = {
                    password: 'newtestpassword',
                    token: passwordRequest.token
                };
                chai.request(server)
                    .post('/api/reset')
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(200);
                        let loginBody = {
                            user: {
                                email: 'test@testuser.com',
                                password: 'newtestpassword',
                            }
                        };
                        chai.request(server)
                            .post('/api/login')
                            .send(loginBody)
                            .end((err, res) => {
                                res.should.have.status(200);
                                done();
                            });
                    });
            })
        });
    });
});