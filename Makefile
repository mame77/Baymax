COMPOSE_DIR := api
API_DIR := api
COMPOSE := docker compose --project-directory $(COMPOSE_DIR) --env-file $(COMPOSE_DIR)/.env -f $(COMPOSE_DIR)/docker-compose.yml
GO_CACHE_DIR ?= /tmp/baymax-go-build
PORT ?= 8080

.PHONY: migrations-dir postgres-up migrate-create migrate-up migrate-down migrate-version run-api

postgres-up:
	$(COMPOSE) up -d postgres

migrate-create: migrations-dir
ifndef name
	$(error name is required. Usage: make migrate-create name=create_users_table)
endif
	$(COMPOSE) --profile tools run --rm --no-deps migrate create -ext sql -dir /migrations -seq $(name)

migrate-up: postgres-up migrations-dir
	@if [ -z "$$(find $(COMPOSE_DIR)/migrations -maxdepth 1 -name '*.up.sql' -print -quit)" ]; then \
		echo "No migration files found in $(COMPOSE_DIR)/migrations"; \
	else \
		$(COMPOSE) --profile tools run --rm migrate up; \
	fi

migrate-down: postgres-up migrations-dir
	@if [ -z "$$(find $(COMPOSE_DIR)/migrations -maxdepth 1 -name '*.down.sql' -print -quit)" ]; then \
		echo "No migration files found in $(COMPOSE_DIR)/migrations"; \
	else \
		$(COMPOSE) --profile tools run --rm migrate down 1; \
	fi

migrate-version: postgres-up migrations-dir
	@if [ -z "$$(find $(COMPOSE_DIR)/migrations -maxdepth 1 -name '*.up.sql' -print -quit)" ]; then \
		echo "No migration files found in $(COMPOSE_DIR)/migrations"; \
	else \
		$(COMPOSE) --profile tools run --rm migrate version; \
	fi

run-api: migrate-up
	@if [ -n "$(API_RUN_CMD)" ]; then \
		sh -c "$(API_RUN_CMD)"; \
	elif [ -f $(API_DIR)/go.mod ]; then \
		cd $(API_DIR) && PORT=$(PORT) GOCACHE=$(GO_CACHE_DIR) go run .; \
	else \
		echo "api/go.mod was not found. Initialize the Go API in api/ or set API_RUN_CMD."; \
		exit 1; \
	fi
