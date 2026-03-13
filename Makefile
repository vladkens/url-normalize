.PHONY: default fmt test update

default: fmt
	npm run format && npm run ci

fmt:
	npm run format

test:
	npm test

update:
	npx --yes npm-check-updates -u
	npm install
