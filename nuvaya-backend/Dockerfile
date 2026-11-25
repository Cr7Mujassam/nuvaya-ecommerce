FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN set -e; \
    for i in 1 2 3 4 5; do \
      mvn dependency:go-offline -B -Dmaven.wagon.http.retryHandler.count=3 && break; \
      echo "Maven dependency download attempt $i hit rate limit/network error, retrying in 12s..."; \
      sleep 12; \
    done
COPY src ./src
RUN set -e; \
    mvn clean package -DskipTests -B -o || { \
      for i in 1 2 3; do \
        mvn clean package -DskipTests -B -Dmaven.wagon.http.retryHandler.count=3 && break; \
        echo "Maven package attempt $i retrying in 10s..."; \
        sleep 10; \
      done; \
    }

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-Xmx384m", "-XX:+UseSerialGC", "-jar", "app.jar"]
