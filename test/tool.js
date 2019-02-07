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
describe('Tools', () => {
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
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
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
                user1.addSquad(squad1, {through: {role: 'USER'}})
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
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
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
                user1.addSquad(squad1, {through: {role: 'USER'}})
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
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
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
                user1.addSquad(squad1, {through: {role: 'USER'}})
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
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
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
                user1.addSquad(squad1, {through: {role: 'USER'}})
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
                user1.addSquad(squad1, {through: {role: 'ADMIN'}})
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
                user1.addSquad(squad1, {through: {role: 'USER'}})
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
});