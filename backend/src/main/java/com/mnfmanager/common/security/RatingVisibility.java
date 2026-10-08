package com.mnfmanager.common.security;

import com.mnfmanager.player.Player;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Who may see a player's rating. Admins always can. Members can only when
 * ratings are public and the player hasn't asked to hide theirs.
 *
 * mnf.ratings.public separates deploying the code from launching it: ratings
 * stay admin-only until the switch is turned on.
 */
@Component
public class RatingVisibility {

    private final boolean ratingsPublic;

    public RatingVisibility(@Value("${mnf.ratings.public:false}") boolean ratingsPublic) {
        this.ratingsPublic = ratingsPublic;
    }

    public boolean canSee(Player player) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return ratingsPublic && !Boolean.TRUE.equals(player.getRatingHidden());
    }
}