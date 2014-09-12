var nock = require('nock');
var forkability = require('..');
require('should');

describe('forkability', function() {
	beforeEach(function () {
		nock.cleanAll();
		// nock('https://api.github.com')
		// 	.get('/repos/thatoneguy/thatonerepo/commits')
		// 	.reply(200, []);
		// nock('https://api.github.com')
		// 	.get('/repos/thatoneguy/thatonerepo/git/trees/fakeshalol')
		// 	.reply(200, { tree : [] });
		// nock('https://api.github.com')
		// 	.get('/repos/thatoneguy/thatonerepo/issues?state=open')
		// 	.reply(200, []);
	});

	it('should identify that the repo has both contributing and readme docs', function(done) {
		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/commits')
			.reply(200, [{
				sha: 'fakeshalol'
			}]);

		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/git/trees/fakeshalol')
			.reply(200, {
				tree: [{
					path: 'contributing.md'
				}, {
					path: 'readme.md'
				}, {
					path: 'licence.md'
				}]
			});

		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/issues?state=open')
			.reply(200, []);

		forkability('thatoneguy', 'thatonerepo', function (present, missing) {
			present.should.containEql('Contributing document');
			present.should.containEql('Readme document');
			present.should.containEql('Licence document');
			present.should.have.a.lengthOf(3);
			missing.should.be.empty;
			done();
		});
	});

	it('should identify that the repo has just a contributing doc, but nothing else', function(done) {
		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/commits')
			.reply(200, [{
				sha: 'fakeshalol'
			}]);

		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/git/trees/fakeshalol')
			.reply(200, {
				tree: [{
					path: 'contributing.md'
				}]
			});

		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/issues?state=open')
			.reply(200, []);

		forkability('thatoneguy', 'thatonerepo', function (present, missing) {
			present.should.containEql('Contributing document').and.lengthOf(1);
			missing.should.containEql('Readme document');
			missing.should.containEql('Licence document');
			missing.should.have.a.lengthOf(2);
			done();
		});
	});

	it('should be case insensitive about the presence of files', function(done) {
		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/commits')
			.reply(200, [{
				sha: 'fakeshalol'
			}]);

		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/git/trees/fakeshalol')
			.reply(200, {
				tree: [{
					path: 'CONTRIBUTing.md'
				}]
			});

		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/issues?state=open')
			.reply(200, []);

		forkability('thatoneguy', 'thatonerepo', function (present, missing) {
			present.should.containEql('Contributing document').and.lengthOf(1);
			missing.should.containEql('Readme document');
			missing.should.containEql('Licence document');
			missing.should.have.a.lengthOf(2);
			done();
		});
	});

	it('should warn about un-replied-to repositories', function(done) {
		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/commits')
			.reply(200, [{
				sha: 'fakeshalol'
			}]);

		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/git/trees/fakeshalol')
			.reply(200, {
				tree: [{
					path: 'CONTRIBUTing.md'
				}]
			});

		nock('https://api.github.com')
			.get('/repos/thatoneguy/thatonerepo/issues?state=open')
			.reply(200, [
				{
					number: 1234,
					title: 'Your repo sucks',
					state: 'open',
					html_url: 'https://github.com/thatoneguy/thatonerepo/issues/1234',
					user: {
						login: 'notthatoneguy'
					},
					comments: 0
				},
				{
					number: 2345,
					title: 'This is the worst open source project ever',
					html_url: 'https://github.com/thatoneguy/thatonerepo/issues/2345',
					state: 'open',
					user: {
						login: 'someoneelse'
					},
					comments: 0
				},
				{
					number: 3456,
					html_url: 'https://github.com/thatoneguy/thatonerepo/issues/3456',
					state: 'open',
					user: {
						login: 'thatoneguy'
					},
					comments: 0
				}
			]);

		forkability('thatoneguy', 'thatonerepo', function (present, missing, warnings) {
			present.should.containEql('Contributing document').and.lengthOf(1);
			missing.should.containEql('Readme document');
			missing.should.containEql('Licence document');
			missing.should.have.a.lengthOf(2);

			warnings.should.containEql({
				message: 'Uncommented issue',
				details: {
					url: 'https://github.com/thatoneguy/thatonerepo/issues/1234',
					title: 'Your repo sucks'
				}
			});

			warnings.should.containEql({
				message: 'Uncommented issue',
				details: {
					url: 'https://github.com/thatoneguy/thatonerepo/issues/2345',
					title: 'This is the worst open source project ever'
				}
			});

			done();
		});
	});
});