.PHONY: help build run stop clean restart logs shell

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker image
	docker build -t carboncontrol:latest .

run: ## Run the container (detached)
	docker run -d --name carboncontrol -p 3000:3000 carboncontrol:latest
	@echo "Container started! Access at http://localhost:3000"

run-dev: ## Run the container with attached logs
	docker run --name carboncontrol -p 3000:3000 carboncontrol:latest

stop: ## Stop the running container
	docker stop carboncontrol || true

clean: ## Stop and remove the container and image
	docker stop carboncontrol || true
	docker rm carboncontrol || true
	docker rmi carboncontrol:latest || true

restart: stop run ## Restart the container

logs: ## Show container logs
	docker logs -f carboncontrol

shell: ## Open a shell in the running container
	docker exec -it carboncontrol /bin/sh

compose-up: ## Start with docker-compose
	docker-compose up -d

compose-down: ## Stop docker-compose
	docker-compose down

compose-logs: ## Show docker-compose logs
	docker-compose logs -f
