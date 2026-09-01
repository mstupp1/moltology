import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { RubberBandInterface } from 'rubberband-wasm'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

const RUBBERBAND_WASM_PATH = require.resolve('rubberband-wasm/dist/rubberband.wasm')

const SAMPLE_RATE = 44100

/**
 * High-quality time-stretch of an MP3 buffer via Rubber Band (WASM).
 * durationRatio < 1 speeds the audio up (shorter duration), > 1 slows it down,
 * keeping pitch/formants intact — much cleaner than prosody speed on TTS.
 */
export async function timeStretchMp3(
  inputMp3: Buffer,
  outputMp3Path: string,
  durationRatio: number
): Promise<void> {
  const workDir = path.dirname(outputMp3Path)
  const stamp = Date.now()
  const mp3In = path.join(workDir, `rb-in-${stamp}.mp3`)
  const rawIn = path.join(workDir, `rb-in-${stamp}.f32`)
  const rawOut = path.join(workDir, `rb-out-${stamp}.f32`)

  fs.writeFileSync(mp3In, inputMp3)

  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      mp3In,
      '-ac', '1',
      '-ar', String(SAMPLE_RATE),
      '-c:a', 'pcm_f32le',
      '-f', 'f32le',
      rawIn,
    ])

    const samples = readF32(rawIn)
    const stretched = await stretch(samples, durationRatio)

    fs.writeFileSync(rawOut, Buffer.from(stretched.buffer))
    await execFileAsync('ffmpeg', [
      '-y',
      '-f', 'f32le',
      '-ar', String(SAMPLE_RATE),
      '-ac', '1',
      '-i', rawOut,
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      outputMp3Path,
    ])
  } finally {
    fs.rmSync(mp3In, { force: true })
    fs.rmSync(rawIn, { force: true })
    fs.rmSync(rawOut, { force: true })
  }
}

function readF32(filePath: string): Float32Array {
  const buf = fs.readFileSync(filePath)
  return new Float32Array(buf.buffer, 0, buf.length / 4)
}

async function stretch(samples: Float32Array, ratio: number): Promise<Float32Array> {
  const wasm = await WebAssembly.compile(fs.readFileSync(RUBBERBAND_WASM_PATH))
  const rb = await RubberBandInterface.initialize(wasm)

  // Offline + Precise stretch + R3 (Finer) engine — highest quality for speech.
  const options = 0 | 16 | 536870912
  const rbState = rb.rubberband_new(SAMPLE_RATE, 1, options, ratio, 1)
  rb.rubberband_set_time_ratio(rbState, ratio)

  const samplesRequired = rb.rubberband_get_samples_required(rbState)

  const channelArrayPtr = rb.malloc(4)
  const bufferPtr = rb.malloc(samplesRequired * 4)
  rb.memWritePtr(channelArrayPtr, bufferPtr)

  rb.rubberband_set_expected_input_duration(rbState, samples.length)

  const output = new Float32Array(Math.ceil(samples.length * ratio))

  // Offline mode requires a study pass before processing.
  let read = 0
  while (read < samples.length) {
    const block = samples.subarray(read, read + samplesRequired)
    rb.memWrite(bufferPtr, block)
    const remaining = block.length
    read += remaining
    rb.rubberband_study(rbState, channelArrayPtr, remaining, read < samples.length ? 0 : 1)
  }

  read = 0
  let write = 0
  const tryRetrieve = (final: boolean) => {
    while (true) {
      const available = rb.rubberband_available(rbState)
      if (available < 1) break
      if (!final && available < samplesRequired) break
      const recv = rb.rubberband_retrieve(rbState, channelArrayPtr, Math.min(samplesRequired, available))
      output.set(rb.memReadF32(bufferPtr, recv), write)
      write += recv
    }
  }

  while (read < samples.length) {
    const block = samples.subarray(read, read + samplesRequired)
    rb.memWrite(bufferPtr, block)
    const remaining = block.length
    read += remaining
    rb.rubberband_process(rbState, channelArrayPtr, remaining, read < samples.length ? 0 : 1)
    tryRetrieve(false)
  }
  tryRetrieve(true)

  rb.free(bufferPtr)
  rb.free(channelArrayPtr)
  rb.rubberband_delete(rbState)

  return output.subarray(0, write)
}