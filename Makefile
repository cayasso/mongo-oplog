REPORTER = spec

test:
	@./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--require should \
		--recursive \
		test

.PHONY: test
