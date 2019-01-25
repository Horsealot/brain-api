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
                        res.should.have.status(401);
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
    * Test the /GET users route
    */
    describe('/GET user', () => {
        it('should not accept a GET when unauthentified', (done) => {
            chai.request(server)
                .get('/api/user/1')
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
                    .get('/api/user/1')
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
                    .get('/api/user/5c4ae60ce24c6d20936f9264')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            })
        });
        it('should return 404 on a not found', (done) => {
            let user = new UsersModel({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            let user2 = new UsersModel({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            user.save().then((user) => {
                return user2.save();
            }).then(() => {
                chai.request(server)
                    .get('/api/user/' + user2.id)
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('user');
                        res.body.user.should.have.property('email').eql(user2.email);
                        res.body.user.should.have.property('firstname').eql(user2.firstname);
                        res.body.user.should.have.property('lastname').eql(user2.lastname);
                        res.body.user.should.have.not.property('token');
                        res.body.user.should.have.property('_id').eql(user2.id);
                        done();
                    });
            })
        });
    });
});