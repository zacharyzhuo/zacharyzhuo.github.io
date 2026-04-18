import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, X, Send, Music, Search } from 'lucide-react'

// 彩蛋照片/影片列表：請將檔案放在 proposal-photos/（靜態根目錄）
// 圖片：JPEG 或 WebP（勿用 HEIC）。影片：.mov 或 .mp4（.mov 在 Safari 支援佳，Chrome 建議 .mp4）。
const BASE = import.meta.env.BASE_URL || ''
const PROPOSAL_PHOTOS = [
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/1.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/2.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/3.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/4.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/5.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/6.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/7.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/8.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/9.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/10.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/11.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/12.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/13.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/14.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/15.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/16.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/17.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/18.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/19.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/20.MOV`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/21.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/22.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/23.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/24.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/25.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/26.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/27.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/28.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/29.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/30.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/31.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/32.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/33.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/34.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/35.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/36.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/37.JPG`,
  `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/38.MOV`,
]

const isVideoUrl = (url) => /\.(mov|mp4|webm)(\?|$)/i.test(url || '')

// 分享對象：大頭貼請放置對應圖片檔案
const SHARE_CONTACTS = [
  {
    name: 'Angelet Y.',
    avatar: `${BASE}trips/tokyo-hokkaido-2026-03/proposal-photos/angelet.jpg`,
  },
]

// Share Sheet 元件（Instagram 分享面板，支援手勢下滑關閉）
const ShareSheet = ({ isOpen, onClose }) => {
  const sheetRef = useRef(null)
  const overlayRef = useRef(null)
  const dragRef = useRef(null)
  const [planePos, setPlanePos] = useState(null) // { x, y } 飛機起始位置

  const handleDragStart = (e) => {
    e.stopPropagation()
    dragRef.current = { startY: e.touches[0].clientY, dy: 0 }
    if (sheetRef.current) {
      sheetRef.current.style.animation = 'none'
      sheetRef.current.style.transition = 'none'
      sheetRef.current.style.transform = 'translateY(0)'
    }
  }

  const handleDragMove = (e) => {
    e.stopPropagation()
    if (!dragRef.current) return
    const dy = Math.max(0, e.touches[0].clientY - dragRef.current.startY)
    dragRef.current.dy = dy
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`
    if (overlayRef.current) {
      const opacity = Math.max(0, 0.4 * (1 - dy / 300))
      overlayRef.current.style.backgroundColor = `rgba(0,0,0,${opacity})`
    }
  }

  const handleDragEnd = (e) => {
    e.stopPropagation()
    if (!dragRef.current) return
    const dy = dragRef.current.dy
    dragRef.current = null
    if (dy > 80) {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.25s ease'
        sheetRef.current.style.transform = 'translateY(100%)'
      }
      setTimeout(onClose, 250)
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.3s ease'
        sheetRef.current.style.transform = 'translateY(0)'
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'background-color 0.3s ease'
        overlayRef.current.style.backgroundColor = 'rgba(0,0,0,0.4)'
      }
    }
  }

  // 點擊頭像：取得點擊座標 → 觸發飛機動畫 → 關閉
  const handleContactClick = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setPlanePos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    setTimeout(() => {
      setPlanePos(null)
      onClose()
    }, 700)
  }

  if (!isOpen) return null

  return (
    <>
      {/* 飛機動畫：fixed 定位在點擊位置，播完就消失 */}
      {planePos && (
        <div
          className="fixed z-[300] pointer-events-none animate-plane-fly"
          style={{ left: planePos.x - 12, top: planePos.y - 12 }}
        >
          <Send size={24} className="text-white" strokeWidth={2} />
        </div>
      )}

      <div
        ref={overlayRef}
        className="absolute inset-0 z-50 flex flex-col justify-end"
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        <div
          ref={sheetRef}
          className="relative rounded-t-2xl overflow-hidden animate-share-slide-up"
          style={{ backgroundColor: '#262626' }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* 拖曳把手 */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>

          {/* 搜尋列 */}
          <div className="px-4 pb-4">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ backgroundColor: '#363636' }}
            >
              <Search size={16} className="text-white/50 flex-shrink-0" />
              <span className="text-white/50 text-sm font-sans">搜尋</span>
              <div className="flex-1" />
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#4a4a4a' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                  <circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><circle cx="8" cy="16" r="3" /><circle cx="16" cy="16" r="3" />
                </svg>
              </div>
            </div>
          </div>

          {/* 聯絡人 */}
          <div className="px-6 pb-6">
            <div className="flex flex-wrap gap-6">
              {SHARE_CONTACTS.map((contact) => (
                <div
                  key={contact.name}
                  className="flex flex-col items-center gap-2 w-[72px] cursor-pointer"
                  onClick={handleContactClick}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = `<span class="text-white/30 text-2xl font-sans">${contact.name[0]}</span>`
                      }}
                    />
                  </div>
                  <span className="text-white text-xs font-sans text-center leading-tight">{contact.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
        </div>
      </div>
    </>
  )
}

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

  const photos = PROPOSAL_PHOTOS
  const PHOTO_DURATION = 6000
  const currentIsVideo = isVideoUrl(photos[currentPhotoIndex])
  const getLayerIndex = (layer) =>
    layer === visibleLayer ? currentPhotoIndex : Math.min(currentPhotoIndex + 1, photos.length - 1)
  const visibleVideoRef = visibleLayer === 0 ? videoRef0 : videoRef1

  // 預載下一張與前一張（僅圖片）
  useEffect(() => {
    if (!isOpen || !photos.length) return
    const preload = (index) => {
      if (index >= 0 && index < photos.length && !isVideoUrl(photos[index])) {
        const img = new Image()
        img.src = photos[index]
      }
    }
    preload(currentPhotoIndex + 1)
    preload(currentPhotoIndex - 1)
  }, [isOpen, currentPhotoIndex, photos])

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

  // 影片播放控制
  useEffect(() => {
    const otherRef = visibleLayer === 0 ? videoRef1 : videoRef0
    otherRef.current?.pause()
    const v = visibleVideoRef.current
    if (!currentIsVideo || !v) return
    if (isPaused) v.pause()
    else v.play().catch(() => {})
  }, [currentIsVideo, isPaused, visibleLayer, visibleVideoRef])

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

  if (!isOpen) return null

  const displayPosition = heartPosition || {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  }

  return (
    <div
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
                    zIndex: isVisible ? 1 : 0,
                  }}
                >
                  {isVideo ? (
                    <video
                      ref={layer === 0 ? videoRef0 : videoRef1}
                      src={photos[idx]}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      playsInline
                      muted
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

function HeartIcon({ activated }) {
  return (
    <Heart
      size={32}
      className={activated ? 'animate-heart-pop-shake' : ''}
      style={{ color: '#89CFF0', fill: activated ? '#89CFF0' : 'none' }}
    />
  )
}

export default {
  easterEggDay: 4,
  HeartIcon,
  ProposalModal,
}
