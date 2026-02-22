// 可選：若之後要測量效能，可傳入 callback 並安裝 web-vitals
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    // 未安裝 web-vitals 時不執行
  }
};

export default reportWebVitals;
