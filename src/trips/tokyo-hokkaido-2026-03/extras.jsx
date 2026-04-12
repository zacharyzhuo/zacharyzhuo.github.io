import React, { useState, useEffect } from 'react'
import { Heart, X, Send, Music } from 'lucide-react'

// 彩蛋照片/影片列表：請將檔案放在 proposal-photos/（靜態根目錄）
// 圖片：JPEG 或 WebP（勿用 HEIC）。影片：.mov 或 .mp4（.mov 在 Safari 支援佳，Chrome 建議 .mp4）。
const PROPOSAL_PHOTOS = [
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/1.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/2.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/3.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/4.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/5.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/6.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/7.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/8.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/9.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/10.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/11.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/12.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/13.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/14.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/15.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/16.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/17.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/18.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/19.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/20.MOV`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/21.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/22.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/23.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/24.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/25.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/26.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/27.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/28.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/29.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/30.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/31.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/32.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/33.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/34.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/35.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/36.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/37.JPG`,
  `${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/38.MOV`,
  // 可加入影片：`${import.meta.env.BASE_URL || ''}proposal-photos/VID_001.mov`
]

const isVideoUrl = (url) => /\.(mov|mp4|webm)(\?|$)/i.test(url || '')

// Proposal Modal (彩蛋 - Instagram 限時動態風格)
const ProposalModal = ({ isOpen, onClose, heartPosition }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [visibleLayer, setVisibleLayer] = useState(0) // 0 或 1，哪一層正在顯示（雙層預載，下一則已在另一層載好）
  const [showTransition, setShowTransition] = useState(false)
  const [hasStartedTransition, setHasStartedTransition] = useState(false) // 追蹤是否已經開始過渡動畫
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0)
  const [pauseStartTime, setPauseStartTime] = useState(null)
  const [heartLiked, setHeartLiked] = useState(false)
  const [bgmStarted, setBgmStarted] = useState(false)
  const videoRef0 = React.useRef(null)
  const videoRef1 = React.useRef(null)
  const bgmRef = React.useRef(null)

  const photos = PROPOSAL_PHOTOS
  const PHOTO_DURATION = 6000 // 6秒
  const currentIsVideo = isVideoUrl(photos[currentPhotoIndex])
  // 每層顯示的內容索引：當前層顯示 currentPhotoIndex，另一層顯示下一則（預載）
  const getLayerIndex = (layer) =>
    layer === visibleLayer ? currentPhotoIndex : Math.min(currentPhotoIndex + 1, photos.length - 1)
  const visibleVideoRef = visibleLayer === 0 ? videoRef0 : videoRef1

  // 預載下一張與前一張（僅圖片；影片不預載）
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
      setShowTransition(false) // 初始不顯示動畫
      setHasStartedTransition(false) // 重置過渡狀態
      setHeartLiked(false) // 每次打開彩蛋時愛心重置為未按

      // 如果 heartPosition 已設置（表示是從搖晃觸發的），等待搖晃完成後開始動畫
      if (heartPosition) {
        // 等待搖晃完成（1.2秒）後立即開始動畫
        const shakeTimer = setTimeout(() => {
          setShowTransition(true)
          setHasStartedTransition(true)
        }, 1200)

        // 過場動畫在開始後 2.5 秒開始淡入照片（與動畫時長一致）
        const transitionTimer = setTimeout(() => {
          setShowTransition(false)
        }, 3700) // 1.2秒搖晃 + 2.5秒動畫

        return () => {
          clearTimeout(shakeTimer)
          clearTimeout(transitionTimer)
        }
      } else {
        // 如果沒有 heartPosition，立即開始（備用方案）
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
      // 關閉時重置
      setShowTransition(false)
      setHasStartedTransition(false)
    }
  }, [isOpen, heartPosition])

  // 背景音樂：Instagram 頁面顯示時嘗試播放「好きだから。」；若被瀏覽器阻擋，需使用者點擊「播放音樂」或點一下畫面
  const tryPlayBGM = React.useCallback(() => {
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
        .catch(() => {
          // 瀏覽器阻擋自動播放時，不報錯；使用者可點「播放音樂」或點擊畫面
        })
    } else {
      audio.pause()
      if (!isOpen) {
        audio.currentTime = 0
        setBgmStarted(false)
      }
    }
  }, [isOpen, hasStartedTransition, showTransition])

  // 自動播放和進度條（僅圖片；影片由 video 的 onTimeUpdate / onEnded 驅動）
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

  // 當照片/影片切換時，重置已過時間
  useEffect(() => {
    if (!isOpen || showTransition) return
    setElapsedBeforePause(0)
    setProgress(0)
  }, [currentPhotoIndex, isOpen, showTransition])

  // 影片：只播放可見層、暫停另一層；長按暫停/放開播放
  useEffect(() => {
    const otherRef = visibleLayer === 0 ? videoRef1 : videoRef0
    otherRef.current?.pause()
    const v = visibleVideoRef.current
    if (!currentIsVideo || !v) return
    if (isPaused) v.pause()
    else v.play().catch(() => {})
  }, [currentIsVideo, isPaused, visibleLayer, visibleVideoRef])

  // 影片進度條：每 50ms 輪詢，只讀取目前可見層的 video
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

  const handlePhotoClick = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return

    // 第一次點擊畫面時嘗試播放背景音樂（因瀏覽器可能阻擋自動播放）
    tryPlayBGM()

    // 如果是長按後鬆開（有暫停記錄），不處理點擊切換
    if (pauseStartTime && Date.now() - pauseStartTime > 200) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const isLeftHalf = clickX < rect.width / 2

    // 只處理左右點擊
    if (isLeftHalf) {
      // 點擊左半邊，上一張
      if (currentPhotoIndex > 0) {
        setVisibleLayer((v) => 1 - v)
        setCurrentPhotoIndex(currentPhotoIndex - 1)
        setProgress(0) // 重置進度
        setElapsedBeforePause(0)
      }
    } else {
      // 點擊右半邊，下一張（翻到已預載的層，無載入延遲）
      if (currentPhotoIndex < photos.length - 1) {
        setVisibleLayer((v) => 1 - v)
        setCurrentPhotoIndex(currentPhotoIndex + 1)
        setProgress(0) // 重置進度
        setElapsedBeforePause(0)
      } else {
        // 最後一張後保持顯示
        setProgress(100)
      }
    }
  }

  // 處理觸摸/點擊暫停
  const handleTouchStart = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return

    const currentProgress = progress
    const currentElapsed = (currentProgress / 100) * PHOTO_DURATION
    setElapsedBeforePause(currentElapsed)
    setIsPaused(true)
    setPauseStartTime(Date.now())
  }

  const handleTouchEnd = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return

    const pauseDuration = pauseStartTime ? Date.now() - pauseStartTime : 0
    setPauseStartTime(null)

    // 如果暫停時間很短（< 200ms），視為點擊，不恢復進度條
    if (pauseDuration < 200) {
      setIsPaused(false)
      return
    }

    // 恢復進度條
    setIsPaused(false)
  }

  // 處理滑鼠按下/放開暫停（桌面端）
  const handleMouseDown = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return

    const currentProgress = progress
    const currentElapsed = (currentProgress / 100) * PHOTO_DURATION
    setElapsedBeforePause(currentElapsed)
    setIsPaused(true)
    setPauseStartTime(Date.now())
  }

  const handleMouseUp = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return

    const pauseDuration = pauseStartTime ? Date.now() - pauseStartTime : 0
    setPauseStartTime(null)

    // 如果暫停時間很短（< 200ms），視為點擊，不恢復進度條
    if (pauseDuration < 200) {
      setIsPaused(false)
      return
    }

    // 恢復進度條
    setIsPaused(false)
  }

  if (!isOpen) return null

  // 如果沒有 heartPosition，使用螢幕中心作為 fallback
  const displayPosition = heartPosition || {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{
        pointerEvents: showTransition ? 'none' : 'auto',
        backgroundColor: 'transparent',
        opacity: (showTransition || hasStartedTransition) ? 1 : 0,
        visibility: (showTransition || hasStartedTransition) ? 'visible' : 'hidden'
      }}
    >
      {/* 背景音樂：好きだから。（Instagram 頁面顯示時播放） */}
      <audio
        ref={bgmRef}
        src={`${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/sukidakara.mp3`}
        loop
        preload="auto"
      />
      {/* 白色背景過渡層：在愛心動畫後期逐漸顯示 */}
      {showTransition && (
        <div
          className="absolute inset-0 animate-bg-fade-in"
          style={{
            backgroundColor: 'white',
            zIndex: 9998
          }}
        />
      )}

      {/* 過場動畫：愛心放大填滿螢幕 */}
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

      {/* 當 showTransition 為 false 時，確保背景是白色 */}
      {!showTransition && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'white',
            zIndex: 0
          }}
        />
      )}

      {/* Instagram 限時動態風格：圖片只顯示到傳送訊息區塊上方，整體黑底 */}
      {!showTransition && hasStartedTransition && (
        <div
          className="flex flex-col w-full h-full bg-black cursor-pointer animate-photo-fade-in select-none"
          onClick={handlePhotoClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          {/* 上方：雙層預載（層 0 / 層 1），下一則已在另一層載好，切換只翻層不重載 */}
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

            {/* 進度條（Instagram 風格 - 動態進度） */}
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

            {/* 左上角：Profile 圖片 + 帳號名稱 */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 h-[44px]">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={`${import.meta.env.BASE_URL || ''}trips/tokyo-hokkaido-2026-03/proposal-photos/gokigen_panda.png`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white font-sans font-semibold text-sm leading-[44px]">
                zacharyzhuoyc
              </span>
            </div>

            {/* 右上角：叉叉 */}
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

            {/* 左右點擊區域（僅覆蓋圖片區） */}
            <div className="absolute inset-0 flex">
              <div className="flex-1" />
              <div className="flex-1" />
            </div>
          </div>

          {/* 下方：傳送訊息區塊（純黑底）；愛心可點擊切換紅/白 */}
          <div
            className="flex items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-black flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 min-w-0 rounded-full border border-white/30 bg-white/5 py-2.5 px-4 pointer-events-none">
              <span className="text-white/80 text-sm font-serif">傳送訊息......</span>
            </div>
            <div className="flex items-center gap-5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setHeartLiked((prev) => !prev)}
                className="p-1 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px]"
                aria-label={heartLiked ? "取消喜歡" : "喜歡"}
              >
                <Heart
                  size={26}
                  className={heartLiked ? "text-red-500 stroke-[2]" : "text-white stroke-[2]"}
                  fill={heartLiked ? "currentColor" : "none"}
                />
              </button>
              <Send size={24} className="text-white stroke-[2] pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* 彩蛋視窗 */}
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
