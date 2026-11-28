/**
 * Remotion settings for the long-form Academy videos (video/). See
 * .agents/skills/long-form-video-creator/SKILL.md.
 */
import path from 'node:path'
import { Config } from '@remotion/cli/config'

Config.setEntryPoint('video/index.ts')
Config.setVideoImageFormat('jpeg')
Config.setConcurrency(null)
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: { ...(config.resolve?.alias ?? {}), '@': path.resolve(process.cwd(), 'src') },
  },
}))
