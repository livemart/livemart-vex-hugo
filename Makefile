.PHONY: build all

all: build

build:
	@echo "Building docker image..."
	docker build -t registry.gitlab.com/livemart/livemart-backend:0.0.1 .
