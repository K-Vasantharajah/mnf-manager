package com.mnfmanager.milestone;

/**
 * A true statement about tonight's squad. The frontend turns these into
 * sentences.
 *
 * value: the milestone number or streak length.
 * remaining: goals still needed, for goal milestones only.
 * partnerId: the other player, for together-records only.
 */
public record Fact(FactType type, long playerId, Long partnerId, int value, Integer remaining) {

    static Fact of(FactType type, long playerId, int value) {
        return new Fact(type, playerId, null, value, null);
    }
}