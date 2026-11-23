import { describe, expect, it } from 'vitest'
import { Box3, Vector3 } from 'three'
import { CAST } from '../cast'
import { buildCharacter } from './character'
import { lookFromConfig } from './look'
import { dressPodcast } from './podcast-set'
import { SET_NAMES } from './sets'

const member = (key: string, x: number) => {
  const config = CAST.find((m) => m.key === key)!.config
  return { character: buildCharacter(lookFromConfig(config as never)), x, z: 0 }
}

describe('podcast studio', () => {
  it('is one of the sets', () => {
    expect(SET_NAMES).toContain('podcast-studio')
  })

  it('fits a mic to each speaker, headphones to each head, and a desk below the lowest mouth', () => {
    const members = [member('lobster_vera_drift', -1.05), member('crab_bo_pebble', 1.05)]
    const props = dressPodcast(members)
    const mics = props.children.filter((c) => c.name === 'podcast:mic')
    expect(mics).toHaveLength(2)
    for (const m of members) {
      expect(m.character.rig.sockets.get('ears')!.node.getObjectByName('podcast:headphones')).toBeTruthy()
    }
    // Bo is the shorter one: the desk top stays under Bo's mouth.
    const bo = members[1].character
    bo.root.updateMatrixWorld(true)
    const mouth = bo.rig.bones.get('mouthOpen')!.getWorldPosition(new Vector3())
    const desk = new Box3().setFromObject(props.children[0])
    expect(desk.max.y).toBeLessThan(mouth.y)
  })
})
