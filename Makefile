.PHONY: test test-ts test-matrix-ts clean

default:
	yarn ci && yarn bench

fmt:
	yarn format

test:
	yarn test
