-- ==============================================================================
-- Aroma Rose — Official Catalog Database Seed
-- Generated automatically from docs/catalogue_aroma_rose_premium_fr.md
-- Total products: 72 items across 6 botanical categories
-- ==============================================================================

BEGIN;

-- 1. Seed Categories
INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES ('3d4125f3-0aa9-595e-bb07-4e80a398d290', 'Parfums et Déodorants', 'parfums-et-deodorants', 'Fragrances raffinées, brumes d''ambiance et déodorants délicats à la rose et aux essences orientales.', 1, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = true,
    updated_at = now();
INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES ('8aba6f7d-9fdf-561e-9415-d8678f43a79e', 'Soins du Visage', 'soins-du-visage', 'Crèmes précieuses, sérums régénérants et masques purifiants inspirés des rituels de beauté marocains.', 2, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = true,
    updated_at = now();
INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES ('92c1e9cf-7112-58eb-bb20-e7c716672146', 'Soins des Cheveux', 'soins-des-cheveux', 'Shampooings fortifiants, masques nourrissants et sérums réparateurs aux extraits botaniques naturels.', 3, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = true,
    updated_at = now();
INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES ('7fae2789-a4c5-5a02-9751-0cd08d840de0', 'Soins du Corps', 'soins-du-corps', 'Gels douche sensoriels, savons artisanaux et soins protecteurs pour une peau douce et soyeuse.', 4, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = true,
    updated_at = now();
INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES ('8c388520-6e24-570b-981d-1eed87118a05', 'Eaux et Huiles', 'eaux-et-huiles', 'Eau de rose pure distillée de Kelaat M''Gouna, huiles précieuses et élixirs botaniques 100% purs.', 5, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = true,
    updated_at = now();
INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES ('7d645027-79bc-5c2e-81bb-2bb14cc22a25', 'Produits Bruts', 'produits-bruts', 'Boutons de roses séchées et trésors botaniques bruts récoltés au cœur de la Vallée des Roses.', 6, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = true,
    updated_at = now();

-- 2. Seed Products
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '106c6281-d62c-5c59-b865-458e1ca30869',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Huile Essentielle de Rose (Flacon Décoratif)',
    'huile-essentielle-de-rose-flacon-decoratif',
    'AR-PRF-001',
    'Un élixir précieux capturé dans un flacon artisanal. Cette huile essentielle de rose 100% pure offre un parfum envoûtant et des propriétés apaisantes pour l''esprit et la peau. Une véritable essence de luxe marocain.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '4550a5d4-d287-5065-956c-a0b3a67f01d5',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum Taj Alward (Taj Alward) من Aroma Rose',
    'parfum-taj-alward-taj-alward-aroma-rose',
    'AR-PRF-002',
    'L''incarnation de l''élégance. Le Parfum Taj Alward est une signature olfactive sophistiquée, mêlant la douceur intemporelle de la rose aux notes mystérieuses de l''Orient. Pour une présence inoubliable.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '9763dcc1-ee5d-5fb3-ad06-b3b0b146e262',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum Parfum (Flacon Transparent, Liquide Jaune)',
    'parfum-parfum-flacon-transparent-liquide-jaune',
    'AR-PRF-011',
    'Une fragrance lumineuse et captivante. Ce parfum dévoile un bouquet floral délicat, conçu pour vous accompagner tout au long de la journée avec fraîcheur et raffinement.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '0236601b-d1da-575a-8faf-5bb5cd6dc2ae',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Brume Corporelle / Parfum d''Ambiance',
    'brume-corporelle-parfum-d-ambiance',
    'AR-PRF-019',
    'Enveloppez-vous ou votre intérieur d''une aura rafraîchissante. Cette brume délicate neutralise les odeurs et parfume subtilement votre espace ou votre peau d''un voile de douceur.',
    100.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'f29906f4-a9ae-5b40-884c-2910e7c3fdcd',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum pour Femme (Flacon Noir)',
    'parfum-pour-femme-flacon-noir',
    'AR-PRF-025',
    'Audacieux et sensuel. Ce parfum intense pour femme, présenté dans un élégant flacon noir, est une ode à la féminité moderne, avec un sillage profond et mystérieux.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '0da5a784-c1f7-5baa-9622-478ee9ca056e',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum / Huile Parfumée Femme (Flacon Rose)',
    'parfum-huile-parfumee-femme-flacon-rose',
    'AR-PRF-026',
    'La quintessence du romantisme. Cette huile parfumée offre une expérience olfactive intime et durable, mariant la délicatesse des fleurs à une douceur poudrée irrésistible.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '21bc6e1e-b775-5455-b9b9-90638dd801be',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum pour Femme',
    'parfum-pour-femme',
    'AR-PRF-031',
    'Une symphonie florale délicate. Ce parfum raffiné célèbre la féminité avec des accords harmonieux, offrant un sillage élégant qui sublime chaque instant.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'a2ef7106-8156-5c7b-b383-9a0d92316022',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum pour Femme (Flacon en Verre)',
    'parfum-pour-femme-flacon-en-verre',
    'AR-PRF-032',
    'Pureté et élégance. Ce parfum capture l''essence même de la rose dans un flacon minimaliste, offrant une fragrance fraîche, florale et intemporelle.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '92cafbc5-09ed-5f11-940b-eaa5a0a81b7c',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum pour Femme',
    'parfum-pour-femme-2',
    'AR-PRF-040',
    'Une symphonie florale délicate. Ce parfum raffiné célèbre la féminité avec des accords harmonieux, offrant un sillage élégant qui sublime chaque instant.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'a161a633-2b4d-5412-8c1d-3e3ce1cc3510',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum (Flacon Violet)',
    'parfum-flacon-violet',
    'AR-PRF-046',
    'Un parfum envoûtant et mystique. Son sillage profond et captivant évoque la magie des nuits orientales, pour une allure chic et sophistiquée.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'e5b21ec1-acd8-539b-953c-2a62552b2ab4',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum (Flacon Gris Décoratif)',
    'parfum-flacon-gris-decoratif',
    'AR-PRF-049',
    'L''élégance à l''état pur. Une fragrance unique et racée, présentée dans un flacon finement ciselé, parfaite pour affirmer votre singularité avec classe.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '4c68ab7d-a4e5-57d9-ad17-ff5fdaf3c0a7',
    (SELECT id FROM public.categories WHERE slug = 'parfums-et-deodorants'),
    'Parfum (Flacon en Verre Foncé)',
    'parfum-flacon-en-verre-fonce',
    'AR-PRF-052',
    'Intensité et caractère. Un parfum riche et boisé, où se rencontrent des notes profondes et chaudes pour une expérience sensorielle luxueuse et durable.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '1c1412d2-0776-517c-ac83-c73c8c8ab59c',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Huile de Rose avec Pipette',
    'huile-de-rose-avec-pipette',
    'AR-VIS-003',
    'Le secret d''un teint radieux. Riche en antioxydants, cette huile de rose pure nourrit intensément, revitalise et aide à prévenir les signes de l''âge. Format pratique avec pipette pour un dosage précis.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '169f2c9e-63bc-5cea-91ff-3849ed5ddd09',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Crème/Masque Anti-imperfections',
    'creme-masque-anti-imperfections',
    'AR-VIS-005',
    'Votre allié pour une peau zéro défaut. Ce soin ciblé aide à réduire visiblement les imperfections et les rougeurs, tout en unifiant le teint grâce à ses actifs purifiants naturels.',
    100.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '6e84da25-10fa-522b-8099-d35b943483e6',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Masque à l''Argile aux Algues Marines',
    'masque-a-l-argile-aux-algues-marines',
    'AR-VIS-006',
    'Une cure détox pour votre visage. Ce masque combine la pureté de l''argile à la richesse minérale des algues marines pour purifier, raffermir et illuminer les teints ternes.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '83cec09c-7eb1-54a7-80fe-1c4cd663a45e',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Baume à Lèvres à la Rose',
    'baume-a-levres-a-la-rose',
    'AR-VIS-007',
    'Un baiser de douceur pour vos lèvres. Formulé avec de l''extrait de rose, ce baume ultra-nourrisant répare les lèvres gercées et les protège des agressions extérieures avec un léger fini nacré.',
    100.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '9651ef79-b99e-5bab-aab0-08928a24a44f',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Crème Hydratante Visage & Corps (Rose & Oud)',
    'creme-hydratante-visage-corps-rose-oud',
    'AR-VIS-012',
    'Le mariage parfait de l''hydratation et du luxe. Cette crème onctueuse nourrit la peau en profondeur tout en laissant un sillage exquis et sensuel de rose de Damas et de bois de oud.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '5e41c989-b5c9-50a2-9fc7-689343e81ea2',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Gel Nettoyant à l''Oliban',
    'gel-nettoyant-a-l-oliban',
    'AR-VIS-014',
    'La pureté ancestrale. Ce gel nettoyant doux à l''encens (Oliban) purifie la peau en profondeur, élimine les impuretés et régule l''excès de sébum sans dessécher.',
    100.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'b9ac5538-7c0e-5a76-81ab-8b9bf35130ea',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Sérum Naturel Visage & Corps à l''Extrait d''Argan',
    'serum-naturel-visage-corps-a-l-extrait-d-argan',
    'AR-VIS-015',
    'L''or liquide du Maroc pour votre peau. Ce sérum concentré en huile d''argan revitalise, raffermit et hydrate intensément, offrant un éclat naturel et une protection anti-âge redoutable.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'e195a871-76c5-539c-bee1-76ca5ee92ac1',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Gommage à l''Argan Riche en Vitamine E',
    'gommage-a-l-argan-riche-en-vitamine-e',
    'AR-VIS-021',
    'Une exfoliation douce et nourrissante. Enrichi en vitamine E antioxydante et en poudre de coques d''argan, ce gommage élimine les cellules mortes tout en préservant le film hydrolipidique de la peau.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '0b59494b-dc8c-563d-9211-b3cdc3c53153',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Gel Nettoyant à l''Argan',
    'gel-nettoyant-a-l-argan',
    'AR-VIS-022',
    'Le nettoyage soin par excellence. Ce gel doux à l''huile d''argan nettoie la peau en douceur, élimine les traces de maquillage et laisse une sensation de confort absolu, sans tiraillement.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '7234c128-ab88-576a-93d2-d5a889047818',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Gommage Visage & Corps au Nila',
    'gommage-visage-corps-au-nila',
    'AR-VIS-023',
    'Le secret de beauté des femmes du Sahara. Ce gommage éclat au Nila bleu aide à éclaircir le teint, atténuer les zones sombres et lisser le grain de peau pour un visage et un corps lumineux.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'abe1d3ef-7793-5c3e-9b02-7d09e09c83ca',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Masque à l''Argile à la Rose et à l''Argan',
    'masque-a-l-argile-a-la-rose-et-a-l-argan',
    'AR-VIS-027',
    'Le rituel jeunesse et pureté. L''alliance de l''argile purifiante, de l''argan nourrissant et de la rose tonifiante offre à votre peau un soin complet pour un teint frais et reposé.',
    100.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '268397fc-21d5-54a5-b23d-ae5987de4f57',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Blush Liquide Rose',
    'blush-liquide-rose',
    'AR-VIS-033',
    'Pour des pommettes effet ''bonne mine'' immédiat. Ce blush liquide léger et modulable se fond parfaitement à la peau pour un fini rose naturel, frais et longue tenue.',
    150.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'e6a6363a-4ecc-5137-8a0d-4e33c6c7859c',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Sérum Cosmétique à la Rose',
    'serum-cosmetique-a-la-rose',
    'AR-VIS-034',
    'Un concentré d''éclat et de jeunesse. Ce sérum léger pénètre rapidement pour infuser la peau des propriétés régénérantes et illuminatrices de la rose, pour un teint visiblement plus unifié.',
    300.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'd3c97dcc-4d01-5358-82f0-543ce82ae6e1',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Crème de Soin Hydratante Visage & Corps à la Rose',
    'creme-de-soin-hydratante-visage-corps-a-la-rose',
    'AR-VIS-035',
    'Un voile de douceur au quotidien. Cette crème fondante hydrate intensément et durablement, laissant la peau souple, veloutée et délicatement parfumée à la rose.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '30c0e964-9bec-54d6-a3b7-6b7af8c67739',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Coffret de Soins Miniatures (Rose)',
    'coffret-de-soins-miniatures-rose',
    'AR-VIS-038',
    'Le luxe au format voyage. Un coffret élégant réunissant nos meilleurs soins à la rose en format miniature, parfait pour découvrir notre univers ou pour vos déplacements.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '883f7292-f52d-5314-b8cd-f227e6e02247',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Crème Intensive pour le Visage',
    'creme-intensive-pour-le-visage',
    'AR-VIS-039',
    'Un soin profond pour les peaux exigeantes. Cette crème riche et concentrée offre une nutrition intense, répare la barrière cutanée et redonne souplesse et rebond au visage.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '852a2e95-2524-53b9-adaa-f98c8c295199',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Crème Intensive pour le Visage',
    'creme-intensive-pour-le-visage-2',
    'AR-VIS-043',
    'Un soin profond pour les peaux exigeantes. Cette crème riche et concentrée offre une nutrition intense, répare la barrière cutanée et redonne souplesse et rebond au visage.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '4bc59644-e0b1-5f45-833e-5f8357e7c2ff',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Gel Nettoyant à la Rose',
    'gel-nettoyant-a-la-rose',
    'AR-VIS-054',
    'Fraîcheur et douceur au réveil. Ce gel nettoyant libère la peau des impuretés quotidiennes tout en respectant son équilibre naturel, grâce aux propriétés apaisantes de la rose.',
    150.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'dd6ea142-08a0-5625-bc74-c06f755a3b16',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Lait-Crème Concentré à la Rose',
    'lait-creme-concentre-a-la-rose',
    'AR-VIS-056',
    'Le soin multi-fonctions indispensable. À la fois base de maquillage, crème hydratante et lait démaquillant, ce concentré à la rose adoucit et nourrit la peau pour un fini parfait.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '4fc9e622-fb3c-58c2-a8f1-71e1a9745b51',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Gommage au Musc Riche en Vitamine E',
    'gommage-au-musc-riche-en-vitamine-e',
    'AR-VIS-061',
    'Une peau soyeuse et divinement parfumée. Ce gommage exfoliant affine le grain de peau tout en vous enveloppant des notes chaleureuses et sensuelles du musc oriental.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '543fc47d-252a-56ff-80e4-1ed5d79ba3bf',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Sérum Naturel Visage & Corps à la Rose',
    'serum-naturel-visage-corps-a-la-rose',
    'AR-VIS-062',
    'L''élixir absolu de beauté. Un sérum précieux qui lisse, repulpe et redonne un éclat spectaculaire au visage et au corps, grâce au pouvoir régénérant de la rose.',
    300.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'c3a6cdd4-8edb-5667-8366-0f47010c029b',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Sérum Naturel Visage & Corps à l''Aloe Vera',
    'serum-naturel-visage-corps-a-l-aloe-vera',
    'AR-VIS-065',
    'Le bain d''hydratation réparateur. Gorgé d''Aloe Vera apaisant, ce sérum ultra-frais calme les irritations, hydrate en profondeur et aide à cicatriser la peau après l''exposition au soleil.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '326735b5-239b-56eb-864b-e488d1eac0a5',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Masque Purifiant Argile & Eau de Rose',
    'masque-purifiant-argile-eau-de-rose',
    'AR-VIS-066',
    'Le soin SOS teint net. Ce masque associe l''argile absorbante à l''eau de rose astringente pour resserrer les pores, matifier la peau et redonner un coup d''éclat instantané.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '24b23c27-fe6e-577d-92bb-724a0beea4fe',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Crème Hydratante au Nila Bleu et Rose',
    'creme-hydratante-au-nila-bleu-et-rose',
    'AR-VIS-067',
    'Le duo éclat parfait. Cette crème unique combine les vertus éclaircissantes du Nila bleu aux propriétés hydratantes de la rose pour un teint unifié, lumineux et sans taches.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '8f762da7-f943-5aac-a2a6-cc64a7bd53df',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-visage'),
    'Crème Hydratante Aloe Vera & Rose',
    'creme-hydratante-aloe-vera-rose',
    'AR-VIS-072',
    'La fraîcheur désaltérante. Une crème légère qui désaltère la peau en continu, calmant les rougeurs grâce à l''aloe vera tout en tonifiant le teint grâce à l''extrait de rose.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'a6527483-ce15-5554-a380-9aa16e7560ad',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Ghassoul/Argile Marocaine aux Huiles Essentielles',
    'ghassoul-argile-marocaine-aux-huiles-essentielles',
    'AR-CHV-004',
    'Le secret des cheveux volumineux et sains. Ce Ghassoul traditionnel du Moyen Atlas, enrichi aux huiles essentielles, nettoie le cuir chevelu en douceur, régule le sébum et apporte brillance sans alourdir.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '95725b8a-6471-5e73-8240-385dde5cf049',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Masque à l''Argile à la Rose et au Thé Vert',
    'masque-a-l-argile-a-la-rose-et-au-the-vert',
    'AR-CHV-008',
    'Une cure revitalisante pour vos cheveux. L''argile purifie, le thé vert antioxydant stimule la croissance, et la rose adoucit, pour une chevelure fortifiée et éclatante de santé.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '3f132c6a-b177-5e68-b228-f4c7844497e7',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Masque à l''Argile au Nila et à la Rose',
    'masque-a-l-argile-au-nila-et-a-la-rose',
    'AR-CHV-010',
    'Un soin profond et purifiant. Ce masque capillaire unique nettoie le cuir chevelu en profondeur tout en apportant douceur et brillance aux longueurs ternes et fatiguées.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '9c7d61b6-c708-5463-936e-4586d1fc5b27',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Masque à l''Argile à la Rose et au Safran',
    'masque-a-l-argile-a-la-rose-et-au-safran',
    'AR-CHV-016',
    'Le masque de luxe pour cheveux abîmés. Le safran précieux et l''argile s''associent pour réparer la fibre capillaire, nourrir intensément et raviver la couleur naturelle de vos cheveux.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '639bc0c1-7ab4-5afd-952e-e5041bffc5c5',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Gel Démêlant Après-Shampooing',
    'gel-demelant-apres-shampooing',
    'AR-CHV-018',
    'Fini les nœuds, place à la douceur. Ce gel après-shampooing facilite le démêlage instantanément, lisse la cuticule et laisse les cheveux soyeux et disciplinés, sans les alourdir.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'b7e2c81d-3a31-5f19-abf9-c6b68eb26fc5',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Shampooing à l''Aloe Vera',
    'shampooing-a-l-aloe-vera',
    'AR-CHV-024',
    'L''hydratation suprême pour les cheveux secs. Ce shampooing doux à l''aloe vera nettoie tout en hydratant intensément la fibre capillaire, pour des cheveux souples et faciles à coiffer.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '7f567e1b-48e1-5ef2-bd81-9b90de43e2be',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Shampooing à la Rose',
    'shampooing-a-la-rose',
    'AR-CHV-030',
    'Un véritable bain de douceur parfumé. Il nettoie délicatement tout en fortifiant les cheveux. Son parfum envoûtant de rose transforme votre douche en un moment de pur bien-être.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '46f92688-d5d5-57d2-8b37-db0317551cad',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Shampooing au Oud',
    'shampooing-au-oud',
    'AR-CHV-050',
    'L''élégance orientale sous la douche. Ce shampooing premium nettoie et renforce vos cheveux tout en y déposant un sillage boisé et luxueux de oud qui dure toute la journée.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'f15beb72-28c1-5ee9-b222-7394b38378c8',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Shampooing au Romarin',
    'shampooing-au-romarin',
    'AR-CHV-051',
    'L''allié anti-chute naturel. Enrichi en huile essentielle de romarin, ce shampooing stimule la microcirculation du cuir chevelu, favorise la pousse et redonne de la densité aux cheveux fins.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '5089b73a-1581-5a6c-8708-bacc8328ef63',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Shampooing au Thé Vert',
    'shampooing-au-the-vert',
    'AR-CHV-059',
    'Le détoxifiant pour cheveux à tendance grasse. Formulé au thé vert purifiant, ce shampooing assainit le cuir chevelu, régule l''excès de sébum et apporte une sensation de fraîcheur immédiate.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '5fa19e11-7de9-5e1a-9d60-b4bba8353993',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Shampooing au Oud',
    'shampooing-au-oud-2',
    'AR-CHV-060',
    'L''élégance orientale sous la douche. Ce shampooing premium nettoie et renforce vos cheveux tout en y déposant un sillage boisé et luxueux de oud qui dure toute la journée.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '1a66fb5c-f110-5189-b968-119bf1fc8fe9',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Sérum Capillaire à l''Extrait de Rose',
    'serum-capillaire-a-l-extrait-de-rose',
    'AR-CHV-068',
    'Le soin finition brillance. Ce sérum léger nourrit les pointes sèches, dompte les frisottis et protège la fibre capillaire de la chaleur, tout en parfumant subtilement vos cheveux de rose.',
    100.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '27bf4645-626e-53d9-a4d3-6ea6ff8465c2',
    (SELECT id FROM public.categories WHERE slug = 'soins-des-cheveux'),
    'Shampooing à l''Argan',
    'shampooing-a-l-argan',
    'AR-CHV-071',
    'Le soin réparateur par excellence. Riche en acides gras essentiels, ce shampooing à l''huile d''argan nourrit, répare les cheveux abîmés et redonne vie aux longueurs les plus sèches.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '75e1193c-d222-5322-9cc8-c2ed882d72cf',
    (SELECT id FROM public.categories WHERE slug = 'produits-bruts'),
    'Boutons de Roses Séchées',
    'boutons-de-roses-sechees',
    'AR-BRT-009',
    'La pureté de la vallée des roses à l''état brut. Ces boutons de roses de Damas, soigneusement séchés à l''air libre, sont parfaits pour vos infusions relaxantes, vos rituels de beauté faits maison, ou pour parfumer naturellement votre intérieur.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'f550fd13-d7fb-5f7a-823b-4e636c27c731',
    (SELECT id FROM public.categories WHERE slug = 'produits-bruts'),
    'Boutons de Roses Séchées',
    'boutons-de-roses-sechees-2',
    'AR-BRT-070',
    'La pureté de la vallée des roses à l''état brut. Ces boutons de roses de Damas, soigneusement séchés à l''air libre, sont parfaits pour vos infusions relaxantes, vos rituels de beauté faits maison, ou pour parfumer naturellement votre intérieur.',
    100.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'a249bbe4-d81d-5e3b-8425-d3363ee2b286',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-corps'),
    'Déodorant Roll-on',
    'deodorant-roll-on',
    'AR-CRP-013',
    'Protection et douceur au naturel. Ce déodorant roll-on offre une protection efficace 24h contre les odeurs, tout en respectant les aisselles les plus sensibles.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '73580003-3d42-5241-8edc-3ae0212a76ae',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-corps'),
    'Déodorant Stick (Rose & Musc)',
    'deodorant-stick-rose-musc',
    'AR-CRP-017',
    'Une fraîcheur sophistiquée qui dure. Sa formule solide sans alcool protège efficacement toute la journée, laissant sur votre peau un parfum captivant de rose délicate et de musc sensuel.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'c9e459b1-094d-5974-9061-a3a71313024d',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-corps'),
    'Gel Douche à la Fraise',
    'gel-douche-a-la-fraise',
    'AR-CRP-020',
    'Un cocktail de vitalité sous la douche. Ce gel douche gourmand nettoie la peau en douceur et laisse un parfum fruité, pétillant et irrésistible de fraise.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'efb2b22a-e922-5136-99d6-69757803d76c',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-corps'),
    'Fresh Deodorant Senteur Rose',
    'fresh-deodorant-senteur-rose',
    'AR-CRP-042',
    'L''assurance d''une journée fraîche et fleurie. Ce déodorant offre une protection fiable tout en enveloppant votre peau du parfum subtil et élégant de la rose.',
    100.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '311f8c6f-7ece-5138-8dbe-9737f3c6b42d',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-corps'),
    'Savon Liquide pour les Mains à la Rose',
    'savon-liquide-pour-les-mains-a-la-rose',
    'AR-CRP-044',
    'Le soin des mains à chaque lavage. Formulé pour nettoyer efficacement sans dessécher, ce savon liquide laisse vos mains propres, douces et délicatement parfumées à la rose.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '363802e0-0e7a-5ebd-8da7-e8ececceae8d',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-corps'),
    'Gel Douche à la Rose',
    'gel-douche-a-la-rose',
    'AR-CRP-053',
    'Une expérience sensorielle luxueuse. Ce gel douche onctueux transforme le nettoyage quotidien en un véritable moment de spa, laissant la peau hydratée, satinée et parfumée.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '7708cef5-a61d-5d78-a348-9c609a1ed8b2',
    (SELECT id FROM public.categories WHERE slug = 'soins-du-corps'),
    'Déodorant pour Femme Roll-on',
    'deodorant-pour-femme-roll-on',
    'AR-CRP-058',
    'Fiabilité et respect de la peau. Ce déodorant roll-on spécialement formulé pour les femmes assure une fraîcheur continue et un confort optimal, sans irriter la peau.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '6673c65e-29f0-5980-bdbf-a68045cd3def',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Eau de Rose Distillée',
    'eau-de-rose-distillee',
    'AR-EAU-028',
    'Le tonique naturel incontournable. Issue d''une distillation artisanale, cette eau de rose pure apaise, rafraîchit, resserre les pores et illumine le teint. L''étape indispensable de toute routine beauté.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'd63a35f8-d992-5ea7-a0e4-4e79ad67ab89',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Eau de Rose Distillée (Flacon Bleu Spray)',
    'eau-de-rose-distillee-flacon-bleu-spray',
    'AR-EAU-029',
    'L''éclat à portée de main. Notre eau de rose pure présentée dans un flacon spray bleu élégant, idéal pour tonifier le visage matin et soir ou fixer le maquillage en douceur.',
    100.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '65c732b2-3e26-5187-bea9-159d2b37dfdc',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Huile de Rose',
    'huile-de-rose',
    'AR-EAU-036',
    'L''or floral pour votre peau. Cette huile précieuse, ultra-nourrissante et anti-âge, améliore l''élasticité de la peau, atténue les cicatrices et redonne un éclat naturel exceptionnel.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'dfe20cf1-62cd-55e6-a566-04fce29eede0',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Huile de Rose avec Pipette',
    'huile-de-rose-avec-pipette-2',
    'AR-EAU-037',
    'Le secret d''un teint radieux. Riche en antioxydants, cette huile de rose pure nourrit intensément, revitalise et aide à prévenir les signes de l''âge. Format pratique avec pipette pour un dosage précis.',
    300.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '2f41179c-6f7e-5ec2-bd19-597dcbf8f0cd',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Huile de Rose',
    'huile-de-rose-2',
    'AR-EAU-041',
    'L''or floral pour votre peau. Cette huile précieuse, ultra-nourrissante et anti-âge, améliore l''élasticité de la peau, atténue les cicatrices et redonne un éclat naturel exceptionnel.',
    600.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '582a151c-12ff-5228-bcbe-9afecfbe9816',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Eau de Rose Distillée (Mini Spray 30ml)',
    'eau-de-rose-distillee-mini-spray-30ml',
    'AR-EAU-045',
    'La fraîcheur à emporter partout. Le format de poche idéal de notre véritable eau de rose pour rafraîchir et hydrater votre visage à tout moment de la journée.',
    50.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '39a364c0-29f8-5916-9253-d469dbfaf759',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Sérum/Huile Cosmétique au Lait et Huile d''Argan',
    'serum-huile-cosmetique-au-lait-et-huile-d-argan',
    'AR-EAU-047',
    'Un cocktail de nutrition absolue. La richesse de l''huile d''argan s''associe à la douceur lactée pour régénérer la peau en profondeur, la laissant souple, lisse et radieuse.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'ab29ce79-9be1-58ec-bcb0-e74f8b8d3151',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Eau de Rose Distillée (Mini Spray Cosmétique)',
    'eau-de-rose-distillee-mini-spray-cosmetique',
    'AR-EAU-048',
    'Le geste beauté nomade. Un spray délicat d''eau de rose pure pour réveiller le teint, calmer les rougeurs et apporter un coup de frais instantané, où que vous soyez.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    'b899f0bf-2716-5364-a63d-4f9eacac9f03',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Eau de Rose Distillée (Flacon Bleu Spray) 50ml',
    'eau-de-rose-distillee-flacon-bleu-spray-50ml',
    'AR-EAU-055',
    'Tonique, astringente et rafraîchissante. Cette eau florale authentique parfait le démaquillage et prépare la peau à recevoir ses soins, dans un format spray pratique de 50ml.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '61f74e5c-be24-524d-b881-cc6e79b29b4c',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Eau de Rose Distillée',
    'eau-de-rose-distillee-2',
    'AR-EAU-057',
    'Le tonique naturel incontournable. Issue d''une distillation artisanale, cette eau de rose pure apaise, rafraîchit, resserre les pores et illumine le teint. L''étape indispensable de toute routine beauté.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '29a8e0ac-dd00-597e-902c-0c1bc792740a',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Eau de Rose Distillée (Spray Bleu Usage Externe)',
    'eau-de-rose-distillee-spray-bleu-usage-externe',
    'AR-EAU-063',
    'L''hydratation florale immédiate. Une brume fine d''eau de rose 100% naturelle qui désaltère la peau, apaise les tiraillements et ravive l''éclat du teint en un pschitt.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '4f1998bd-b673-587d-94e8-c0e9a7191223',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Huile d''Argan Cosmétique',
    'huile-d-argan-cosmetique',
    'AR-EAU-064',
    'Le miracle marocain anti-âge. 100% pure et pressée à froid, cette huile d''argan regorge de vitamine E pour nourrir intensément la peau, les cheveux et les ongles. Le secret de beauté ultime.',
    250.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();
INSERT INTO public.products (
    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active
) VALUES (
    '6501bf8f-be58-5081-a415-9eb8d01f6635',
    (SELECT id FROM public.categories WHERE slug = 'eaux-et-huiles'),
    'Crème Hydratante Argan & Rose',
    'creme-hydratante-argan-rose',
    'AR-EAU-069',
    'La synergie parfaite de la nature. Une crème veloutée qui combine le pouvoir réparateur de l''huile d''argan à la fraîcheur de la rose pour une peau repulpée, éclatante et profondément hydratée.',
    200.00,
    NULL,
    NULL,
    100,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    is_active = true,
    updated_at = now();

-- 3. Seed Primary Product Images
-- Clean existing primary images for these products to avoid partial index collision
DELETE FROM public.product_images WHERE product_id IN (
    SELECT id FROM public.products WHERE sku LIKE 'AR-%'
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'cd585ca6-8cef-521a-a517-825cbd8cca53',
    '106c6281-d62c-5c59-b865-458e1ca30869',
    '/products/parfums-et-deodorants/huile-essentielle-de-rose-flacon-decoratif.jpg',
    'Huile Essentielle de Rose (Flacon Décoratif)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '946af81c-6a12-50b4-aec4-a05763ef52c8',
    '4550a5d4-d287-5065-956c-a0b3a67f01d5',
    '/products/parfums-et-deodorants/parfum-taj-alward-taj-alward-aroma-rose.jpg',
    'Parfum Taj Alward (Taj Alward) من Aroma Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '8d378db6-b3a7-53d8-aefa-116711265d81',
    '9763dcc1-ee5d-5fb3-ad06-b3b0b146e262',
    '/products/parfums-et-deodorants/parfum-parfum-flacon-transparent-liquide-jaune.jpg',
    'Parfum Parfum (Flacon Transparent, Liquide Jaune)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '2f666a47-38c5-5cca-95c0-54fb1d327a7e',
    '0236601b-d1da-575a-8faf-5bb5cd6dc2ae',
    '/products/parfums-et-deodorants/brume-corporelle-parfum-d-ambiance.jpg',
    'Brume Corporelle / Parfum d''Ambiance',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '617e283e-bf18-567d-bae2-146d3c474e2e',
    'f29906f4-a9ae-5b40-884c-2910e7c3fdcd',
    '/products/parfums-et-deodorants/parfum-pour-femme-flacon-noir.jpg',
    'Parfum pour Femme (Flacon Noir)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'fca04d00-eb4f-583b-be07-4058ea0392f4',
    '0da5a784-c1f7-5baa-9622-478ee9ca056e',
    '/products/parfums-et-deodorants/parfum-huile-parfumee-femme-flacon-rose.jpg',
    'Parfum / Huile Parfumée Femme (Flacon Rose)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '57052f0f-d1c4-50b2-ab0d-58135df9c032',
    '21bc6e1e-b775-5455-b9b9-90638dd801be',
    '/products/parfums-et-deodorants/parfum-pour-femme.jpg',
    'Parfum pour Femme',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '6832dda7-d3ac-5b3b-856f-662735c60a40',
    'a2ef7106-8156-5c7b-b383-9a0d92316022',
    '/products/parfums-et-deodorants/parfum-pour-femme-flacon-en-verre.jpg',
    'Parfum pour Femme (Flacon en Verre)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'ee203ba4-8020-5fb2-93ef-1ee946a02c44',
    '92cafbc5-09ed-5f11-940b-eaa5a0a81b7c',
    '/products/parfums-et-deodorants/parfum-pour-femme-2.jpg',
    'Parfum pour Femme',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '887aea9b-8bbc-5884-a191-689414c1bccd',
    'a161a633-2b4d-5412-8c1d-3e3ce1cc3510',
    '/products/parfums-et-deodorants/parfum-flacon-violet.jpg',
    'Parfum (Flacon Violet)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '634035ee-4174-51ee-a2fb-0d08282f767e',
    'e5b21ec1-acd8-539b-953c-2a62552b2ab4',
    '/products/parfums-et-deodorants/parfum-flacon-gris-decoratif.jpg',
    'Parfum (Flacon Gris Décoratif)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'd3b9e020-2243-5178-b931-0f5d5acebaef',
    '4c68ab7d-a4e5-57d9-ad17-ff5fdaf3c0a7',
    '/products/parfums-et-deodorants/parfum-flacon-en-verre-fonce.jpg',
    'Parfum (Flacon en Verre Foncé)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'b52acfef-a1e3-5692-beb3-4f9fa8641727',
    '1c1412d2-0776-517c-ac83-c73c8c8ab59c',
    '/products/soins-du-visage/huile-de-rose-avec-pipette.jpg',
    'Huile de Rose avec Pipette',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '48594267-1fc8-5ed9-ab58-d0ddc7bd80aa',
    '169f2c9e-63bc-5cea-91ff-3849ed5ddd09',
    '/products/soins-du-visage/creme-masque-anti-imperfections.jpg',
    'Crème/Masque Anti-imperfections',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '60b34b80-9336-55ab-86c9-2bb881ad1bf7',
    '6e84da25-10fa-522b-8099-d35b943483e6',
    '/products/soins-du-visage/masque-a-l-argile-aux-algues-marines.jpg',
    'Masque à l''Argile aux Algues Marines',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'b621c82c-9c20-5ebf-a6ed-9bdede41a9fa',
    '83cec09c-7eb1-54a7-80fe-1c4cd663a45e',
    '/products/soins-du-visage/baume-a-levres-a-la-rose.jpg',
    'Baume à Lèvres à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '575f53fb-e227-55fd-9d50-27af21d947b3',
    '9651ef79-b99e-5bab-aab0-08928a24a44f',
    '/products/soins-du-visage/creme-hydratante-visage-corps-rose-oud.jpg',
    'Crème Hydratante Visage & Corps (Rose & Oud)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '397c279d-57fb-55d4-beef-f12ee5883003',
    '5e41c989-b5c9-50a2-9fc7-689343e81ea2',
    '/products/soins-du-visage/gel-nettoyant-a-l-oliban.jpg',
    'Gel Nettoyant à l''Oliban',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'e8a0f32a-9f93-5437-a9be-3c9770ca13df',
    'b9ac5538-7c0e-5a76-81ab-8b9bf35130ea',
    '/products/soins-du-visage/serum-naturel-visage-corps-a-l-extrait-d-argan.jpg',
    'Sérum Naturel Visage & Corps à l''Extrait d''Argan',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '03505e42-0f44-59c9-b4c8-2031194bfef2',
    'e195a871-76c5-539c-bee1-76ca5ee92ac1',
    '/products/soins-du-visage/gommage-a-l-argan-riche-en-vitamine-e.jpg',
    'Gommage à l''Argan Riche en Vitamine E',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'dd874323-0c3d-5182-8144-27193031ad44',
    '0b59494b-dc8c-563d-9211-b3cdc3c53153',
    '/products/soins-du-visage/gel-nettoyant-a-l-argan.jpg',
    'Gel Nettoyant à l''Argan',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '24c3bd3f-0716-522e-8594-8a8f9404e1a2',
    '7234c128-ab88-576a-93d2-d5a889047818',
    '/products/soins-du-visage/gommage-visage-corps-au-nila.jpg',
    'Gommage Visage & Corps au Nila',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'ac7ea407-56cd-5a3f-8c63-599c99e4d6ce',
    'abe1d3ef-7793-5c3e-9b02-7d09e09c83ca',
    '/products/soins-du-visage/masque-a-l-argile-a-la-rose-et-a-l-argan.jpg',
    'Masque à l''Argile à la Rose et à l''Argan',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'fab1ab0b-26d6-5a80-9df3-66d67b601552',
    '268397fc-21d5-54a5-b23d-ae5987de4f57',
    '/products/soins-du-visage/blush-liquide-rose.jpg',
    'Blush Liquide Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '56c1473f-9eed-5a44-bb95-a3fe4e3b0648',
    'e6a6363a-4ecc-5137-8a0d-4e33c6c7859c',
    '/products/soins-du-visage/serum-cosmetique-a-la-rose.jpg',
    'Sérum Cosmétique à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'e1c12d29-c19c-5887-8aa6-2f36920040cb',
    'd3c97dcc-4d01-5358-82f0-543ce82ae6e1',
    '/products/soins-du-visage/creme-de-soin-hydratante-visage-corps-a-la-rose.jpg',
    'Crème de Soin Hydratante Visage & Corps à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '56619bef-95ea-5cbd-912f-ba948fb671c5',
    '30c0e964-9bec-54d6-a3b7-6b7af8c67739',
    '/products/soins-du-visage/coffret-de-soins-miniatures-rose.jpg',
    'Coffret de Soins Miniatures (Rose)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'c1ddf7d0-de8f-558f-8685-bf090854576a',
    '883f7292-f52d-5314-b8cd-f227e6e02247',
    '/products/soins-du-visage/creme-intensive-pour-le-visage.jpg',
    'Crème Intensive pour le Visage',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '0bac215b-dccb-59c8-9019-88336665d790',
    '852a2e95-2524-53b9-adaa-f98c8c295199',
    '/products/soins-du-visage/creme-intensive-pour-le-visage-2.jpg',
    'Crème Intensive pour le Visage',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'e18064ab-764f-5310-bee4-852280ce7a49',
    '4bc59644-e0b1-5f45-833e-5f8357e7c2ff',
    '/products/soins-du-visage/gel-nettoyant-a-la-rose.jpg',
    'Gel Nettoyant à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'bf2a210e-5105-5029-9adf-88c112ad421e',
    'dd6ea142-08a0-5625-bc74-c06f755a3b16',
    '/products/soins-du-visage/lait-creme-concentre-a-la-rose.jpg',
    'Lait-Crème Concentré à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'a2e5d4f2-d930-593d-86e8-f0f1ccce486b',
    '4fc9e622-fb3c-58c2-a8f1-71e1a9745b51',
    '/products/soins-du-visage/gommage-au-musc-riche-en-vitamine-e.jpg',
    'Gommage au Musc Riche en Vitamine E',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'd5ce52ad-a4b2-5400-8cfe-9c228b291e3e',
    '543fc47d-252a-56ff-80e4-1ed5d79ba3bf',
    '/products/soins-du-visage/serum-naturel-visage-corps-a-la-rose.jpg',
    'Sérum Naturel Visage & Corps à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '9b8b3245-5b7b-56e4-9e33-b8460abc3985',
    'c3a6cdd4-8edb-5667-8366-0f47010c029b',
    '/products/soins-du-visage/serum-naturel-visage-corps-a-l-aloe-vera.jpg',
    'Sérum Naturel Visage & Corps à l''Aloe Vera',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '76dc0c10-ce31-5f28-a927-0da9b174fc08',
    '326735b5-239b-56eb-864b-e488d1eac0a5',
    '/products/soins-du-visage/masque-purifiant-argile-eau-de-rose.jpg',
    'Masque Purifiant Argile & Eau de Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '994f2a03-1082-55a1-84b2-20dc95a1474d',
    '24b23c27-fe6e-577d-92bb-724a0beea4fe',
    '/products/soins-du-visage/creme-hydratante-au-nila-bleu-et-rose.jpg',
    'Crème Hydratante au Nila Bleu et Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'eeacfa6c-1013-54b0-ad1a-67e67e8da25f',
    '8f762da7-f943-5aac-a2a6-cc64a7bd53df',
    '/products/soins-du-visage/creme-hydratante-aloe-vera-rose.jpg',
    'Crème Hydratante Aloe Vera & Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '21d38079-5eac-5643-a1e0-ca5fd05f7024',
    'a6527483-ce15-5554-a380-9aa16e7560ad',
    '/products/soins-des-cheveux/ghassoul-argile-marocaine-aux-huiles-essentielles.jpg',
    'Ghassoul/Argile Marocaine aux Huiles Essentielles',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'bc164408-1c0a-57b7-a161-025567c9b8fe',
    '95725b8a-6471-5e73-8240-385dde5cf049',
    '/products/soins-des-cheveux/masque-a-l-argile-a-la-rose-et-au-the-vert.jpg',
    'Masque à l''Argile à la Rose et au Thé Vert',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'fd565be5-4afc-5a66-baa2-99164a678b98',
    '3f132c6a-b177-5e68-b228-f4c7844497e7',
    '/products/soins-des-cheveux/masque-a-l-argile-au-nila-et-a-la-rose.jpg',
    'Masque à l''Argile au Nila et à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '50450fd8-f0b1-533f-a434-9f96b47b394b',
    '9c7d61b6-c708-5463-936e-4586d1fc5b27',
    '/products/soins-des-cheveux/masque-a-l-argile-a-la-rose-et-au-safran.jpg',
    'Masque à l''Argile à la Rose et au Safran',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '5df95b29-1f76-5831-9704-9fbe9fea5c98',
    '639bc0c1-7ab4-5afd-952e-e5041bffc5c5',
    '/products/soins-des-cheveux/gel-demelant-apres-shampooing.jpg',
    'Gel Démêlant Après-Shampooing',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '4b021306-66d5-5fe6-8dbc-32704ef04c95',
    'b7e2c81d-3a31-5f19-abf9-c6b68eb26fc5',
    '/products/soins-des-cheveux/shampooing-a-l-aloe-vera.jpg',
    'Shampooing à l''Aloe Vera',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'b5d9bd5c-51d4-5f67-8c82-994137eef3f5',
    '7f567e1b-48e1-5ef2-bd81-9b90de43e2be',
    '/products/soins-des-cheveux/shampooing-a-la-rose.jpg',
    'Shampooing à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '2b1f04bc-3230-5bb1-9330-063fcce0117c',
    '46f92688-d5d5-57d2-8b37-db0317551cad',
    '/products/soins-des-cheveux/shampooing-au-oud.jpg',
    'Shampooing au Oud',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '9d365ee4-80a3-55d2-b625-bebcde66762c',
    'f15beb72-28c1-5ee9-b222-7394b38378c8',
    '/products/soins-des-cheveux/shampooing-au-romarin.jpg',
    'Shampooing au Romarin',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'c8681b92-f722-5b3b-acb8-ba272551b7b8',
    '5089b73a-1581-5a6c-8708-bacc8328ef63',
    '/products/soins-des-cheveux/shampooing-au-the-vert.jpg',
    'Shampooing au Thé Vert',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '5261b484-0446-5c6a-b0c4-38384854498a',
    '5fa19e11-7de9-5e1a-9d60-b4bba8353993',
    '/products/soins-des-cheveux/shampooing-au-oud-2.jpg',
    'Shampooing au Oud',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'd43da786-e42c-5fd9-af32-2896db59ac0b',
    '1a66fb5c-f110-5189-b968-119bf1fc8fe9',
    '/products/soins-des-cheveux/serum-capillaire-a-l-extrait-de-rose.jpg',
    'Sérum Capillaire à l''Extrait de Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'd1fbc81b-e719-5eb5-944a-b14655b63ee5',
    '27bf4645-626e-53d9-a4d3-6ea6ff8465c2',
    '/products/soins-des-cheveux/shampooing-a-l-argan.jpg',
    'Shampooing à l''Argan',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '42b5d63f-5b15-522d-a3ff-22fd3666ae58',
    '75e1193c-d222-5322-9cc8-c2ed882d72cf',
    '/products/produits-bruts/boutons-de-roses-sechees.jpg',
    'Boutons de Roses Séchées',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'd9a09e6c-d427-55a3-82ca-bd85e0413fee',
    'f550fd13-d7fb-5f7a-823b-4e636c27c731',
    '/products/produits-bruts/boutons-de-roses-sechees-2.jpg',
    'Boutons de Roses Séchées',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'bc3e7d54-7135-5e98-a8f3-476655709b4b',
    'a249bbe4-d81d-5e3b-8425-d3363ee2b286',
    '/products/soins-du-corps/deodorant-roll-on.jpg',
    'Déodorant Roll-on',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '8e876576-d20c-5b06-8620-b6c16c66844c',
    '73580003-3d42-5241-8edc-3ae0212a76ae',
    '/products/soins-du-corps/deodorant-stick-rose-musc.jpg',
    'Déodorant Stick (Rose & Musc)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '5fa63ab5-c05d-5c91-ba1c-1572c5cc4f95',
    'c9e459b1-094d-5974-9061-a3a71313024d',
    '/products/soins-du-corps/gel-douche-a-la-fraise.jpg',
    'Gel Douche à la Fraise',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '639b93fc-e14c-55ca-8cf8-5ef4a1c95e89',
    'efb2b22a-e922-5136-99d6-69757803d76c',
    '/products/soins-du-corps/fresh-deodorant-senteur-rose.jpg',
    'Fresh Deodorant Senteur Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '213cd63f-37e8-5a46-b8b3-c5cc401e4395',
    '311f8c6f-7ece-5138-8dbe-9737f3c6b42d',
    '/products/soins-du-corps/savon-liquide-pour-les-mains-a-la-rose.jpg',
    'Savon Liquide pour les Mains à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '79984bf3-7491-5e17-92a0-bc1c1042ebf6',
    '363802e0-0e7a-5ebd-8da7-e8ececceae8d',
    '/products/soins-du-corps/gel-douche-a-la-rose.jpg',
    'Gel Douche à la Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '182ddd90-2278-56e2-b21c-1c3c4ea50a39',
    '7708cef5-a61d-5d78-a348-9c609a1ed8b2',
    '/products/soins-du-corps/deodorant-pour-femme-roll-on.jpg',
    'Déodorant pour Femme Roll-on',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'f8da9b24-e808-5e58-b611-eb1fa48707ff',
    '6673c65e-29f0-5980-bdbf-a68045cd3def',
    '/products/eaux-et-huiles/eau-de-rose-distillee.jpg',
    'Eau de Rose Distillée',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '348d6ce3-b4b7-55c6-b0c2-342a853cdd1a',
    'd63a35f8-d992-5ea7-a0e4-4e79ad67ab89',
    '/products/eaux-et-huiles/eau-de-rose-distillee-flacon-bleu-spray.jpg',
    'Eau de Rose Distillée (Flacon Bleu Spray)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '799fca81-391b-5d14-bc21-56a5bdd587e0',
    '65c732b2-3e26-5187-bea9-159d2b37dfdc',
    '/products/eaux-et-huiles/huile-de-rose.jpg',
    'Huile de Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '892abd0e-4ef6-571b-9373-227e73a02402',
    'dfe20cf1-62cd-55e6-a566-04fce29eede0',
    '/products/eaux-et-huiles/huile-de-rose-avec-pipette.jpg',
    'Huile de Rose avec Pipette',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'a68aee40-c110-513e-b7fe-b8b9b4ddbff8',
    '2f41179c-6f7e-5ec2-bd19-597dcbf8f0cd',
    '/products/eaux-et-huiles/huile-de-rose-2.jpg',
    'Huile de Rose',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '8aba0fc6-687f-5ec2-9733-ea9007ba8ff9',
    '582a151c-12ff-5228-bcbe-9afecfbe9816',
    '/products/eaux-et-huiles/eau-de-rose-distillee-mini-spray-30ml.jpg',
    'Eau de Rose Distillée (Mini Spray 30ml)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'ae74676c-a0df-5721-ae7a-8a1d9397e756',
    '39a364c0-29f8-5916-9253-d469dbfaf759',
    '/products/eaux-et-huiles/serum-huile-cosmetique-au-lait-et-huile-d-argan.jpg',
    'Sérum/Huile Cosmétique au Lait et Huile d''Argan',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'ae871d2b-5350-50b5-b269-f522debf72f2',
    'ab29ce79-9be1-58ec-bcb0-e74f8b8d3151',
    '/products/eaux-et-huiles/eau-de-rose-distillee-mini-spray-cosmetique.jpg',
    'Eau de Rose Distillée (Mini Spray Cosmétique)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '959ba8a5-0c8b-54a9-9c84-b051365a13b6',
    'b899f0bf-2716-5364-a63d-4f9eacac9f03',
    '/products/eaux-et-huiles/eau-de-rose-distillee-flacon-bleu-spray-50ml.jpg',
    'Eau de Rose Distillée (Flacon Bleu Spray) 50ml',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '2f5630cb-40ba-5f59-9810-37d5920a3a5d',
    '61f74e5c-be24-524d-b881-cc6e79b29b4c',
    '/products/eaux-et-huiles/eau-de-rose-distillee-2.jpg',
    'Eau de Rose Distillée',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '9aa8532d-b75b-520e-b426-32503eeb4a37',
    '29a8e0ac-dd00-597e-902c-0c1bc792740a',
    '/products/eaux-et-huiles/eau-de-rose-distillee-spray-bleu-usage-externe.jpg',
    'Eau de Rose Distillée (Spray Bleu Usage Externe)',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    '03007f10-4837-5190-acfd-a27cf866ba6f',
    '4f1998bd-b673-587d-94e8-c0e9a7191223',
    '/products/eaux-et-huiles/huile-d-argan-cosmetique.jpg',
    'Huile d''Argan Cosmétique',
    1,
    true
);
INSERT INTO public.product_images (
    id, product_id, storage_path, alt_text, display_order, is_primary
) VALUES (
    'f37ce22c-3333-5b74-a6fa-7a4bd2cf76a9',
    '6501bf8f-be58-5081-a415-9eb8d01f6635',
    '/products/eaux-et-huiles/creme-hydratante-argan-rose.jpg',
    'Crème Hydratante Argan & Rose',
    1,
    true
);

COMMIT;
