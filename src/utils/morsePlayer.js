let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

const playBeep = (duration, startTime) => {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(750, startTime) 

  gainNode.gain.setValueAtTime(0, startTime)
  gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.005)
  gainNode.gain.setValueAtTime(0.15, startTime + duration - 0.005)
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

  osc.connect(gainNode)
  gainNode.connect(ctx.destination)

  osc.start(startTime)
  osc.stop(startTime + duration)
}

export const playMorseSequence = (morseOutput, useSound, setFlashActive, onComplete) => {
  const ctx = getAudioContext()
  // Resume context in case it was suspended by browser policy
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  let now = ctx.currentTime
  const unit = 0.09 // dot duration
  const chars = morseOutput.split(' ')

  chars.forEach((char) => {
    const symbols = char.split('')
    symbols.forEach((symbol) => {
      let duration = 0
      if (symbol === '.') duration = unit
      else if (symbol === '-') duration = unit * 3

      if (duration > 0) {
        if (useSound) {
          playBeep(duration, now)
        }
        if (setFlashActive) {
          const delayMs = (now - ctx.currentTime) * 1000
          const durationMs = duration * 1000
          setTimeout(() => setFlashActive(true), delayMs)
          setTimeout(() => setFlashActive(false), delayMs + durationMs)
        }
        now += duration
      }
      now += unit
    })
    now += unit * 2
  })

  const totalTimeMs = (now - ctx.currentTime) * 1000
  if (onComplete) {
    setTimeout(onComplete, totalTimeMs + 100)
  }
}

export const playRealtimeTapSound = () => {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(750, ctx.currentTime)
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.start()
  return { osc, gainNode, ctx }
}

export const stopRealtimeTapSound = (audioRef) => {
  if (audioRef) {
    const { osc, gainNode, ctx } = audioRef
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.02)
    setTimeout(() => {
      try { osc.stop(); } catch(e){}
    }, 30)
  }
}
