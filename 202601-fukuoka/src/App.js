import React, { useState, useEffect } from "react";
import { tripData } from "./data";
import {
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  X,
  Plane,
  Hotel,
  Coffee,
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
  Bath,
  BookOpen,
  Phone,
  PhoneCall,
  Shield,
  Flame,
  Building2,
} from "lucide-react";

// --- DATA ---
const checklistData = {
  Money: ["外幣", "護照", "信用卡", "鑰匙"],
  Clothes: ["4 套衣服", "內衣/內褲/襪子", "外套", "帽子/圍巾/手套", "睡衣"],
  Appliances: ["esim or sim card", "耳機", "行動電源", "充電器", "自拍桿"],
  Toiletries: [
    "化妝品",
    "防曬",
    "暖暖包",
    "洗面乳",
    "飾品（項鍊/耳環/戒指）",
    "保養品",
    "口罩",
  ],
  Health: ["定期需要吃的藥"],
  Others: ["梳子", "衛生紙＆濕紙巾", "雨傘", "酒精噴霧"],
};

// --- COMPONENTS ---

// 1. Sidebar (Drawer)
const Sidebar = ({ isOpen, onClose, onSelect }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-[#FDFBF9] shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white/50">
          <h2 className="text-xl font-serif font-bold text-jp-text">
            Trip Menu
          </h2>
          <button
            onClick={onClose}
            className="p-3 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉選單"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-2 px-4">
            <button
              onClick={() => onSelect("info")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-stone-100 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Info size={20} />
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">
                  旅程資訊
                </span>
                <span className="block text-xs text-stone-400 font-sans tracking-wide">
                  Flight & Info
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelect("checklist")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-stone-100 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <ClipboardList size={22} />
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">
                  行李清單
                </span>
                <span className="block text-xs text-stone-400 font-sans tracking-wide">
                  Packing List
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelect("shopping")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-stone-100 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                <ShoppingBag size={22} />
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">
                  逛街清單
                </span>
                <span className="block text-xs text-stone-400 font-sans tracking-wide">
                  Shopping Map
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelect("food")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-stone-100 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Utensils size={22} />
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">
                  美食清單
                </span>
                <span className="block text-xs text-stone-400 font-sans tracking-wide">
                  Food List
                </span>
              </div>
            </button>

            <button
              onClick={() => onSelect("emergency")}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 transition-all text-left group border-2 border-red-100"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <PhoneCall size={22} />
              </div>
              <div>
                <span className="block font-serif font-bold text-red-700 text-base">
                  緊急聯絡
                </span>
                <span className="block text-xs text-red-400 font-sans tracking-wide">
                  Emergency
                </span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-stone-100 bg-stone-50">
          <p className="text-xs text-stone-400 text-center font-sans tracking-widest uppercase">
            Family Trip 2026
          </p>
        </div>
      </div>
    </>
  );
};

// 2. Date Strip (Top Calendar)
const DateStrip = ({ days, activeDay, onSelect }) => {
  const [lastTap, setLastTap] = useState(0);

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

  const handleTap = (dayId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleToggleScroll();
    } else {
      onSelect(dayId);
    }
    setLastTap(now);
  };

  return (
    <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200/50 bg-jp-bg sticky top-0 z-10">
      {days.map((day) => {
        const dayNum = day.date.split("/")[1].split(" ")[0];
        const weekDay = day.date.match(/\((.*?)\)/)?.[1] || "週";
        const isActive = activeDay === day.day;

        return (
          <button
            key={day.day}
            onClick={() => handleTap(day.day)}
            className="flex flex-col items-center gap-1 min-w-[3rem] min-h-[44px] justify-center touch-manipulation px-2"
            aria-label={`選擇第 ${day.day} 天`}
          >
            <span
              className={`text-xs tracking-widest uppercase font-sans ${
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
          </button>
        );
      })}
    </div>
  );
};

// 3. Hero Section (Image + Title)
const HeroSection = ({ location, title, image }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative mx-4 mt-4 rounded-xl overflow-hidden shadow-lg h-48 group">
      <div className="absolute inset-0 bg-gradient-to-br from-stone-600 to-stone-800 mix-blend-multiply" />
      {!imageError ? (
        <img
          src={image}
          alt={location}
          className={`absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-300 ${
            imageLoaded ? "opacity-60" : "opacity-0"
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

      <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center">
        <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase opacity-80 mb-2 font-sans">
          <span className="w-6 h-[1px] bg-white"></span>
          <span>今日行程</span>
          <span className="w-6 h-[1px] bg-white"></span>
        </div>
        <h2 className="text-2xl font-serif font-bold tracking-wide mb-1 shadow-black drop-shadow-md">
          {title}
        </h2>
        <p className="text-xs font-sans opacity-90 tracking-widest">
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
        <span className="text-xl font-serif font-bold text-jp-text leading-none">
          {activity.time}
        </span>
        {!isLast && <div className="w-[1px] bg-stone-200 flex-1 my-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-stone-100 active:scale-[0.98] transition-transform duration-200 h-full flex flex-col touch-manipulation">
          <div className="flex justify-between items-start mb-2">
            <span
              className={`text-xs tracking-wider uppercase px-2 py-0.5 rounded border font-sans font-bold ${
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
          <p className="text-sm text-jp-sub line-clamp-3 font-sans mb-2 leading-relaxed opacity-80">
            {activity.desc}
          </p>

          {activity.hours && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-sans mb-3 bg-stone-50 w-fit px-2 py-1 rounded">
              <Clock size={12} />
              <span>{activity.hours}</span>
            </div>
          )}

          {activity.subItems && (
            <div className="mt-3 space-y-2 border-t border-stone-100 pt-2 mb-3">
              {activity.subItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-0.5 text-sm font-sans"
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

          <div className="flex items-center gap-2 text-xs text-stone-400 font-sans mt-auto pt-2">
            {getIcon(activity.type)}
            <span className="truncate opacity-70 flex-1">
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

const DetailModal = ({
  isOpen,
  activity,
  onClose,
  onOpenShopping,
  onOpenInfo,
}) => {
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
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-[#FDFBF9] rounded-t-[2rem] shadow-2xl min-h-[60vh] max-h-[90vh] flex flex-col relative">
          {/* Header (Sticky) */}

          <div className="flex justify-between items-start p-8 pb-4 sticky top-0 bg-[#FDFBF9]/95 backdrop-blur-sm z-10 rounded-t-[2rem] border-b border-stone-100/50">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 border text-xs tracking-widest font-bold font-sans uppercase rounded ${
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

              <span className="font-serif text-xl text-stone-400">
                {currentActivity.time}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-3 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉詳情"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}

          <div className="overflow-y-auto px-8 pb-10">
            {/* Title */}

            <h2 className="text-3xl font-serif font-bold text-jp-text mb-2 leading-tight mt-2">
              {currentActivity.title}
            </h2>

            <div className="flex items-center gap-2 text-base text-stone-500 mb-8 font-sans">
              <MapPin size={14} />

              {currentActivity.address ||
                (currentActivity.nav.startsWith("http")
                  ? "查看地圖位置"
                  : currentActivity.nav)}
            </div>

            {/* Body Content */}

            <div className="space-y-8">
              <div className="relative pl-6 border-l border-stone-200">
                <p className="text-jp-text leading-relaxed font-serif text-base opacity-90">
                  {currentActivity.desc}
                </p>
              </div>

              {currentActivity.about && (
                <div className="bg-[#F8F6F4] p-5 rounded-xl border border-stone-100">
                  <h3 className="font-bold text-stone-500 mb-2 flex items-center gap-2 text-xs uppercase tracking-widest font-sans">
                    <BookOpen size={14} />
                    關於此處
                  </h3>

                  <p className="text-base text-stone-600 leading-relaxed font-sans text-justify">
                    {currentActivity.about}
                  </p>
                </div>
              )}

              {/* Surroundings Link Block */}
              {currentActivity.hasSurroundingsLink && (
                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl mb-8">
                  <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <Hotel size={16} /> 民宿周邊推薦
                  </h4>
                  <p className="text-xs text-blue-600/80 mb-3 font-sans leading-relaxed">
                    回到民宿休息時，不妨去附近的溫泉放鬆，或是到超市採買宵夜。
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenInfo("surroundings-section");
                    }}
                    className="w-full bg-white text-blue-600 text-xs font-bold py-3 rounded-lg border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                    aria-label="查看民宿周邊推薦詳細資訊"
                  >
                    查看詳細資訊 (溫泉/LOPIA) <ChevronRight size={12} />
                  </button>
                </div>
              )}

              {/* Special Action Link: Shopping List */}

              {currentActivity.showShoppingLink && (
                <button
                  onClick={() => {
                    onClose();

                    onOpenShopping(currentActivity.shoppingTab || "tenjin");
                  }}
                  className="w-full flex items-center justify-between p-4 bg-pink-50 border border-pink-100 rounded-xl group active:scale-[0.98] transition-all touch-manipulation min-h-[48px]"
                  aria-label="查看逛街清單"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full text-pink-500 shadow-sm">
                      <ShoppingBag size={18} />
                    </div>

                    <span className="font-bold text-pink-700 text-base">
                      {currentActivity.shoppingText || "查看天神逛街清單"}
                    </span>
                  </div>

                  <ChevronRight
                    size={16}
                    className="text-pink-300 group-hover:translate-x-1 transition-transform"
                  />
                </button>
              )}

              {currentActivity.highlight && (
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-100/50">
                  <h3 className="font-bold text-jp-text mb-3 flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-jp-red rounded-full"></span>
                    行程重點
                  </h3>

                  <p className="text-base text-stone-600 leading-relaxed font-sans">
                    {currentActivity.highlight}
                  </p>
                </div>
              )}

              {currentActivity.tips && (
                <div>
                  <h3 className="text-xs font-bold text-stone-400 mb-3 uppercase tracking-[0.2em] font-sans border-b border-stone-100 pb-2">
                    Traveler Tips / 旅人攻略
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {currentActivity.tips.map((tip) => (
                      <span
                        key={tip}
                        className="px-4 py-2 bg-white border border-stone-200 rounded-full text-xs text-stone-600 shadow-sm font-sans"
                      >
                        {tip}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}

          <div className="sticky bottom-4 mt-12 pt-4 pb-4 px-8 bg-gradient-to-t from-[#FDFBF9] via-[#FDFBF9] to-transparent safe-area-bottom">
            <button
              onClick={() => {
                const url = currentActivity.nav.startsWith("http")
                  ? currentActivity.nav
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      currentActivity.nav
                    )}`;

                window.open(url, "_blank");
              }}
              className="w-full bg-jp-green text-white py-4 rounded-lg font-serif font-medium tracking-wide flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-jp-green/20 touch-manipulation min-h-[48px]"
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
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-[#FDFBF9] rounded-t-[2rem] shadow-2xl min-h-[60vh] max-h-[90vh] flex flex-col relative">
          {/* Header (Sticky) */}
          <div className="flex justify-between items-center p-8 pb-4 sticky top-0 bg-[#FDFBF9]/95 backdrop-blur-sm z-10 rounded-t-[2rem] border-b border-stone-100/50">
            <h2 className="text-2xl font-serif font-bold text-jp-text">
              旅程資訊
            </h2>
            <button
              onClick={onClose}
              className="p-3 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉詳情"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto px-8 pb-10 space-y-8">
            {/* 1. Flight Info */}
            <div>
              <h3 className="text-base font-bold text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plane size={18} /> 航班資訊
              </h3>
              <div className="space-y-4">
                {/* Outbound */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                  <div className="flex justify-between items-center mb-4 border-b border-stone-50 pb-2">
                    <span className="text-sm font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded">
                      去程 01/10
                    </span>
                    <span className="text-sm font-bold text-jp-green">
                      AirAsia AK 1510
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-2xl font-serif font-bold text-jp-text">
                        12:40
                      </div>
                      <div className="text-sm text-stone-400 font-sans">
                        TPE 台北
                      </div>
                    </div>
                    <div className="flex flex-col items-center text-stone-300">
                      <span className="text-sm mb-1">3h 20m</span>
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
                        16:00
                      </div>
                      <div className="text-sm text-stone-400 font-sans">
                        FUK 福岡
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inbound */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                  <div className="flex justify-between items-center mb-4 border-b border-stone-50 pb-2">
                    <span className="text-sm font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded">
                      回程 01/14
                    </span>
                    <span className="text-sm font-bold text-jp-green">
                      AirAsia AK 1511
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-2xl font-serif font-bold text-jp-text">
                        16:55
                      </div>
                      <div className="text-sm text-stone-400 font-sans">
                        FUK 福岡
                      </div>
                    </div>
                    <div className="flex flex-col items-center text-stone-300">
                      <span className="text-sm mb-1">2h 35m</span>
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
                        18:30
                      </div>
                      <div className="text-sm text-stone-400 font-sans">
                        TPE 台北
                      </div>
                    </div>
                  </div>
                </div>
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
                className="w-full bg-[#6B9080] text-white p-6 rounded-2xl shadow-md hover:brightness-105 transition-all text-left group relative overflow-hidden touch-manipulation min-h-[48px]"
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
                    <p className="text-sm opacity-80 font-sans tracking-wide">
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
              <div className="space-y-5">
                {/* Airbnb */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded mb-3 inline-block">
                        Airbnb
                      </span>
                      <h4 className="font-serif font-bold text-jp-text text-xl leading-tight mb-2">
                        Flower Base Sakura
                      </h4>
                      <p className="text-base text-stone-500 font-sans mb-4">
                        博多駅南 (Near Hakata Station)
                      </p>

                      <div className="flex gap-6 mb-4 text-sm font-sans text-stone-600 bg-stone-50/50 p-3 rounded-lg border border-stone-100">
                        <div>
                          <span className="block text-sm text-stone-400 uppercase tracking-wider font-bold mb-1">
                            Check-in
                          </span>
                          <span className="font-bold text-jp-text text-sm">
                            01/10 15:00
                          </span>
                        </div>
                        <div className="w-[1px] bg-stone-200"></div>
                        <div>
                          <span className="block text-sm text-stone-400 uppercase tracking-wider font-bold mb-1">
                            Check-out
                          </span>
                          <span className="font-bold text-jp-text text-sm">
                            01/14 10:00
                          </span>
                        </div>
                      </div>

                      <a
                        href="https://maps.app.goo.gl/vEDXtXCyJSVLbwP5A"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-jp-green font-bold flex items-center gap-1 hover:underline mt-auto pl-1 py-2 touch-manipulation min-h-[44px]"
                        aria-label="查看民宿位置"
                      >
                        查看位置 <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Surroundings */}
                <div id="surroundings-section">
                  <h4 className="text-sm font-bold text-stone-400 mb-3 pl-1">
                    周邊推薦
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Onsen */}
                    <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-white text-blue-500 rounded-full shadow-sm">
                          <Bath size={18} />
                        </div>
                        <span className="text-base font-bold text-blue-800">
                          八百治博多ホテル 八百治の湯
                        </span>
                      </div>
                      <div className="text-sm text-stone-600 space-y-1.5 mb-3 font-sans pl-1">
                        <p>• 營業：6:30-9:30 / 12:00-24:00</p>
                        <p>• 費用：平日 1,200円 / 土日祝 1,400円</p>
                      </div>
                      <a
                        href="https://maps.app.goo.gl/1zHyqqb42Sgi8Vhu5"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline mt-auto pl-1 py-2 touch-manipulation min-h-[44px]"
                        aria-label="查看溫泉位置"
                      >
                        查看位置 <ExternalLink size={14} />
                      </a>
                    </div>

                    {/* LOPIA */}
                    <div className="bg-red-50/50 p-5 rounded-xl border border-red-100 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-white text-red-500 rounded-full shadow-sm">
                          <ShoppingBag size={18} />
                        </div>
                        <span className="text-base font-bold text-red-800">
                          LOPIA 博多友都八喜店
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 mb-3 font-sans pl-1 leading-relaxed">
                        人氣超市，非常適合購買伴手禮與宵夜。
                      </p>
                      <a
                        href="https://maps.app.goo.gl/zYKq8J5sbHPdmruP8"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-red-600 font-bold flex items-center gap-1 hover:underline mt-auto pl-1 py-2 touch-manipulation min-h-[44px]"
                        aria-label="查看 LOPIA 超市位置"
                      >
                        查看位置 <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Important Notes */}
            <div>
              <h3 className="text-base font-bold text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle size={18} /> 注意事項
              </h3>
              <div className="space-y-4">
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 flex gap-4">
                  <div className="bg-orange-100 p-2.5 rounded-full h-fit text-orange-600">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-900 text-base mb-1.5">
                      取票提醒
                    </h4>
                    <p className="text-sm text-orange-800/80 leading-relaxed">
                      請提醒 <strong>育辰</strong>{" "}
                      記得在博多站領取「特急ゆふいんの森」的指定席車票。
                    </p>
                  </div>
                </div>

                <div className="bg-stone-100 p-5 rounded-xl border border-stone-200 flex gap-4">
                  <div className="bg-white p-2.5 rounded-full h-fit text-stone-500">
                    <Luggage size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-stone-700 text-base mb-3">
                      行李限重與規定 (AirAsia)
                    </h4>

                    {/* Weight Limits */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm text-stone-600 border-b border-stone-200 pb-2">
                        <span>手提行李 (最多 2 件)</span>
                        <span className="font-bold">合計 7 kg</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-stone-600">
                        <span>托運行李 (已加購)</span>
                        <span className="font-bold text-right">
                          合計 20 kg
                          <br />
                          <span className="text-[10px] font-normal text-stone-400">
                            不限件數，單件 &lt;32kg
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Detailed Rules */}
                    <div className="bg-white/50 rounded-lg p-3 space-y-3">
                      <div>
                        <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">
                          隨身行李限制
                        </p>
                        <ul className="text-sm text-stone-600 space-y-1 list-disc pl-3">
                          <li>主要行李：56 x 36 x 23 cm 以內</li>
                          <li>隨身小包：40 x 30 x 10 cm 以內</li>
                          <li>液體需單瓶 &lt;100ml，總體積 &lt;1L 透明袋裝</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">
                          禁止託運 (務必隨身)
                        </p>
                        <ul className="text-sm text-red-600/80 space-y-1 list-disc pl-3">
                          <li>行動電源、鋰電池</li>
                          <li>相機電池、筆電、平板</li>
                          <li>打火機 (限 1 個，需隨身)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
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
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-[#FDFBF9] rounded-t-[2rem] shadow-2xl min-h-[60vh] max-h-[90vh] flex flex-col relative">
          {/* Header (Sticky) */}
          <div className="flex justify-between items-center p-8 pb-4 sticky top-0 bg-[#FDFBF9]/95 backdrop-blur-sm z-10 rounded-t-[2rem] border-b border-stone-100/50">
            <h2 className="text-2xl font-serif font-bold text-jp-text">
              行李清單
            </h2>
            <button
              onClick={onClose}
              className="p-3 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉詳情"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto px-8 pb-10 grid grid-cols-1 gap-6">
            {Object.entries(checklistData).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-100 pb-1">
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
  const [activeTab, setActiveTab] = useState("tenjin"); // tenjin or hakata
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
      if (distanceX > minSwipeDistance && activeTab === "tenjin")
        setActiveTab("hakata");
      if (distanceX < -minSwipeDistance && activeTab === "hakata")
        setActiveTab("tenjin");
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
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-[#FDFBF9] rounded-t-[2rem] shadow-2xl min-h-[70vh] max-h-[90vh] flex flex-col relative">
          {/* Header (Sticky) */}
          <div className="flex justify-between items-center px-8 pt-8 pb-0 sticky top-0 bg-[#FDFBF9] z-20 rounded-t-[2rem]">
            <h2 className="text-2xl font-serif font-bold text-jp-text">
              逛街清單
            </h2>
            <button
              onClick={onClose}
              className="p-3 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉詳情"
            >
              <X size={20} />
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className="overflow-y-auto px-8 pb-10 space-y-4"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Tabs (Sticky) */}
            <div className="sticky top-0 z-10 bg-[#FDFBF9] py-4 -mx-1 px-1 border-b border-stone-100/50">
              <div className="flex gap-2 p-1 bg-stone-100 rounded-xl shadow-sm">
                <button
                  onClick={() => handleTap("tenjin")}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all touch-manipulation min-h-[44px] ${
                    activeTab === "tenjin"
                      ? "bg-white shadow text-jp-text"
                      : "text-stone-400"
                  }`}
                  aria-label="天神逛街清單"
                  aria-pressed={activeTab === "tenjin"}
                >
                  天神
                </button>
                <button
                  onClick={() => handleTap("hakata")}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all touch-manipulation min-h-[44px] ${
                    activeTab === "hakata"
                      ? "bg-white shadow text-jp-text"
                      : "text-stone-400"
                  }`}
                  aria-label="博多逛街清單"
                  aria-pressed={activeTab === "hakata"}
                >
                  博多
                </button>
              </div>
            </div>

            {/* List */}

            {/* List */}
            {currentList.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm"
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
                        <span className="text-xs text-stone-500 font-sans mt-1 flex items-center gap-1">
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
                          <div className="flex items-center gap-2 text-xs text-stone-500 font-sans">
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
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-500 font-sans pl-11">
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
      Police: "警察",
      "Fire/Ambulance": "消防/救護車",
      "TECO Fukuoka": "駐福岡辦事處",
    };
    return labels[name] || name;
  };

  const getPhoneIcon = (name) => {
    if (name === "Police") return <Shield size={28} className="text-red-600" />;
    if (name === "Fire/Ambulance")
      return <Flame size={28} className="text-red-600" />;
    if (name === "TECO Fukuoka")
      return <Building2 size={28} className="text-red-600" />;
    return <Phone size={28} className="text-red-600" />;
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-[#FDFBF9] rounded-t-[2rem] shadow-2xl min-h-[50vh] max-h-[90vh] flex flex-col relative">
          {/* Header (Sticky) */}
          <div className="flex justify-between items-center p-8 pb-4 sticky top-0 bg-[#FDFBF9]/95 backdrop-blur-sm z-10 rounded-t-[2rem] border-b border-red-100/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-full text-red-600">
                <PhoneCall size={24} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-jp-text">
                緊急聯絡
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉緊急聯絡"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-8 pb-10 pt-6 space-y-4">
            <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl mb-6">
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
                className="block bg-white rounded-xl p-5 border-2 border-stone-100 shadow-sm hover:border-red-200 hover:shadow-md transition-all group active:scale-[0.98] touch-manipulation"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                      {getPhoneIcon(contact.name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-jp-text text-lg mb-1">
                        {getPhoneLabel(contact.name)}
                      </h3>
                      <p className="text-sm text-stone-500 font-sans">
                        {contact.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-serif font-bold text-red-600 mb-0.5">
                        {contact.number}
                      </p>
                      <p className="text-xs text-stone-400 font-sans">
                        點擊撥號
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full text-red-600 group-hover:bg-red-100 transition-colors">
                      <Phone size={20} />
                    </div>
                  </div>
                </div>
              </a>
            ))}

            <div className="mt-6 pt-6 border-t border-stone-100">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 font-sans">
                其他重要資訊
              </h4>
              <div className="space-y-3">
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    <strong className="text-stone-700">語言協助：</strong>
                    撥打緊急電話時，如果不會日語，可以說 "English, please" 或
                    "Taiwanese, please"，接線員會協助轉接。
                  </p>
                </div>
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
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

// 10. Food Modal
const FoodModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("tenjin"); // tenjin, nakasu, or hakata
  const [lastTap, setLastTap] = useState(0);
  const scrollContainerRef = React.useRef(null);

  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const tabs = ["tenjin", "nakasu", "hakata"];

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
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-[#FDFBF9] rounded-t-[2rem] shadow-2xl min-h-[70vh] max-h-[90vh] flex flex-col relative">
          {/* Header (Sticky) */}
          <div className="flex justify-between items-center px-8 pt-8 pb-0 sticky top-0 bg-[#FDFBF9] z-20 rounded-t-[2rem]">
            <h2 className="text-2xl font-serif font-bold text-jp-text">
              美食清單
            </h2>
            <button
              onClick={onClose}
              className="p-3 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉詳情"
            >
              <X size={20} />
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className="overflow-y-auto px-8 pb-10 space-y-6"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Tabs (Sticky) */}
            <div className="sticky top-0 z-10 bg-[#FDFBF9] py-4 -mx-1 px-1 border-b border-stone-100/50">
              <div className="flex gap-2 p-1 bg-stone-100 rounded-xl shadow-sm">
                {[
                  { id: "tenjin", label: "天神" },
                  { id: "nakasu", label: "中洲" },
                  { id: "hakata", label: "博多" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTap(tab.id)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all touch-manipulation min-h-[44px] ${
                      activeTab === tab.id
                        ? "bg-white shadow text-jp-text"
                        : "text-stone-400"
                    }`}
                    aria-label={`${tab.label}美食清單`}
                    aria-pressed={activeTab === tab.id}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List by Category */}

            {/* List by Category */}
            <div className="space-y-8">
              {currentCategories.map((cat, cIdx) => (
                <div key={cIdx}>
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 border-b border-stone-100 pb-2">
                    {cat.category}
                  </h3>
                  <div className="space-y-4">
                    {cat.shops.map((shop, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-jp-text font-serif text-lg leading-tight">
                              {shop.name}
                            </h4>
                            {shop.hours && (
                              <span className="text-xs text-stone-500 font-sans mt-1 flex items-center gap-1">
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
                        <p className="text-sm text-stone-500 leading-relaxed font-sans">
                          {shop.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
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

  // Reset scroll on day change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeDay]);

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
  const [shoppingTab, setShoppingTab] = useState("tenjin");
  const [infoScrollTarget, setInfoScrollTarget] = useState(null);

  // Load checked items from localStorage
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("fukuoka-checklist");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Failed to load checklist from localStorage:", error);
      return {};
    }
  });

  // Save checked items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("fukuoka-checklist", JSON.stringify(checkedItems));
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
    tripData.itinerary[0];

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

      {/* PWA Install Prompt */}
      {showInstallPrompt && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-jp-green text-white p-4 rounded-xl shadow-2xl z-50 safe-area-bottom max-w-md mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-serif font-bold text-lg mb-1">
                安裝到主畫面
              </h3>
              <p className="text-sm opacity-90 font-sans">
                將此應用安裝到手機主畫面，可離線使用並快速開啟
              </p>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="p-1 text-white/80 hover:text-white transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
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
              className="px-4 py-2.5 text-white/80 hover:text-white transition-colors touch-manipulation text-sm font-sans min-h-[44px]"
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

        <div className="flex flex-col items-center">
          <p className="text-xs tracking-[0.4em] uppercase text-stone-400 mb-1 font-sans font-bold">
            Family Trip
          </p>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-2xl font-bold tracking-[0.2em] text-jp-text">
              九州旅行
            </h1>
            <span className="px-2 py-0.5 border border-stone-300 rounded-full text-xs text-stone-400 font-sans font-bold">
              2026/01
            </span>
          </div>
        </div>

        {/* Placeholder for balance, or could keep quick flight info if user wants, but request said move all to sidebar */}
        <div className="w-10"></div>
      </div>

      {/* 2. Date Selector */}
      <DateStrip
        days={tripData.itinerary}
        activeDay={activeDay}
        onSelect={setActiveDay}
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
        onOpenShopping={(tab) => {
          setShoppingTab(tab);
          setShowShopping(true);
        }}
        onOpenInfo={(target) => {
          setInfoScrollTarget(target);
          setShowInfo(true);
        }}
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
        initialTab={shoppingTab}
      />

      <FoodModal isOpen={showFood} onClose={() => setShowFood(false)} />

      <EmergencyModal
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
      />
    </div>
  );
}

export default App;
