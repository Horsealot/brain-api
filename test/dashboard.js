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
describe('Dashboards', () => {
    beforeEach((done) => { //Before each test we empty the database
        preTest.cleanDB().then(() => {
            done();
        });
    });

    /*
    * Test the /POST dashboards route
    */
    describe('/POST dashboards', () => {
        it('should not accept a POST when unauthentified', (done) => {
            chai.request(server)
                .post('/api/dashboards')
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
                    .post('/api/dashboards')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST with a productId for a non super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/dashboards')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard', productId: 1}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST with a productId for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
                return user1.save();
            }).then((user1) => {
                chai.request(server)
                    .post('/api/dashboards')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard', productId: 1}})
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
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
                return user1.save();
            }).then((user1) => {
                chai.request(server)
                    .post('/api/dashboards')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('dashboard');
                        res.body.dashboard.should.be.a('object');
                        res.body.dashboard.should.have.property('name').eql('New dashboard');
                        models.Dashboards.findOne({where: {SquadId: squad1.id}}).then((dashboard) => {
                            expect(dashboard).to.be.an('object');
                            dashboard = dashboard.toJSON();
                            dashboard.should.have.property('name').eql('New dashboard');
                            dashboard.should.have.property('ProductId').eql(null);
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
                user1.addSquad(squad1, {through: {role: 'USER'}})
                return user1.save();
            }).then((user1) => {
                chai.request(server)
                    .post('/api/dashboards')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('dashboard');
                        res.body.dashboard.should.be.a('object');
                        res.body.dashboard.should.have.property('name').eql('New dashboard');
                        models.Dashboards.findOne({where: {SquadId: squad1.id}}).then((dashboard) => {
                            expect(dashboard).to.be.an('object');
                            dashboard = dashboard.toJSON();
                            dashboard.should.have.property('name').eql('New dashboard');
                            dashboard.should.have.property('ProductId').eql(null);
                            done();
                        });
                    });
            });
        });
        it('should return 404 on an unknown productId', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
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
                    .post('/api/dashboards')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard', productId: 1}})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should accept a POST with a productId for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let product = new models.Products({name: 'New product'});
            user1.save().then((user1) => {
                return product.save();
            }).then((product) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                chai.request(server)
                    .post('/api/dashboards')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard', productId: product.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('dashboard');
                        res.body.dashboard.should.be.a('object');
                        res.body.dashboard.should.have.property('name').eql('New dashboard');
                        models.Dashboards.findOne({where: {ProductId: product.id}}).then((dashboard) => {
                            expect(dashboard).to.be.an('object');
                            dashboard = dashboard.toJSON();
                            dashboard.should.have.property('name').eql('New dashboard');
                            dashboard.should.have.property('ProductId').eql(product.id);
                            dashboard.should.have.property('SquadId').eql(null);
                            done();
                        });
                    });
            });
        });
    });

    /*
    * Test the /POST dashboards/:id route
    */
    describe('/POST dashboards/:id', () => {

        it('should return 400 for an invalid id', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/dashboards/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            });
        });

        it('should return 404 for an unknown dashboard', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                chai.request(server)
                    .post('/api/dashboards/47b454e9-f0e4-4c0f-9ef1-72ca01600816')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should not accept a POST with a squadId for a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                dashboard.SquadId = squad1.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .post('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard name'}, modules: []})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST with a squadId for a squad member not admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                dashboard.SquadId = squad1.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .post('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard name'}, modules: []})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST with a productId for a non super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let product = new models.Products({name: 'New product'});
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return product.save();
            }).then((product) => {
                dashboard.ProductId = product.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .post('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard name'}, modules: []})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a POST with a productId for a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let product = new models.Products({name: 'New product'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
                return user1.save();
            }).then((user1) => {
                dashboard.ProductId = product.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .post('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard name'}, modules: []})
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
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
                return user1.save();
            }).then((user1) => {
                dashboard.SquadId = squad1.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .post('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard name'}, modules: []})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('dashboard');
                        res.body.dashboard.should.be.a('object');
                        res.body.dashboard.should.have.property('name').eql('New dashboard name');
                        models.Dashboards.findOne({where: {SquadId: squad1.id}}).then((dashboard) => {
                            expect(dashboard).to.be.an('object');
                            dashboard = dashboard.toJSON();
                            dashboard.should.have.property('name').eql('New dashboard name');
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
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}})
                return user1.save();
            }).then((user1) => {
                dashboard.SquadId = squad1.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .post('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard name'}, modules: []})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('dashboard');
                        res.body.dashboard.should.be.a('object');
                        res.body.dashboard.should.have.property('name').eql('New dashboard name');
                        models.Dashboards.findOne({where: {SquadId: squad1.id}}).then((dashboard) => {
                            expect(dashboard).to.be.an('object');
                            dashboard = dashboard.toJSON();
                            dashboard.should.have.property('name').eql('New dashboard name');
                            done();
                        });
                    });
            });
        });
        it('should accept a POST with new modules', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}})
                return user1.save();
            }).then((user1) => {
                dashboard.SquadId = squad1.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .post('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({dashboard: {name: 'New dashboard name'}, modules: []})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('dashboard');
                        res.body.dashboard.should.be.a('object');
                        res.body.dashboard.should.have.property('name').eql('New dashboard name');
                        models.Dashboards.findOne({where: {SquadId: squad1.id}}).then((dashboard) => {
                            expect(dashboard).to.be.an('object');
                            dashboard = dashboard.toJSON();
                            dashboard.should.have.property('name').eql('New dashboard name');
                            done();
                        });
                    });
            });
        });
        // it('should modify an existing category POST', (done) => {
        //     let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
        //     let category = new models.ToolCategories({name: 'Category', order: 1});
        //     user1.save().then((user1) => {
        //         category.UserId = user1.id;
        //         return category.save();
        //     }).then(() => {
        //         chai.request(server)
        //             .post('/api/tools/category/' + category.id)
        //             .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
        //             .send({category: {name: 'New category name', order: 2}})
        //             .end((err, res) => {
        //                 res.should.have.status(200);
        //                 res.should.be.json;
        //                 res.body.should.be.a('object');
        //                 res.body.should.have.property('category');
        //                 res.body.category.should.be.a('object');
        //                 res.body.category.should.have.property('name').eql('New category name');
        //                 models.ToolCategories.findOne({where: {UserId: user1.id}}).then((toolCategory) => {
        //                     expect(toolCategory).to.be.an('object');
        //                     toolCategory = toolCategory.toJSON();
        //                     toolCategory.should.have.property('name').eql('New category name');
        //                     toolCategory.should.have.property('order').eql(2);
        //                     toolCategory.should.have.property('SquadId').eql(null);
        //                     done();
        //                 });
        //             });
        //     });
        // });
        // it('should not accept a modify POST with a squadId for a non squad admin or super admin', (done) => {
        //     let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
        //     let squad1 = new models.Squads({
        //         name: 'squad1',
        //         slug: 'squad1'
        //     });
        //     let category = new models.ToolCategories({name: 'Category', order: 1});
        //     user1.save().then((user1) => {
        //         return squad1.save();
        //     }).then((squad1) => {
        //         category.SquadId = squad1.id;
        //         return category.save();
        //     }).then(() => {
        //         chai.request(server)
        //             .post('/api/tools/category/' + category.id)
        //             .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
        //             .send({category: {name: 'New category name', order: 2, squadId: squad1.id}})
        //             .end((err, res) => {
        //                 res.should.have.status(403);
        //                 done();
        //             });
        //     });
        // });
        // it('should not accept a modify POST with a squadId for a non squad admin or super admin', (done) => {
        //     let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
        //     let squad1 = new models.Squads({
        //         name: 'squad1',
        //         slug: 'squad1'
        //     });
        //     let category = new models.ToolCategories({name: 'Category', order: 1});
        //     user1.save().then((user1) => {
        //         return squad1.save();
        //     }).then((squad1) => {
        //         user1.addSquad(squad1, {through: {role: 'ADMIN'}})
        //         return user1.save();
        //     }).then((user1) => {
        //         category.SquadId = squad1.id;
        //         return category.save();
        //     }).then(() => {
        //         chai.request(server)
        //             .post('/api/tools/category/' + category.id)
        //             .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
        //             .send({category: {name: 'New category name', order: 2, squadId: squad1.id}})
        //             .end((err, res) => {
        //                 res.should.have.status(200);
        //                 res.should.be.json;
        //                 res.body.should.be.a('object');
        //                 res.body.should.have.property('category');
        //                 res.body.category.should.be.a('object');
        //                 res.body.category.should.have.property('name').eql('New category name');
        //                 models.ToolCategories.findOne({where: {SquadId: squad1.id}}).then((toolCategory) => {
        //                     expect(toolCategory).to.be.an('object');
        //                     toolCategory = toolCategory.toJSON();
        //                     toolCategory.should.have.property('name').eql('New category name');
        //                     toolCategory.should.have.property('order').eql(2);
        //                     toolCategory.should.have.property('UserId').eql(null);
        //                     done();
        //                 });
        //             });
        //     });
        // });
        // it('should not accept a modify POST with a squadId for a non squad admin or super admin', (done) => {
        //     let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
        //     let squad1 = new models.Squads({
        //         name: 'squad1',
        //         slug: 'squad1'
        //     });
        //     let category = new models.ToolCategories({name: 'Category', order: 1});
        //     user1.save().then((user1) => {
        //         return squad1.save();
        //     }).then((squad1) => {
        //         user1.addSquad(squad1, {through: {role: 'USER'}})
        //         return user1.save();
        //     }).then((user1) => {
        //         category.SquadId = squad1.id;
        //         return category.save();
        //     }).then(() => {
        //         chai.request(server)
        //             .post('/api/tools/category/' + category.id)
        //             .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
        //             .send({category: {name: 'New category name', order: 2, squadId: squad1.id}})
        //             .end((err, res) => {
        //                 res.should.have.status(403);
        //                 done();
        //             });
        //     });
        // });
        // it('should not accept a modify POST with a squadId for a non squad admin or super admin', (done) => {
        //     let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
        //     let squad1 = new models.Squads({
        //         name: 'squad1',
        //         slug: 'squad1'
        //     });
        //     let category = new models.ToolCategories({name: 'Category', order: 1});
        //     user1.save().then((user1) => {
        //         return squad1.save();
        //     }).then((squad1) => {
        //         category.SquadId = squad1.id;
        //         return category.save();
        //     }).then(() => {
        //         chai.request(server)
        //             .post('/api/tools/category/' + category.id)
        //             .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
        //             .send({category: {name: 'New category name', order: 2, squadId: squad1.id}})
        //             .end((err, res) => {
        //                 res.should.have.status(200);
        //                 res.should.be.json;
        //                 res.body.should.be.a('object');
        //                 res.body.should.have.property('category');
        //                 res.body.category.should.be.a('object');
        //                 res.body.category.should.have.property('name').eql('New category name');
        //                 models.ToolCategories.findOne({where: {SquadId: squad1.id}}).then((toolCategory) => {
        //                     expect(toolCategory).to.be.an('object');
        //                     toolCategory = toolCategory.toJSON();
        //                     toolCategory.should.have.property('name').eql('New category name');
        //                     toolCategory.should.have.property('order').eql(2);
        //                     toolCategory.should.have.property('UserId').eql(null);
        //                     done();
        //                 });
        //             });
        //     });
        // });
    });

    /*
    * Test the /DELETE dashboards/:id route
    */
    describe('/DELETE dashboards/:id', () => {

        it('should return 400 for an invalid id', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .delete('/api/dashboards/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(400);
                        done();
                    });
            });
        });
        it('should return 404 for an unknown dashboard', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .delete('/api/dashboards/47b454e9-f0e4-4c0f-9ef1-72ca01600816')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should not accept a DELETE on a dashboard belonging to a squad from a non squad admin nor super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                dashboard.SquadId = squad1.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .delete('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        models.Dashboards.findOne({where: {id: dashboard.id}}).then((dbDashboard) => {
                            expect(dbDashboard).to.be.not.null;
                            done();
                        });
                    });
            });
        });
        it('should accept a DELETE on a dashboard linked to a squad from a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
                return user1.save();
            }).then((user1) => {
                dashboard.SquadId = squad1.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .delete('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Dashboards.findOne({where: {id: dashboard.id}}).then((dbDashboard) => {
                            expect(dbDashboard).to.be.null;
                            done();
                        });
                    });
            });
        });
        it('should not accept a DELETE on a dashboard linked to a squad from a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}})
                return user1.save();
            }).then((user1) => {
                dashboard.SquadId = squad1.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .delete('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        models.Dashboards.findOne({where: {id: dashboard.id}}).then((dbDashboard) => {
                            expect(dbDashboard).to.be.not.null;
                            done();
                        });
                    });
            });
        });
        it('should accept a DELETE on a tool linked to a squad from a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let dashboard = new models.Dashboards({
                name: 'New dashboard'
            });
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                dashboard.SquadId = squad1.id;
                return dashboard.save();
            }).then((dashboard) => {
                chai.request(server)
                    .delete('/api/dashboards/' + dashboard.publicId)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Dashboards.findOne({where: {id: dashboard.id}}).then((dbDashboard) => {
                            expect(dbDashboard).to.be.null;
                            done();
                        });
                    });
            });
        });
    });

});