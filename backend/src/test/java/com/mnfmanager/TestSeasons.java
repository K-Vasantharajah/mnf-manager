package com.mnfmanager;

import java.time.LocalDate;

public final class TestSeasons {

    public static final int CURRENT = LocalDate.now().getYear();
    public static final int PREVIOUS = CURRENT - 1;

    private TestSeasons() {
    }
}