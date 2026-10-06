package com.mnfmanager.demo;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DemoResetStrategyTest {

    @Test
    void allowsDemoDatabase() {
        assertThatCode(() -> DemoResetStrategy.requireDemoDatabase("mnfmanager_demo"))
                .doesNotThrowAnyException();
    }

    @Test
    void refusesProductionDatabase() {
        assertThatThrownBy(() -> DemoResetStrategy.requireDemoDatabase("mnfmanager"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("refuses to start");
    }

    @Test
    void refusesUnknownDatabase() {
        assertThatThrownBy(() -> DemoResetStrategy.requireDemoDatabase(null))
                .isInstanceOf(IllegalStateException.class);
    }
}