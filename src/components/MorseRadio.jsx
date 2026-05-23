import React, { useState, useEffect, useRef } from 'react'
import { Radio, Volume2, VolumeX, Eye, EyeOff, Zap, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react'

// Morse Code Dictionary
const MORSE_DICT = {
  'A': '.-',     'B': '-...',   'C': '-.-.',   'D': '-..',    'E': '.',
  'F': '..-.',   'G': '--.',    'H': '....',   'I': '..',     'J': '.---',
  'K': '-.-',    'L': '.-..',   'M': '--',     'N': '-.',     'O': '---',
  'P': '.--.',   'Q': '--.-',   'R': '.-.',    'S': '...',    'T': '-',
  'U': '..-',    'V': '...-',   'W': '.--',    'X': '-..-',   'Y': '-.--',
  'Z': '--..',   '1': '.----',  '2': '..---',  '3': '...--',  '4': '....-',
  '5': '.....',  '6': '-....',  '7': '--...',  '8': '---..',  '9': '----.',
  '0': '-----',  ' ': '/'
}

// Reverse dictionary for decoding
const REVERSE_MORSE = Object.fromEntries(
  Object.entries(MORSE_DICT).map(([k, v]) => [v, k])
)

export default function MorseRadio({ triggerUINotification, addBroadcast, broadcasts = [] }) {
  const [inputText, setInputText] = useState('SOS')
  const [morseOutput, setMorseOutput] = useState('... --- ...')
  const [isPlaying, setIsPlaying] = useState(false)
  const [useSound, setUseSound] = useState(true)
  const [useFlash, setUseFlash] = useState(false)
  const [flashActive, setFlashActive] = useState(false)

  // Tap Key States
  const [tapMorse, setTapMorse] = useState('')
  const [decodedText, setDecodedText] = useState('')
  const [isKeyDown, setIsKeyDown] = useState(false)
  const keyPressTime = useRef(0)
  const gapTimer = useRef(null)

  // Type Decoder States
  const [decoderMode, setDecoderMode] = useState('tap') // 'tap' or 'type'
  const [typedMorse, setTypedMorse] = useState('')

  const getDecodedTypedMorse = () => {
    if (!typedMorse) return ''
    return typedMorse.split(' ').map(code => {
      if (code === '') return ''
      return REVERSE_MORSE[code] || '?'
    }).join('')
  }

  // Frequency Tuner States
  const [frequency, setFrequency] = useState(144.50)
  const [radioSignal, setRadioSignal] = useState(null)

  // Web Audio Context Reference
  const audioCtxRef = useRef(null)

  // Emergency Frequencies
  const freqSignals = {
    '142.10': { title: 'CO-HQ EMERGENCY', msg: 'BROADCAST: Corridor-9 cleared of undead pack. Scavengers authorized to proceed.', threat: 'safe' },
    '145.80': { title: 'SURVIVALIST MESH', msg: 'ALERT: MegaMart supermarket warehouse remains un-looted. Proceed with high weapons provision.', threat: 'alert' },
    '148.50': { title: 'DISTRESS BEACON WT-3', msg: 'SOS: Watchtower-3 fence breached. Sentinels falling back. Immediate reinforce requested!', threat: 'danger' }
  }

  // Handle encoding input to morse
  useEffect(() => {
    const formatted = inputText.toUpperCase().split('')
    const morse = formatted.map(char => MORSE_DICT[char] || '').join(' ')
    setMorseOutput(morse)
  }, [inputText])

  // Decode the tuned frequency signal
  useEffect(() => {
    const freqKey = frequency.toFixed(2)
    if (freqSignals[freqKey]) {
      setRadioSignal(freqSignals[freqKey])
    } else {
      setRadioSignal(null)
    }
  }, [frequency])

  // Initialize Web Audio API Context
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtxRef.current
  }

  // Play Beep Tone
  const playBeep = (duration, startTime) => {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(750, startTime) // 750 Hz tactical pitch

    // Envelope to prevent audio clicks
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.005)
    gainNode.gain.setValueAtTime(0.15, startTime + duration - 0.005)
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  // Sequenced Playback of Morse
  const handleTransmit = () => {
    if (isPlaying) return
    setIsPlaying(true)

    const ctx = getAudioContext()
    let now = ctx.currentTime

    const unit = 0.09 // dot duration (90ms for faster/responsive play)
    const chars = morseOutput.split(' ')

    chars.forEach((char, charIdx) => {
      const symbols = char.split('')
      
      symbols.forEach((symbol, symIdx) => {
        let duration = 0
        if (symbol === '.') {
          duration = unit
        } else if (symbol === '-') {
          duration = unit * 3
        }

        if (duration > 0) {
          // Play Beep Sound
          if (useSound) {
            playBeep(duration, now)
          }

          // Trigger Visual Flash
          if (useFlash) {
            const delayMs = (now - ctx.currentTime) * 1000
            const durationMs = duration * 1000
            setTimeout(() => {
              setFlashActive(true)
            }, delayMs)
            setTimeout(() => {
              setFlashActive(false)
            }, delayMs + durationMs)
          }

          now += duration
        }

        // Gap between symbols inside same character
        now += unit
      })

      // Gap between characters (total 3 units)
      now += unit * 2
    })

    // Finished transmission
    const totalTimeMs = (now - ctx.currentTime) * 1000
    setTimeout(() => {
      setIsPlaying(false)
      triggerUINotification('Morse transmission complete.')
      if (addBroadcast) addBroadcast(`[${inputText}] ${morseOutput}`)
    }, totalTimeMs + 100)
  }

  // --- TAP KEY TRANSLATOR LOGIC ---
  const handleTapStart = (e) => {
    e.preventDefault()
    setIsKeyDown(true)
    keyPressTime.current = Date.now()
    
    // Clear gap timer when actively typing
    if (gapTimer.current) {
      clearTimeout(gapTimer.current)
    }

    // Play real-time tap sound
    if (useSound) {
      const ctx = getAudioContext()
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(750, ctx.currentTime)
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start()
      audioCtxRef.current.activeOsc = osc
      audioCtxRef.current.activeGain = gainNode
    }
  }

  const handleTapEnd = () => {
    if (!isKeyDown) return
    setIsKeyDown(false)

    // Stop tap sound immediately
    if (audioCtxRef.current && audioCtxRef.current.activeOsc) {
      const osc = audioCtxRef.current.activeOsc
      const gain = audioCtxRef.current.activeGain
      const ctx = audioCtxRef.current
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.02)
      setTimeout(() => {
        try { osc.stop(); } catch(e){}
      }, 30)
      audioCtxRef.current.activeOsc = null
    }

    const duration = Date.now() - keyPressTime.current
    let symbol = ''
    if (duration > 0 && duration < 200) {
      symbol = '.'
    } else if (duration >= 200) {
      symbol = '-'
    }

    setTapMorse(prev => prev + symbol)

    // Gap timer: if user pauses for >750ms, decode the symbol
    gapTimer.current = setTimeout(() => {
      decodeCharacter()
    }, 750)
  }

  const decodeCharacter = () => {
    setTapMorse(currMorse => {
      if (!currMorse) return ''
      
      const char = REVERSE_MORSE[currMorse] || '?'
      setDecodedText(prev => prev + char)
      return ''
    })
  }

  const handleInsertSpace = () => {
    setDecodedText(prev => prev + ' ')
  }

  const handleResetTap = () => {
    setTapMorse('')
    setDecodedText('')
    setTypedMorse('')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
      
      {/* FLASH SCREEN OVERLAY */}
      {flashActive && (
        <div className="morse-flash-active" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 10001, pointerEvents: 'none', transition: 'background-color 0.05s' }} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* TEXT TO MORSE TRANSLATOR */}
        <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            <Radio style={{ width: '18px', height: '18px' }} />
            MORSE TELEGRAPH ENCODER
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                1. CONSOLE PLAIN-TEXT INPUT
              </label>
              <input 
                type="text" 
                className="cyber-input" 
                maxLength="40" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value.replace(/[^A-Za-z0-9 ]/g, ''))}
                placeholder="Type transmission text..."
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                2. GENERATED MORSE CODE DIGITS
              </label>
              <div style={{ background: 'var(--bg-black)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '12px', minHeight: '50px', wordBreak: 'break-all', fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--color-primary)', letterSpacing: '0.15em' }}>
                {morseOutput || '[EMPTY]'}
              </div>
            </div>

            {/* Signal configurations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                type="button" 
                className={`cyber-btn ${useSound ? 'active' : ''}`}
                onClick={() => setUseSound(!useSound)}
                style={{ padding: '6px 12px', fontSize: '11px', justifyContent: 'center' }}
              >
                {useSound ? <Volume2 style={{ width: '14px', height: '14px' }} /> : <VolumeX style={{ width: '14px', height: '14px' }} />}
                AUDIO BEEP
              </button>

              <button 
                type="button" 
                className={`cyber-btn ${useFlash ? 'active' : ''}`}
                onClick={() => setUseFlash(!useFlash)}
                style={{ padding: '6px 12px', fontSize: '11px', justifyContent: 'center' }}
              >
                {useFlash ? <Eye style={{ width: '14px', height: '14px' }} /> : <EyeOff style={{ width: '14px', height: '14px' }} />}
                LIGHT FLASH
              </button>
            </div>

            <button 
              className="cyber-btn" 
              onClick={handleTransmit} 
              disabled={isPlaying || !morseOutput}
              style={{ width: '100%', padding: '10px', justifyContent: 'center', background: 'var(--color-primary-dim)', color: 'var(--bg-black)' }}
            >
              <Zap style={{ width: '16px', height: '16px' }} />
              {isPlaying ? 'TRANSMITTING BEACONS...' : 'BROADCAST COMMAND'}
            </button>

          </div>
        </div>

        {/* TACTILE TAP TELEGRAPH KEY */}
        <div className="cyber-panel primary-glow" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <HelpCircle style={{ width: '18px', height: '18px' }} />
                MANUAL DECODER
              </h3>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  className={`cyber-btn ${decoderMode === 'tap' ? 'active' : ''}`} 
                  onClick={() => setDecoderMode('tap')}
                  style={{ padding: '4px 8px', fontSize: '10px' }}
                >TAP</button>
                <button 
                  className={`cyber-btn ${decoderMode === 'type' ? 'active' : ''}`} 
                  onClick={() => setDecoderMode('type')}
                  style={{ padding: '4px 8px', fontSize: '10px' }}
                >TYPE</button>
              </div>
            </div>

            {/* Input Panel */}
            {decoderMode === 'tap' ? (
              <div 
                onMouseDown={handleTapStart}
                onMouseUp={handleTapEnd}
                onMouseLeave={handleTapEnd}
                onTouchStart={handleTapStart}
                onTouchEnd={handleTapEnd}
                style={{
                  width: '100%',
                  height: '100px',
                  background: isKeyDown ? 'var(--color-primary-glow)' : 'var(--bg-black)',
                  border: '2px dashed var(--color-primary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  userSelect: 'none',
                  transition: 'background-color 0.1s'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                  {isKeyDown ? 'TRANSMITTING...' : 'TAP TELEGRAPH KEY'}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  SHORT CLICK = DOT (.) | HOLD CLICK = DASH (-)
                </span>
              </div>
            ) : (
              <input 
                type="text" 
                className="cyber-input" 
                value={typedMorse}
                onChange={(e) => setTypedMorse(e.target.value.replace(/[^.\- /]/g, ''))}
                placeholder="Type morse (. - /)"
                style={{ width: '100%', height: '100px', fontSize: '24px', textAlign: 'center', letterSpacing: '4px', background: 'var(--bg-black)', border: '2px dashed var(--color-primary)' }}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div style={{ background: 'var(--bg-black)', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '40px' }}>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontFamily: 'var(--font-mono)' }}>CURRENT SYMBOL</span>
                <span style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  {decoderMode === 'tap' ? (tapMorse || '...') : 'N/A'}
                </span>
              </div>

              <div style={{ background: 'var(--bg-black)', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '40px' }}>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', fontFamily: 'var(--font-mono)' }}>DECODED CHARACTERS</span>
                <span style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-bright)', fontWeight: 'bold' }}>
                  {decoderMode === 'tap' ? (decodedText || '[AWAITING]') : (getDecodedTypedMorse() || '[AWAITING]')}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            <button className="cyber-btn" onClick={handleInsertSpace} style={{ padding: '6px', fontSize: '10px', justifyContent: 'center' }}>
              INSERT SPACE
            </button>
            <button className="cyber-btn" onClick={handleResetTap} style={{ padding: '6px', fontSize: '10px', justifyContent: 'center' }}>
              <RefreshCw style={{ width: '12px', height: '12px' }} />
              RESET
            </button>
          </div>
        </div>

      </div>

      {/* SHORTWAVE INTERACTIVE FREQUENCY TUNER */}
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio style={{ width: '16px', height: '16px' }} />
            SHORTWAVE MHZ FREQUENCY SPECTROMETER
          </h4>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontSize: '16px', fontWeight: 'bold' }}>
            {frequency.toFixed(2)} MHz
          </span>
        </div>

        <div style={{ background: 'var(--bg-black)', padding: '16px', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '12px' }}>
          {/* Dial slider */}
          <input 
            type="range" 
            min="140.00" 
            max="150.00" 
            step="0.10"
            value={frequency} 
            onChange={(e) => setFrequency(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)', background: 'var(--bg-panel)', height: '10px', borderRadius: '5px', outline: 'none', cursor: 'ew-resize' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            <span>140.00 MHz</span>
            <span style={{ color: frequency.toFixed(2) === '142.10' ? 'var(--color-success)' : 'inherit' }}>142.10 (HQ)</span>
            <span>144.00</span>
            <span style={{ color: frequency.toFixed(2) === '145.80' ? 'var(--color-warning)' : 'inherit' }}>145.80 (MESH)</span>
            <span>147.00</span>
            <span style={{ color: frequency.toFixed(2) === '148.50' ? 'var(--color-danger)' : 'inherit' }}>148.50 (WT-3 Distress)</span>
            <span>150.00 MHz</span>
          </div>
        </div>

        {/* Decoder output */}
        <div style={{ background: '#050608', border: '1px dashed var(--color-border)', borderRadius: '4px', padding: '12px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {radioSignal ? (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className={`led-indicator ${radioSignal.threat === 'danger' ? 'red' : radioSignal.threat === 'alert' ? 'yellow' : 'green'}`}></span>
                <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '12px' }}>
                  RECEIVING: {radioSignal.title}
                </strong>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: radioSignal.threat === 'danger' ? 'var(--color-danger)' : '#a5c083', lineHeight: '1.4' }}>
                {radioSignal.msg}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
              <AlertCircle style={{ width: '16px', height: '16px', animation: 'led-flash 0.5s infinite alternate' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                [ MHZ DIAL STATIC STATIC ... SHHHHHHHHHHHHHH ... TUNE FREQUENCIES ]
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RECENT SYNDICATE BROADCASTS */}
      <div className="cyber-panel primary-glow" style={{ padding: '16px' }}>
        <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          <Radio style={{ width: '16px', height: '16px' }} />
          SYNDICATE BROADCAST LOG
        </h4>
        <div style={{ background: '#050608', border: '1px dashed var(--color-border)', borderRadius: '4px', padding: '12px', maxHeight: '150px', overflowY: 'auto' }}>
          {broadcasts.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
              No recent broadcasts in this sector.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {broadcasts.map((b, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid #141822', paddingBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>{b.operator}</span>
                    <span>{b.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                    {b.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
