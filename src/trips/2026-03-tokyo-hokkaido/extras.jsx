import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { Heart, X, Music, Send } from 'lucide-react'
import { env } from '../../lib/env.js'
import { PROPOSAL_PHOTOS, INTRO_BLUE_SLIDES, isVideoUrl } from './extras/data.js'
import ShareSheet from './extras/ShareSheet.jsx'
import HeartIcon from './extras/HeartIcon.jsx'
import { prefersReducedMotion } from '../../lib/motion.js'
import { HEART_COLOR, revealGeometry, clipKeyframes, clipStyle, BEAT_MS, REVEAL_MS, COLLAPSE_MS, CHROME_FADE_MS } from './extras/heartReveal.js'

const BASE = env.BASE_URL
// BGM：AAC-LC 160 kbps m4a（原 320 kbps mp3 轉檔，手機 / 耳機聽不出差異，體積減半）
const BGM_URL = `${BASE}proposal-photos/sukidakara.m4a`
// 開場藍底影片在第一幀 decode 出來前的 poster：同色，窗打開時裡面不會先黑一下
const BLUE_POSTER = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="${HEART_COLOR}"/></svg>`
)


// Proposal Modal (彩蛋 - Instagram 限時動態風格)
const ProposalModal = ({ isOpen, onClose, heartPosition, onRevealStart, warm = false }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [visibleLayer, setVisibleLayer] = useState(0)
  const [showTransition, setShowTransition] = useState(false)
  const [hasStartedTransition, setHasStartedTransition] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0)
  const [pauseStartTime, setPauseStartTime] = useState(null)
  // 目前圖片計時起點（= interval effect 的 startTime）；null = 沒有在計時（影片 / 轉場 / 關閉）
  const photoStartTimeRef = useRef(null)
  const [heartLiked, setHeartLiked] = useState(false)
  // 每點一次 +1，當 key 用來重掛載愛心 → 連點也能每次重播彈跳
  const [heartBounceTick, setHeartBounceTick] = useState(0)
  const [bgmStarted, setBgmStarted] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chatBubble, setChatBubble] = useState(null) // { text, fading }
  const [shareOpen, setShareOpen] = useState(false)
  const [swipeY, setSwipeY] = useState(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  // 關窗中：限時動態收回 DayNav 那顆愛心，收完才真的 onClose
  const [closing, setClosing] = useState(false)
  const closingRef = useRef(false)
  // 開窗已起跑（root 可見；之前限時動態已掛載但 visibility:hidden，讓第一支影片先跑起來）
  const [revealStarted, setRevealStarted] = useState(false)
  // 愛心開窗：限時動態滿版層，只動它的 clip-path；幾何在開窗那刻量一次、關窗沿用
  const windowRef = useRef(null)
  const geomRef = useRef(null)
  const bubbleTimerRef = useRef(null)
  const videoRef0 = useRef(null)
  const videoRef1 = useRef(null)
  const bgmRef = useRef(null)
  const inputRef = useRef(null)
  const swipeRef = useRef(null)
  const isSwipingRef = useRef(false)
  const justSwipedRef = useRef(false)
  // 下滑手勢的近期取樣 [{ y, t }]，放開時算速度（甩動關閉）
  const swipeSamplesRef = useRef([])
  // iOS Safari 不會 preload hidden video，用 fetch 下載 blob 後轉成 blob URL
  const videoBlobCache = useRef(new Map())
  // 用 state 觸發 re-render，讓播放 effect 在 blob 就緒後能取用新 src
  const [blobReadyCount, setBlobReadyCount] = useState(0)

  const photos = PROPOSAL_PHOTOS
  const PHOTO_DURATION = 6000
  // 甩動關閉：取放開前 80ms 內的位移算速度，超過 0.11 px/ms 且至少拉了 24px 即關閉
  const SWIPE_VELOCITY_WINDOW_MS = 80
  const SWIPE_DISMISS_VELOCITY = 0.11
  const SWIPE_DISMISS_MIN_PX = 24
  const SWIPE_DISMISS_DISTANCE = 120
  // 下滑判定門檻：超過才進入拖拉，並以門檻為 0 點起算（不跳 10px）
  const SWIPE_ENGAGE_PX = 10

  // Warm-up：使用者停在彩蛋那天（warm=true，由 TripPage 以 activeDay === easterEggDay 判斷）才開始，
  // 依播放順序「逐一」fetch 全部媒體 + BGM，讓 sw.js 的 proposal-media CacheFirst（30 天）存成完整 200 response；
  // 之後開彩蛋全部零流量、離線也能播（BGM 的 Range 請求由 RangeRequestsPlugin 從快取切片）。
  // 逐一而非並發：前面的先熱、不跟頁面其他請求搶頻寬；切到別天 / 卸載就 abort。
  // 流量考量：省流量模式 / 2G 直接跳過（iOS Safari 沒有 navigator.connection，等於永遠執行，
  // 但有 SW 快取後每 30 天最多跑一次完整下載）。
  useEffect(() => {
    if (!warm || typeof window === 'undefined') return
    const conn = navigator.connection
    if (conn?.saveData) return
    if (conn && ['slow-2g', '2g'].includes(conn.effectiveType)) return

    const controller = new AbortController()
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 500))
    const handle = schedule(async () => {
      for (const url of [...PROPOSAL_PHOTOS, BGM_URL]) {
        if (controller.signal.aborted) return
        try {
          // 讀完 body 才算存進 SW cache；失敗（離線 / abort）就停，下次再來
          const res = await fetch(url, { signal: controller.signal })
          await res.arrayBuffer()
        } catch {
          return
        }
      }
    }, { timeout: 3000 })

    return () => {
      controller.abort()
      if (window.cancelIdleCallback && typeof handle === 'number') {
        try { window.cancelIdleCallback(handle) } catch { /* ignore */ }
      }
    }
  }, [warm])
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
      setHeartBounceTick(0)
      setInputFocused(false)
      setShareOpen(false)
      setSwipeY(0)
      setClosing(false)
      closingRef.current = false
      setRevealStarted(false)
      // 限時動態第 9 下就掛載（root 先 visibility:hidden）：第一支影片趁 icon 心跳那 1.1s 先跑起來，
      // 開窗時窗裡已經是它的藍
      setHasStartedTransition(true)

      // 有 heartPosition（從 DayNav 點出來）：icon 綻放 + 心跳兩下（BEAT_MS）後開窗；
      // 沒有（其他入口）：從視窗中心直接開。reduced-motion：不等心跳、不開窗，root 300ms 淡入
      const center = heartPosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const reduced = prefersReducedMotion()
      const delay = heartPosition && !reduced ? BEAT_MS : 0
      const timer = setTimeout(() => {
        geomRef.current = revealGeometry(center, window.innerWidth, window.innerHeight)
        setRevealStarted(true)
        setShowTransition(!reduced)
        // 窗出現的同一幀把 DayNav 的 icon 藏掉，畫面上只剩窗這一顆愛心
        onRevealStart?.()
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setShowTransition(false)
      setHasStartedTransition(false)
      setRevealStarted(false)
      setClosing(false)
      closingRef.current = false
      setInputFocused(false)
      setInputValue('')
      setChatBubble(null)
      setShareOpen(false)
      setSwipeY(0)
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    }
  }, [isOpen, heartPosition, onRevealStart])

  // BGM
  const tryPlayBGM = useCallback(() => {
    const audio = bgmRef.current
    if (!audio || bgmStarted) return
    audio.play().then(() => setBgmStarted(true)).catch(() => {})
  }, [bgmStarted])

  useEffect(() => {
    const audio = bgmRef.current
    if (!audio) return
    if (isOpen && revealStarted && !closing) {
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
  }, [isOpen, revealStarted, closing])

  // 開窗：showTransition 轉 true 時（限時動態層已掛載、inline clip 是 32px 愛心）跑 WAAPI，只動 clip-path。
  // 結束時先把 inline clip 直接寫成 none 再 cancel 動畫，最後才 setState，
  // 否則 cancel → re-render 之間會有一幀窗縮回 32px。
  useEffect(() => {
    if (!showTransition) return
    const el = windowRef.current
    const g = geomRef.current
    if (!el || !g || prefersReducedMotion() || typeof el.animate !== 'function') {
      setShowTransition(false)
      return
    }
    const a = el.animate(clipKeyframes(g), { duration: REVEAL_MS, fill: 'forwards' })
    let finished = false
    a.onfinish = () => {
      finished = true
      el.style.clipPath = 'none'
      el.style.webkitClipPath = 'none'
      a.cancel()
      setShowTransition(false)
    }
    return () => { if (!finished) a.cancel() }
  }, [showTransition])

  // 關窗：closing 轉 true 時 inline clip 已是蓋滿的愛心（視覺上跟全開一樣），反向收回 32px 再 onClose
  useEffect(() => {
    if (!closing) return
    const el = windowRef.current
    const g = geomRef.current
    if (!el || !g || typeof el.animate !== 'function') {
      onClose()
      return
    }
    const a = el.animate(clipKeyframes(g, { reverse: true }), { duration: COLLAPSE_MS, fill: 'forwards' })
    let finished = false
    a.onfinish = () => {
      finished = true
      onClose()
    }
    return () => { if (!finished) a.cancel() }
  }, [closing, onClose])

  // 所有關閉入口（下滑、X、ESC）都走這裡：窗開著就先收窗，其餘情況直接關
  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (!revealStarted || showTransition || prefersReducedMotion()) {
      onClose()
      return
    }
    setClosing(true)
  }, [revealStarted, showTransition, onClose])

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
    if (!isOpen || !revealStarted || showTransition) return

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
      restored.content = '#FBFAF5'
      document.head.appendChild(restored)
    }
  }, [isOpen, revealStarted, showTransition])

  // 自動播放和進度條（僅圖片）
  useEffect(() => {
    if (!isOpen || !revealStarted || showTransition || currentIsVideo) {
      photoStartTimeRef.current = null
      return
    }
    if (isPaused) return

    const startTime = Date.now() - elapsedBeforePause
    photoStartTimeRef.current = startTime
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
  }, [isOpen, revealStarted, currentPhotoIndex, showTransition, isPaused, elapsedBeforePause, photos.length, currentIsVideo])

  // 暫停的唯一記帳點：isPaused 轉 true 時（長按 / 滑鼠按住 / 輸入框聚焦 / 開分享面板皆同）
  // 由計時起點算出已播時間，恢復時 interval 從這裡接續，與 CSS story-progress 凍結點一致。
  // 各觸發點不再自行抓 elapsed（之前只有 touch / mouse 會抓，其餘路徑恢復時會用到舊值）
  useEffect(() => {
    if (!isPaused || photoStartTimeRef.current === null) return
    const elapsed = Math.min(PHOTO_DURATION, Date.now() - photoStartTimeRef.current)
    photoStartTimeRef.current = null
    setElapsedBeforePause(elapsed)
  }, [isPaused])

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
    if (!isOpen || !revealStarted || showTransition || !currentIsVideo || isPaused) return
    const interval = setInterval(() => {
      const v = visibleVideoRef.current
      if (!v || !v.duration || !isFinite(v.duration)) return
      const p = (v.currentTime / v.duration) * 100
      setProgress(p)
    }, 50)
    return () => clearInterval(interval)
  }, [isOpen, revealStarted, showTransition, currentIsVideo, isPaused, currentPhotoIndex, visibleLayer, visibleVideoRef])

  // 進度條樣式：過去 = 滿、未來 = 空；目前那格（圖片）交給 story-progress CSS 動畫線性填滿，
  // 暫停用 animationPlayState 凍結。影片的長度不固定，仍沿用 interval 量 currentTime 的 progress（scaleX）。
  // interval 只負責推進 currentPhotoIndex 與暫停時的 elapsed 記帳，不再驅動圖片進度條的 DOM。
  const progressBarStyle = (index) => {
    if (index < currentPhotoIndex) return { transform: 'scaleX(1)' }
    if (index > currentPhotoIndex) return { transform: 'scaleX(0)' }
    if (currentIsVideo || progress >= 100) return { transform: `scaleX(${progress / 100})` }
    return {
      animation: `story-progress ${PHOTO_DURATION}ms linear forwards`,
      animationPlayState: isPaused ? 'paused' : 'running',
    }
  }

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
    swipeSamplesRef.current = []

    setIsPaused(true)
    setPauseStartTime(Date.now())
  }

  const handleTouchMove = (e) => {
    if (!swipeRef.current || e.target.closest('button') || e.target.closest('input')) return

    const touch = e.touches[0]
    const dy = touch.clientY - swipeRef.current.y
    const dx = Math.abs(touch.clientX - swipeRef.current.x)

    // 一旦進入拖拉就持續跟手（往回拉到門檻內也不會卡住舊位置）
    if (isSwipingRef.current || (dy > SWIPE_ENGAGE_PX && dy > dx * 1.5)) {
      isSwipingRef.current = true
      setSwipeY(Math.max(0, dy - SWIPE_ENGAGE_PX))
      const now = performance.now()
      const samples = swipeSamplesRef.current.filter((p) => now - p.t <= SWIPE_VELOCITY_WINDOW_MS)
      samples.push({ y: touch.clientY, t: now })
      swipeSamplesRef.current = samples
    }
  }

  const handleTouchEnd = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return

    // 下滑關閉
    if (isSwipingRef.current) {
      // 速度：只看放開前 80ms 內的取樣；停住後才放開 → 無取樣 → 速度 0
      const now = performance.now()
      const recent = swipeSamplesRef.current.filter((p) => now - p.t <= SWIPE_VELOCITY_WINDOW_MS)
      let velocity = 0
      if (recent.length >= 2) {
        const first = recent[0]
        const last = recent[recent.length - 1]
        const dt = last.t - first.t
        if (dt > 0) velocity = (last.y - first.y) / dt
      }
      swipeSamplesRef.current = []
      if (
        swipeY > SWIPE_DISMISS_DISTANCE ||
        (velocity > SWIPE_DISMISS_VELOCITY && swipeY > SWIPE_DISMISS_MIN_PX)
      ) {
        requestClose()
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
    setHeartBounceTick((t) => t + 1)
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
        requestClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, requestClose])

  if (!isOpen) return null

  const reducedMotion = prefersReducedMotion()
  // 開窗 / 關窗期間限時動態層套 inline clip（WAAPI 的 clip-path 蓋在上面動）；全開後沒有 clip
  const windowClip = (showTransition || closing) && geomRef.current
    ? clipStyle(geomRef.current, closing ? 'end' : 'start')
    : undefined
  // 限時動態的 UI（進度條 / 帳號 / 右上鈕 / 底欄）：窗開滿才淡入、關窗一開始就淡出，
  // 開窗過程窗裡只有影片的藍，不會有一堆白色小 UI 擠在小窗裡
  const chromeStyle = {
    opacity: (!revealStarted || showTransition || closing) ? 0 : 1,
    transition: `opacity ${CHROME_FADE_MS}ms ease`,
  }
  // 舞台（滿版層 / 欄 / media 區 / 狀態列覆蓋 / 底欄）一律黑底（user 指定），contain 留出來的邊也是黑；
  // 開場藍只存在於影片本身：1~8.mp4 帶同色 poster，第一幀 decode 前影片區就是藍，窗從 icon 打開時裡面是藍

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="求婚彩蛋"
      // animate-stage-settle：窗開滿後跑一次 background-color keyframe，逼 iOS Safari（瀏覽器模式）
      // 重新採樣頁面頂端顏色把頂部 tint 轉黑（它不會因為 theme-color meta 換了就重採；舊版靠 bgFadeIn 做這件事）
      className={`fixed inset-0 z-[100] overflow-hidden ${(revealStarted && !showTransition && !closing) ? 'animate-stage-settle' : ''}`}
      style={{
        pointerEvents: (!revealStarted || showTransition || closing) ? 'none' : 'auto',
        // 開 / 關窗期間 root 透明：窗外看得到底下的行程頁，窗內才是限時動態
        backgroundColor: (revealStarted && !showTransition && !closing) ? 'black' : 'transparent',
        opacity: revealStarted ? 1 : 0,
        visibility: revealStarted ? 'visible' : 'hidden',
        transition: reducedMotion ? 'opacity 300ms ease' : undefined,
      }}
    >
      {/* BGM */}
      <audio
        ref={bgmRef}
        src={BGM_URL}
        loop
        preload="auto"
      />

      {/* 愛心開窗：限時動態滿版層，開 / 關窗只動它的 clip-path（幾何與 keyframes 見 extras/heartReveal.js）。
          舞台一律黑底（user 指定） */}
      {hasStartedTransition && (
        <div ref={windowRef} className="absolute inset-0 bg-black" style={windowClip}>
        {/* Safari 頂部 safe-area 黑色覆蓋（狀態列區域） */}
        <div
          className="absolute top-0 left-0 right-0 z-[99] bg-black"
          style={{ height: 'env(safe-area-inset-top)' }}
        />
        <div
          className="flex flex-col w-full h-full max-w-2xl mx-auto cursor-pointer select-none"
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
            backgroundColor: 'black',
            transform: swipeY > 0 ? `translateY(${swipeY}px) scale(${Math.max(0.9, 1 - swipeY * 0.0008)})` : undefined,
            transition: swipeY === 0 ? 'transform 0.3s var(--ease-out)' : undefined,
            borderRadius: swipeY > 0 ? '16px' : undefined,
            overflow: 'hidden',
          }}
        >
          {/* 雙層預載。媒體尺寸用 .story-media（index.css）依顯示模式分流：
              瀏覽器模式可視區被 Safari 工具列吃掉、比 9:16 矮 → contain 等比縮小、黑底留邊、整張都看得到；
              PWA standalone 全螢幕 → cover 滿版、錨頂 */}
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
                    // 只讓「進場層」淡入；退場層等 200ms 進場完成後才瞬切為 0，
                    // 避免兩層同時半透明時透出黑底（中途變暗）。onTransitionEnd 仍會觸發，buffer 換 src 邏輯不變
                    transition: isVisible ? 'opacity 200ms ease' : 'opacity 0ms linear 200ms',
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
                      className="absolute inset-0 w-full h-full story-media pointer-events-none"
                      playsInline
                      muted
                      preload="auto"
                      poster={idx < INTRO_BLUE_SLIDES ? BLUE_POSTER : undefined}
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
                      className="absolute inset-0 w-full h-full story-media pointer-events-none"
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
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-2 pt-2" style={chromeStyle}>
              {photos.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    // 目前那格以 currentPhotoIndex 當 key：換照片即重掛載、動畫從 0 重跑
                    key={index === currentPhotoIndex ? `current-${currentPhotoIndex}` : 'static'}
                    className="h-full bg-white origin-left"
                    style={progressBarStyle(index)}
                  />
                </div>
              ))}
            </div>

            {/* 左上角：Profile + 帳號 */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 h-[44px]" style={chromeStyle}>
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={`${BASE}proposal-photos/gokigen_panda.png`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white font-sans font-semibold text-sm leading-[44px]">
                zacharyzhuoyc
              </span>
            </div>

            {/* 右上角：播放音樂 + 關閉 */}
            <div className="absolute top-4 right-4 z-20 flex items-center h-[44px] gap-1" style={chromeStyle}>
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
                  requestClose()
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
                    src={`${BASE}proposal-photos/angelet.jpg`}
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
              className="flex items-center gap-2 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex-shrink-0"
              style={{ ...chromeStyle, backgroundColor: 'black' }}
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
                className="touch-manipulation flex items-center justify-center w-11 h-11 flex-shrink-0"
                aria-label={heartLiked ? '取消喜歡' : '喜歡'}
              >
                <Heart
                  key={heartBounceTick}
                  size={24}
                  className={`${heartLiked ? 'text-red-500' : 'text-white'} ${heartBounceTick > 0 ? 'animate-heart-bounce' : ''}`}
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
        </div>
      )}

      {/* 鍵盤打開時：黑色背景填滿鍵盤高度區域，消除縫隙 */}
      {inputFocused && keyboardHeight > 0 && (
        <div
          className="fixed left-0 right-0 max-w-2xl mx-auto z-[199] bg-black"
          style={{ bottom: 0, height: keyboardHeight }}
        />
      )}

      {/* 浮動輸入列：貼在黑色填充層上方 */}
      {inputFocused && keyboardHeight > 0 && (
        <div
          className="fixed left-0 right-0 max-w-2xl mx-auto z-[200] flex items-center px-3 py-2 bg-black"
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
