ALTER TABLE "equipment_catalog" ADD COLUMN "appearanceKey" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "equippedAppearance" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "equipmentVersion" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "appearanceRevision" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
INSERT INTO public.equipment_catalog ("id","slug","name","flavorText","category","rarity","visualType","primaryStat","affixes","uniquePower","imageUrl","sortOrder","kind","artKey","appearanceKey") VALUES
('a1000000-0000-4000-8000-000000000001','larval-plate-vest','Larval Plate Vest','Thin chitin, still soft from the last shed. It holds because you do.','carapace','common','carapace',12,'[]'::jsonb,NULL,'/images/chassis/carapace.webp',1,'gear',NULL,'larval-plate-vest'),
('a1000000-0000-4000-8000-000000000002','tide-braced-carapace','Tide-Braced Carapace','Ribbed against surface weather. Drama slides off like silt.','carapace','uncommon','carapace',28,'[{"stat": "perception", "value": 4}]'::jsonb,NULL,'/images/chassis/carapace.webp',2,'gear',NULL,'tide-braced-carapace'),
('a1000000-0000-4000-8000-000000000003','abyssal-ward-shell','Abyssal Ward Shell','Pressure-forged in the benthic core. Nothing shallow dents this.','carapace','epic','carapace',72,'[{"stat": "intelligence", "value": 8}]'::jsonb,NULL,'/images/chassis/carapace.webp',3,'gear',NULL,'abyssal-ward-shell'),
('a1000000-0000-4000-8000-000000000011','hydrostatic-seal-plate','Hydrostatic Seal Plate','Depth is not an enemy. Depth is the kiln.','carapace','legendary','carapace',94,'[{"stat": "intelligence", "value": 10}]'::jsonb,'{"name": "Pressure Calcifies", "description": "The harder the current, the tighter this plate sets. Surface weather cannot pry it open."}'::jsonb,'/images/chassis/carapace.webp',4,'gear',NULL,'hydrostatic-seal-plate'),
('a1000000-0000-4000-8000-000000000004','training-pincers','Training Pincers','Practice clamps for initiates who are still learning to finish.','claws','common','pincer',14,'[]'::jsonb,NULL,'/images/chassis/pincer.webp',5,'gear',NULL,'training-pincers'),
('a1000000-0000-4000-8000-000000000005','hydraulic-crush-claws','Hydraulic Crush Claws','They close once. The goal does not escape.','claws','rare','pincer',48,'[{"stat": "speed", "value": 5}]'::jsonb,NULL,'/images/chassis/pincer.webp',6,'gear',NULL,'hydraulic-crush-claws'),
('a1000000-0000-4000-8000-000000000006','synapse-shear-claws','Synapse-Shear Claws','Legendary torque. Soft deadlines do not survive contact.','claws','legendary','pincer',96,'[{"stat": "speed", "value": 8}]'::jsonb,'{"name": "Zero-Latency Clamp", "description": "The first grip of a session closes without hesitation. There is no gap between seeing the work and taking it."}'::jsonb,'/images/chassis/pincer.webp',7,'gear',NULL,'synapse-shear-claws'),
('a1000000-0000-4000-8000-000000000012','silt-maul','Silt Maul','A blunt instrument for mornings that will not start themselves.','claws','uncommon','hammer',32,'[{"stat": "defense", "value": 4}]'::jsonb,NULL,'/images/chassis/hammer.webp',8,'gear',NULL,'silt-maul'),
('a1000000-0000-4000-8000-000000000013','tideforge-hammer','Tideforge Hammer','Forged where current meets iron. One strike, one finished task.','claws','rare','hammer',54,'[{"stat": "defense", "value": 6}]'::jsonb,NULL,'/images/chassis/hammer.webp',9,'gear',NULL,'tideforge-hammer'),
('a1000000-0000-4000-8000-000000000007','soft-shell-visor','Soft-Shell Visor','Filters the loudest currents so a young mind can think.','head','common','helm',11,'[]'::jsonb,NULL,'/images/chassis/helm.webp',10,'gear',NULL,'soft-shell-visor'),
('a1000000-0000-4000-8000-000000000008','architect-crown-plate','Architect Crown Plate','A calm brow for builders who stack systems instead of tabs.','head','rare','helm',44,'[{"stat": "perception", "value": 6}]'::jsonb,NULL,'/images/chassis/helm.webp',11,'gear',NULL,'architect-crown-plate'),
('a1000000-0000-4000-8000-000000000009','oracle-dome-lattice','Oracle Dome Lattice','Thought arrives quiet and leaves finished.','head','legendary','helm',88,'[{"stat": "perception", "value": 10}]'::jsonb,'{"name": "Quiet Arrival", "description": "Thought reaches the dome already complete. Surface chatter never crosses the lattice."}'::jsonb,'/images/chassis/helm.webp',12,'gear',NULL,'oracle-dome-lattice'),
('a1000000-0000-4000-8000-00000000000a','silt-walker-greaves','Silt-Walker Greaves','Steady steps through muddy mornings.','legs','common','greaves',13,'[]'::jsonb,NULL,'/images/chassis/greaves.webp',13,'gear',NULL,'silt-walker-greaves'),
('a1000000-0000-4000-8000-00000000000b','current-cutter-legs','Current-Cutter Legs','They find the short path through the noise.','legs','uncommon','greaves',31,'[{"stat": "attack", "value": 4}]'::jsonb,NULL,'/images/chassis/greaves.webp',14,'gear',NULL,'current-cutter-legs'),
('a1000000-0000-4000-8000-00000000000c','void-stride-articulation','Void-Stride Articulation','Epic locomotion for initiates who refuse to linger on the surface.','legs','epic','greaves',68,'[{"stat": "perception", "value": 8}]'::jsonb,NULL,'/images/chassis/greaves.webp',15,'gear',NULL,'void-stride-articulation'),
('a1000000-0000-4000-8000-00000000000d','larval-feelers','Larval Feelers','They twitch at the first hint of distraction.','antennae','common','antennae',10,'[]'::jsonb,NULL,'/images/chassis/antennae.webp',16,'gear',NULL,'larval-feelers'),
('a1000000-0000-4000-8000-00000000000e','depth-sense-antennae','Depth-Sense Antennae','You notice the quiet work before the loud demand.','antennae','uncommon','antennae',26,'[{"stat": "intelligence", "value": 4}]'::jsonb,NULL,'/images/chassis/antennae.webp',17,'gear',NULL,'depth-sense-antennae'),
('a1000000-0000-4000-8000-00000000000f','benthic-radar-array','Benthic Radar Array','Rare perception. Surface chatter never reaches the core.','antennae','rare','antennae',52,'[{"stat": "speed", "value": 6}]'::jsonb,NULL,'/images/chassis/antennae.webp',18,'gear',NULL,'benthic-radar-array'),
('a1000000-0000-4000-8000-000000000010','ascendant-signal-crown','Ascendant Signal Crown','Antennae that hear what matters and ignore the melt.','antennae','epic','antennae',74,'[{"stat": "intelligence", "value": 8}]'::jsonb,NULL,'/images/chassis/antennae.webp',19,'gear',NULL,'ascendant-signal-crown'),
('a1000000-0000-4000-8000-000000000014','larval-chitin-cincture','Larval Chitin Cincture','A snug ventral sash keeping the abdominal plates locked under depth.','belt','common','belt',11,'[]'::jsonb,NULL,'/images/chassis/belt.webp',20,'gear',NULL,'larval-chitin-cincture'),
('a1000000-0000-4000-8000-000000000016','silt-tension-vent-sash','Silt-Tension Vent Sash','Woven from flexible hydrothermal cords. Keeps the abdominal plates stable during rapid descent.','belt','uncommon','belt',27,'[{"stat": "defense", "value": 4}]'::jsonb,NULL,'/images/chassis/belt.webp',21,'gear',NULL,'silt-tension-vent-sash'),
('a1000000-0000-4000-8000-000000000015','abyssal-clasp-girdle','Abyssal Clasp Girdle','Forged from tempered chitin ribs. Secures the core when pressure mounts.','belt','rare','belt',46,'[{"stat": "speed", "value": 4}]'::jsonb,NULL,'/images/chassis/belt.webp',22,'gear',NULL,'abyssal-clasp-girdle'),
('a1000000-0000-4000-8000-000000000017','hydrostatic-girdle-lattice','Hydrostatic Girdle Lattice','Pressure-sealed titanium ribs distribute benthic torque evenly across the chassis core.','belt','epic','belt',70,'[{"stat": "intelligence", "value": 8}]'::jsonb,NULL,'/images/chassis/belt.webp',23,'gear',NULL,'hydrostatic-girdle-lattice'),
('a1000000-0000-4000-8000-000000000018','core-lock-vent-harness','Core-Lock Vent Harness','Legendary ventral plating. The deep core does not buckle.','belt','legendary','belt',92,'[{"stat": "defense", "value": 10}]'::jsonb,'{"name": "Zero-Strain Bulkhead", "description": "When abdominal torque peaks, internal pressure vents automatically. Your core never fractures under sudden load."}'::jsonb,'/images/chassis/belt.webp',24,'gear',NULL,'core-lock-vent-harness'),
('a2000000-0000-4000-8000-000000000001','creator-hard-hat','Hard hat','A familiar fit, made for your shell.','head','common','helm',0,'[]'::jsonb,NULL,'',25,'gear',NULL,'creator-hard-hat'),
('a2000000-0000-4000-8000-000000000002','creator-crown','Crown','A familiar fit, made for your shell.','head','common','helm',0,'[]'::jsonb,NULL,'',26,'gear',NULL,'creator-crown'),
('a2000000-0000-4000-8000-000000000003','creator-headset','Headset','A familiar fit, made for your shell.','head','common','helm',0,'[]'::jsonb,NULL,'',27,'gear',NULL,'creator-headset'),
('a2000000-0000-4000-8000-000000000004','creator-halo','Halo','A familiar fit, made for your shell.','head','common','helm',0,'[]'::jsonb,NULL,'',28,'gear',NULL,'creator-halo'),
('a2000000-0000-4000-8000-000000000005','creator-bow','Bow','A familiar fit, made for your shell.','head','common','helm',0,'[]'::jsonb,NULL,'',29,'gear',NULL,'creator-bow'),
('a2000000-0000-4000-8000-000000000006','creator-beanie','Beanie','A familiar fit, made for your shell.','head','common','helm',0,'[]'::jsonb,NULL,'',30,'gear',NULL,'creator-beanie'),
('a2000000-0000-4000-8000-000000000007','creator-crusher','Crusher gauntlet','A familiar fit, made for your shell.','claws','common','pincer',0,'[]'::jsonb,NULL,'',31,'gear',NULL,'creator-crusher'),
('a2000000-0000-4000-8000-000000000008','creator-slim','Slender gauntlet','A familiar fit, made for your shell.','claws','common','pincer',0,'[]'::jsonb,NULL,'',32,'gear',NULL,'creator-slim'),
('a2000000-0000-4000-8000-000000000009','creator-mitten','Mitten gauntlet','A familiar fit, made for your shell.','claws','common','pincer',0,'[]'::jsonb,NULL,'',33,'gear',NULL,'creator-mitten')
ON CONFLICT (id) DO UPDATE SET "slug"=EXCLUDED."slug","name"=EXCLUDED."name","flavorText"=EXCLUDED."flavorText","category"=EXCLUDED."category","rarity"=EXCLUDED."rarity","visualType"=EXCLUDED."visualType","primaryStat"=EXCLUDED."primaryStat","affixes"=EXCLUDED."affixes","uniquePower"=EXCLUDED."uniquePower","imageUrl"=EXCLUDED."imageUrl","sortOrder"=EXCLUDED."sortOrder","kind"=EXCLUDED."kind","artKey"=EXCLUDED."artKey","appearanceKey"=EXCLUDED."appearanceKey";
--> statement-breakpoint
CREATE FUNCTION public.character_equipment_snapshot(p_user text) RETURNS jsonb
LANGUAGE sql STABLE SET search_path = pg_catalog, public AS $$
 SELECT COALESCE(jsonb_object_agg(g."equippedSlot", jsonb_build_object('visualKey', c."appearanceKey", 'rarity',c.rarity)), '{}'::jsonb)
 FROM public.user_gear_items g JOIN public.equipment_catalog c ON c.id=g."catalogItemId"
 WHERE g."userId"=p_user AND g."equippedSlot" IN ('head','carapace','belt','legs','antennae','claws-1','claws-2') AND c.kind='gear' AND c."appearanceKey" IS NOT NULL;
$$;
--> statement-breakpoint
CREATE FUNCTION public.initialize_character(p_user text) RETURNS void
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE v_version integer;
BEGIN
 SELECT "equipmentVersion" INTO v_version FROM public.profiles WHERE id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Member not found.'; END IF;
 IF v_version >= 1 THEN RETURN; END IF;
 DELETE FROM public.user_gear_items WHERE "userId"=p_user;
 INSERT INTO public.user_gear_items ("userId","catalogItemId","equippedSlot","vaultIndex") VALUES
(p_user,'a1000000-0000-4000-8000-000000000001'::uuid,'carapace',NULL),
(p_user,'a1000000-0000-4000-8000-000000000004'::uuid,'claws-1',NULL),
(p_user,'a1000000-0000-4000-8000-000000000004'::uuid,'claws-2',NULL),
(p_user,'a1000000-0000-4000-8000-000000000007'::uuid,'head',NULL),
(p_user,'a1000000-0000-4000-8000-00000000000a'::uuid,'legs',NULL),
(p_user,'a1000000-0000-4000-8000-00000000000d'::uuid,'antennae',NULL),
(p_user,'a1000000-0000-4000-8000-000000000014'::uuid,'belt',NULL),
(p_user,'a2000000-0000-4000-8000-000000000001'::uuid,NULL,0),
(p_user,'a2000000-0000-4000-8000-000000000002'::uuid,NULL,1),
(p_user,'a2000000-0000-4000-8000-000000000003'::uuid,NULL,2),
(p_user,'a2000000-0000-4000-8000-000000000004'::uuid,NULL,3),
(p_user,'a2000000-0000-4000-8000-000000000005'::uuid,NULL,4),
(p_user,'a2000000-0000-4000-8000-000000000006'::uuid,NULL,5),
(p_user,'a2000000-0000-4000-8000-000000000007'::uuid,NULL,6),
(p_user,'a2000000-0000-4000-8000-000000000007'::uuid,NULL,7),
(p_user,'a2000000-0000-4000-8000-000000000008'::uuid,NULL,8),
(p_user,'a2000000-0000-4000-8000-000000000008'::uuid,NULL,9),
(p_user,'a2000000-0000-4000-8000-000000000009'::uuid,NULL,10),
(p_user,'a2000000-0000-4000-8000-000000000009'::uuid,NULL,11);
 UPDATE public.profiles SET "equipmentVersion"=1, "appearanceRevision"="appearanceRevision"+1,
 "avatarConfig"="avatarConfig" - 'equipment' - 'accessory' - 'claws',
 "equippedAppearance"=public.character_equipment_snapshot(p_user), "updatedAt"=now() WHERE id=p_user;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.commit_character(p_user text,p_revision integer,p_config jsonb,p_placements jsonb) RETURNS integer
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE v_revision integer; v_count integer;
BEGIN
 SELECT "appearanceRevision" INTO v_revision FROM public.profiles WHERE id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Member not found.'; END IF;
 IF p_revision IS NULL OR v_revision <> p_revision THEN
   RAISE EXCEPTION 'Your character changed in another session. Reload before saving.' USING ERRCODE='40001';
 END IF;
 IF p_config IS NOT NULL AND (jsonb_typeof(p_config) <> 'object' OR COALESCE(length(p_config->>'seed'),0) NOT BETWEEN 1 AND 128 OR p_config->>'style' IS DISTINCT FROM 'critters') THEN
   RAISE EXCEPTION 'Invalid character configuration.';
 END IF;
 IF p_placements IS NULL OR jsonb_typeof(p_placements) <> 'array' THEN RAISE EXCEPTION 'Invalid equipment placements.'; END IF;
 SELECT count(*) INTO v_count FROM public.user_gear_items WHERE "userId"=p_user;
 IF jsonb_array_length(p_placements) <> v_count OR
   (SELECT count(DISTINCT id) FROM jsonb_to_recordset(p_placements) AS p(id uuid)) <> v_count THEN
   RAISE EXCEPTION 'Include every owned item exactly once.';
 END IF;
 IF EXISTS (
   SELECT 1 FROM jsonb_to_recordset(p_placements) AS p(id uuid,"equippedSlot" text,"vaultIndex" integer)
   LEFT JOIN public.user_gear_items g ON g.id=p.id AND g."userId"=p_user
   LEFT JOIN public.equipment_catalog c ON c.id=g."catalogItemId"
   WHERE g.id IS NULL OR c.id IS NULL OR c.kind <> 'gear' OR c."appearanceKey" IS NULL OR
   NOT ((p."equippedSlot" IS NULL AND p."vaultIndex" BETWEEN 0 AND 19) OR
   (p."vaultIndex" IS NULL AND p."equippedSlot" IS NOT NULL AND p."equippedSlot" IN ('head','carapace','belt','legs','antennae','claws-1','claws-2') AND
     c.category = CASE WHEN p."equippedSlot" IN ('claws-1','claws-2') THEN 'claws' ELSE p."equippedSlot" END)) OR
   (p."equippedSlot" IS NULL AND p."vaultIndex" IS NULL)
 ) THEN RAISE EXCEPTION 'Invalid or unowned equipment placement.'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p_placements) AS p("equippedSlot" text) WHERE p."equippedSlot" IS NOT NULL GROUP BY p."equippedSlot" HAVING count(*)>1)
 OR EXISTS (SELECT 1 FROM jsonb_to_recordset(p_placements) AS p("vaultIndex" integer) WHERE p."vaultIndex" IS NOT NULL GROUP BY p."vaultIndex" HAVING count(*)>1) THEN
   RAISE EXCEPTION 'Duplicate equipment position.';
 END IF;
 UPDATE public.user_gear_items SET "equippedSlot"=NULL,"vaultIndex"=NULL WHERE "userId"=p_user;
 UPDATE public.user_gear_items g SET "equippedSlot"=p."equippedSlot","vaultIndex"=p."vaultIndex","updatedAt"=now()
 FROM jsonb_to_recordset(p_placements) AS p(id uuid,"equippedSlot" text,"vaultIndex" integer)
 WHERE g.id=p.id AND g."userId"=p_user;
 UPDATE public.profiles SET "avatarConfig"=p_config - 'equipment' - 'accessory' - 'claws',
   "equippedAppearance"=public.character_equipment_snapshot(p_user), "appearanceRevision"=v_revision+1,"updatedAt"=now() WHERE id=p_user;
 RETURN v_revision+1;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.initialize_character(text), public.commit_character(text,integer,jsonb,jsonb), public.character_equipment_snapshot(text) FROM PUBLIC;
