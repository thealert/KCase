# syntax=docker/dockerfile:1.4

FROM --platform=linux/amd64 maven:3.6.3-jdk-8 AS backend-builder

WORKDIR /build

COPY casemind_backend/pom.xml ./casemind_backend/pom.xml
RUN --mount=type=cache,target=/root/.m2 \
    mvn -f ./casemind_backend/pom.xml dependency:go-offline

COPY casemind_backend/ ./casemind_backend/
RUN --mount=type=cache,target=/root/.m2 \
    mvn -f ./casemind_backend/pom.xml clean package -Dmaven.test.skip=true


FROM eclipse-temurin:8-jre

WORKDIR /app

COPY --from=backend-builder /build/casemind_backend/target/mycasemind-webapp.jar ./mycasemind-webapp.jar

EXPOSE 8443

ENTRYPOINT ["java", "-jar", "/app/mycasemind-webapp.jar"]
