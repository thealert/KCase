FROM mysql:5.7

COPY casemind_backend/sql/case_manager.sql /docker-entrypoint-initdb.d/01-case_manager.sql
