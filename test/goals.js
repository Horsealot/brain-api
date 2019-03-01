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
describe('Goals', () => {
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
    * Test the /POST goals route
    */
    describe('/POST goals', () => {
        it('should return 401 when unauthentified', (done) => {
            chai.request(server)
                .post('/api/goals')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return 422 when mandatory data is missing', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({})
                    .end((err, res) => {
                        res.should.have.status(422);
                        done();
                    });
            });
        });
        it('should return 422 when mandatory data is incomplete', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({goal: ''})
                    .end((err, res) => {
                        res.should.have.status(422);
                        done();
                    });
            });
        });
        it('should return 400 when there is no active period', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            period.destroy({}).then(() => {
                return user1.save();
            }).then((user1) => {
                chai.request(server)
                    .post('/api/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({goal: 'fdsfsd'})
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            });
        });
        it('should return the goal when post is successful', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({goal: 'My goal'})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goal');
                        res.body.goal.should.be.a('object');
                        res.body.goal.should.have.property('value').eql('My goal');
                        res.body.goal.should.have.property('id');

                        models.UserGoals.findOne({where: {UserId: user1.id}}).then((goal) => {
                            expect(goal).to.be.an('object');
                            goal = goal.toJSON();
                            goal.should.have.property('id').eql(res.body.goal.id);
                            goal.should.have.property('value').eql(res.body.goal.value);
                            done();
                        });
                    });
            });
        });
        it('should return the created goal when user already have other goals', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            const existingGoal = new models.UserGoals({value: 'Existing goal'});
            user1.save().then((user1) => {
                existingGoal.UserId = user1.id;
                existingGoal.PeriodId = period.id;
                return existingGoal.save();
            }).then((existingGoal) => {
                chai.request(server)
                    .post('/api/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({goal: 'My goal'})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goal');
                        res.body.goal.should.be.a('object');
                        res.body.goal.should.have.property('value').eql('My goal');
                        res.body.goal.should.have.property('id');

                        models.UserGoals.findOne({where: {value: 'My goal'}}).then((goal) => {
                            expect(goal).to.be.an('object');
                            expect(goal.UserId).to.be.eql(user1.id);
                            goal = goal.toJSON();
                            goal.should.have.property('id').eql(res.body.goal.id);
                            done();
                        });
                    });
            });
        });
    });

    /*
    * Test the /POST goals/:id route
    */
    describe('/POST goals', () => {
        it('should return 401 when unauthentified', (done) => {
            chai.request(server)
                .post('/api/goals/1')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return 404 on an unknown goal', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/goals/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({goal: 'New goal'})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should return 422 when mandatory data is missing', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'My goal'});
            user1.save().then((user1) => {
                goal.UserId = user1.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .post('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({})
                    .end((err, res) => {
                        res.should.have.status(422);
                        done();
                    });
            });
        });
        it('should return 403 when a user try to modify another user\'s goal', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let user2 = new models.Users({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            let goal = new models.UserGoals({value: 'My goal'});
            user1.save().then((user1) => {
                return user2.save();
            }).then((user2) => {
                goal.UserId = user1.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .post('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user2.toAuthJSON().token)
                    .send({goal: 'New goal'})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return 403 when a squad admin try to modify a squad member goal', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let user2 = new models.Users({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            let goal = new models.UserGoals({value: 'My goal'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return user2.save();
            }).then((user2) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                user2.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user2.save();
            }).then((user2) => {
                goal.UserId = user1.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .post('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user2.toAuthJSON().token)
                    .send({goal: 'New goal'})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return 400 when the period is expired', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'My goal'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            const expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                goal.UserId = user1.id;
                goal.PeriodId = expiredPeriod.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .post('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({goal: 'New goal'})
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            });
        });
        it('should return 400 when there is no current period', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'My goal'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            const expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});
            user1.save().then((user1) => {
                return period.destroy();
            }).then(() => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                goal.UserId = user1.id;
                goal.PeriodId = expiredPeriod.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .post('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({goal: 'New goal'})
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            });
        });
        it('should modify when the request come from the right user', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'My goal'});
            user1.save().then((user1) => {
                goal.UserId = user1.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .post('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({goal: 'New goal'})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goal');
                        res.body.goal.should.be.a('object');
                        res.body.goal.should.have.property('value').eql('New goal');
                        res.body.goal.should.have.property('id').eql(goal.id);

                        models.UserGoals.findOne({where: {id: goal.id, UserId: user1.id}}).then((goal) => {
                            expect(goal).to.be.an('object');
                            goal = goal.toJSON();
                            goal.should.have.property('id').eql(res.body.goal.id);
                            goal.should.have.property('value').eql(res.body.goal.value);
                            done();
                        });
                    });
            });
        });
        it('should modify when the request come from a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let user2 = new models.Users({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            let goal = new models.UserGoals({value: 'My goal'});
            user1.save().then((user1) => {
                return user2.save();
            }).then((user2) => {
                goal.UserId = user2.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .post('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({goal: 'New goal'})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goal');
                        res.body.goal.should.be.a('object');
                        res.body.goal.should.have.property('value').eql('New goal');
                        res.body.goal.should.have.property('id').eql(goal.id);

                        models.UserGoals.findOne({where: {id: goal.id, UserId: user2.id}}).then((goal) => {
                            expect(goal).to.be.an('object');
                            goal = goal.toJSON();
                            goal.should.have.property('id').eql(res.body.goal.id);
                            goal.should.have.property('value').eql(res.body.goal.value);
                            done();
                        });
                    });
            });
        });
    });

    /*
    * Test the /DELETE goals/:id route
    */
    describe('/DELETE goals', () => {
        it('should return 401 when unauthentified', (done) => {
            chai.request(server)
                .delete('/api/goals/1')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return 404 on an unknown goal', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            user1.save().then((user1) => {
                chai.request(server)
                    .delete('/api/goals/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should return 403 when a user try to delete another user\'s goal', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let user2 = new models.Users({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            let goal = new models.UserGoals({value: 'My goal'});
            user1.save().then((user1) => {
                return user2.save();
            }).then((user2) => {
                goal.UserId = user1.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .delete('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user2.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        models.UserGoals.findOne({where: {id: goal.id}}).then((goal) => {
                            expect(goal).to.be.an('object');
                            done();
                        });
                    });
            });
        });
        it('should return 403 when a squad admin try to delete a squad member goal', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let user2 = new models.Users({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            let goal = new models.UserGoals({value: 'My goal'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return user2.save();
            }).then((user2) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                user2.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user2.save();
            }).then((user2) => {
                goal.UserId = user1.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .delete('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user2.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        models.UserGoals.findOne({where: {id: goal.id}}).then((goal) => {
                            expect(goal).to.be.an('object');
                            done();
                        });
                    });
            });
        });
        it('should delete when the request come from the right user', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'My goal'});
            user1.save().then((user1) => {
                goal.UserId = user1.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .delete('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);

                        models.UserGoals.findOne({where: {id: goal.id}}).then((goal) => {
                            expect(goal).to.be.null;
                            done();
                        });
                    });
            });
        });
        it('should return 400 when the period is expired', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'My goal'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            const expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});
            user1.save().then((user1) => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                goal.UserId = user1.id;
                goal.PeriodId = expiredPeriod.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .delete('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            });
        });
        it('should return 400 when there is no active period', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'My goal'});
            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 120);
            endDate.setDate(endDate.getDate() - 60);
            const expiredPeriod = new models.Periods({name: 'Jan - Mars 2019', startDate: startDate, endDate: endDate});
            user1.save().then((user1) => {
                return period.destroy();
            }).then(() => {
                return expiredPeriod.save();
            }).then((expiredPeriod) => {
                goal.UserId = user1.id;
                goal.PeriodId = expiredPeriod.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .delete('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            });
        });
        it('should delete when the request come from a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let user2 = new models.Users({ email: "test2@testuser.com", password: "testpassword", firstname: 'Test2', lastname: 'User2'});
            let goal = new models.UserGoals({value: 'My goal'});
            user1.save().then((user1) => {
                return user2.save();
            }).then((user2) => {
                goal.UserId = user2.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .delete('/api/goals/' + goal.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);

                        models.UserGoals.findOne({where: {id: goal.id}}).then((goal) => {
                            expect(goal).to.be.null;
                            done();
                        });
                    });
            });
        });
    });



    /*
    * Test the /GET my goals route
    */
    describe('/GET my goals', () => {
        it('should return 401 when unauthentified', (done) => {
            chai.request(server)
                .get('/api/goals')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return 400 if there is no active period', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            user1.save().then((user1) => {
                return period.destroy();
            }).then(() => {
                chai.request(server)
                    .get('/api/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            });
        });
        it('should return an empty list if the user has no goal yet', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            user1.save().then((user1) => {
                chai.request(server)
                    .get('/api/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goals').eql([]);
                        done();
                    });
            });
        });
        it('should return one goal if the user has one', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'goal1'});
            user1.save().then((user1) => {
                goal.UserId = user1.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                chai.request(server)
                    .get('/api/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goals');
                        res.body.goals.should.be.a('array');
                        res.body.goals[0].should.be.a('object');
                        res.body.goals[0].should.have.property('value').eql('goal1');
                        res.body.goals[0].should.have.property('id').eql(goal.id);
                        done();
                    });
            });
        });
        it('should return all user\'s goals if the user has more than one', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal1 = new models.UserGoals({value: 'goal1'});
            let goal2 = new models.UserGoals({value: 'goal2'});
            user1.save().then((user1) => {
                goal1.UserId = user1.id;
                goal1.PeriodId = period.id;
                return goal1.save();
            }).then((goal1) => {
                goal2.UserId = user1.id;
                goal2.PeriodId = period.id;
                return goal2.save();
            }).then((goal2) => {
                chai.request(server)
                    .get('/api/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goals');
                        res.body.goals.should.be.a('array');
                        expect(res.body.goals).to.deep.include({id: goal1.id, value: goal1.value});
                        expect(res.body.goals).to.deep.include({id: goal2.id, value: goal2.value});
                        done();
                    });
            });
        });
    });



    /*
    * Test the /GET users goals route
    */
    describe('/GET users goals', () => {
        it('should return 401 when unauthentified', (done) => {
            chai.request(server)
                .get('/api/users/1/goals')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should return 403 when not a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            user1.save().then((user1) => {
                chai.request(server)
                    .get('/api/users/' + user1.id + '/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return 403 when a squad admin', (done) => {
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
                    .get('/api/users/' + user1.id + '/goals')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should return an empty list if the user has no goal yet', (done) => {
            let superAdmin = new models.Users({ email: "superAdmin@testuser.com", password: "testpassword", firstname: 'superAdmin', lastname: 'superAdmin', roles: ['ADMIN']});
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'My goal'});
            user1.save().then((user1) => {
                return superAdmin.save();
            }).then((superAdmin) => {
                chai.request(server)
                    .get('/api/users/' + user1.id + '/goals')
                    .set('Authorization', 'Bearer ' + superAdmin.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goals').eql([]);
                        done();
                    });
            });
        });
        it('should return 400 when there is no active period', (done) => {
            let superAdmin = new models.Users({ email: "superAdmin@testuser.com", password: "testpassword", firstname: 'superAdmin', lastname: 'superAdmin', roles: ['ADMIN']});
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'My goal'});
            user1.save().then((user1) => {
                return period.destroy();
            }).then(() => {
                return superAdmin.save();
            }).then((superAdmin) => {
                chai.request(server)
                    .get('/api/users/' + user1.id + '/goals')
                    .set('Authorization', 'Bearer ' + superAdmin.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            });
        });
        it('should return one goal if the user has one', (done) => {
            let superAdmin = new models.Users({ email: "superAdmin@testuser.com", password: "testpassword", firstname: 'superAdmin', lastname: 'superAdmin', roles: ['ADMIN']});
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal = new models.UserGoals({value: 'goal1'});
            user1.save().then((user1) => {
                goal.UserId = user1.id;
                goal.PeriodId = period.id;
                return goal.save();
            }).then((goal) => {
                return superAdmin.save();
            }).then((superAdmin) => {
                chai.request(server)
                    .get('/api/users/' + user1.id + '/goals')
                    .set('Authorization', 'Bearer ' + superAdmin.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goals');
                        res.body.goals.should.be.a('array');
                        res.body.goals[0].should.be.a('object');
                        res.body.goals[0].should.have.property('value').eql('goal1');
                        res.body.goals[0].should.have.property('id').eql(goal.id);
                        done();
                    });
            });
        });
        it('should return all user\'s goals if the user has more than one', (done) => {
            let superAdmin = new models.Users({ email: "superAdmin@testuser.com", password: "testpassword", firstname: 'superAdmin', lastname: 'superAdmin', roles: ['ADMIN']});
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let goal1 = new models.UserGoals({value: 'goal1'});
            let goal2 = new models.UserGoals({value: 'goal2'});
            user1.save().then((user1) => {
                goal1.UserId = user1.id;
                goal1.PeriodId = period.id;
                return goal1.save();
            }).then((goal1) => {
                goal2.UserId = user1.id;
                goal2.PeriodId = period.id;
                return goal2.save();
            }).then((goal2) => {
                return superAdmin.save();
            }).then((superAdmin) => {
                chai.request(server)
                    .get('/api/users/' + user1.id + '/goals')
                    .set('Authorization', 'Bearer ' + superAdmin.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('goals');
                        res.body.goals.should.be.a('array');
                        expect(res.body.goals).to.deep.include({id: goal1.id, value: goal1.value});
                        expect(res.body.goals).to.deep.include({id: goal2.id, value: goal2.value});
                        done();
                    });
            });
        });
    });
});