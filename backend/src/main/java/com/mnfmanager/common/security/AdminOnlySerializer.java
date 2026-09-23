package com.mnfmanager.common.security;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;

/**
 * Serialises a field normally for admins and as null for everyone else.
 *
 * Deliberately a serializer rather than nulling the field on the entity:
 * Player.rating uses orphanRemoval, so setting it to null inside a
 * transaction would delete the rating row.
 */
public class AdminOnlySerializer extends JsonSerializer<Object> {

    @Override
    public void serialize(Object value, JsonGenerator gen, SerializerProvider provider)
            throws IOException {
        if (SecurityUtils.isAdmin()) {
            provider.defaultSerializeValue(value, gen);
        } else {
            gen.writeNull();
        }
    }
}