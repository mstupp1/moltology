# About page artwork

Created October 23, 2026 for `/what-is-moltology/beliefs` and
`/what-is-moltology/what-moltologists-say` with the built-in ImageGen tool,
using three Luna agents. Evergreen treatment: no seasonal or holiday props.

The registry is `src/components/what-is-moltology/story/page-art.ts`.
Original PNG masters live under `images/about/20261023/` in the public asset
bucket. The normal upload pipeline also creates compressed WebP twins; pages
resolve original PNG keys through `getAssetUrl` and load the WebP versions
through `/media/`.

Hero desktop and mobile files are independently generated wide and portrait
compositions. The seven other images have smaller 900px-wide `-sm` exports
of their original composition. `StoryImg` selects the small version below
768px, eagerly loads heroes, and lazily loads section artwork. Existing dark
overlays keep text legible over the hero and section backgrounds.

| Registry entry | Master filename | Intended placement |
| --- | --- | --- |
| beliefsHero | beliefs-hero-desktop.png / beliefs-hero-mobile.png | Beliefs hero |
| voicesHero | voices-hero-desktop.png / voices-hero-mobile.png | Voices hero |
| truthRefuge | truth-depth.png | Softness as a starting condition |
| truthNature | truth-harden.png | Nature's repeated armored forms |
| truthShedding | truth-shed.png | Growth requires shedding |
| practices | practices-bg.png | Living practices background |
| codes | community-codes.png | Soft-Shell Covenant illustration |
| featuredVoice | voices-feature.png | Featured composite voice |
| firstRite | first-rite-bg.png | Closing invitations on both pages |

## Generation prompts

Full generation prompts and inspected outputs are recorded in
[about-page-artwork-prompts.json](about-page-artwork-prompts.json).
Local masters, mobile exports, and upload receipts are retained in the ignored
`scratch/page-art-20261023/` folder. Heavy media is kept outside Git.
