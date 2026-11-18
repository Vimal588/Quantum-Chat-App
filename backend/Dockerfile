# ==============================================================================
# Stage 1: Build the Spring Boot application using Maven and Temurin JDK 21
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache Maven dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Minimal, secure JRE runtime container
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Add unprivileged system user for security
RUN addgroup -S quantum && adduser -S quantumchat -G quantum

# Install curl for health checks
RUN apk add --no-cache curl

# Copy packaged executable jar from the build stage
COPY --from=build /app/target/quantum-chat-backend-*.jar app.jar
RUN chown -R quantumchat:quantum /app

USER quantumchat:quantum

EXPOSE 8080

# Configure memory limits & G1GC JVM flags optimized for containers
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/api/benchmark/summary || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
