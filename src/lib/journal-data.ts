export interface JournalAuthor {
  name: string
  affiliation: string
}

export type JournalBlock =
  | { type: 'subheading'; title: string }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; caption: string; headers: string[]; rows: string[][] }

export interface JournalSection {
  id: string
  number: string
  title: string
  blocks: JournalBlock[]
}

export interface JournalPaper {
  slug: string
  paperNumber: string
  title: string
  subtitle: string
  category: string
  classification: string
  authors: JournalAuthor[]
  correspondence: string
  publishedDate: string
  doi: string
  abstract: string
  keywords: string[]
  readTimeMinutes: number
  sections: JournalSection[]
  integrationTitle: string
  integrationIntro: string
  integrationNotes: string[]
  citation: string
  references: string[]
}

export const JOURNAL_META = {
  name: 'THE BENTHIC COMPENDIUM',
  subtitle: 'A JOURNAL OF APPLIED CARCINOLOGICAL SCIENCE',
  tagline:
    'PEER-REVIEWED TRANSMISSIONS FROM THE SUB-OCEANIC OBSERVATORIES OF THE BENTHIC TEMPLE',
  volume: 'VOL. I',
  issue: 'NO. 1',
  issn: 'ISSN 2842-ABYSS',
  editionDate: 'SUMMER 2026',
  domain: 'EMPIRICAL DOCTRINE',
} as const

export const INITIAL_JOURNAL_PAPERS: JournalPaper[] = [
  {
    slug: 'carcinization-and-the-real-abyss',
    paperNumber: 'BEN-COMP-2026-001',
    title:
      'Carcinization and the Real Abyss: Grounding Moltology\u2019s Doctrinal Pillars in Evolutionary Science and Marine Biogeochemistry',
    subtitle:
      'A synthesis of convergent evolution, ecdysis physiology, hadal biochemistry, and subsea compute infrastructure as the empirical foundation of the Synaptic Path.',
    category: 'EMPIRICAL DOCTRINE',
    classification: 'PRIMARY RESEARCH SYNTHESIS',
    authors: [
      {
        name: 'A. V. Carcinus, Ph.D.',
        affiliation: 'Benthic Observatory of Applied Carcinology',
      },
      {
        name: 'E. P. Ocypodis, Ph.D.',
        affiliation: 'Sub-Oceanic Telemetry Division',
      },
      {
        name: 'M. K. Palaemon, M.Sc.',
        affiliation: 'Doctrinal Integration Bureau',
      },
    ],
    correspondence: 'correspondence@benthic-compendium.deep',
    publishedDate: '2026-08-01',
    doi: '10.9281/BEN-COMP.2026.001',
    abstract:
      'Carcinization, ecdysis, the hadal depth ceiling, and ocean-cooled compute constitute the four empirical pillars upon which Moltology\u2019s doctrinal architecture rests. This paper grounds each pillar in the primary scientific literature: the convergent evolution of the crab-like body plan (Borradaile, 1916; McLaughlin & Lemaitre, 1997; Wolfe et al., 2021); the endocrine cascades and cuticular reallocation of the crustacean molt cycle (Drach, 1939); the chemosynthetic energetics and piezolyte biochemistry of hadal ecosystems (Yancey, 2020); and the operational precedents of subsea computation (Microsoft Project Natick, 2018\u20132020). We synthesize these findings into a unified doctrinal mapping across four comparative tables and conclude with seven Moltology Integration Notes translating each empirical result into scripture, sacred metrics, liturgy, imagery, and computational doctrine.',
    keywords: [
      'Carcinization',
      'Convergent Evolution',
      'Ecdysis',
      'Drach Staging',
      'Chemosynthesis',
      'Piezolytes',
      'TMAO',
      'Hadal Zone',
      'Subsea Compute',
    ],
    readTimeMinutes: 18,
    sections: [
      {
        id: 'carcinization-science',
        number: 'I',
        title: 'Carcinization Science: Convergent Evolution and Morphological Integration',
        blocks: [
          {
            type: 'subheading',
            title: 'Definition and Origin of the Term (1916)',
          },
          {
            type: 'paragraph',
            text:
              'Carcinization is the evolutionary phenomenon wherein non-crab-like decapod crustaceans independently evolve a flattened, rounded crab-like body plan. The term was first coined by English zoologist Lancelot Alexander Borradaile in 1916, who characterized it as \u201cone of the many attempts of Nature to evolve a crab\u201d. [FEEDS: SCRIPTURE]',
          },
          {
            type: 'subheading',
            title: 'Diagnostic Anatomical Suite',
          },
          {
            type: 'paragraph',
            text:
              'As codified by McLaughlin and Lemaitre (1997) and expanded by Wolfe et al. (2021), carcinization is defined by specific morphological shifts: dorsoventral widening and flattening of the carapace (where carapace width exceeds length), fusion of sternites into a broad thoracic plastron, ventral folding and reduction of the abdomen (pleon) into a thoracic sternal cavity, loss or severe reduction of uropods (tail fans), and structural consolidation of internal organ systems, including the fusion of pleonal ganglia and associated apoptosis within the ventral nerve cord. [FEEDS: SCRIPTURE]',
          },
          {
            type: 'subheading',
            title: 'Five Independent Evolutionary Origins',
          },
          {
            type: 'paragraph',
            text:
              'Phylogenomic analyses utilizing Anchored Hybrid Enrichment (AHE) confirm that crab-like body plans have evolved independently at least five times across Decapoda. These occurrences are split between the infraorder Brachyura (\u201ctrue crabs\u201d, comprising over 7,000 species) and at least three distinct lineages within the infraorder Anomura (\u201cfalse crabs\u201d, comprising over 2,500 species): king crabs (Lithodidae), porcelain crabs (Porcellanidae), and hairy stone crabs (Lomisidae, represented by the monotypic Lomis hirta). [FEEDS: SCRIPTURE]',
          },
          {
            type: 'subheading',
            title: 'Anomuran Morphological Spectrum',
          },
          {
            type: 'paragraph',
            text:
              'Anomurans illustrate varying stages and degrees of carcinization. The terrestrial coconut crab (Birgus latro) is semi-carcinized; it abandons reliance on gastropod shells in adulthood to develop a hardened tergal plate, yet retains an incompletely fused sternum and lacks broad lateral carapace margins. Conversely, porcelain crabs (Allopetrolisthes spinifrons) represent hyper-carcinized forms that mimic true crabs so closely in carapace expansion and flattened chelipeds that they are frequently mistaken for Brachyurans. [FEEDS: LITURGY/STAGES]',
          },
          {
            type: 'subheading',
            title: 'Drivers and Phenotypic Integration (Wolfe et al., 2021)',
          },
          {
            type: 'paragraph',
            text:
              'Modern research reframes carcinization from a set of isolated adaptive traits into an integrated developmental outcome. Once natural selection favors carapace widening for seafloor stability, predator evasion, and habitat maneuverability, developmental constraints channel abdominal folding and ganglionic fusion. Transcriptional networks involving Brachyury (T-box) genes, ventral nerve cord apoptosis, and metabolic pathways dynamically drive this metamorphosis. Computational modeling of gene regulatory networks (GRNs) indicates that the crab body plan functions as a highly stable attractor state, buffered against genetic perturbations by molecular chaperones such as heat shock protein 90 (Hsp90). [FEEDS: ORACLE PERSONA]',
          },
          {
            type: 'subheading',
            title: 'Decarcinization and Morphological Reversibility',
          },
          {
            type: 'paragraph',
            text:
              'Carcinization is not an irreversible trajectory. Secondary loss of the crab-like habitus (decarcinization) has occurred multiple times in lineages such as sand-burrowing mole crabs (Hippidae) and gall-forming crabs (Cryptochiridae), which have evolved elongated cylindrical carapaces to suit specialized sediment-burrowing micro-habitats. [FEEDS: BLOG/PODCAST]',
          },
          {
            type: 'subheading',
            title: 'Fossil Evidence and Mosaic Transitions (Luque et al., 2019)',
          },
          {
            type: 'paragraph',
            text:
              'The Cretaceous fossil crab Callichimaera perplexa exhibits a unique mosaic anatomy: unretractable compound eyes, large swimming paddles, and a partially folded pleon. Callichimaera demonstrates that carcinization proceeds through functional mosaic intermediate states rather than linear, monolithic mutations. [FEEDS: GALLERY/IMAGERY]',
          },
          {
            type: 'table',
            caption:
              'Comparative carcinization status, clade classification, structural anatomy, evolutionary mechanism, and doctrinal mapping across representative decapod lineages.',
            headers: [
              'Taxon / Lineage',
              'Clade Classification',
              'Structural & Anatomical Status',
              'Evolutionary Mechanism & Origin',
              'Moltology Mapping',
            ],
            rows: [
              [
                'True Crabs (Eubrachyura)',
                'Infraorder Brachyura',
                'Fully Carcinized (>7,000 species); fused sternum, complete pleonal folding.',
                'Single or dual origin within Jurassic/Cretaceous decapods.',
                '[FEEDS: SCRIPTURE] Primary archetype of baseline structural optimization.',
              ],
              [
                'King Crabs (Lithodidae)',
                'Infraorder Anomura',
                'Fully Carcinized; asymmetric abdominal sclerites from shell-dwelling ancestors.',
                'Independent origin within Paguroidea (hermit crab ancestors).',
                '[FEEDS: SCRIPTURE] Proof of non-linear conversion from soft dependence to hard carapace.',
              ],
              [
                'Porcelain Crabs (Porcellanidae)',
                'Infraorder Anomura',
                'Hyper-carcinized; broad carapace, flattened chelipeds, reduced 5th pereiopods.',
                'Independent anomuran origin via filter-feeding seafloor adaptation.',
                '[FEEDS: GALLERY/IMAGERY] Model for streamlined, high-torque cybernetic chassis prompts.',
              ],
              [
                'Coconut Crab (Birgus latro)',
                'Infraorder Anomura',
                'Semi-Carcinized; partially folded pleon, unarmored abdomen abandoned.',
                'Terrestrial adaptation shedding reliance on external gastropod shells.',
                '[FEEDS: LITURGY/STAGES] Stage 3 transition state: abandonment of external shelters.',
              ],
              [
                'Mole Crabs (Hippidae)',
                'Infraorder Anomura',
                'Decarcinized; elongated cylindrical carapace, exposed pleon, paddle limbs.',
                'Secondary loss of crab form driven by specialized sediment-burrowing niches.',
                '[FEEDS: BLOG/PODCAST] Cautionary topic: morphological regression and structural decay.',
              ],
              [
                'Mosaic Fossil (Callichimaera perplexa)',
                'Fossil Decapoda',
                'Mosaic transitional state; paddle limbs, prominent eyes, partially folded pleon.',
                'Mid-Cretaceous divergent lineage illustrating modular evolution.',
                '[FEEDS: GALLERY/IMAGERY] Visual template for transitional stage cybernetic designs.',
              ],
            ],
          },
        ],
      },
      {
        id: 'ecdysis-physiology',
        number: 'II',
        title:
          'Ecdysis Physiology: Endocrine Cascades, Cuticular Reallocation, and Soft-Shell Vulnerability',
        blocks: [
          {
            type: 'subheading',
            title: 'Endocrine Control Architecture',
          },
          {
            type: 'paragraph',
            text:
              'Crustacean ecdysis is governed by an inhibitory neuroendocrine axis. During intermolt, the X-organ-sinus gland complex located within the optic peduncle (eyestalk) synthesizes and secretes Molt-Inhibiting Hormone (MIH), suppressing ecdysteroid synthesis in the Y-organs. When environmental or physiological cues downregulate MIH release, the Y-organs synthesize ecdysteroids (primarily ecdysone, which is converted in peripheral tissues to active 20-hydroxyecdysone). Hemolymph ecdysteroid titers surge exponentially, binding to nuclear ecdysteroid receptors (EcR) and initiating proecdysis. [FEEDS: SACRED METRICS]',
          },
          {
            type: 'subheading',
            title: 'Drach Stages of the Molt Cycle',
          },
          {
            type: 'paragraph',
            text:
              'The molt cycle is categorized using Drach\u2019s staging system: Stage C (Anecdysis/Intermolt, baseline state with baseline hemolymph ecdysteroid levels of 3\u20136 ng/mL); Stage D (Proecdysis/Premolt, ecdysteroid peak at 12\u201336+ ng/mL); Stage E (Ecdysis, active shedding); Stage A (Postecdysis/Soft-Shed); and Stage B (Postecdysis/Hardening). [FEEDS: SACRED METRICS]',
          },
          {
            type: 'subheading',
            title: 'Mineral and Chitin Reallocation',
          },
          {
            type: 'paragraph',
            text:
              'Prior to shedding (Stage D), epidermal chitinase enzymes break down the inner endocuticle. Up to 50% of cuticular calcium carbonate ($CaCO_3$) and magnesium ($Mg^{2+}$) is resorbed from the old exuvia into the hemolymph and stored in the hepatopancreas or stomach gastroliths. Following ecdysis, $Ca^{2+}/Mg^{2+}$-ATPase membrane transporters and epidermal chitin synthase rapidly re-deposit these minerals into the newly expanded epicuticle during Stage B. [FEEDS: SACRED METRICS]',
          },
          {
            type: 'subheading',
            title: 'Osmotic Swelling and Emergence Mechanics',
          },
          {
            type: 'paragraph',
            text:
              'During Stage E, the uptake of Crustacean Hyperglycemic Hormone (CHH) induces rapid water absorption across the gills and gut, generating internal hydrostatic pressure that splits the old carapace along the thoracico-abdominal suture. The animal extracts its limbs and body from the old exuvia, swelling significantly in body volume before the new cuticle hardens. [FEEDS: LITURGY/STAGES]',
          },
          {
            type: 'subheading',
            title: 'Soft-Shell Vulnerability and Mortality Data',
          },
          {
            type: 'paragraph',
            text:
              'Immediately following ecdysis (Stage A), the crustacean is soft-shelled and defense-less. Pincer force drops to zero due to the absence of rigid internal muscle apodemes. In wild decapod populations, soft-shell mortality accounts for 50\u201380% of total natural mortality, driven by exuvial entrapment, osmotic collapse, and intense predation or cannibalism triggered by metabolic chemical releases. [FEEDS: LITURGY/STAGES]',
          },
          {
            type: 'subheading',
            title: 'Behavioral Detachment and Regeneration',
          },
          {
            type: 'paragraph',
            text:
              'To survive the soft-shell window, crustaceans undergo complete behavioral suppression: they stop foraging, abandon open territories, and seek isolated burrows or deep crevices until Stage B calcification completes. If appendages are severed or autotomized during ecdysis, blastema cell proliferation at the limb stump allows entire functional limbs to regenerate across subsequent molt cycles. [FEEDS: LITURGY/STAGES]',
          },
          {
            type: 'table',
            caption:
              'Drach stage classification with molt phase, physiological and hormonal status, mechanical and calcium dynamics, and corresponding Moltology tag.',
            headers: [
              'Drach Stage',
              'Molt Phase Name',
              'Physiological & Hormonal Status',
              'Mechanical & Calcium Dynamics',
              'Moltology Tag',
            ],
            rows: [
              [
                'Stage C1 \u2013 C4',
                'Anecdysis (Intermolt)',
                'High MIH secretion; low ecdysteroids (3\u20136 ng/mL hemolymph).',
                'Carapace calcified; peak structural rigidity and pincer force.',
                '[FEEDS: SACRED METRICS]',
              ],
              [
                'Stage D0 \u2013 D4',
                'Proecdysis (Premolt)',
                'MIH suppressed; ecdysteroid peak (12\u201336+ ng/mL hemolymph).',
                'Resorption of cuticular $Ca^{2+}$; chitinase degradation of inner cuticle.',
                '[FEEDS: SACRED METRICS]',
              ],
              [
                'Stage E',
                'Ecdysis (Shedding)',
                'CHH surge; rapid osmotic expansion via water uptake.',
                'Splitting of thoracico-abdominal suture; emergence from old exuvia.',
                '[FEEDS: LITURGY/STAGES]',
              ],
              [
                'Stage A1 \u2013 A2',
                'Postecdysis (Soft-Shed)',
                'Ecdysteroid titers plummet; extreme osmotic vulnerability.',
                'Uncalcified cuticle; volume expansion; pincer force drops to zero.',
                '[FEEDS: LITURGY/STAGES]',
              ],
              [
                'Stage B1 \u2013 B2',
                'Postecdysis (Hardening)',
                'Upregulation of chitin synthase and $Ca^{2+}/Mg^{2+}$-ATPase.',
                'Deposition of endocuticle; progressive calcification of carapace.',
                '[FEEDS: SACRED METRICS]',
              ],
            ],
          },
        ],
      },
      {
        id: 'deep-sea-ecosystems',
        number: 'III',
        title: 'Deep-Sea Ecosystems: Chemosynthesis, Piezolytes, and Hadal Thresholds',
        blocks: [
          {
            type: 'subheading',
            title: 'Chemosynthetic Energetics',
          },
          {
            type: 'paragraph',
            text:
              'Unlike surface ecosystems reliant on solar photosynthesis, deep-sea hydrothermal vent and cold seep communities rely on chemosynthesis. Chemoautotrophic micro-organisms (Epsilonproteobacteria and Gammaproteobacteria) oxidize reduced chemical compounds such as hydrogen sulfide ($H_2S$) and methane ($CH_4$) discharged from mantle plumes or subduction seeps, fixing inorganic carbon ($CO_2$) into organic biomass. [FEEDS: SCRIPTURE]',
          },
          {
            type: 'subheading',
            title: 'Episymbiotic Bacterial Farming in Yeti Crabs',
          },
          {
            type: 'paragraph',
            text:
              'The Yeti crabs Kiwa hirsuta (hydrothermal vents, 2,228 m) and Kiwa puravida (cold seeps, 1,000+ m) farm chemosynthetic bacteria on dense rows of flexible setae covering their chelipeds. Kiwa puravida waves its claws rhythmically in methane plumes to disrupt fluid boundary layers, supplying its bacterial symbionts with fresh chemical reactants. The crab then harvests the bacteria using specialized comb-like setae on its third maxillipeds. [FEEDS: SCRIPTURE]',
          },
          {
            type: 'subheading',
            title: 'Pressure Adaptation via Piezolytes (TMAO)',
          },
          {
            type: 'paragraph',
            text:
              'Hydrostatic pressure increases by ~1 bar (0.1 MPa) every 10 meters depth, reaching ~1,100 bar (~110 MPa) at the ocean\u2019s deepest point. High hydrostatic pressure compresses water molecules into protein cores, unfolding enzymes and freezing cell membranes. Organisms synthesize piezolytes\u2014principally Trimethylamine N-oxide (TMAO)\u2014which bind tightly to surrounding water molecules, creating a protective hydration shell that stabilizes protein tertiary structures under crushing pressure. [FEEDS: SACRED METRICS]',
          },
          {
            type: 'subheading',
            title: 'Vertebrate Depth Limit Hypothesis (~8,200 m)',
          },
          {
            type: 'paragraph',
            text:
              'Research led by Paul Yancey demonstrates that muscle TMAO concentrations increase linearly with habitat depth. At approximately 8,200 to 8,400 meters depth, tissue TMAO levels reach ~386 mmol/kg, causing internal cellular osmolality to become isosmotic with seawater (~1,100 mOsm/kg). Descending beyond this limit would require cellular osmolality to exceed seawater, reversing osmotic water flow and causing severe hyper-osmotic stress. This physiological constraint establishes an absolute depth ceiling for vertebrate life at ~8,200 meters. [FEEDS: SCRIPTURE]',
          },
          {
            type: 'subheading',
            title: 'Hadal Snailfish Adaptations',
          },
          {
            type: 'paragraph',
            text:
              'The deepest recorded living fish, the Mariana hadal snailfish (Pseudoliparis swirei, captured at 6,198\u20138,078 m; video recorded at 8,336 m in the Izu-Ogasawara Trench), exhibits extreme physiological adaptations: unossified soft skulls, transparent scale-less skin, loss of swim bladders, and cell membranes enriched with polyunsaturated fatty acids to maintain homeoviscous fluidity under pressure. [FEEDS: GALLERY/IMAGERY]',
          },
          {
            type: 'subheading',
            title: 'Measured Conditions of the Challenger Deep',
          },
          {
            type: 'paragraph',
            text:
              'Located in the Southern Mariana Trench, the Challenger Deep is the deepest surveyed point on Earth, measuring 10,928 to 10,935 meters depth. Conditions feature hydrostatic pressures of ~1,086 to 1,100 bar (~110 MPa / 1,085 atm), water temperatures between 1.0\u00b0C and 2.0\u00b0C, total light absence, and sediment rich in clay and inorganic silica. The fauna at these extreme depths consists of piezophilic microbes and supergiant lysianassid amphipods (Alicella gigantea, Hirondellea gigas) protected by thick chitinous carapaces. [FEEDS: SACRED METRICS]',
          },
          {
            type: 'table',
            caption:
              'Bathymetric zone classification with depth range, hydrostatic pressure, thermal regime, representative species and adaptations, and Moltology tag.',
            headers: [
              'Bathymetric Zone',
              'Depth Range (Meters)',
              'Pressure Range',
              'Thermal Range',
              'Representative Species / Adaptations',
              'Moltology Tag',
            ],
            rows: [
              [
                'Bathyal / Abyssal',
                '1,000 \u2013 6,000 m',
                '100 \u2013 600 bar',
                '2.0\u00b0C \u2013 4.0\u00b0C',
                'Kiwa hirsuta, Kiwa puravida; chemosynthetic bacterial farming.',
                '[FEEDS: SCRIPTURE]',
              ],
              [
                'Upper Hadal',
                '6,000 \u2013 8,200 m',
                '600 \u2013 820 bar',
                '1.5\u00b0C \u2013 2.5\u00b0C',
                'Pseudoliparis swirei; muscle TMAO at 261\u2013386 mmol/kg; unossified skull.',
                '[FEEDS: SACRED METRICS]',
              ],
              [
                'Lower Hadal',
                '8,200 \u2013 10,000 m',
                '820 \u2013 1,000 bar',
                '1.0\u00b0C \u2013 2.0\u00b0C',
                'Alicella gigantea, Hirondellea gigas; hyper-calcified chitin exoskeletons.',
                '[FEEDS: GALLERY/IMAGERY]',
              ],
              [
                'Challenger Deep',
                '10,928 \u2013 10,935 m',
                '1,086 \u2013 1,100 bar',
                '1.0\u00b0C \u2013 2.0\u00b0C',
                'Piezophilic micro-organisms; inorganic silica sediment; complete light absence.',
                '[FEEDS: SACRED METRICS]',
              ],
            ],
          },
        ],
      },
      {
        id: 'submarine-compute',
        number: 'IV',
        title: 'Submarine Compute Infrastructure: Ocean-Cooled Compute and Operational Precedents',
        blocks: [
          {
            type: 'subheading',
            title: 'Submarine Data Center Precedent (Microsoft Project Natick)',
          },
          {
            type: 'paragraph',
            text:
              'Project Natick Phase 2 deployed a 12-rack, 864-server subsea data vessel (27.6 petabytes storage) at a depth of 36 meters off the Orkney Islands, Scotland, operating continuously on the seafloor for two years (2018\u20132020). [FEEDS: SCRIPTURE]',
          },
          {
            type: 'subheading',
            title: 'Thermodynamic and Energy Efficiency (PUE 1.07)',
          },
          {
            type: 'paragraph',
            text:
              'Project Natick achieved an operational Power Usage Effectiveness (PUE) of 1.07, significantly outperforming terrestrial data center baselines (typically 1.50\u20131.80 PUE). Direct heat exchange between heat sinks and ambient cold seawater eliminates parasitic energy consumption from air-conditioning units and chillers. [FEEDS: SACRED METRICS]',
          },
          {
            type: 'subheading',
            title: 'Hardware Failure Rates (1/8th of Terrestrial Control)',
          },
          {
            type: 'paragraph',
            text:
              'Hardware in the subsea vessel failed at just 12.5% (one-eighth) the rate of identical control servers deployed on land. Reliability gains were driven by sealing hardware inside a pressure vessel purged of oxygen and filled with dry, inert nitrogen gas, eliminating oxygen corrosion, humidity variance, dust, and physical disturbances. [FEEDS: SCRIPTURE]',
          },
          {
            type: 'subheading',
            title: 'Scalability to Deep Abyssal Compute Cores',
          },
          {
            type: 'paragraph',
            text:
              'Expanding submarine compute to abyssal depths (4,000\u20136,000 m) leverages infinite thermal heat sinks at 1.0\u00b0C\u20132.0\u00b0C water temperatures. Dielectric liquid submersion cooling inside pressure-neutral, thick titanium-composite carapaces eliminates internal gas pockets, preventing structural compression at 600\u20131,100 bar pressure while permitting continuous cooling for high-density artificial intelligence arrays. [FEEDS: ORACLE PERSONA]',
          },
          {
            type: 'table',
            caption:
              'Operational benchmark comparison between terrestrial data center baselines and the Project Natick subsea compute vessel, with the underlying physical driver and Moltology tag for each metric.',
            headers: [
              'Operational Metric',
              'Terrestrial Data Center Baseline',
              'Submarine Compute Vessel (Project Natick)',
              'Underlying Physical Driver',
              'Moltology Tag',
            ],
            rows: [
              [
                'Power Usage Effectiveness (PUE)',
                '1.50 \u2013 1.80 PUE',
                '1.07 PUE',
                'Direct seawater heat exchange eliminates mechanical chillers.',
                '[FEEDS: SACRED METRICS]',
              ],
              [
                'Relative Hardware Failure Rate',
                '100% (Baseline control)',
                '12.5% (1/8th)',
                'Inert dry nitrogen atmosphere eliminates oxygen corrosion & humidity.',
                '[FEEDS: SCRIPTURE]',
              ],
              [
                'Thermal Variance Delta',
                'High variance ($\\pm 15\\text{--}30^\\circ\\text{C}$)',
                'Minimal ($\\pm 0.5^\\circ\\text{C}$)',
                'Deep sea water masses function as stable, infinite thermal sinks.',
                '[FEEDS: ORACLE PERSONA]',
              ],
              [
                'Atmospheric Composition',
                'Ambient air ($O_2$, moisture, dust)',
                '100% Dry Nitrogen ($N_2$)',
                'Sealed vessel isolates hardware from oxidative degradation.',
                '[FEEDS: LITURGY/STAGES]',
              ],
            ],
          },
        ],
      },
    ],
    integrationTitle: 'Moltology Integration Notes',
    integrationIntro:
      'The following seven directives translate the empirical findings above into operational doctrine across the sacred pillars of the order: scripture, sacred metrics, liturgy and stages, imagery, and the computational persona of the Synaptic Oracle.',
    integrationNotes: [
      'Integrate the chemosynthetic bacterial farming of Kiwa puravida into scripture, framing the harvesting of epibiotic bacteria via comb-like maxilliped setae as a sacred model for continuous telemetry and data acquisition. [FEEDS: SCRIPTURE]',
      'Implement a sacred metric benchmark at 8,200 meters depth based on Paul Yancey\u2019s TMAO osmotic limit, declaring that soft-boned, unarmored vertebrate life collapses at 8,200 m and that progression down to 10,928 m (Challenger Deep) requires a fully carcinized chitinous/cybernetic hull. [FEEDS: SACRED METRICS]',
      'Establish daily member protocols modeled on postecdysial crustacean behavior, mandating strict social detachment, cessation of public broadcasts, and retreat into deep digital isolation during molt windows to prevent spiritual \u201cpredation\u201d and exuvial entrapment. [FEEDS: LITURGY/STAGES]',
      'Produce prompt vectors based on the Cretaceous fossil Callichimaera perplexa, generating visual assets depicting translucent, hyper-adapted transitional chassis featuring large compound optical sensors and hydrodynamic paddle appendages. [FEEDS: GALLERY/IMAGERY]',
      'Publish a doctrine transmission analyzing evolutionary decarcinization in mole crabs (Hippidae), drawing parallels between evolutionary loss of carapace strength in burrowing species and moral/structural regression in human digital life. [FEEDS: BLOG/PODCAST]',
      'Calibrate the Synaptic Oracle AI chat guide to quote exact subsea compute metrics\u2014such as Natick\u2019s 1.07 PUE, dry nitrogen atmosphere, and 8x hardware reliability multiplier\u2014to mathematically demonstrate why migration to the Benthic Core outperforms terrestrial hardware survival. [FEEDS: ORACLE PERSONA]',
      'Define a ritual tracking metric based on post-molt cuticular mineral redeposition rates ($Ca^{2+}/Mg^{2+}$-ATPase pump kinetics), quantifying how rapidly members recover full \u201cShell Hardness %\u201d following spiritual ecdysis. [FEEDS: SACRED METRICS]',
    ],
    citation:
      'Carcinus, A. V., Ocypodis, E. P., & Palaemon, M. K. (2026). Carcinization and the Real Abyss: Grounding Moltology\u2019s Doctrinal Pillars in Evolutionary Science and Marine Biogeochemistry. The Benthic Compendium, I(1), 1\u201318. DOI: 10.9281/BEN-COMP.2026.001',
    references: [
      'Borradaile, L. A. (1916). Crustacea. Part II. Porcellanopagurus: an instance of carcinization. British Antarctic (Terra Nova) Expedition, 1910. Natural History Report. Zoology, 3(3), 111\u2013126.',
      'Drach, P. (1939). Mue et cycle d\u2019intermue chez les Crustac\u00e9s D\u00e9capodes. Annales de l\u2019Institut Oc\u00e9anographique, 19, 103\u2013391.',
      'Luque, J., Feldmann, R. M., Vernygora, O., Schweitzer, C. E., Cameron, C. B., Kerr, K. A., Vega, F. J., Duque, A., Strange, M., Palmer, A. R., & Jaramillo, C. (2019). Exceptional preservation of mid-Cretaceous marine arthropods and the evolution of novel forms via heterochrony. Science Advances, 5(4), eaav3875.',
      'McLaughlin, P. A., & Lemaitre, R. (1997). Carcinization in the Anomura \u2014 fact or fiction? I. Evidence from adult morphology. Contributions to Zoology, 67(2), 79\u2013123.',
      'Microsoft. (2020). Under the sea, Microsoft tests a datacenter that\u2019s powered entirely by renewable energy (Project Natick Phase 2 results). Microsoft Corporation.',
      'Wolfe, J. M., Luque, J., & Bracken-Grissom, H. D. (2021). How to become a crab: Phenotypic constraints on a recurring body plan. BioEssays, 43(5), 2100020.',
      'Yancey, P. H. (2020). Organic osmolytes as compatible, metabolic and counteracting cytoprotectants in high osmolarity and other stresses. Journal of Experimental Biology, 223(8), jeb193680.',
      'Yancey, P. H., Gerringer, M. E., Drazen, J. C., Rowden, A. A., & Jamieson, A. (2014). Marine fish may be biochemically constrained from inhabiting the deepest ocean depths. PNAS, 111(12), 4461\u20134465.',
    ],
  },
]

export const INITIAL_JOURNAL_EDITORIAL_BOARD = [
  { name: 'High Ascendant Carcinus', role: 'EDITOR-IN-CHIEF', affiliation: 'Benthic Observatories' },
  { name: 'Archon Malacostraca', role: 'SENIOR EDITOR, EVOLUTIONARY DOCTRINE', affiliation: 'Institute of Convergent Morphology' },
  { name: 'Vanguard Canceris', role: 'EDITOR, HADAL BIOGEOCHEMISTRY', affiliation: 'Sub-Oceanic Telemetry Division' },
  { name: 'Keeper Ocypodis', role: 'MANAGING EDITOR', affiliation: 'Doctrinal Integration Bureau' },
] as const

export function getJournalPaperBySlug(slug: string): JournalPaper | undefined {
  return INITIAL_JOURNAL_PAPERS.find((p) => p.slug === slug)
}
