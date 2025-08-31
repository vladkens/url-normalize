.PHONY: default fmt test

default:
	yarn format && yarn ci && yarn bench

fmt:
	yarn format

test:
	yarn test
