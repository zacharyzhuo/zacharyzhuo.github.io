import React, { useState, useEffect } from "react";
import { tripData } from "./data";
import {
  MapPin,
  X,
  Plane,
  Hotel,
  Camera,
  Utensils,
  ShoppingBag,
  Train,
  ChevronRight,
  Navigation,
  ClipboardList,
  Check,
  Info,
  AlertCircle,
  ExternalLink,
  Luggage,
  Menu,
  Clock,
  BookOpen,
  Phone,
  PhoneCall,
  Shield,
  Flame,
  Building2,
  Heart,
  Send,
} from "lucide-react";

// --- DATA ---
const checklistData = {
  "Documents & Money": [
    "護照",
    "外幣",
    "信用卡",
    "鑰匙",
    "駕照",
    "駕照日文譯本",
  ],
  Clothes: [
    "衣物 (上衣/褲子/裙子/外套)",
    "內衣",
    "發熱衣",
    "內褲",
    "襪子",
    "帽子",
    "圍巾",
    "手套",
    "睡衣",
  ],
  Electronics: [
    "eSIM",
    "耳機",
    "行動電源",
    "充電器 (充電線/轉接頭)",
    "自拍桿",
  ],
  "Toiletries & Beauty": [
    "洗面乳",
    "化妝品",
    "防曬",
    "保養品",
    "香水",
    "梳子",
    "飾品（項鍊/耳環/戒指）",
    "小圓鏡",
  ],
  "Health & Care": ["常備藥品", "暖暖包", "口罩", "牙套維持器"],
  Others: ["衛生紙/濕紙巾", "雨傘"],
};

// --- COMPONENTS ---

// 1. Sidebar (Drawer)
const Sidebar = ({ isOpen, onClose, onSelect }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full w-full glass-sidebar flex flex-col">
          <div className="p-6 flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-jp-text">
              Trip Menu
            </h2>
            <button
              onClick={onClose}
              className="p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉選單"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-2 px-4">
            <button
              onClick={() => onSelect("info")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50/80 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Info size={20} />
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">
                  旅程資訊
                </span>
                <span className="block text-xs text-stone-500 font-serif tracking-wide">
                  Flight & Info
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelect("checklist")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-green-50/80 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <ClipboardList size={22} />
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">
                  行李清單
                </span>
                <span className="block text-xs text-stone-500 font-serif tracking-wide">
                  Packing List
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelect("shopping")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-pink-50/80 text-pink-600 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                <ShoppingBag size={22} />
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">
                  逛街清單
                </span>
                <span className="block text-xs text-stone-500 font-serif tracking-wide">
                  Shopping Map
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelect("food")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-orange-50/80 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Utensils size={22} />
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">
                  美食清單
                </span>
                <span className="block text-xs text-stone-500 font-serif tracking-wide">
                  Food List
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelect("emergency")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-red-50/80 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <PhoneCall size={22} />
              </div>
              <div>
                <span className="block font-serif font-bold text-red-700 text-base">
                  緊急聯絡
                </span>
                <span className="block text-xs text-red-400 font-serif tracking-wide">
                  Emergency
                </span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          <p className="text-xs text-stone-500 text-center font-serif tracking-widest uppercase opacity-70">
            Tokyo & Hokkaido Trip 2026
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

// 2. Date Strip (Top Calendar)
const DateStrip = ({ days, activeDay, onSelect, onDay4Click, day4ClickCount, isDay4Activated }) => {
  const [lastTap, setLastTap] = useState(0);
  const scrollContainerRef = React.useRef(null);

  const handleToggleScroll = () => {
    const isAtBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

    if (isAtBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleTap = (dayId, e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    // 先執行日期選擇
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleToggleScroll();
    } else {
      onSelect(dayId);
    }
    setLastTap(now);

    // 如果是 day 4，處理點擊計數（在日期選擇之後）
    if (dayId === 4) {
      e.stopPropagation();
      onDay4Click();
    }
  };

  // Scroll to active day when it changes
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const activeButton = scrollContainerRef.current.querySelector(
        `[data-day="${activeDay}"]`
      );
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeDay]);

  // Prevent swipe gesture from propagating to parent
  const handleTouchStart = (e) => {
    e.stopPropagation();
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="border-b border-stone-200/50 bg-jp-bg sticky top-0 z-20 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={scrollContainerRef}
        className="flex items-center px-6 py-4 overflow-x-auto scrollbar-hide"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {days.map((day) => {
          const dayNum = day.date.split("/")[1].split(" ")[0];
          const weekDay = day.date.match(/\((.*?)\)/)?.[1] || "週";
          const isActive = activeDay === day.day;
          const isDay4 = day.day === 4;
          const showHeart = isDay4 && isDay4Activated;

          return (
            <button
              key={day.day}
              data-day={day.day}
              onClick={(e) => handleTap(day.day, e)}
              className="flex flex-col items-center gap-1 min-w-[4rem] flex-shrink-0 min-h-[44px] justify-center touch-manipulation px-2 relative"
              aria-label={`選擇第 ${day.day} 天`}
            >
              {showHeart ? (
                <Heart
                  size={32}
                  className="animate-heart-pop-shake"
                  style={{ color: '#89CFF0', fill: '#89CFF0' }}
                />
              ) : (
                <>
                  <span
                    className={`text-xs tracking-widest uppercase font-serif ${
                      isActive ? "text-jp-red font-bold" : "text-stone-400"
                    }`}
                  >
                    {weekDay}
                  </span>
                  <span
                    className={`text-2xl font-serif leading-none ${
                      isActive ? "text-jp-text" : "text-stone-300"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 bg-jp-red rounded-full mt-1" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 3. Hero Section (Image + Title)
const HeroSection = ({ location, title, image }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative rounded-none overflow-hidden h-48 group">
      {!imageError ? (
        <img
          src={image}
          alt={location}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-70" : "opacity-0"
          }`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-500 to-stone-700" />
      )}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-stone-300 animate-pulse" />
      )}
      
      {/* 從上方開始的漸變遮罩，讓底部自然淡出到背景色 */}
      <div 
        className="absolute inset-0" 
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(249, 248, 244, 0.05) 45%, rgba(249, 248, 244, 0.15) 60%, rgba(249, 248, 244, 0.3) 72%, rgba(249, 248, 244, 0.5) 82%, rgba(249, 248, 244, 0.7) 90%, rgba(249, 248, 244, 0.85) 95%, rgba(249, 248, 244, 0.95) 98%, rgb(249, 248, 244) 100%)'
        }}
      />
      
      {/* 輕微的深色遮罩保持文字可讀性 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center z-0">
        <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase opacity-80 mb-2 font-serif">
          <span className="w-6 h-[1px] bg-white"></span>
          <span>今日行程</span>
          <span className="w-6 h-[1px] bg-white"></span>
        </div>
        <h2 className="text-2xl font-serif font-bold tracking-wide mb-1 shadow-black drop-shadow-md">
          {title}
        </h2>
        <p className="text-xs font-serif opacity-90 tracking-widest">
          {location}
        </p>
      </div>
    </div>
  );
};

// 4. Activity List Item
const ActivityItem = ({ activity, isLast, onOpen }) => {
  const getIcon = (type) => {
    switch (type) {
      case "交通":
        return <Train size={16} />;
      case "美食":
        return <Utensils size={16} />;
      case "購物":
        return <ShoppingBag size={16} />;
      case "景點":
        return <Camera size={16} />;
      case "住宿":
        return <Hotel size={16} />;
      default:
        return <MapPin size={16} />;
    }
  };

  return (
    <div
      className="flex gap-4 px-6 group cursor-pointer"
      onClick={() => onOpen(activity)}
    >
      {/* Time Column */}
      <div className="w-16 shrink-0 flex flex-col items-center pt-1">
        <span className="text-xg font-serif font-bold text-jp-text leading-none">
          {activity.time}
        </span>
        {!isLast && <div className="w-[1px] bg-stone-200 flex-1 my-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="bg-white rounded-lg p-4 border border-stone-100 active:scale-[0.98] transition-transform duration-200 h-full flex flex-col touch-manipulation">
          <div className="flex justify-between items-start mb-2">
            <span
              className={`text-xs tracking-wider uppercase px-2 py-0.5 rounded border font-serif font-bold ${
                activity.type === "美食"
                  ? "border-orange-200 text-orange-700 bg-orange-50"
                  : activity.type === "交通"
                  ? "border-blue-200 text-blue-700 bg-blue-50"
                  : activity.type === "購物"
                  ? "border-pink-200 text-pink-700 bg-pink-50"
                  : activity.type === "景點"
                  ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                  : activity.type === "住宿"
                  ? "border-purple-200 text-purple-700 bg-purple-50"
                  : "border-stone-200 text-stone-500 bg-stone-50"
              }`}
            >
              {activity.type}
            </span>
          </div>

          <h4 className="text-lg font-serif font-bold text-jp-text mb-1 leading-snug">
            {activity.title}
          </h4>
          <p className="text-sm text-jp-sub text-stone-500 line-clamp-3 font-serif mb-2 leading-relaxed opacity-80">
            {activity.desc}
          </p>

          {activity.hours && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-serif mb-3 bg-stone-50 w-fit px-2 py-1 rounded">
              <Clock size={12} />
              <span>{activity.hours}</span>
            </div>
          )}

          {activity.subItems && (
            <div className="mt-3 space-y-2 border-t border-stone-100 pt-2 mb-3">
              {activity.subItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-0.5 text-sm font-serif"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-stone-600">
                      {item.title}
                    </span>
                    {item.hours && (
                      <span className="text-xs text-stone-400">
                        {item.hours}
                      </span>
                    )}
                  </div>
                  {item.desc && (
                    <span className="text-xs text-stone-400 line-clamp-1">
                      {item.desc}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-stone-400 font-serif mt-auto pt-2">
            {getIcon(activity.type)}
            <span className="truncate text-stone-500 opacity-70 flex-1">
              {activity.address ||
                (activity.nav.startsWith("http")
                  ? "查看地圖位置"
                  : activity.nav)}
            </span>
            <ChevronRight size={12} className="ml-auto shrink-0 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Detail Modal

const DetailModal = ({ isOpen, activity, onClose }) => {
  const [displayActivity, setDisplayActivity] = useState(null);

  useEffect(() => {
    if (activity) {
      setDisplayActivity(activity);
    }
  }, [activity]);

  const currentActivity = activity || displayActivity;
  if (!currentActivity) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="glass-bottom-sheet min-h-[60vh] max-h-[79vh] flex flex-col relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉詳情"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto px-8 pb-10 flex-1 pt-8">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 border text-xs tracking-widest font-bold font-serif uppercase rounded ${
                  currentActivity.type === "美食"
                    ? "border-orange-200 text-orange-700 bg-orange-50"
                    : currentActivity.type === "交通"
                    ? "border-blue-200 text-blue-700 bg-blue-50"
                    : currentActivity.type === "購物"
                    ? "border-pink-200 text-pink-700 bg-pink-50"
                    : currentActivity.type === "景點"
                    ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                    : currentActivity.type === "住宿"
                    ? "border-purple-200 text-purple-700 bg-purple-50"
                    : "border-stone-200 text-stone-500 bg-stone-50"
                }`}
              >
                {currentActivity.type}
              </span>

              <span className="font-serif text-xl text-stone-600">
                {currentActivity.time}
              </span>
            </div>

            {/* Title */}

            <h2 className="text-2xl font-serif font-bold text-jp-text mb-2 leading-tight mt-2 pr-12">
              {currentActivity.title}
            </h2>

            <div className="flex items-center gap-2 text-sm text-stone-600 mb-8 font-serif">
              <MapPin size={14} />

              {currentActivity.address ||
                (currentActivity.nav.startsWith("http")
                  ? "查看地圖位置"
                  : currentActivity.nav)}
            </div>

            {/* Body Content */}

            <div className="space-y-8">
              {currentActivity.about && (
                <div>
                  <h3 className="font-bold text-jp-text mb-2 flex items-center gap-2 text-base font-serif">
                    <BookOpen size={14} />
                    關於此處
                  </h3>
                  <p className="text-jp-text leading-relaxed font-serif text-base opacity-90">
                    {currentActivity.about}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}

          <div className="sticky bottom-4 mt-12 pt-4 pb-4 px-8 safe-area-bottom">
            <button
              onClick={() => {
                const url = currentActivity.nav.startsWith("http")
                  ? currentActivity.nav
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      currentActivity.nav
                    )}`;

                window.open(url, "_blank");
              }}
              className="w-full liquid-glass-button text-stone-600 py-4 rounded-xl font-serif tracking-wide flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
              aria-label={`開啟 ${currentActivity.title} 的 Google Maps 導航`}
            >
              <Navigation size={16} />
              Google Maps 導航
            </button>

            <div className="h-4" />
          </div>
        </div>
      </div>
    </>
  );
};

// 6. Info Modal (Flight & Prep)
const InfoModal = ({ isOpen, onClose, initialScrollTarget }) => {
  useEffect(() => {
    if (isOpen && initialScrollTarget) {
      setTimeout(() => {
        const element = document.getElementById(initialScrollTarget);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300); // Slight delay to ensure modal is rendered
    }
  }, [isOpen, initialScrollTarget]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="glass-bottom-sheet min-h-[60vh] max-h-[79vh] flex flex-col relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉詳情"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto px-8 pb-10 space-y-8 flex-1 pt-8">
            <h2 className="text-2xl font-serif font-bold text-jp-text mb-2 pr-12">
              旅程資訊
            </h2>
            {/* 1. Flight Info */}
            <div>
              <h3 className="text-base font-bold text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plane size={18} /> 航班資訊
              </h3>
              <div className="space-y-4">
                {tripData.flight.map((flight, index) => {
                  const [departure, arrival] = flight.route.split(" -> ");
                  const [depTime, arrTime] = flight.time.split(" - ");
                  const airportNames = {
                    "TPE": "台北",
                    "NRT": "成田",
                    "HND": "羽田",
                    "HKD": "函館",
                    "CTS": "新千歲"
                  };
                  
                  return (
                    <div key={index} className="bg-white p-5 rounded-2xl border border-stone-100">
                      <div className="flex justify-between items-center mb-4 border-b border-stone-50 pb-2">
                        <span className="text-sm font-bold border border-blue-200 text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          {flight.date}
                        </span>
                        <span className="text-sm font-bold text-jp-green">
                          {flight.flightNo}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-serif font-bold text-jp-text">
                            {depTime}
                          </div>
                          <div className="text-sm text-stone-400 font-serif">
                            {departure} {airportNames[departure] || ""}
                          </div>
                        </div>
                        <div className="flex flex-col items-center text-stone-300">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full border border-stone-300" />
                            <div className="w-12 h-[1px] bg-stone-300" />
                            <Plane size={18} className="rotate-90 text-stone-400" />
                            <div className="w-12 h-[1px] bg-stone-300" />
                            <div className="w-3 h-3 rounded-full bg-stone-300" />
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-serif font-bold text-jp-text">
                            {arrTime}
                          </div>
                          <div className="text-sm text-stone-400 font-serif">
                            {arrival} {airportNames[arrival] || ""}
                          </div>
                        </div>
                      </div>
                      {flight.baggage && (
                        <div className="mt-4 pt-4 border-t border-stone-100">
                          <div className="flex items-start gap-2">
                            <Luggage size={16} className="text-stone-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                              {flight.baggage}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Preparation */}
            <div>
              <h3 className="text-base font-bold text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ClipboardList size={18} /> 行前準備
              </h3>
              <button
                onClick={() =>
                  window.open("https://vjw-lp.digital.go.jp/zh-hant/", "_blank")
                }
                className="w-full bg-[#6B9080] text-white p-6 rounded-2xl hover:brightness-105 transition-all text-left group relative overflow-hidden touch-manipulation min-h-[48px]"
                aria-label="開啟 Visit Japan Web 網站"
              >
                <div className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12">
                  <Plane size={100} />
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-serif font-bold mb-1">
                      Visit Japan Web
                    </h4>
                    <p className="text-sm opacity-80 font-serif tracking-wide">
                      入境日本必備・提前填寫申報
                    </p>
                  </div>
                  <ExternalLink
                    size={24}
                    className="opacity-80 group-hover:opacity-100"
                  />
                </div>
              </button>
            </div>

            {/* 2.5 Accommodation Info */}
            <div>
              <h3 className="text-base font-bold text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Hotel size={18} /> 住宿資訊
              </h3>
              <div className="space-y-6">
                {tripData.accommodation.map((accommodation, index) => (
                  <div key={index}>
                    {/* Region Title */}
                    <h4 className="text-sm font-bold text-stone-500 mb-3 pl-1">
                      {accommodation.region}
                    </h4>
                    {/* Accommodation Card */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-100 relative overflow-hidden">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className={`text-sm font-bold border px-2 py-1 rounded mb-3 inline-block ${
                            accommodation.type === "hotel" 
                              ? "border-purple-200 text-purple-700 bg-purple-50" 
                              : accommodation.type === "airbnb" 
                              ? "border-pink-200 text-pink-700 bg-pink-50" 
                              : "border-stone-200 text-stone-500 bg-stone-50"
                          }`}>
                            {accommodation.type === "hotel" ? "飯店" : accommodation.type === "airbnb" ? "Airbnb" : "住宿"}
                          </span>
                          <h5 className="font-serif font-bold text-jp-text text-xl leading-tight mb-2">
                            {accommodation.name}
                          </h5>
                          <p className="text-sm text-stone-500 font-serif mb-4">
                            {accommodation.address}
                          </p>

                          <div className="flex gap-6 mb-4 text-sm font-serif text-stone-600 bg-stone-50/50 p-3 rounded-lg border border-stone-100">
                            <div>
                              <span className="block text-sm text-stone-500 uppercase font-serif tracking-wider mb-1">
                                Check-in
                              </span>
                              <span className="text-sm text-stone-500 font-serif mb-4">
                                {accommodation.checkIn}
                              </span>
                            </div>
                            <div className="w-[1px] bg-stone-200"></div>
                            <div>
                              <span className="block text-sm text-stone-500 uppercase font-serif tracking-wider mb-1">
                                Check-out
                              </span>
                              <span className="text-sm text-stone-500 font-serif mb-4">
                                {accommodation.checkOut}
                              </span>
                            </div>
                          </div>

                          {accommodation.note && (
                            <p className="text-sm text-stone-600 mb-2 font-serif leading-relaxed">
                              {accommodation.note}
                            </p>
                          )}

                          {accommodation.mapUrl && (
                            <a
                              href={accommodation.mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full liquid-glass-button text-stone-600 py-3 rounded-xl font-serif tracking-wide flex items-center justify-center gap-2 mt-4 touch-manipulation min-h-[44px]"
                              aria-label="查看住宿位置"
                            >
                              <Navigation size={16} />
                              Google Maps 導航
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// 7. Checklist Modal
const ChecklistModal = ({ isOpen, onClose, checkedItems, onToggle }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="glass-bottom-sheet min-h-[60vh] max-h-[79vh] flex flex-col relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉詳情"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto px-8 pb-10 grid grid-cols-1 gap-6 flex-1 pt-8">
            <h2 className="text-2xl font-serif font-bold text-jp-text mb-2 pr-12">
              行李清單
            </h2>
            {Object.entries(checklistData).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-3 pb-1">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {items.map((item, idx) => {
                    const uniqueKey = `${category}-${item}`;
                    const isChecked = checkedItems[uniqueKey] || false;

                    return (
                      <li
                        key={uniqueKey}
                        className="flex items-center gap-3 group cursor-pointer touch-manipulation py-0.5"
                        onClick={() => onToggle(uniqueKey)}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onToggle(uniqueKey);
                          }
                        }}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                            isChecked
                              ? "bg-jp-green border-jp-green text-white"
                              : "border-stone-300 text-transparent hover:border-stone-400"
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span
                          className={`text-base font-serif transition-all leading-tight ${
                            isChecked
                              ? "text-stone-400 line-through"
                              : "text-jp-text"
                          }`}
                        >
                          {item}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// 8. Shopping Modal
const ShoppingModal = ({ isOpen, onClose, initialTab }) => {
  const [activeTab, setActiveTab] = useState("sapporo"); // sapporo or hakodate
  const [lastTap, setLastTap] = useState(0);
  const scrollContainerRef = React.useRef(null);

  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const handleToggleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const isAtBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 50;

    if (isAtBottom) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleTap = (tabId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleToggleScroll();
    } else {
      setActiveTab(tabId);
    }
    setLastTap(now);
  };

  const onTouchStart = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart.x || !touchEnd.x) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 75;

    // Only trigger if horizontal movement is significantly greater than vertical movement
    if (Math.abs(distanceX) > Math.abs(distanceY) * 2) {
      if (distanceX > minSwipeDistance && activeTab === "sapporo")
        setActiveTab("hakodate");
      if (distanceX < -minSwipeDistance && activeTab === "hakodate")
        setActiveTab("sapporo");
    }
  };

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const currentList = tripData.shopping[activeTab];

  // Reset scroll on tab change
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
  }, [activeTab]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="glass-bottom-sheet min-h-[60vh] max-h-[79vh] flex flex-col relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉詳情"
          >
            <X size={20} />
          </button>

          <div
            ref={scrollContainerRef}
            className="overflow-y-auto px-8 pb-32 space-y-4 pt-8"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <h2 className="text-2xl font-serif font-bold text-jp-text mb-4 pr-12">
              逛街清單
            </h2>

            {/* List */}
            {currentList.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-5 border border-stone-100"
              >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-50 text-pink-500 rounded-full">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-jp-text font-serif text-lg leading-none">
                        {item.name}
                      </h3>
                      {item.isBuilding && item.hours && (
                        <span className="text-xs text-stone-500 font-serif mt-1 flex items-center gap-1">
                          <Clock size={12} /> {item.hours}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Standalone Link */}
                  {!item.isBuilding && item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-jp-green hover:bg-green-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`查看 ${item.name} 的位置`}
                    >
                      <Navigation size={16} />
                    </a>
                  )}
                </div>

                {/* Sub-list for Buildings */}
                {item.isBuilding && item.shops && (
                  <div className="mt-4 space-y-3 pl-2 border-l-2 border-stone-100">
                    {item.shops.map((shop, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-bold text-sm text-stone-700">
                            {shop.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-stone-500 font-serif">
                            <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-medium">
                              {shop.floor}
                            </span>
                            {shop.hours && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {shop.hours}
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={shop.link}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-40 group-hover:opacity-100 group-hover:text-jp-green transition-all p-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={`查看 ${shop.name} 的位置`}
                        >
                          <Navigation size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Details for Standalone */}
                {!item.isBuilding && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-500 font-serif pl-11">
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-medium">
                      {item.floor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {item.hours}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Floating Tabs (Bottom) */}
          <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
            <div className="liquid-tab-track pointer-events-auto shadow-2xl">
              <button
                onClick={() => handleTap("sapporo")}
                className={`liquid-tab-btn px-8 ${
                  activeTab === "sapporo" ? "active" : ""
                }`}
                aria-label="札幌逛街清單"
                aria-pressed={activeTab === "sapporo"}
              >
                札幌
              </button>
              <button
                onClick={() => handleTap("hakodate")}
                className={`liquid-tab-btn px-8 ${
                  activeTab === "hakodate" ? "active" : ""
                }`}
                aria-label="函館逛街清單"
                aria-pressed={activeTab === "hakodate"}
              >
                函館
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// 9. Emergency Modal
const EmergencyModal = ({ isOpen, onClose }) => {
  const { emergency } = tripData;

  const getPhoneNumber = (number) => {
    // Remove spaces and format for tel: link
    return number.replace(/\s/g, "").replace(/-/g, "");
  };

  const getPhoneLabel = (name) => {
    const labels = {
      "Police": "警察",
      "Fire/Ambulance": "消防/救護車",
      "TECO Sapporo": "駐札幌辦事處",
    };
    return labels[name] || name;
  };

  const getPhoneIcon = (name) => {
    if (name === "Police") return <Shield size={28} className="text-red-600" />;
    if (name === "Fire/Ambulance")
      return <Flame size={28} className="text-red-600" />;
    if (name === "TECO Sapporo")
      return <Building2 size={28} className="text-red-600" />;
    return <Phone size={28} className="text-red-600" />;
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="glass-bottom-sheet min-h-[50vh] max-h-[79vh] flex flex-col relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉緊急聯絡"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="overflow-y-auto px-8 pb-10 pt-8 space-y-4">
            <div className="mb-4 pb-4 pr-12">
              <h2 className="text-2xl font-serif font-bold text-jp-text">
                緊急聯絡
              </h2>
            </div>
            <div className="bg-red-50/50 p-4 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="text-red-600 mt-0.5 shrink-0"
                />
                <div>
                  <h3 className="font-bold text-red-900 text-sm mb-1">
                    緊急情況處理
                  </h3>
                  <p className="text-xs text-red-700/80 leading-relaxed">
                    在日本遇到緊急情況時，請直接撥打對應的緊急電話。警察為
                    110，消防/救護車為
                    119。如需台灣駐日辦事處協助，可撥打駐福岡辦事處電話。
                  </p>
                </div>
              </div>
            </div>

            {emergency.map((contact, idx) => (
              <a
                key={idx}
                href={`tel:${getPhoneNumber(contact.number)}`}
                className="block bg-white rounded-xl p-5 border-2 border-stone-100 transition-all group active:scale-[0.98] touch-manipulation"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors flex-shrink-0">
                    {getPhoneIcon(contact.name)}
                  </div>
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <div>
                      <h3 className="font-serif font-bold text-jp-text text-lg mb-0.5">
                        {getPhoneLabel(contact.name)}
                      </h3>
                      <p className="text-sm text-stone-500 font-serif">
                        {contact.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-serif font-bold text-red-600 mb-0.5">
                        {contact.number}
                      </p>
                      <p className="text-xs text-stone-400 font-serif">
                        點擊撥號
                      </p>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors flex-shrink-0">
                    <Phone size={20} />
                  </div>
                </div>
              </a>
            ))}

            <div className="mt-6 pt-6">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 font-serif">
                其他重要資訊
              </h4>
              <div className="space-y-3">
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                  <p className="text-xs text-stone-600 leading-relaxed font-serif">
                    <strong className="text-stone-700">語言協助：</strong>
                    撥打緊急電話時，如果不會日語，可以說 "English, please" 或
                    "Taiwanese, please"，接線員會協助轉接。
                  </p>
                </div>
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                  <p className="text-xs text-stone-600 leading-relaxed font-serif">
                    <strong className="text-stone-700">位置資訊：</strong>
                    撥打緊急電話時，請盡可能提供詳細的位置資訊，例如：地址、附近的地標、或使用
                    Google Maps 分享位置。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// 彩蛋照片/影片列表：請將檔案放在 public/proposal-photos/
// 圖片：JPEG 或 WebP（勿用 HEIC）。影片：.mov 或 .mp4（.mov 在 Safari 支援佳，Chrome 建議 .mp4）。
const PROPOSAL_PHOTOS = [
  `${process.env.PUBLIC_URL || ''}/proposal-photos/1.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/2.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/3.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/4.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/5.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/6.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/7.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/8.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/9.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/10.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/11.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/12.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/13.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/14.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/15.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/16.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/17.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/18.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/19.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/20.MOV`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/21.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/22.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/23.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/24.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/25.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/26.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/27.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/28.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/29.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/30.JPG`,
  `${process.env.PUBLIC_URL || ''}/proposal-photos/31.JPG`,
  // 可加入影片：`${process.env.PUBLIC_URL || ''}/proposal-photos/VID_001.mov`
];

const isVideoUrl = (url) => /\.(mov|mp4|webm)(\?|$)/i.test(url || '');

// 10. Proposal Modal (彩蛋 - Instagram 限時動態風格)
const ProposalModal = ({ isOpen, onClose, heartPosition }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [visibleLayer, setVisibleLayer] = useState(0); // 0 或 1，哪一層正在顯示（雙層預載，下一則已在另一層載好）
  const [showTransition, setShowTransition] = useState(false);
  const [hasStartedTransition, setHasStartedTransition] = useState(false); // 追蹤是否已經開始過渡動畫
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState(null);
  const [heartLiked, setHeartLiked] = useState(false);
  const videoRef0 = React.useRef(null);
  const videoRef1 = React.useRef(null);

  const photos = PROPOSAL_PHOTOS;
  const PHOTO_DURATION = 6000; // 6秒
  const currentIsVideo = isVideoUrl(photos[currentPhotoIndex]);
  // 每層顯示的內容索引：當前層顯示 currentPhotoIndex，另一層顯示下一則（預載）
  const getLayerIndex = (layer) =>
    layer === visibleLayer ? currentPhotoIndex : Math.min(currentPhotoIndex + 1, photos.length - 1);
  const visibleVideoRef = visibleLayer === 0 ? videoRef0 : videoRef1;

  // 預載下一張與前一張（僅圖片；影片不預載）
  useEffect(() => {
    if (!isOpen || !photos.length) return;
    const preload = (index) => {
      if (index >= 0 && index < photos.length && !isVideoUrl(photos[index])) {
        const img = new Image();
        img.src = photos[index];
      }
    };
    preload(currentPhotoIndex + 1);
    preload(currentPhotoIndex - 1);
  }, [isOpen, currentPhotoIndex, photos]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPhotoIndex(0);
      setVisibleLayer(0);
      setProgress(0);
      setShowTransition(false); // 初始不顯示動畫
      setHasStartedTransition(false); // 重置過渡狀態
      setHeartLiked(false); // 每次打開彩蛋時愛心重置為未按
      
      // 如果 heartPosition 已設置（表示是從搖晃觸發的），等待搖晃完成後開始動畫
      if (heartPosition) {
        // 等待搖晃完成（1.2秒）後立即開始動畫
        const shakeTimer = setTimeout(() => {
          setShowTransition(true);
          setHasStartedTransition(true);
        }, 1200);
        
        // 過場動畫在開始後 2.5 秒開始淡入照片（與動畫時長一致）
        const transitionTimer = setTimeout(() => {
          setShowTransition(false);
        }, 3700); // 1.2秒搖晃 + 2.5秒動畫

        return () => {
          clearTimeout(shakeTimer);
          clearTimeout(transitionTimer);
        };
      } else {
        // 如果沒有 heartPosition，立即開始（備用方案）
        setShowTransition(true);
        setHasStartedTransition(true);
        const transitionTimer = setTimeout(() => {
          setShowTransition(false);
        }, 2500);

        return () => {
          clearTimeout(transitionTimer);
        };
      }
    } else {
      // 關閉時重置
      setShowTransition(false);
      setHasStartedTransition(false);
    }
  }, [isOpen, heartPosition]);

  // 自動播放和進度條（僅圖片；影片由 video 的 onTimeUpdate / onEnded 驅動）
  useEffect(() => {
    if (!isOpen || showTransition || currentIsVideo) return;

    if (isPaused) return;

    const startTime = Date.now() - elapsedBeforePause;
    
    const interval = setInterval(() => {
      if (isPaused) return;
      
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / PHOTO_DURATION) * 100;
      
      if (newProgress >= 100) {
        if (currentPhotoIndex < photos.length - 1) {
          setVisibleLayer((v) => 1 - v);
          setCurrentPhotoIndex((prevIndex) => prevIndex + 1);
          setElapsedBeforePause(0);
        } else {
          setProgress(100);
        }
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, currentPhotoIndex, showTransition, isPaused, elapsedBeforePause, photos.length, currentIsVideo]);

  // 當照片/影片切換時，重置已過時間
  useEffect(() => {
    if (!isOpen || showTransition) return;
    setElapsedBeforePause(0);
    setProgress(0);
  }, [currentPhotoIndex, isOpen, showTransition]);

  // 影片：只播放可見層、暫停另一層；長按暫停/放開播放
  useEffect(() => {
    const otherRef = visibleLayer === 0 ? videoRef1 : videoRef0;
    otherRef.current?.pause();
    const v = visibleVideoRef.current;
    if (!currentIsVideo || !v) return;
    if (isPaused) v.pause();
    else v.play().catch(() => {});
  }, [currentIsVideo, isPaused, visibleLayer]);

  // 影片進度條：每 50ms 輪詢，只讀取目前可見層的 video
  useEffect(() => {
    if (!isOpen || showTransition || !currentIsVideo || isPaused) return;
    const interval = setInterval(() => {
      const v = visibleVideoRef.current;
      if (!v || !v.duration || !isFinite(v.duration)) return;
      const p = (v.currentTime / v.duration) * 100;
      setProgress(p);
    }, 50);
    return () => clearInterval(interval);
  }, [isOpen, showTransition, currentIsVideo, isPaused, currentPhotoIndex, visibleLayer]);

  const handlePhotoClick = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return;

    // 如果是長按後鬆開（有暫停記錄），不處理點擊切換
    if (pauseStartTime && Date.now() - pauseStartTime > 200) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;

    // 只處理左右點擊
    if (isLeftHalf) {
      // 點擊左半邊，上一張
      if (currentPhotoIndex > 0) {
        setVisibleLayer((v) => 1 - v);
        setCurrentPhotoIndex(currentPhotoIndex - 1);
        setProgress(0); // 重置進度
        setElapsedBeforePause(0);
      }
    } else {
      // 點擊右半邊，下一張（翻到已預載的層，無載入延遲）
      if (currentPhotoIndex < photos.length - 1) {
        setVisibleLayer((v) => 1 - v);
        setCurrentPhotoIndex(currentPhotoIndex + 1);
        setProgress(0); // 重置進度
        setElapsedBeforePause(0);
      } else {
        // 最後一張後保持顯示
        setProgress(100);
      }
    }
  };

  // 處理觸摸/點擊暫停
  const handleTouchStart = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return;
    
    const currentProgress = progress;
    const currentElapsed = (currentProgress / 100) * PHOTO_DURATION;
    setElapsedBeforePause(currentElapsed);
    setIsPaused(true);
    setPauseStartTime(Date.now());
  };

  const handleTouchEnd = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return;
    
    const pauseDuration = pauseStartTime ? Date.now() - pauseStartTime : 0;
    setPauseStartTime(null);
    
    // 如果暫停時間很短（< 200ms），視為點擊，不恢復進度條
    if (pauseDuration < 200) {
      setIsPaused(false);
      return;
    }
    
    // 恢復進度條
    setIsPaused(false);
  };

  // 處理滑鼠按下/放開暫停（桌面端）
  const handleMouseDown = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return;
    
    const currentProgress = progress;
    const currentElapsed = (currentProgress / 100) * PHOTO_DURATION;
    setElapsedBeforePause(currentElapsed);
    setIsPaused(true);
    setPauseStartTime(Date.now());
  };

  const handleMouseUp = (e) => {
    // 如果點擊到按鈕，不處理
    if (e.target.closest('button')) return;
    
    const pauseDuration = pauseStartTime ? Date.now() - pauseStartTime : 0;
    setPauseStartTime(null);
    
    // 如果暫停時間很短（< 200ms），視為點擊，不恢復進度條
    if (pauseDuration < 200) {
      setIsPaused(false);
      return;
    }
    
    // 恢復進度條
    setIsPaused(false);
  };


  if (!isOpen) return null;

  // 如果沒有 heartPosition，使用螢幕中心作為 fallback
  const displayPosition = heartPosition || { 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  };

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
              const idx = getLayerIndex(layer);
              const isVisible = visibleLayer === layer;
              const isVideo = isVideoUrl(photos[idx]);
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
                          setVisibleLayer((v) => 1 - v);
                          setCurrentPhotoIndex((i) => i + 1);
                          setProgress(0);
                        } else {
                          setProgress(100);
                        }
                      }}
                      onError={(e) => {
                        console.error("Failed to load video:", photos[idx]);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <img
                      src={photos[idx]}
                      alt={`${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      draggable="false"
                      onError={(e) => {
                        console.error("Failed to load image:", photos[idx]);
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              );
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
                  src={`${process.env.PUBLIC_URL || ''}/proposal-photos/gokigen_panda.png`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white font-sans font-semibold text-sm leading-[44px]">
                zacharyzhuoyc
              </span>
            </div>

            {/* 右上角：叉叉 */}
            <div className="absolute top-4 right-4 z-20 flex items-center h-[44px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
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
              <span className="text-white/80 text-sm font-sans">傳送訊息......</span>
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
  );
};

// 11. Food Modal
const FoodModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("sapporo"); // sapporo or hakodate
  const [lastTap, setLastTap] = useState(0);
  const scrollContainerRef = React.useRef(null);

  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const tabs = ["sapporo", "hakodate"];

  const handleToggleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const isAtBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 50;

    if (isAtBottom) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleTap = (tabId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleToggleScroll();
    } else {
      setActiveTab(tabId);
    }
    setLastTap(now);
  };

  const onTouchStart = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart.x || !touchEnd.x) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 75;

    // Only trigger if horizontal movement is significantly greater than vertical movement
    if (Math.abs(distanceX) > Math.abs(distanceY) * 2) {
      const currentIndex = tabs.indexOf(activeTab);
      if (distanceX > minSwipeDistance && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
      if (distanceX < -minSwipeDistance && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
  };

  const currentCategories = tripData.food[activeTab];

  // Reset scroll on tab change
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0 });
    }
  }, [activeTab]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="glass-bottom-sheet min-h-[60vh] max-h-[79vh] flex flex-col relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉詳情"
          >
            <X size={20} />
          </button>

          <div
            ref={scrollContainerRef}
            className="overflow-y-auto px-8 pb-32 space-y-6 pt-8"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <h2 className="text-2xl font-serif font-bold text-jp-text mb-4 pr-12">
              美食清單
            </h2>

            {/* List by Category */}
            <div className="space-y-8">
              {currentCategories.map((cat, cIdx) => (
                <div key={cIdx}>
                  <h3 className="text-xs font-bold text-stone-600 uppercase tracking-widest mb-4 pb-2">
                    {cat.category}
                  </h3>
                  <div className="space-y-4">
                    {cat.shops.map((shop, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white rounded-xl p-5 border border-stone-100 group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-jp-text font-serif text-lg leading-tight">
                              {shop.name}
                            </h4>
                            {shop.hours && (
                              <span className="text-xs text-stone-500 font-serif mt-1 flex items-center gap-1">
                                <Clock size={12} /> {shop.hours}
                              </span>
                            )}
                          </div>
                          <a
                            href={shop.link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-jp-green hover:bg-green-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label={`查看 ${shop.name} 的位置`}
                          >
                            <Navigation size={16} />
                          </a>
                        </div>
                        <p className="text-sm text-stone-500 leading-relaxed font-serif">
                          {shop.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Tabs (Bottom) */}
          <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
            <div className="liquid-tab-track pointer-events-auto shadow-2xl">
              {[
                { id: "sapporo", label: "札幌" },
                { id: "hakodate", label: "函館" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTap(tab.id)}
                  className={`liquid-tab-btn px-8 ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  aria-label={`${tab.label}美食清單`}
                  aria-pressed={activeTab === tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function App() {
  const [activeDay, setActiveDay] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Reset scroll on day change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeDay]);

  // Monitor service worker updates
  useEffect(() => {
    const handleUpdate = () => {
      console.log("swUpdated event received in App.js");
      setShowUpdatePrompt(true);
    };

    window.addEventListener("swUpdated", handleUpdate);
    return () => window.removeEventListener("swUpdated", handleUpdate);
  }, []);

  // Handle manual update
  const handleUpdateClick = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        } else {
          // If no waiting worker, just reload
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle PWA install prompt
  useEffect(() => {
    // 檢查是否已經安裝過
    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");

    if (isInstalled) {
      return; // 已安裝，不需要監聽
    }

    const handleBeforeInstallPrompt = (e) => {
      console.log("beforeinstallprompt event fired");
      // 阻止預設的安裝提示
      e.preventDefault();
      // 保存事件以便稍後使用
      setDeferredPrompt(e);

      // 延遲顯示安裝提示，給用戶時間瀏覽網站
      // Chrome 通常需要用戶與網站互動至少 30 秒後才會顯示
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000); // 增加到 5 秒
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 如果事件已經觸發但我們錯過了，檢查是否可以直接顯示
    // 這在某些情況下可能發生
    const checkInstallability = () => {
      // 檢查 manifest 是否存在
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        fetch(manifestLink.href)
          .then((res) => res.json())
          .then((manifest) => {
            console.log("Manifest loaded:", manifest);
            // 如果 manifest 有效，但沒有觸發 beforeinstallprompt
            // 可能是因為其他條件不滿足（如用戶互動時間不足）
          })
          .catch((err) => {
            console.error("Failed to load manifest:", err);
          });
      }
    };

    // 延遲檢查，確保頁面完全載入
    setTimeout(checkInstallability, 2000);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // Handle install button click
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn("No deferred prompt available");
      // 如果沒有 deferredPrompt，可能是因為：
      // 1. 已經安裝過
      // 2. 瀏覽器不支援
      // 3. 不滿足安裝條件
      alert(
        "無法顯示安裝提示。請確認：\n1. 使用 Chrome/Edge 瀏覽器\n2. 網站已通過 HTTPS 訪問\n3. 已訪問網站至少 30 秒"
      );
      return;
    }

    try {
      // 顯示安裝提示
      deferredPrompt.prompt();

      // 等待用戶回應
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        setShowInstallPrompt(false);
      } else {
        console.log("User dismissed the install prompt");
      }
    } catch (error) {
      console.error("Error showing install prompt:", error);
    }

    // 清除保存的提示（無論結果如何）
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // Debug: 檢查 PWA 安裝條件（僅在開發環境）
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("=== PWA 安裝條件檢查 ===");
      console.log("Service Worker 支援:", "serviceWorker" in navigator);
      console.log("HTTPS:", window.location.protocol === "https:");
      console.log(
        "Manifest:",
        document.querySelector('link[rel="manifest"]')?.href
      );
      console.log(
        "已安裝:",
        window.matchMedia("(display-mode: standalone)").matches
      );
      console.log("Deferred Prompt:", !!deferredPrompt);
    }
  }, [deferredPrompt]);

  // Swipe logic for days
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const minSwipeDistance = 100;

  const onTouchStart = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart.x || !touchEnd.x) return;

    // Don't swipe background if a modal is open
    const isAnyModalOpen =
      selectedActivity ||
      isSidebarOpen ||
      showInfo ||
      showChecklist ||
      showShopping ||
      showFood ||
      showEmergency;
    if (isAnyModalOpen) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;

    // Only trigger if horizontal movement is significantly greater than vertical movement
    if (Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      if (isLeftSwipe && activeDay < tripData.itinerary.length) {
        setActiveDay((prev) => prev + 1);
      }
      if (isRightSwipe && activeDay > 1) {
        setActiveDay((prev) => prev - 1);
      }
    }
  };

  // Modal States
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [infoScrollTarget, setInfoScrollTarget] = useState(null);

  // Proposal Easter Egg - Day 4 Click Counter
  const [day4ClickCount, setDay4ClickCount] = useState(0);
  const [lastDay4ClickTime, setLastDay4ClickTime] = useState(0);
  const [isDay4Activated, setIsDay4Activated] = useState(false);
  const [heartPosition, setHeartPosition] = useState(null);

  const handleDay4Click = () => {
    // 如果還沒有選中週三04，先選中它並重置計數器
    if (activeDay !== 4) {
      setActiveDay(4);
      setDay4ClickCount(0);
      setLastDay4ClickTime(0);
      return; // 不計算點擊次數，只選中日期
    }

    // 只有當 activeDay === 4 時才開始計算點擊次數
    const now = Date.now();
    // 如果距離上次點擊超過 2 秒，重置計數
    if (now - lastDay4ClickTime > 2000) {
      setDay4ClickCount(1);
    } else {
      setDay4ClickCount((prev) => prev + 1);
    }
    setLastDay4ClickTime(now);

    // 點擊 9 次後觸發彩蛋模態框
    if (day4ClickCount + 1 >= 9) {
      setIsDay4Activated(true);
      setDay4ClickCount(0);
      
      // 獲取週三04按鈕的位置
      const day4Button = document.querySelector('[data-day="4"]');
      if (day4Button) {
        const rect = day4Button.getBoundingClientRect();
        setHeartPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
      
      // 立即打開模態框（但保持透明），讓它在搖晃期間就準備好
      setShowProposal(true);
    }
  };

  // Load checked items from localStorage
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("tokyo-hokkaido-checklist");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Failed to load checklist from localStorage:", error);
      return {};
    }
  });

  // Save checked items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("tokyo-hokkaido-checklist", JSON.stringify(checkedItems));
    } catch (error) {
      console.error("Failed to save checklist to localStorage:", error);
    }
  }, [checkedItems]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    const isAnyModalOpen =
      selectedActivity ||
      isSidebarOpen ||
      showInfo ||
      showChecklist ||
      showShopping ||
      showFood ||
      showEmergency;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    selectedActivity,
    isSidebarOpen,
    showInfo,
    showChecklist,
    showShopping,
    showFood,
    showEmergency,
  ]);

  const currentDayData =
    tripData.itinerary.find((d) => d.day === activeDay) ||
    tripData.itinerary[0] ||
    {
      day: 1,
      date: "03/01 (週日)",
      title: "行程規劃中",
      location: "北海道",
      weather: "",
      image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80",
      activities: []
    };

  const handleChecklistToggle = (key) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSidebarSelect = (menu) => {
    setSidebarOpen(false);
    setTimeout(() => {
      // Small delay for smooth transition
      if (menu === "info") setShowInfo(true);
      if (menu === "checklist") setShowChecklist(true);
      if (menu === "shopping") setShowShopping(true);
      if (menu === "food") setShowFood(true);
      if (menu === "emergency") setShowEmergency(true);
    }, 200);
  };

  return (
    <div
      className="min-h-screen bg-jp-bg text-jp-text font-serif pb-12 safe-area-inset"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
       {/* Offline Indicator */}
       {!isOnline && (
         <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 text-sm z-50 safe-area-inset">
           目前處於離線狀態（部分功能可能受限）
         </div>
       )}

       {/* New Version Update Prompt */}
       {showUpdatePrompt && (
        <div className="fixed top-4 left-4 right-4 bg-jp-red text-white p-4 rounded-xl z-[60] flex items-center justify-between gap-4 animate-slide-up">
           <div className="flex items-center gap-3">
             <AlertCircle size={20} />
             <div>
               <p className="font-bold text-sm leading-tight">發現新版本</p>
               <p className="text-[10px] opacity-90">點擊更新以套用最新行程</p>
             </div>
           </div>
           <button
             onClick={handleUpdateClick}
              className="bg-white text-jp-red px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all min-h-[36px]"
           >
             立即更新
           </button>
         </div>
       )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-jp-green text-white p-4 rounded-xl shadow-2xl z-50 safe-area-bottom max-w-md mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-serif font-bold text-lg mb-1">
                安裝到主畫面
              </h3>
              <p className="text-sm opacity-90 font-serif">
                將此應用安裝到手機主畫面，可離線使用並快速開啟
              </p>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="p-1 liquid-glass-button-dark rounded-full text-white/80 hover:text-white transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-jp-green py-2.5 rounded-lg font-serif font-bold text-sm hover:bg-stone-50 transition-colors touch-manipulation min-h-[44px]"
            >
              安裝
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="px-4 py-2.5 text-white/80 hover:text-white transition-colors touch-manipulation text-sm font-serif min-h-[44px]"
            >
              稍後
            </button>
          </div>
        </div>
      )}

      {/* 1. Header with Sidebar Toggle */}
      <div
        className={`relative pt-8 pb-4 px-6 flex items-center justify-between ${
          !isOnline ? "mt-8" : ""
        }`}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 text-stone-400 hover:text-jp-text transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="開啟選單"
        >
          <Menu size={24} />
        </button>

        <div className="flex flex-col items-center flex-1 px-4">
          {/* 日期 */}
          <p className="text-[11px] tracking-[0.3em] uppercase text-stone-400 mb-2 font-serif font-medium">
            2026/03
          </p>
          {/* 英文標題 */}
          <p className="text-xs tracking-[0.15em] uppercase text-stone-400 mb-3 font-serif font-medium">
            Tokyo & Hokkaido Trip
          </p>
          {/* 日文標題 */}
          <h1 className="text-2xl font-bold tracking-[0.1em] text-jp-text leading-tight">
            東京&北海道旅行
          </h1>
        </div>

        {/* Placeholder for balance, or could keep quick flight info if user wants, but request said move all to sidebar */}
        <div className="w-10"></div>
      </div>

      {/* 2. Date Selector */}
      <DateStrip
        days={tripData.itinerary}
        activeDay={activeDay}
        onSelect={setActiveDay}
        onDay4Click={handleDay4Click}
        day4ClickCount={day4ClickCount}
        isDay4Activated={isDay4Activated}
      />

      {/* 3. Hero Image for the Day */}
      <HeroSection
        location={currentDayData.location}
        title={currentDayData.title}
        image={currentDayData.image}
      />

      <div className="h-8" />

      {/* 4. Timeline List */}
      <div className="mt-2">
        {currentDayData.activities.map((act, idx) => (
          <ActivityItem
            key={idx}
            activity={act}
            isLast={idx === currentDayData.activities.length - 1}
            onOpen={setSelectedActivity}
          />
        ))}
      </div>

      {/* Modals */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={handleSidebarSelect}
      />

      <DetailModal
        isOpen={!!selectedActivity}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />

      <InfoModal
        isOpen={showInfo}
        onClose={() => {
          setShowInfo(false);
          setInfoScrollTarget(null);
        }}
        initialScrollTarget={infoScrollTarget}
      />

      <ChecklistModal
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
        checkedItems={checkedItems}
        onToggle={handleChecklistToggle}
      />

      <ShoppingModal
        isOpen={showShopping}
        onClose={() => setShowShopping(false)}
        initialTab="sapporo"
      />

      <FoodModal isOpen={showFood} onClose={() => setShowFood(false)} />

      <EmergencyModal
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
      />

      <ProposalModal
        isOpen={showProposal}
        onClose={() => {
          setShowProposal(false);
          setDay4ClickCount(0);
          setIsDay4Activated(false);
          setHeartPosition(null);
        }}
        heartPosition={heartPosition}
      />
    </div>
  );
}

export default App;
