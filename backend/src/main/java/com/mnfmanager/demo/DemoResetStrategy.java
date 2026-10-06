package com.mnfmanager.demo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Wipes and rebuilds the demo database on every startup, so each visitor after
 * a quiet spell gets a fresh demo.
 *
 * Refuses to run against any database whose name doesn't end in _demo. A
 * misconfigured connection string would otherwise point the wipe at real data.
 */
@Configuration
@Profile("demo")
@Slf4j
public class DemoResetStrategy {

    static final String REQUIRED_SUFFIX = "_demo";

    @Bean
    public FlywayMigrationStrategy demoReset() {
        return flyway -> {
            String database = databaseName(flyway.getConfiguration().getDataSource());
            requireDemoDatabase(database);
            log.info("Resetting demo database {}", database);
            flyway.clean();
            flyway.migrate();
        };
    }

    static void requireDemoDatabase(String database) {
        if (database == null || !database.endsWith(REQUIRED_SUFFIX)) {
            throw new IllegalStateException(
                    "Demo profile refuses to start: database '" + database
                            + "' does not end in " + REQUIRED_SUFFIX
                            + ". The demo wipes its database on startup.");
        }
    }

    private static String databaseName(DataSource dataSource) {
        try (Connection connection = dataSource.getConnection()) {
            return connection.getCatalog(); // Postgres: the current database's name
        } catch (SQLException e) {
            throw new IllegalStateException("Could not read the database name", e);
        }
    }
}