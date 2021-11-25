.PHONY: build-web

build:
	mkdir -p build-web && \
	cd build-web && \
	emcmake cmake ../src -DCMAKE_BUILD_TYPE=Release && \
	make
