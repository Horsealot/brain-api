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
    * Test the /POST invite route
    */
    describe('/POST invite', () => {
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
        it('should not accept a POST invite on an existing user', (done) => {
            let body = {
                email: "test@testuser.com"
            };
            let user = new models.Users({email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.setRoles("ADMIN");
            user.save().then((user) => {
                chai.request(server)
                    .post('/api/invite')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(409);
                        done();
                    });
            })
        });
        it('should accept a POST invite from an Admin', (done) => {
            let body = {
                email: "mynewuser@testuser.com"
            };

            const signupProducerStub = sinon.stub(notificationProducer, "signup").returns();
            let user = new models.Users({email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.setRoles("ADMIN");
            user.save().then((user) => {
                chai.request(server)
                    .post('/api/invite')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send(body)
                    .end((err, res) => {
                        expect(signupProducerStub.calledOnce).to.be.true;
                        res.should.have.status(200);
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