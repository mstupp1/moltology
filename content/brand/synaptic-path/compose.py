#!/usr/bin/env python3
"""Compose standalone path-only logos from the interchangeable SVG parts."""
import argparse
import copy
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parent
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
PALETTES = json.loads((BASE/'palettes.json').read_text())

def load(name):
    root = ET.parse(BASE/'parts'/f'{name}.svg').getroot()
    _, _, width, height = map(float, root.get('viewBox').split())
    return root.find(f'{{{NS}}}g'), width, height

def place(root, name, role, x, y, height, color):
    group, width, original_height = load(name)
    scale = height/original_height
    wrapper = ET.SubElement(root, f'{{{NS}}}g', {'id':f'brand-{role}', 'transform':f'translate({x:.4f} {y:.4f}) scale({scale:.7f})'})
    child = copy.deepcopy(group)
    child.set('fill', color)
    wrapper.append(child)
    return width*scale

def compose(subtitle='foundation', palette='dark', layout='horizontal', output=None, accent=None, primary=None, secondary=None):
    colors = dict(PALETTES[palette])
    for role, override in [('icon', accent), ('primary', primary), ('secondary', secondary)]:
        if override is not None:
            if not re.fullmatch(r'#[0-9a-fA-F]{6}|currentColor', override):
                raise ValueError('Colors must be six-digit hex values or currentColor')
            colors[role] = override
    primary_height, secondary_height = 34, 16
    _, pw, ph = load('primary')
    primary_width = pw*primary_height/ph
    root = ET.Element(f'{{{NS}}}svg', {'role':'img', 'aria-labelledby':'brand-title', 'preserveAspectRatio':'xMidYMid meet'})
    title = 'The Synaptic Path' + (' — Benthic Core' if subtitle == 'benthic' else ' — Moltology.org Foundation' if subtitle == 'foundation' else '')
    ET.SubElement(root, f'{{{NS}}}title', {'id':'brand-title'}).text = title
    if layout == 'horizontal':
        width, height = primary_width+136, 112
        place(root, 'icon', 'icon', 12, 12, 88, colors['icon'])
        text_x, text_y = 120, 26 if subtitle != 'none' else 39
    else:
        width, height = primary_width+48, 214 if subtitle != 'none' else 186
        place(root, 'icon', 'icon', (width-112)/2, 12, 112, colors['icon'])
        text_x, text_y = 24, 142
    place(root, 'primary', 'primary', text_x, text_y, primary_height, colors['primary'])
    if subtitle != 'none':
        _, sw, sh = load(f'secondary-{subtitle}')
        secondary_width = sw*secondary_height/sh
        secondary_x = text_x if layout == 'horizontal' else (width-secondary_width)/2
        place(root, f'secondary-{subtitle}', 'secondary', secondary_x, text_y+47, secondary_height, colors['secondary'])
    root.set('viewBox', f'0 0 {width:.4f} {height}')
    root.set('width', f'{width:.4f}')
    root.set('height', str(height))
    ET.indent(root)
    destination = Path(output) if output else BASE/'lockups'/f'{layout}-{subtitle}-{palette}.svg'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(ET.tostring(root, encoding='utf-8', xml_declaration=True))
    return destination

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--subtitle', choices=['foundation', 'benthic', 'none'], default='foundation')
    parser.add_argument('--palette', choices=list(PALETTES), default='dark')
    parser.add_argument('--layout', choices=['horizontal', 'stacked'], default='horizontal')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--accent', help='Override emblem color: #rrggbb or currentColor')
    parser.add_argument('--primary', help='Override primary wordmark color')
    parser.add_argument('--secondary', help='Override subtitle color')
    args = parser.parse_args()
    print(compose(args.subtitle, args.palette, args.layout, args.output, args.accent, args.primary, args.secondary))
