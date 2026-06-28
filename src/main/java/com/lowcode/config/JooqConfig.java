package com.lowcode.config;

import org.jooq.SQLDialect;
import org.jooq.conf.Settings;
import org.jooq.impl.DefaultConfiguration;
import org.jooq.impl.DefaultDSLContext;
import org.jooq.impl.DefaultExecuteListenerProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class JooqConfig {

    @Bean
    public DefaultDSLContext dslContext(DataSource dataSource) {
        Settings settings = new Settings()
            .withRenderFormatted(false)
            .withExecuteWithOptimisticLocking(true);

        return new DefaultDSLContext(
            new DefaultConfiguration()
                .set(dataSource)
                .set(SQLDialect.MYSQL)
                .set(settings)
                .set(new DefaultExecuteListenerProvider(new SlowSqlListener()))
        );
    }
}
