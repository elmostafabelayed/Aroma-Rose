-- ==============================================================================
-- Aroma Rose — Store Settings & Business Configuration Table
-- Migration: 20261105000100_store_settings.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    value_type TEXT NOT NULL CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Trigger for auto updated_at
DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to store settings" ON public.store_settings;
CREATE POLICY "Allow read access to store settings" ON public.store_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin to update store settings" ON public.store_settings;
CREATE POLICY "Allow admin to update store settings" ON public.store_settings
    FOR ALL TO authenticated
    USING (fn_is_admin())
    WITH CHECK (fn_is_admin());

-- Seed default settings if not exists
INSERT INTO public.store_settings (setting_key, setting_value, value_type, description) VALUES
    ('store_name', '"Aroma Rose"'::jsonb, 'string', 'Nom officiel de la marque et de la boutique'),
    ('store_description', '"L’élégance pure de la rose de Kelaat M’Gouna. Cosmétiques naturels & artisanat marocain."'::jsonb, 'string', 'Description courte de la boutique'),
    ('store_address', '"Vallée des Roses, Kelaat M’Gouna"'::jsonb, 'string', 'Adresse physique principale'),
    ('store_city', '"Kelaat M’Gouna"'::jsonb, 'string', 'Ville d’origine du terroir'),
    ('store_phone', '"+212 5 24 88 00 00"'::jsonb, 'string', 'Téléphone fixe du service client'),
    ('store_email', '"contact@aromarose.ma"'::jsonb, 'string', 'Adresse email officielle de contact'),
    ('whatsapp_number', '"+212600000000"'::jsonb, 'string', 'Numéro WhatsApp pour commandes et assistance'),
    ('shipping_standard_fee', '30.00'::jsonb, 'number', 'Frais de livraison standard au Maroc (MAD)'),
    ('shipping_free_threshold', '300.00'::jsonb, 'number', 'Seuil de commande pour livraison offerte (MAD)'),
    ('free_shipping_enabled', 'true'::jsonb, 'boolean', 'Activation de la livraison gratuite au-delà du seuil'),
    ('shipping_enabled', 'true'::jsonb, 'boolean', 'Activation générale de la livraison'),
    ('estimated_delivery_days', '"24h à 48h dans tout le Maroc"'::jsonb, 'string', 'Délai moyen indicatif de livraison'),
    ('cod_enabled', 'true'::jsonb, 'boolean', 'Disponibilité du paiement à la livraison (Cash on Delivery)'),
    ('currency', '"MAD"'::jsonb, 'string', 'Devise officielle de transaction'),
    ('currency_symbol', '"DH"'::jsonb, 'string', 'Symbole d’affichage de la devise'),
    ('store_status', '"open"'::jsonb, 'string', 'Disponibilité du magasin (open / closed)'),
    ('store_closure_message', '"Notre boutique en ligne est temporairement fermée aux nouvelles commandes."'::jsonb, 'string', 'Message affiché lors de la fermeture'),
    ('low_stock_alert_enabled', 'true'::jsonb, 'boolean', 'Notifications visuelles d’alerte de stock faible'),
    ('new_order_notification_enabled', 'true'::jsonb, 'boolean', 'Indicateurs visuels de nouvelles commandes'),
    ('low_stock_threshold', '10'::jsonb, 'number', 'Seuil d’unités déclenchant l’état de stock faible')
ON CONFLICT (setting_key) DO NOTHING;
