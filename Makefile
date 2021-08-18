.PHONY: build all

all: build

build:
	@echo "Building docker image..."
	docker build -t registry.gitlab.com/livemart/livemart-vex-hugo:0.0.1 .
