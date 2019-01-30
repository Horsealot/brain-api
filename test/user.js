//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let mongoose = require("mongoose");
//Require the dev-dependencies
let chai = require('chai');
let expect = chai.expect;
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
let sinon = require('sinon');

let Users = require('./../models/Users');
let Invites = require('./../models/Invites');
let PasswordRequests = require('./../models/PasswordRequests');
const UserRole = require('./../models/UserRole');
const InvitesModel = mongoose.model('Invites');
const UsersModel = mongoose.model('Users');
const PasswordRequestsModel = mongoose.model('PasswordRequests');

chai.use(chaiHttp);
//Our parent block
describe('Auth', () => {
    beforeEach((done) => { //Before each test we empty the database
        UsersModel.deleteMany({}, (err) => {
        }).then(() => {
            return InvitesModel.deleteMany({});
        }).then(() => {
            return PasswordRequestsModel.deleteMany({});
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
            let user = new UsersModel({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
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
            let user = new UsersModel({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            let user2 = new UsersModel({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
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
                        res.body.users[0].should.have.property('_id').eql(user.id);
                        res.body.users[1].should.have.property('email').eql(user2.email);
                        res.body.users[1].should.have.property('firstname').eql(user2.firstname);
                        res.body.users[1].should.have.property('lastname').eql(user2.lastname);
                        // res.body.users[1].should.have.property('squads').eql(user2.squads);
                        // res.body.users[1].should.have.property('roles').eql(user2.roles);
                        res.body.users[1].should.not.have.property('token');
                        res.body.users[1].should.have.property('_id').eql(user2.id);
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
            let user = new UsersModel({ email: "test@testuser.com", picture: 'picture1', password: "testpassword", firstname: 'Test', lastname: 'User', squads: ['SQUAD1']});
            let user2 = new UsersModel({ email: "test2@testuser.com", picture: 'picture2', password: "testpassword", firstname: 'Test2', lastname: 'User2', squads: ['SQUAD2']});
            user.save().then((user) => {
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
                        res.body.squads.should.have.property('SQUAD1');
                        res.body.squads.SQUAD1.should.be.a('array');
                        res.body.squads.should.have.property('SQUAD2');
                        res.body.squads.SQUAD2.should.be.a('array');
                        // User 1
                        res.body.squads.SQUAD1[0].should.not.have.property('email');
                        res.body.squads.SQUAD1[0].should.have.property('firstname').eql(user.firstname);
                        res.body.squads.SQUAD1[0].should.have.property('lastname').eql(user.lastname);
                        res.body.squads.SQUAD1[0].should.have.property('picture').eql(user.picture);
                        res.body.squads.SQUAD1[0].should.have.property('squads');
                        res.body.squads.SQUAD1[0].should.not.have.property('roles');
                        res.body.squads.SQUAD1[0].should.not.have.property('token');
                        res.body.squads.SQUAD1[0].should.have.property('_id').eql(user.id);
                        // User 2
                        res.body.squads.SQUAD2[0].should.not.have.property('email');
                        res.body.squads.SQUAD2[0].should.have.property('firstname').eql(user2.firstname);
                        res.body.squads.SQUAD2[0].should.have.property('lastname').eql(user2.lastname);
                        res.body.squads.SQUAD2[0].should.have.property('picture').eql(user2.picture);
                        res.body.squads.SQUAD2[0].should.have.property('squads');
                        res.body.squads.SQUAD2[0].should.not.have.property('roles');
                        res.body.squads.SQUAD2[0].should.not.have.property('token');
                        res.body.squads.SQUAD2[0].should.have.property('_id').eql(user2.id);
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
            let user = new UsersModel({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
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
            let user = new UsersModel({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                chai.request(server)
                    .get('/api/users/5c4ae60ce24c6d20936f9264')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            })
        });
        it('should return the user', (done) => {
            let user = new UsersModel({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            let user2 = new UsersModel({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            user.save().then((user) => {
                return user2.save();
            }).then(() => {
                chai.request(server)
                    .get('/api/users/' + user2.id)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('user');
                        res.body.user.should.have.property('firstname').eql(user2.firstname);
                        res.body.user.should.have.property('lastname').eql(user2.lastname);
                        res.body.user.should.have.not.property('token');
                        res.body.user.should.have.property('_id').eql(user2.id);
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
            let user = new UsersModel({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
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
            let user = new UsersModel({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            user.save().then((user) => {
                let body = {
                    user: {
                        firstname: 'fn',
                        lastname: 'ln'
                    }
                };
                chai.request(server)
                    .post('/api/users/5c4ae60ce24c6d20936f9264')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send(body)
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            })
        });
        it('should update when the request come from a user', (done) => {
            let user = new UsersModel({
                email: "test@testuser.com",
                password: "testpassword",
                firstname: 'Test',
                lastname: 'User',
                picture: 'picture',
                description: 'description',
                jobTitle: 'jobTitle',
                scorecard: 'scorecard',
                roles: ['USER'],
                squads: ['SQUAD'],
            });
            user.save().then((user) => {
                let body = {
                    user: {
                        firstname: 'newfirstname',
                        lastname: 'newlastname',
                        picture: 'newPicture',
                        description: 'newDescription',
                        jobTitle: 'newJobTitle',
                        scorecard: 'newScorecard',
                        roles: ['USER', 'ADMIN', 'OTHER'],
                        squads: ['SQUAD', 'SQUAD2'],
                    }
                };
                chai.request(server)
                    .post('/api/users/' + user.id)
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

                        UsersModel.findById(user._id).then((user) => {
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
                            user.should.have.property('squads').that.includes("SQUAD");
                            user.should.have.property('roles').that.not.includes("SQUAD2");
                            done();
                        });
                    });
            });
        });
        it('should update when the request come from an admin', (done) => {
            let user = new UsersModel({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User', roles: ["ADMIN"]});
            let user2 = new UsersModel({
                email: "test2@testuser.com",
                password: "testpassword2",
                firstname: 'Test2',
                lastname: 'User2',
                picture: 'picture2',
                description: 'description2',
                jobTitle: 'jobTitle2',
                scorecard: 'scorecard2',
                roles: ['USER'],
                squads: ['SQUAD'],
            });
            user.save().then((user) => {
                return user2.save();
            }).then(() => {
                let body = {
                    user: {
                        firstname: 'newfirstname',
                        lastname: 'newlastname',
                        picture: 'newPicture',
                        description: 'newDescription',
                        jobTitle: 'newJobTitle',
                        scorecard: 'newScorecard',
                        roles: ['USER', 'ADMIN', 'OTHER'],
                        squads: ['SQUAD', 'SQUAD2'],
                    }
                };
                chai.request(server)
                    .post('/api/users/' + user2.id)
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

                        UsersModel.findById(user2._id).then((user) => {
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
                            user.should.have.property('squads').that.includes("SQUAD");
                            user.should.have.property('squads').that.includes("SQUAD2");
                            done();
                        });
                    });
            })
        });
    });
});