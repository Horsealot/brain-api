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
describe('Tools', () => {
    beforeEach((done) => { //Before each test we empty the database
        preTest.cleanDB().then(() => {
            done();
        });
    });

    /*
    * Test the /POST category route
    */
    describe('/POST category', () => {
        it('should not accept a POST when unauthentified', (done) => {
            chai.request(server)
                .post('/api/tools/category')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should accept a POST', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/tools/category')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('category');
                        res.body.category.should.be.a('object');
                        res.body.category.should.have.property('name').eql('New category');
                        models.ToolCategories.findOne({where: {UserId: user1.id}}).then((toolCategory) => {
                            expect(toolCategory).to.be.an('object');
                            toolCategory = toolCategory.toJSON();
                            toolCategory.should.have.property('name').eql('New category');
                            toolCategory.should.have.property('SquadId').eql(null);
                            done();
                        });
                    });
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
                    .post('/api/tools/category')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category', squadId: squad1.id}})
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
                    .post('/api/tools/category')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('category');
                        res.body.category.should.be.a('object');
                        res.body.category.should.have.property('name').eql('New category');
                        models.ToolCategories.findOne({where: {SquadId: squad1.id}}).then((toolCategory) => {
                            expect(toolCategory).to.be.an('object');
                            toolCategory = toolCategory.toJSON();
                            toolCategory.should.have.property('name').eql('New category');
                            toolCategory.should.have.property('UserId').eql(null);
                            done();
                        });
                    });
            });
        });
        it('should accept not a POST with a squadId for a squad member', (done) => {
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
                    .post('/api/tools/category')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
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
                    .post('/api/tools/category')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category', squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('category');
                        res.body.category.should.be.a('object');
                        res.body.category.should.have.property('name').eql('New category');
                        models.ToolCategories.findOne({where: {SquadId: squad1.id}}).then((toolCategory) => {
                            expect(toolCategory).to.be.an('object');
                            toolCategory = toolCategory.toJSON();
                            toolCategory.should.have.property('name').eql('New category');
                            toolCategory.should.have.property('UserId').eql(null);
                            done();
                        });
                    });
            });
        });
        it('should return 404 for an unknown squad', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/tools/category')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category', squadId: 1}})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });

    });

    /*
    * Test the /POST category/:id route
    */
    describe('/POST category/:id', () => {

        it('should return 404 for a category when modifying', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/tools/category/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category'}})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should modify an existing category POST', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                category.UserId = user1.id;
                return category.save();
            }).then(() => {
                chai.request(server)
                    .post('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category name', order: 2}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('category');
                        res.body.category.should.be.a('object');
                        res.body.category.should.have.property('name').eql('New category name');
                        models.ToolCategories.findOne({where: {UserId: user1.id}}).then((toolCategory) => {
                            expect(toolCategory).to.be.an('object');
                            toolCategory = toolCategory.toJSON();
                            toolCategory.should.have.property('name').eql('New category name');
                            toolCategory.should.have.property('order').eql(2);
                            toolCategory.should.have.property('SquadId').eql(null);
                            done();
                        });
                    });
            });
        });
        it('should not accept a modify POST with a squadId for a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then(() => {
                chai.request(server)
                    .post('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category name', order: 2, squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a modify POST with a squadId for a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then(() => {
                chai.request(server)
                    .post('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category name', order: 2, squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('category');
                        res.body.category.should.be.a('object');
                        res.body.category.should.have.property('name').eql('New category name');
                        models.ToolCategories.findOne({where: {SquadId: squad1.id}}).then((toolCategory) => {
                            expect(toolCategory).to.be.an('object');
                            toolCategory = toolCategory.toJSON();
                            toolCategory.should.have.property('name').eql('New category name');
                            toolCategory.should.have.property('order').eql(2);
                            toolCategory.should.have.property('UserId').eql(null);
                            done();
                        });
                    });
            });
        });
        it('should not accept a modify POST with a squadId for a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then(() => {
                chai.request(server)
                    .post('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category name', order: 2, squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should not accept a modify POST with a squadId for a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then(() => {
                chai.request(server)
                    .post('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({category: {name: 'New category name', order: 2, squadId: squad1.id}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('category');
                        res.body.category.should.be.a('object');
                        res.body.category.should.have.property('name').eql('New category name');
                        models.ToolCategories.findOne({where: {SquadId: squad1.id}}).then((toolCategory) => {
                            expect(toolCategory).to.be.an('object');
                            toolCategory = toolCategory.toJSON();
                            toolCategory.should.have.property('name').eql('New category name');
                            toolCategory.should.have.property('order').eql(2);
                            toolCategory.should.have.property('UserId').eql(null);
                            done();
                        });
                    });
            });
        });
    });

    /*
    * Test the /POST Tools route
    */
    describe('/POST Tools', () => {
        it('should not accept a POST when unauthentified', (done) => {
            chai.request(server)
                .post('/api/tools')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should accept a POST on a category owned by the user', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                category.UserId = user1.id;
                return category.save();
            }).then((category) => {
                chai.request(server)
                    .post('/api/tools')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {categoryId: category.id, name: 'Tool', link: 'Link', icon: 'Icon'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('tool');
                        res.body.tool.should.be.a('object');
                        res.body.tool.should.have.property('name').eql('Tool');
                        res.body.tool.should.have.property('link').eql('Link');
                        res.body.tool.should.have.property('icon').eql('Icon');
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.an('object');
                            tool = tool.toJSON();
                            tool.should.have.property('name').eql('Tool');
                            tool.should.have.property('link').eql('Link');
                            tool.should.have.property('icon').eql('Icon');
                            done();
                        });
                    });
            });
        });
        it('should not accept a POST with a squadId for a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                chai.request(server)
                    .post('/api/tools')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {categoryId: category.id, name: 'Tool', link: 'Link', icon: 'Icon'}})
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
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                chai.request(server)
                    .post('/api/tools')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {categoryId: category.id, name: 'Tool', link: 'Link', icon: 'Icon'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('tool');
                        res.body.tool.should.be.a('object');
                        res.body.tool.should.have.property('name').eql('Tool');
                        res.body.tool.should.have.property('link').eql('Link');
                        res.body.tool.should.have.property('icon').eql('Icon');
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.an('object');
                            tool = tool.toJSON();
                            tool.should.have.property('name').eql('Tool');
                            tool.should.have.property('link').eql('Link');
                            tool.should.have.property('icon').eql('Icon');
                            done();
                        });
                    });
            });
        });
        it('should accept not a POST with a squadId for a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                chai.request(server)
                    .post('/api/tools')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {categoryId: category.id, name: 'Tool', link: 'Link', icon: 'Icon'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a POST with a squadId for a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                chai.request(server)
                    .post('/api/tools')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {categoryId: category.id, name: 'Tool', link: 'Link', icon: 'Icon'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('tool');
                        res.body.tool.should.be.a('object');
                        res.body.tool.should.have.property('name').eql('Tool');
                        res.body.tool.should.have.property('link').eql('Link');
                        res.body.tool.should.have.property('icon').eql('Icon');
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.an('object');
                            tool = tool.toJSON();
                            tool.should.have.property('name').eql('Tool');
                            tool.should.have.property('link').eql('Link');
                            tool.should.have.property('icon').eql('Icon');
                            done();
                        });
                    });
            });
        });
        it('should return 404 for an unknown category', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/tools')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {categoryId: 1, name: 'Tool', link: 'Link', icon: 'Icon'}})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });

    });

    /*
    * Test the /POST Tools/:id route
    */
    describe('/POST Tools/:id', () => {

        it('should return 404 for an unknown tool when modifying', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .post('/api/tools/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {name: 'Tool', link: 'Link', icon: 'Icon'}})
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should modify an existing tool POST', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                category.UserId = user1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then((tool) => {
                chai.request(server)
                    .post('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {name: 'New Tool', link: 'New Link', icon: 'New Icon'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('tool');
                        res.body.tool.should.be.a('object');
                        res.body.tool.should.have.property('name').eql('New Tool');
                        res.body.tool.should.have.property('link').eql('New Link');
                        res.body.tool.should.have.property('icon').eql('New Icon');
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.an('object');
                            tool = tool.toJSON();
                            tool.should.have.property('name').eql('New Tool');
                            tool.should.have.property('link').eql('New Link');
                            tool.should.have.property('icon').eql('New Icon');
                            done();
                        });
                    });
            });
        });
        it('should not accept a modify POST on a tool belonging to a squad from a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .post('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {name: 'New Tool', link: 'New Link', icon: 'New Icon'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a modify POST on a tool linked to a squad from a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .post('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {name: 'New Tool', link: 'New Link', icon: 'New Icon'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('tool');
                        res.body.tool.should.be.a('object');
                        res.body.tool.should.have.property('name').eql('New Tool');
                        res.body.tool.should.have.property('link').eql('New Link');
                        res.body.tool.should.have.property('icon').eql('New Icon');
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.an('object');
                            tool = tool.toJSON();
                            tool.should.have.property('name').eql('New Tool');
                            tool.should.have.property('link').eql('New Link');
                            tool.should.have.property('icon').eql('New Icon');
                            done();
                        });
                    });
            });
        });
        it('should not accept a modify POST on a tool linked to a squad from a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .post('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {name: 'New Tool', link: 'New Link', icon: 'New Icon'}})
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a modify POST on a tool linked to a squad from a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .post('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send({tool: {name: 'New Tool', link: 'New Link', icon: 'New Icon'}})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('tool');
                        res.body.tool.should.be.a('object');
                        res.body.tool.should.have.property('name').eql('New Tool');
                        res.body.tool.should.have.property('link').eql('New Link');
                        res.body.tool.should.have.property('icon').eql('New Icon');
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.an('object');
                            tool = tool.toJSON();
                            tool.should.have.property('name').eql('New Tool');
                            tool.should.have.property('link').eql('New Link');
                            tool.should.have.property('icon').eql('New Icon');
                            done();
                        });
                    });
            });
        });
    });

    /*
    * Test the /DELETE Tools/:id route
    */
    describe('/DELETE Tools/:id', () => {

        it('should return 404 for an unknown tool', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .delete('/api/tools/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should DELETE an existing tool', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                category.UserId = user1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then((tool) => {
                chai.request(server)
                    .delete('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.null;
                            done();
                        });
                    });
            });
        });
        it('should not accept a DELETE on a tool belonging to a squad from a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .delete('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a DELETE on a tool linked to a squad from a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .delete('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.null;
                            done();
                        });
                    });
            });
        });
        it('should not accept a DELETE on a tool linked to a squad from a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .delete('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a DELETE on a tool linked to a squad from a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .delete('/api/tools/' + tool.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.null;
                            done();
                        });
                    });
            });
        });
    });

    /*
    * Test the /DELETE Tools/category/:id route
    */
    describe('/DELETE Tools/category/:id', () => {

        it('should return 404 for an unknown category', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            user1.save().then((user1) => {
                chai.request(server)
                    .delete('/api/tools/category/1')
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
            });
        });
        it('should DELETE an existing category', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                category.UserId = user1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .delete('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.null;
                            models.ToolCategories.findOne({where: {id: category.id}}).then((category) => {
                                expect(category).to.be.null;
                                done();
                            });
                        });
                    });
            });
        });
        it('should not accept a DELETE on a category belonging to a squad from a non squad admin or super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .delete('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a DELETE on a category linked to a squad from a squad admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .delete('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.null;
                            models.ToolCategories.findOne({where: {id: category.id}}).then((category) => {
                                expect(category).to.be.null;
                                done();
                            });
                        });
                    });
            });
        });
        it('should not accept a DELETE on a category linked to a squad from a squad member', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1'});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                user1.addSquad(squad1, {through: {role: 'USER'}});
                return user1.save();
            }).then((user1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .delete('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
        it('should accept a DELETE on a category linked to a squad from a super admin', (done) => {
            let user1 = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test1', lastname: 'User1', roles: ['ADMIN']});
            let squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let category = new models.ToolCategories({name: 'Category', order: 1});
            let tool = new models.Tools({name: 'Tool', link: 'Link', icon: 'Icon'});
            user1.save().then((user1) => {
                return squad1.save();
            }).then((squad1) => {
                category.SquadId = squad1.id;
                return category.save();
            }).then((category) => {
                tool.CategoryId = category.id;
                return tool.save();
            }).then(() => {
                chai.request(server)
                    .delete('/api/tools/category/' + category.id)
                    .set('Authorization', 'Bearer ' + user1.toAuthJSON().token)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        models.Tools.findOne({where: {CategoryId: category.id}}).then((tool) => {
                            expect(tool).to.be.null;
                            models.ToolCategories.findOne({where: {id: category.id}}).then((category) => {
                                expect(category).to.be.null;
                                done();
                            });
                        });
                    });
            });
        });
    });

    /*
    * Test the /GET tools route
    */
    describe('/GET tools', () => {
        it('should not accept a GET when unauthentified', (done) => {
            chai.request(server)
                .get('/api/tools')
                .send()
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it('should not accept a GET without a squad', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
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
        it('should accept a GET from a squad member and return all tools', (done) => {
            let user = new models.Users({ email: "test@testuser.com", password: "testpassword", firstname: 'Test', lastname: 'User'});
            const squad1 = new models.Squads({
                name: 'squad1',
                slug: 'squad1'
            });
            let userCategory1 = new models.ToolCategories({name: 'user1', order: 3});
            let toolUserCategory1 = new models.Tools({name: 'toolUserCategory1', icon: 'userIcon1', link: 'userLink1', order: 1});
            let toolUserCategory2 = new models.Tools({name: 'toolUserCategory2', icon: 'userIcon2', link: 'userLink2', order: 2});
            let userCategory2 = new models.ToolCategories({name: 'user2', order: 1});
            let toolUserCategory21 = new models.Tools({name: 'toolUserCategory21', icon: 'userIcon21', link: 'userLink21', order: 4});
            let toolUserCategory22 = new models.Tools({name: 'toolUserCategory22', icon: 'userIcon22', link: 'userLink22', order: 1});
            let squadCategory1 = new models.ToolCategories({name: 'squad1', order: 1});
            let toolSquad1 = new models.Tools({name: 'toolSquad1', icon: 'squadIcon1', link: 'squadLink1', order: 1});
            let toolSquad2 = new models.Tools({name: 'toolSquad2', icon: 'squadIcon2', link: 'squadLink2', order: 2});
            let squadCategory2 = new models.ToolCategories({name: 'squad2', order: 12});
            let toolSquad21 = new models.Tools({name: 'toolSquad21', icon: 'squadIcon21', link: 'squadLink21', order: 5});
            let toolSquad22 = new models.Tools({name: 'toolSquad22', icon: 'squadIcon22', link: 'squadLink22', order: 1});
            squad1.save().then((squad1) => {
                return user.save();
            }).then(() => {
                user.addSquad(squad1, {through: {role: 'ADMIN'}});
                return user.save();
            }).then(() => {
                userCategory1.UserId = user.id;
                return userCategory1.save();
            }).then(() => {
                userCategory2.UserId = user.id;
                return userCategory2.save();
            }).then(() => {
                squadCategory1.SquadId = squad1.id;
                return squadCategory1.save();
            }).then(() => {
                squadCategory2.SquadId = squad1.id;
                return squadCategory2.save();
            }).then(() => {
                toolUserCategory1.CategoryId = userCategory1.id;
                return toolUserCategory1.save();
            }).then(() => {
                toolUserCategory2.CategoryId = userCategory1.id;
                return toolUserCategory2.save();
            }).then(() => {
                toolUserCategory21.CategoryId = userCategory2.id;
                return toolUserCategory21.save();
            }).then(() => {
                toolUserCategory22.CategoryId = userCategory2.id;
                return toolUserCategory22.save();
            }).then(() => {
                toolSquad1.CategoryId = squadCategory1.id;
                return toolSquad1.save();
            }).then(() => {
                toolSquad2.CategoryId = squadCategory1.id;
                return toolSquad2.save();
            }).then(() => {
                toolSquad21.CategoryId = squadCategory2.id;
                return toolSquad21.save();
            }).then(() => {
                toolSquad22.CategoryId = squadCategory2.id;
                return toolSquad22.save();
            }).then(() => {
                chai.request(server)
                    .get('/api/tools')
                    .set('Authorization', 'Bearer ' + user.toAuthJSON().token)
                    .set('Brain-squad', squad1.id)
                    .send()
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('categories');
                        res.body.categories.should.be.a('array');
                        res.body.categories[0].should.have.property('id').eql(squadCategory1.id);
                        res.body.categories[0].should.have.property('name').eql(squadCategory1.name);
                        res.body.categories[0].should.have.property('isSquad').eql(true);
                        res.body.categories[0].should.have.property('tools');
                        res.body.categories[0].tools.should.be.a('array');
                        res.body.categories[0].tools[0].should.have.property('id').eql(toolSquad1.id);
                        res.body.categories[0].tools[0].should.have.property('name').eql(toolSquad1.name);
                        res.body.categories[0].tools[0].should.have.property('icon').eql(toolSquad1.icon);
                        res.body.categories[0].tools[0].should.have.property('link').eql(toolSquad1.link);
                        res.body.categories[0].tools[1].should.have.property('id').eql(toolSquad2.id);
                        res.body.categories[0].tools[1].should.have.property('name').eql(toolSquad2.name);
                        res.body.categories[0].tools[1].should.have.property('icon').eql(toolSquad2.icon);
                        res.body.categories[0].tools[1].should.have.property('link').eql(toolSquad2.link);
                        res.body.categories[1].should.have.property('id').eql(squadCategory2.id);
                        res.body.categories[1].should.have.property('name').eql(squadCategory2.name);
                        res.body.categories[1].should.have.property('isSquad').eql(true);
                        res.body.categories[1].should.have.property('tools');
                        res.body.categories[1].tools.should.be.a('array');
                        res.body.categories[1].tools[0].should.have.property('id').eql(toolSquad22.id);
                        res.body.categories[1].tools[0].should.have.property('name').eql(toolSquad22.name);
                        res.body.categories[1].tools[0].should.have.property('icon').eql(toolSquad22.icon);
                        res.body.categories[1].tools[0].should.have.property('link').eql(toolSquad22.link);
                        res.body.categories[1].tools[1].should.have.property('id').eql(toolSquad21.id);
                        res.body.categories[1].tools[1].should.have.property('name').eql(toolSquad21.name);
                        res.body.categories[1].tools[1].should.have.property('icon').eql(toolSquad21.icon);
                        res.body.categories[1].tools[1].should.have.property('link').eql(toolSquad21.link);
                        res.body.categories[2].should.have.property('id').eql(userCategory2.id);
                        res.body.categories[2].should.have.property('name').eql(userCategory2.name);
                        res.body.categories[2].should.have.property('isSquad').eql(false);
                        res.body.categories[2].should.have.property('tools');
                        res.body.categories[2].tools.should.be.a('array');
                        res.body.categories[2].tools[0].should.have.property('id').eql(toolUserCategory22.id);
                        res.body.categories[2].tools[0].should.have.property('name').eql(toolUserCategory22.name);
                        res.body.categories[2].tools[0].should.have.property('icon').eql(toolUserCategory22.icon);
                        res.body.categories[2].tools[0].should.have.property('link').eql(toolUserCategory22.link);
                        res.body.categories[2].tools[1].should.have.property('id').eql(toolUserCategory21.id);
                        res.body.categories[2].tools[1].should.have.property('name').eql(toolUserCategory21.name);
                        res.body.categories[2].tools[1].should.have.property('icon').eql(toolUserCategory21.icon);
                        res.body.categories[2].tools[1].should.have.property('link').eql(toolUserCategory21.link);
                        res.body.categories[3].should.have.property('id').eql(userCategory1.id);
                        res.body.categories[3].should.have.property('name').eql(userCategory1.name);
                        res.body.categories[3].should.have.property('isSquad').eql(false);
                        res.body.categories[3].should.have.property('tools');
                        res.body.categories[3].tools.should.be.a('array');
                        res.body.categories[3].tools[0].should.have.property('id').eql(toolUserCategory1.id);
                        res.body.categories[3].tools[0].should.have.property('name').eql(toolUserCategory1.name);
                        res.body.categories[3].tools[0].should.have.property('icon').eql(toolUserCategory1.icon);
                        res.body.categories[3].tools[0].should.have.property('link').eql(toolUserCategory1.link);
                        res.body.categories[3].tools[1].should.have.property('id').eql(toolUserCategory2.id);
                        res.body.categories[3].tools[1].should.have.property('name').eql(toolUserCategory2.name);
                        res.body.categories[3].tools[1].should.have.property('icon').eql(toolUserCategory2.icon);
                        res.body.categories[3].tools[1].should.have.property('link').eql(toolUserCategory2.link);
                        done();
                    });
            })
        });
    });
});