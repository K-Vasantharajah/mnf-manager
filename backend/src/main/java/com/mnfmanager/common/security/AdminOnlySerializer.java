package com.mnfmanager.common.security;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;

/**
 * Serialises a field normally for admins and as null for everyone else.
 * Controls only the JSON output, never the entity, so nothing is written
 * back to the database.
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