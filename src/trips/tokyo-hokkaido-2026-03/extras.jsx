import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { Heart, X, Music, Send } from 'lucide-react'
import { env } from '../../lib/env.js'
import { PROPOSAL_PHOTOS, isVideoUrl } from './extras/data.js'
import ShareSheet from './extras/ShareSheet.jsx'
import HeartIcon from './extras/HeartIcon.jsx'

const BASE = env.BASE_URL


// Proposal Modal (彩蛋 - Instagram 限時動態風格)
const ProposalModal = ({ isOpen, onClose, heartPosition }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [visibleLayer, setVisibleLayer] = useState(0)
  const [showTransition, setShowTransition] = useState(false)
  const [hasStartedTransition, setHasStartedTransition] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0)
  const [pauseStartTime, setPauseStartTime] = useState(null)
  const [heartLiked, setHeartLiked] = useState(false)
  const [heartBounce, setHeartBounce] = useState(false)
  const [bgmStarted, setBgmStarted] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chatBubble, setChatBubble] = useState(null) // { text, fading }
  const [shareOpen, setShareOpen] = useState(false)
  const [swipeY, setSwipeY] = useState(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const bubbleTimerRef = useRef(null)
  const videoRef0 = useRef(null)
  const videoRef1 = useRef(null)
  const bgmRef = useRef(null)
  const inputRef = useRef(null)
  const swipeRef = useRef(null)
  const isSwipingRef = useRef(false)
  const justSwipedRef = useRef(false)
  // iOS Safari 不會 preload hidden video，用 fetch 下載 blob 後轉成 blob URL
  const videoBlobCache = useRef(new Map())
  // 用 state 觸發 re-render，讓播放 effect 在 blob 就緒後能取用新 src
  const [blobReadyCount, setBlobReadyCount] = useState(0)

  const photos = PROPOSAL_PHOTOS
  const PHOTO_DURATION = 6000
  const currentIsVideo = isVideoUrl(photos[currentPhotoIndex])
  const visibleVideoRef = visibleLayer === 0 ? videoRef0 : videoRef1

  // 每層的「已提交內容 idx」，只有在淡出完成後才更新非可見層，
  // 避免 iOS Safari 在 src 改變瞬間清空畫面造成閃爍
  const layerCommittedIdx = useRef([0, Math.min(1, photos.length - 1)])
  layerCommittedIdx.current[visibleLayer] = currentPhotoIndex
  const [, triggerLayerUpdate] = useReducer((n) => n + 1, 0)
  const getLayerIndex = (layer) => layerCommittedIdx.current[layer]

  // 預載：圖片往前看 3 張
  useEffect(() => {
    if (!isOpen || !photos.length) return
    for (let i = 1; i <= 3; i++) {
      const idx = currentPhotoIndex + i
      if (idx < photos.length && !isVideoUrl(photos[idx])) {
        const img = new Image()
        img.src = photos[idx]
      }
    }
  }, [isOpen, currentPhotoIndex, photos])

  // 影片預載：iOS Safari 會忽略 hidden video 的 preload="auto"，
  // 改用 fetch 下載成 blob 後存 cache，避免顯示時才開始下載
  useEffect(() => {
    if (!isOpen || !photos.length) return
    const cache = videoBlobCache.current
    const controllers = []

    // 找出接下來 5 個位置內的影片，提前 fetch
    for (let i = 1; i <= 5; i++) {
      const idx = currentPhotoIndex + i
      if (idx >= photos.length) break
      const src = photos[idx]
      if (!isVideoUrl(src) || cache.has(src)) continue

      const controller = new AbortController()
      controllers.push(controller)

      fetch(src, { signal: controller.signal })
        .then((res) => res.blob())
        .then((blob) => {
          if (!cache.has(src)) {
            cache.set(src, URL.createObjectURL(blob))
            setBlobReadyCount((n) => n + 1)
          }
        })
        .catch(() => {})
    }

    return () => {
      controllers.forEach((c) => c.abort())
    }
  }, [isOpen, currentPhotoIndex, photos])

  // modal 關閉時釋放 blob URL，避免記憶體洩漏
  useEffect(() => {
    if (isOpen) return
    const cache = videoBlobCache.current
    cache.forEach((blobUrl) => URL.revokeObjectURL(blobUrl))
    cache.clear()
    setBlobReadyCount(0)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setCurrentPhotoIndex(0)
      setVisibleLayer(0)
      setProgress(0)
      setShowTransition(false)
      setHasStartedTransition(false)
      setHeartLiked(false)
      setHeartBounce(false)
      setInputFocused(false)
      setShareOpen(false)
      setSwipeY(0)

      if (heartPosition) {
        const shakeTimer = setTimeout(() => {
          setShowTransition(true)
          setHasStartedTransition(true)
        }, 1200)

        const transitionTimer = setTimeout(() => {
          setShowTransition(false)
        }, 3700)

        return () => {
          clearTimeout(shakeTimer)
          clearTimeout(transitionTimer)
        }
      } else {
        setShowTransition(true)
        setHasStartedTransition(true)
        const transitionTimer = setTimeout(() => {
          setShowTransition(false)
        }, 2500)

        return () => {
          clearTimeout(transitionTimer)
        }
      }
    } else {
      setShowTransition(false)
      setHasStartedTransition(false)
      setInputFocused(false)
      setInputValue('')
      setChatBubble(null)
      setShareOpen(false)
      setSwipeY(0)
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    }
  }, [isOpen, heartPosition])

  // BGM
  const tryPlayBGM = useCallback(() => {
    const audio = bgmRef.current
    if (!audio || bgmStarted) return
    audio.play().then(() => setBgmStarted(true)).catch(() => {})
  }, [bgmStarted])

  useEffect(() => {
    const audio = bgmRef.current
    if (!audio) return
    if (isOpen && hasStartedTransition && !showTransition) {
      audio.play()
        .then(() => setBgmStarted(true))
        .catch(() => {})
    } else {
      audio.pause()
      if (!isOpen) {
        audio.currentTime = 0
        setBgmStarted(false)
      }
    }
  }, [isOpen, hasStartedTransition, showTransition])

  // 鍵盤高度追蹤：inputFocused 時用 visualViewport 取得鍵盤高度
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !inputFocused) {
      setKeyboardHeight(0)
      return
    }
    const onResize = () => {
      const kh = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0))
      setKeyboardHeight(kh)
    }
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    onResize()
    return () => {
      vv.removeEventListener('resize', onResize)
      vv.removeEventListener('scroll', onResize)
      setKeyboardHeight(0)
    }
  }, [inputFocused])

  // Safari chrome 顏色：Instagram 出現後用 CSS animation 白→黑觸發 Safari 重新採色
  useEffect(() => {
    if (!isOpen || !hasStartedTransition || showTransition) return

    const oldMeta = document.querySelector('meta[name="theme-color"]')
    if (oldMeta) oldMeta.remove()
    const newMeta = document.createElement('meta')
    newMeta.name = 'theme-color'
    newMeta.content = '#000000'
    document.head.appendChild(newMeta)

    return () => {
      const m = document.querySelector('meta[name="theme-color"]')
      if (m) m.remove()
      const restored = document.createElement('meta')
      restored.name = 'theme-color'
      restored.content = '#F9F8F4'
      document.head.appendChild(restored)
    }
  }, [isOpen, hasStartedTransition, showTransition])

  // 自動播放和進度條（僅圖片）
  useEffect(() => {
    if (!isOpen || showTransition || currentIsVideo) return
    if (isPaused) return

    const startTime = Date.now() - elapsedBeforePause
    const interval = setInterval(() => {
      if (isPaused) return
      const elapsed = Date.now() - startTime
      const newProgress = (elapsed / PHOTO_DURATION) * 100

      if (newProgress >= 100) {
        if (currentPhotoIndex < photos.length - 1) {
          setVisibleLayer((v) => 1 - v)
          setCurrentPhotoIndex((prevIndex) => prevIndex + 1)
          setElapsedBeforePause(0)
        } else {
          setProgress(100)
        }
      } else {
        setProgress(newProgress)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [isOpen, currentPhotoIndex, showTransition, isPaused, elapsedBeforePause, photos.length, currentIsVideo])

  // 切換照片時重置進度
  useEffect(() => {
    if (!isOpen || showTransition) return
    setElapsedBeforePause(0)
    setProgress(0)
  }, [currentPhotoIndex, isOpen, showTransition])

  // 影片播放控制：播放前先確認 src 使用已快取的 blob URL（iOS Safari 才能即時播放）
  useEffect(() => {
    const otherRef = visibleLayer === 0 ? videoRef1 : videoRef0
    otherRef.current?.pause()
    const v = visibleVideoRef.current
    if (!currentIsVideo || !v) return

    const originalSrc = photos[currentPhotoIndex]
    const cachedSrc = videoBlobCache.current.get(originalSrc)
    if (cachedSrc && v.src !== cachedSrc) {
      v.src = cachedSrc
      v.load()
    }

    if (isPaused) v.pause()
    else v.play().catch(() => {})
  }, [currentIsVideo, isPaused, visibleLayer, visibleVideoRef, currentPhotoIndex, photos, blobReadyCount])

  // 影片進度條
  useEffect(() => {
    if (!isOpen || showTransition || !currentIsVideo || isPaused) return
    const interval = setInterval(() => {
      const v = visibleVideoRef.current
      if (!v || !v.duration || !isFinite(v.duration)) return
      const p = (v.currentTime / v.duration) * 100
      setProgress(p)
    }, 50)
    return () => clearInterval(interval)
  }, [isOpen, showTransition, currentIsVideo, isPaused, currentPhotoIndex, visibleLayer, visibleVideoRef])

  // --- 事件處理 ---

  const handlePhotoClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return
    if (justSwipedRef.current) return

    tryPlayBGM()

    if (pauseStartTime && Date.now() - pauseStartTime > 200) return

    // 輸入框聚焦時，點擊照片區域先取消焦點
    if (inputFocused) {
      inputRef.current?.blur()
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const isLeftHalf = clickX < rect.width / 2

    if (isLeftHalf) {
      if (currentPhotoIndex > 0) {
        setVisibleLayer((v) => 1 - v)
        setCurrentPhotoIndex(currentPhotoIndex - 1)
        setProgress(0)
        setElapsedBeforePause(0)
      }
    } else {
      if (currentPhotoIndex < photos.length - 1) {
        setVisibleLayer((v) => 1 - v)
        setCurrentPhotoIndex(currentPhotoIndex + 1)
        setProgress(0)
        setElapsedBeforePause(0)
      } else {
        setProgress(100)
      }
    }
  }

  // 觸控：整合暫停 + 下滑關閉
  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return

    const touch = e.touches[0]
    swipeRef.current = { x: touch.clientX, y: touch.clientY }
    isSwipingRef.current = false

    const currentElapsed = (progress / 100) * PHOTO_DURATION
    setElapsedBeforePause(currentElapsed)
    setIsPaused(true)
    setPauseStartTime(Date.now())
  }

  const handleTouchMove = (e) => {
    if (!swipeRef.current || e.target.closest('button') || e.target.closest('input')) return

    const touch = e.touches[0]
    const dy = touch.clientY - swipeRef.current.y
    const dx = Math.abs(touch.clientX - swipeRef.current.x)

    if (dy > 10 && dy > dx * 1.5) {
      isSwipingRef.current = true
      setSwipeY(Math.max(0, dy))
    }
  }

  const handleTouchEnd = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return

    // 下滑關閉
    if (isSwipingRef.current) {
      if (swipeY > 120) {
        onClose()
      }
      setSwipeY(0)
      isSwipingRef.current = false
      swipeRef.current = null
      setIsPaused(false)
      setPauseStartTime(null)
      justSwipedRef.current = true
      setTimeout(() => { justSwipedRef.current = false }, 100)
      return
    }

    const pauseDuration = pauseStartTime ? Date.now() - pauseStartTime : 0
    setPauseStartTime(null)

    if (pauseDuration < 200) {
      setIsPaused(false)
      return
    }

    setIsPaused(false)
  }

  // 桌面端滑鼠暫停
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return
    const currentElapsed = (progress / 100) * PHOTO_DURATION
    setElapsedBeforePause(currentElapsed)
    setIsPaused(true)
    setPauseStartTime(Date.now())
  }

  const handleMouseUp = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return
    const pauseDuration = pauseStartTime ? Date.now() - pauseStartTime : 0
    setPauseStartTime(null)
    if (pauseDuration < 200) {
      setIsPaused(false)
      return
    }
    setIsPaused(false)
  }

  // 愛心彈跳
  const handleHeartClick = useCallback(() => {
    setHeartLiked((prev) => !prev)
    setHeartBounce(true)
    setTimeout(() => setHeartBounce(false), 500)
  }, [])

  // 輸入框焦點 → 暫停故事
  const handleInputFocus = useCallback(() => {
    setInputFocused(true)
    setIsPaused(true)
  }, [])

  const handleInputBlur = useCallback(() => {
    setInputFocused(false)
    if (!shareOpen) setIsPaused(false)
  }, [shareOpen])

  // 分享面板
  const handleShareOpen = useCallback(() => {
    inputRef.current?.blur()
    setShareOpen(true)
    setIsPaused(true)
  }, [])

  const handleShareClose = useCallback(() => {
    setShareOpen(false)
    setIsPaused(false)
  }, [])

  // 發送訊息 → 顯示對話泡泡
  const handleSendMessage = useCallback(() => {
    const text = inputValue.trim()
    if (!text) return

    setInputValue('')
    inputRef.current?.blur()
    setIsPaused(false)

    // 清除舊計時器
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)

    setChatBubble({ text, fading: false })

    // 3.5 秒後開始淡出
    bubbleTimerRef.current = setTimeout(() => {
      setChatBubble((prev) => prev ? { ...prev, fading: true } : null)
      // 淡出動畫結束後清除
      bubbleTimerRef.current = setTimeout(() => {
        setChatBubble(null)
      }, 350)
    }, 3500)
  }, [inputValue])

  // ESC 關閉（不做 focus trap 以免影響原有複雜手勢/輸入流程）
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const displayPosition = heartPosition || {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="求婚彩蛋"
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{
        pointerEvents: showTransition ? 'none' : 'auto',
        backgroundColor: (hasStartedTransition && !showTransition) ? 'black' : 'transparent',
        opacity: (showTransition || hasStartedTransition) ? 1 : 0,
        visibility: (showTransition || hasStartedTransition) ? 'visible' : 'hidden'
      }}
    >
      {/* BGM */}
      <audio
        ref={bgmRef}
        src={`${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/sukidakara.mp3`}
        loop
        preload="auto"
      />

      {/* 統一背景層：過場期間白色 → Instagram 期間黑色，平滑過渡 */}
      <div
        className={showTransition ? 'absolute inset-0 animate-bg-fade-in' : 'absolute inset-0'}
        style={{
          backgroundColor: (hasStartedTransition && !showTransition) ? 'black' : 'white',
          zIndex: showTransition ? 9998 : 0,
        }}
      />

      {/* 過場動畫：愛心放大 */}
      {showTransition && displayPosition && (
        <div
          key={`heart-transition-${isOpen}`}
          className="absolute animate-heart-transition"
          style={{
            left: `${displayPosition.x}px`,
            top: `${displayPosition.y}px`,
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <Heart
            size={256}
            style={{
              color: '#89CFF0',
              fill: '#89CFF0',
              strokeWidth: 1,
              shapeRendering: 'auto',
              display: 'block',
              filter: 'brightness(1)',
              opacity: 1,
              transform: 'translateZ(0) scale(0.125)',
              WebkitTransform: 'translateZ(0) scale(0.125)',
              imageRendering: 'auto',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              willChange: 'transform'
            }}
          />
        </div>
      )}

      {/* Safari 頂部 safe-area 黑色覆蓋（狀態列區域） */}
      {!showTransition && hasStartedTransition && (
        <div
          className="fixed top-0 left-0 right-0 bg-black z-[99]"
          style={{ height: 'env(safe-area-inset-top)' }}
        />
      )}

      {/* Instagram 限時動態 */}
      {!showTransition && hasStartedTransition && (
        <div
          className="flex flex-col w-full h-full bg-black cursor-pointer animate-photo-fade-in select-none"
          onClick={handlePhotoClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transform: swipeY > 0 ? `translateY(${swipeY}px) scale(${Math.max(0.9, 1 - swipeY * 0.0008)})` : undefined,
            transition: swipeY === 0 ? 'transform 0.3s ease' : undefined,
            borderRadius: swipeY > 0 ? '16px' : undefined,
            overflow: 'hidden',
          }}
        >
          {/* 雙層預載 */}
          <div className="flex-1 min-h-0 relative overflow-hidden bg-black">
            {[0, 1].map((layer) => {
              const idx = getLayerIndex(layer)
              const isVisible = visibleLayer === layer
              const isVideo = isVideoUrl(photos[idx])
              return (
                <div
                  key={layer}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? 'auto' : 'none',
                    zIndex: isVisible ? 2 : 1,
                    transition: 'opacity 200ms ease',
                  }}
                  onTransitionEnd={() => {
                    // 淡出完成後才更新 buffer 層的 src，避免 iOS Safari 在 src 改變時清空畫面
                    if (!isVisible) {
                      const bufferIdx = Math.min(currentPhotoIndex + 1, photos.length - 1)
                      if (layerCommittedIdx.current[layer] !== bufferIdx) {
                        layerCommittedIdx.current[layer] = bufferIdx
                        triggerLayerUpdate()
                      }
                    }
                  }}
                >
                  {isVideo ? (
                    <video
                      ref={layer === 0 ? videoRef0 : videoRef1}
                      src={photos[idx]}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      playsInline
                      muted
                      preload="auto"
                      autoPlay={isVisible}
                      onEnded={() => {
                        if (currentPhotoIndex < photos.length - 1) {
                          setVisibleLayer((v) => 1 - v)
                          setCurrentPhotoIndex((i) => i + 1)
                          setProgress(0)
                        } else {
                          setProgress(100)
                        }
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <img
                      src={photos[idx]}
                      alt={`${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      draggable="false"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              )
            })}

            {/* 進度條 */}
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-2 pt-2">
              {photos.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{
                      width: index < currentPhotoIndex
                        ? '100%'
                        : index === currentPhotoIndex
                        ? `${progress}%`
                        : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* 左上角：Profile + 帳號 */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 h-[44px]">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={`${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/gokigen_panda.png`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white font-sans font-semibold text-sm leading-[44px]">
                zacharyzhuoyc
              </span>
            </div>

            {/* 右上角：播放音樂 + 關閉 */}
            <div className="absolute top-4 right-4 z-20 flex items-center h-[44px] gap-1">
              {!bgmStarted && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    tryPlayBGM()
                  }}
                  className="touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium"
                  aria-label="播放音樂"
                >
                  <Music size={18} />
                  <span>播放</span>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="關閉"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* 對話泡泡：發送訊息後出現在左下角 */}
            {chatBubble && (
              <div
                className={`absolute bottom-4 left-3 z-20 flex items-end gap-2 max-w-[75%] pointer-events-none ${chatBubble.fading ? 'animate-bubble-out' : 'animate-bubble-in'}`}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/30">
                  <img
                    src={`${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/angelet.jpg`}
                    alt="Angelet"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
                <div
                  className="rounded-2xl rounded-bl-sm px-3 py-2"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
                >
                  <p className="text-white text-sm font-sans leading-snug break-words">{chatBubble.text}</p>
                </div>
              </div>
            )}

            {/* 左右點擊區域 */}
            <div className="absolute inset-0 flex">
              <div className="flex-1" />
              <div className="flex-1" />
            </div>
          </div>

          {/* 下方：輸入框 + 愛心 + 分享（鍵盤打開時隱藏，改用浮動輸入列） */}
          {!inputFocused && (
            <div
              className="flex items-center gap-2 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] bg-black flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex-1 min-w-0 rounded-full border border-white/40 py-2 px-4 flex items-center"
                onClick={() => inputRef.current?.focus()}
              >
                <span className="text-white/60 font-sans" style={{ fontSize: '16px' }}>傳送訊息......</span>
              </div>
              <button
                type="button"
                onClick={handleHeartClick}
                className={`touch-manipulation flex items-center justify-center w-11 h-11 flex-shrink-0 ${heartBounce ? 'animate-heart-bounce' : ''}`}
                aria-label={heartLiked ? '取消喜歡' : '喜歡'}
              >
                <Heart
                  size={24}
                  className={heartLiked ? 'text-red-500' : 'text-white'}
                  fill={heartLiked ? 'currentColor' : 'none'}
                  strokeWidth={2}
                />
              </button>
              <button
                type="button"
                onClick={handleShareOpen}
                className="touch-manipulation flex items-center justify-center w-11 h-11 flex-shrink-0"
                aria-label="分享"
              >
                <Send size={22} className="text-white" strokeWidth={2} />
              </button>
            </div>
          )}

          {/* 隱藏的 input（聚焦時驅動浮動輸入列） */}
          <input
            ref={inputRef}
            type="text"
            className="sr-only"
            style={{ fontSize: '16px', position: 'absolute', opacity: 0, pointerEvents: 'none' }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage() } }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            autoComplete="off"
            readOnly={false}
          />
        </div>
      )}

      {/* 鍵盤打開時：黑色背景填滿鍵盤高度區域，消除縫隙 */}
      {inputFocused && keyboardHeight > 0 && (
        <div
          className="fixed left-0 right-0 z-[199] bg-black"
          style={{ bottom: 0, height: keyboardHeight }}
        />
      )}

      {/* 浮動輸入列：貼在黑色填充層上方 */}
      {inputFocused && keyboardHeight > 0 && (
        <div
          className="fixed left-0 right-0 z-[200] flex items-center px-3 py-2 bg-black"
          style={{ bottom: keyboardHeight }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 min-w-0 rounded-full border border-white/40 py-2 px-4 flex items-center">
            <span
              className="flex-1 font-sans leading-tight min-w-0 truncate"
              style={{ fontSize: '16px', color: inputValue ? 'white' : 'rgba(255,255,255,0.6)' }}
            >
              {inputValue || '傳送訊息......'}
            </span>
          </div>
        </div>
      )}

      {/* Share Sheet */}
      <ShareSheet isOpen={shareOpen} onClose={handleShareClose} />
    </div>
  )
}

export default {
  easterEggDay: 4,
  HeartIcon,
  ProposalModal,
}
