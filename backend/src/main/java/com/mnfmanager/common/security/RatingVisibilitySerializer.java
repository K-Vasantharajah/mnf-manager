package com.mnfmanager.common.security;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.mnfmanager.player.Player;

import java.io.IOException;

public class RatingVisibilitySerializer extends JsonSerializer<Object> {

    private final RatingVisibility visibility;

    public RatingVisibilitySerializer(RatingVisibility visibility) {
        this.visibility = visibility;
    }

    @Override
    public void serialize(Object value, JsonGenerator gen, SerializerProvider provider)
            throws IOException {
        // The Player whose rating field is being written
        Object owner = gen.currentValue();
        if (owner instanceof Player player && visibility.canSee(player)) {
            provider.defaultSerializeValue(value, gen);
        } else {
            gen.writeNull();
        }
    }
}