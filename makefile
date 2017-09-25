export SHELL := /bin/bash
export PATH := $(shell npm bin):$(PATH)

HAS_HEROKU_CLI := $(shell command -v heroku 2> /dev/null)

ifdef HAS_HEROKU_CLI
ifndef CI
	-include .env.mk
endif
endif

js-files = app.js $(shell find server -name '*.js')
test-files = $(shell find test -name 'index.js')
test-files-all = $(shell find test -name '*.js')
lintspace-files = $(js-files) $(test-files-all) $(shell find scripts -name '*.js' -or -name '*.sh') $(wildcard scss/*.scss) $(shell find views -name '*.html')

HEROKU_CONFIG_OPTS = -i HEROKU_ -i NODE_ENV -l NODE_ENV=development
HEROKU_CONFIG_APP = ft-google-amp-staging

.env:
	heroku-config-to-env $(HEROKU_CONFIG_OPTS) $(HEROKU_CONFIG_APP) $@

.env.mk: .env
	sed 's/"//g ; s/=/:=/ ; s/^/export /' < $< > $@

lintspaces: $(lintspace-files)
	lintspaces -n -d tabs -l 2 $^

eslint: $(js-files) $(test-files-all)
	eslint --fix $^

lint: lintspaces eslint

bench:
	./scripts/bench.sh

mocha-opts := --require async-to-gen/register

test: lint $(js-files) $(test-files-all)
	NODE_ENV=test istanbul cover node_modules/.bin/_mocha -- $(mocha-opts) $(test-files)

unit-test: $(js-files) $(test-files-all)
	NODE_ENV=test istanbul cover node_modules/.bin/_mocha -- $(mocha-opts) -i --grep "amp validator" $(test-files)

.PHONY: bench
