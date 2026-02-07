
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Recreate encrypt_api_key using pgcrypto's encrypt function with proper schema reference
CREATE OR REPLACE FUNCTION public.encrypt_api_key(raw_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    encryption_key TEXT;
BEGIN
    encryption_key := current_setting('app.settings.jwt_secret', true);
    IF encryption_key IS NULL OR encryption_key = '' THEN
        encryption_key := 'genshai-default-enc-key-change-me';
    END IF;
    RETURN encode(extensions.encrypt(raw_key::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$function$;

-- Recreate decrypt_api_key similarly
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    encryption_key TEXT;
BEGIN
    encryption_key := current_setting('app.settings.jwt_secret', true);
    IF encryption_key IS NULL OR encryption_key = '' THEN
        encryption_key := 'genshai-default-enc-key-change-me';
    END IF;
    RETURN convert_from(extensions.decrypt(decode(encrypted_key, 'base64'), encryption_key::bytea, 'aes'), 'utf8');
END;
$function$;
