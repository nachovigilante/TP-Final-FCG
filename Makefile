.PHONY: build

build:
	mkdir -p build && \
	cd build && \
	emcmake cmake ../src -DCMAKE_BUILD_TYPE=Release && \
	make

