import { Plane, Hotel, MapPin, Utensils, ShoppingBag, Train, Info } from 'lucide-react';

export const tripData = {
  flight: [
    {
      date: '01/10',
      route: 'TPE -> FUK',
      time: '12:40 - 16:00',
      flightNo: 'AirAsia AK 1510',
      type: 'flight'
    },
    {
      date: '01/14',
      route: 'FUK -> TPE',
      time: '16:55 - 18:30',
      flightNo: 'AirAsia AK 1511',
      type: 'flight'
    }
  ],
  shopping: {
    tenjin: [
      {
        name: "HOKA Fukuoka Tenjin",
        building: "Standalone",
        floor: "1F",
        hours: "11:00 - 20:00",
        link: "https://maps.app.goo.gl/AhT9FQU2SYxCUhDA8"
      },
      {
        name: "PARCO Fukuoka",
        isBuilding: true,
        hours: "10:00 - 20:30",
        shops: [
          { name: "Onitsuka Tiger", floor: "Main Bldg 3F", link: "https://maps.app.goo.gl/PKJcnZVR1Fb1w2rQA" },
          { name: "HARE", floor: "New Bldg 3F", link: "https://maps.app.goo.gl/3vrmV18mAawmVqw1A" },
          { name: "9090", floor: "Main Bldg 3F", link: "https://maps.app.goo.gl/ydb4n1qR4r4DadsHA" },
          { name: "Lui’s", floor: "Main Bldg 3F", link: "https://maps.app.goo.gl/5NbbUX4bjui2iu9u9" },
          { name: "FREAK’S STORE", floor: "New Bldg 4F", link: "https://maps.app.goo.gl/7tgNznxC4pkZjikk9" }
        ]
      },
      {
        name: "ABC-MART Grand Stage",
        building: "Standalone",
        floor: "1F-3F",
        hours: "11:00 - 21:00",
        link: "https://maps.app.goo.gl/tp7eAykqyWW9T78BA"
      },
      {
        name: "Adidas Originals Shop",
        building: "Standalone",
        floor: "1F",
        hours: "11:00 - 20:00",
        link: "https://maps.app.goo.gl/pmogb8QkuJvjLonv8"
      },
      {
        name: "Factory",
        building: "Standalone",
        floor: "1F",
        hours: "13:00 - 18:00",
        link: "https://maps.app.goo.gl/RvSJVkHfFkSYMyMf8"
      },
      {
        name: "Dice & Dice",
        building: "Standalone",
        floor: "1F",
        hours: "13:00 - 18:00",
        link: "https://maps.app.goo.gl/Ua9n4WMQmYXZCYay8"
      }
    ],
    hakata: [
      {
        name: "AMU PLAZA Hakata",
        isBuilding: true,
        hours: "10:00 - 20:00",
        shops: [
          { name: "FREAK’S STORE", floor: "5F", link: "https://maps.app.goo.gl/b1izKYHJ4yMRgwDe9" },
          { name: "atmos", floor: "5F", link: "https://maps.app.goo.gl/n4Vs7cBi3YLRdhxQ6" },
          { name: "Le Dome (Édifice/Iéna)", floor: "3F", link: "https://maps.app.goo.gl/jzqbSAUmET3wF4NQ9" }
        ]
      },
      {
        name: "KITTE Hakata",
        isBuilding: true,
        hours: "10:00 - 21:00",
        shops: [
          { name: "UNIQLO", floor: "8F", hours: "10:00 - 21:00", link: "https://maps.app.goo.gl/vpc2qq8bh7DoTbUN8" }
        ]
      },
      {
        name: "CANAL CITY Hakata",
        isBuilding: true,
        hours: "10:00 - 21:00",
        shops: [
          { name: "RAGEBLUE", floor: "North Bldg 2F", link: "https://maps.app.goo.gl/xFkdyyTTst84dLzy8" }
        ]
      }
    ]
  },
  accommodation: {
    name: 'Flower Base Sakura',
    address: 'Fukuoka', 
    note: 'Near Hakata Station',
    type: 'hotel'
  },
  emergency: [
    { name: 'Police', number: '110' },
    { name: 'Fire/Ambulance', number: '119' },
    { name: 'TECO Fukuoka', number: '+81-92-734-2810' }
  ],
  itinerary: [
    {
      day: 1,
      date: '1/10 (週六)',
      title: '抵達福岡・天神血拚・美食尋覓',
      location: '博多 / 天神',
      weather: '多雲 8°C',
      image: 'https://loremflickr.com/800/600/fukuoka,night,city?random=1',
      activities: [
        {
          time: '16:00',
          type: '交通',
          title: '抵達福岡機場',
          desc: '16:00 降落。建議搭乘計程車直接前往 Airbnb（車程約 15 分鐘，車資約 1,500 日圓），省去長輩轉乘勞累。',
          about: '福岡機場距市區極近，被稱為「全日本最方便的機場」。',
          nav: '福岡機場',
          icon: <Plane size={18} />
        },
        {
          time: '17:00',
          type: '住宿',
          title: '入住 Airbnb：Flower Base Sakura',
          desc: '辦理入住並放置行李。',
          about: '位於博多站南的安靜住宅區，體驗當地生活感。',
          nav: 'https://maps.app.goo.gl/gcexBfMvJhPvTLsA9',
          icon: <Hotel size={18} />
        },
        {
          time: '晚上',
          type: '購物',
          title: '天神商圈：買鞋與冬裝',
          desc: '主要目標：在 HOKA 購買爸媽好走的鞋子，並在 UNIQLO 補貨發熱衣與羽絨外套。',
          tips: ['HOKA 天神店', 'UNIQLO 天神店', 'Mina 天神'],
          highlight: '必買：長輩健走鞋、發熱衣',
          showShoppingLink: true,
          shoppingTab: 'tenjin',
          shoppingText: '查看天神逛街地圖',
          about: '天神是九州最大的繁華街，百貨林立。HOKA 以其超厚底避震聞名，非常適合長輩健走；UNIQLO 日本定價約為台灣 7 折，必買發熱衣。',
          nav: '天神駅',
          icon: <ShoppingBag size={18} />
        },
        {
          time: '晚餐',
          type: '美食',
          title: '天神美食饗宴',
          desc: '天神區美食豐富，可根據爸媽胃口選擇：居酒屋（體驗氛圍）、道地拉麵、福岡名產牛腸鍋，或是熱門的炸牛排。',
          highlight: '推薦項目：居酒屋、拉麵、牛腸鍋、炸牛排',
          about: '推薦品嚐「博多名物」：豚骨拉麵（濃厚白湯）、牛腸鍋（韭菜與味噌湯頭）、或是一口餃子，體驗在地屋台文化氛圍。',
          nav: '天神美食',
          icon: <Utensils size={18} />
        }
      ]
    },
    {
      day: 2,
      date: '1/11 (週日)',
      title: '由布院之森・溫泉小鎮一日遊',
      location: '由布院',
      weather: '晴天 5°C',
      image: 'https://loremflickr.com/800/600/forest,mountain,train?random=2',
      activities: [
        {
          time: '08:00',
          type: '美食',
          title: '早餐：Dacomecca',
          desc: '超人氣麵包店，裝潢華麗，麵包種類豐富。',
          hours: '08:00 - 19:00',
          about: '福岡超人氣麵包店，主打炭烤香腸麵包 (Dacomecca Dog) 與明太子法棍，裝潢華麗宛如美術館，是近期福岡必訪名店。',
          nav: 'https://maps.app.goo.gl/kZhtsngZYEfiVaWn7',
          icon: <Utensils size={18} />
        },
        {
          time: '09:17',
          type: '交通',
          title: '特急ゆふいんの森１号',
          desc: '博多 09:17 出發（11:31 抵達）。享受觀光列車的風景。',
          about: 'JR 九州最受歡迎的觀光列車，車廂使用大量木材裝飾，洋溢古典歐風，沿途欣賞由布岳美景。',
          nav: '博多站',
          icon: <Train size={18} />
        },
        {
          time: '11:40',
          type: '美食',
          title: '午餐：由布まぶし 心',
          desc: '著名的豐後牛蓋飯三吃，抵達由布院後先享用午餐。',
          hours: '11:00 - 16:00 / 17:30 - 21:00',
          about: '由布院必吃排隊名店。推薦「豐後牛三吃」：一吃原味，二加佐料（柚子胡椒），三淋高湯變茶泡飯。',
          nav: 'https://maps.app.goo.gl/nrTjZNdxC9RuhEv76',
          icon: <Utensils size={18} />
        },
        {
          time: '13:00',
          type: '景點',
          title: '金鱗湖 & 足湯咖啡',
          desc: '欣賞金鱗湖美景，並在附近的足湯咖啡休息放鬆。',
          hours: '足湯 10:00 - 17:00',
          about: '湖底同時湧出溫泉與清水，秋冬清晨因溫差易產生夢幻晨霧（朝霧）。傳說古代有神龍棲息。',
          nav: 'https://maps.app.goo.gl/7qR3wneN338Bngfv7',
          icon: <MapPin size={18} />
        },
        {
          time: '14:00',
          type: '購物',
          title: '由布院溫泉街散策',
          desc: '漫步湯之坪街道，品嚐各種特色小吃與伴手禮。',
          about: '位於由布岳山腳下，街道充滿童話感，聚集了許多特色甜點與雜貨店。',
          nav: '湯之坪街道',
          icon: <ShoppingBag size={18} />,
          subItems: [
            { title: '湯布院金賞コロッケ (可樂餅)', hours: '09:00 - 17:30', desc: '金賞獎炸肉餅' },
            { title: '花麹菊家 (銅鑼燒布丁)', hours: '09:00 - 17:00', desc: '創意甜點' },
            { title: '湯布珈琲', hours: '11:00 - 17:00', desc: '休息喝咖啡' },
            { title: '吉吾 (中津唐揚雞)', hours: '11:00 - 16:00', desc: '酥脆多汁炸雞' },
            { title: '鞠智 (銅鑼燒)', hours: '10:00 - 17:00', desc: '精緻日式甜點' },
            { title: '由布院ミルヒ (布丁)', hours: '10:30 - 17:30', desc: '熱半熟起司蛋糕' },
            { title: 'telato (抹茶)', hours: '10:30 - 16:30', desc: '特濃抹茶冰淇淋' }
          ]
        },
        {
          time: '15:56',
          type: '交通',
          title: '特急ゆふいんの森４号',
          desc: '由布院 15:56 出發（18:10 抵達博多）。',
          about: '回程再次體驗觀光列車，可購買車上限定的甜點或便當。',
          nav: '由布院站',
          icon: <Train size={18} />
        },
        {
          time: '18:30',
          type: '美食',
          title: '晚餐：かわ屋',
          desc: '福岡著名的雞皮燒烤串，口感酥脆。',
          hours: '17:00 - 24:00',
          about: '福岡「雞皮燒烤」發源地之一。雞皮經過 6 天反覆烘烤去油，口感外酥內Q，與一般軟嫩雞皮不同，是博多獨有的下酒菜。',
          nav: 'https://maps.app.goo.gl/AVqaPHZ7FuUB4ymj9',
          icon: <Utensils size={18} />
        },
        {
          time: '20:30',
          type: '購物',
          title: '博多運河城逛街 or 休息',
          desc: '晚餐後可至運河城逛逛（有大型水舞秀），或直接回民宿休息。',
          showShoppingLink: true,
          shoppingTab: 'hakata',
          shoppingText: '查看博多逛街地圖',
          about: '運河城是結合購物、娛樂的大型複合設施，每天晚上的水舞秀非常有名。',
          nav: '博多運河城',
          icon: <ShoppingBag size={18} />
        }
      ]
    },
    {
      day: 3,
      date: '1/12 (週一)',
      title: '太宰府參拜・市區美食巡禮',
      location: '太宰府 / 博多',
      weather: '局部降雨 7°C',
      image: 'https://loremflickr.com/800/600/shrine,japan,temple?random=3',
      activities: [
        {
          time: '09:00',
          type: '美食',
          title: '早餐：藍瓶咖啡 Blue Bottle Coffee',
          desc: '在警固神社旁的藍瓶咖啡開啟悠閒的一天。',
          about: '位於警固神社境內，是福岡超人氣的精品咖啡店。環境與神社融合，非常適合早晨放鬆。',
          nav: 'https://maps.app.goo.gl/wXyNwvzSCbQStQYf6',
          icon: <Utensils size={18} />
        },
        {
          time: '10:00',
          type: '景點',
          title: '警固神社',
          desc: '早餐後直接在境內參拜，欣賞繁華天神中的寧靜之地。',
          about: '守護福岡城下町的神社，以祈求消除災難與轉運聞名，其足湯也是一大特色。',
          nav: 'https://maps.app.goo.gl/KKuU72EA69mACRVP9',
          icon: <MapPin size={18} />
        },
        {
          time: '10:45',
          type: '交通',
          title: '前往太宰府',
          desc: '步行至西鐵天神站，搭乘電車前往太宰府（車程約 30 分鐘）。',
          about: '建議搭乘西鐵天神大牟田線，若時間湊巧可搭到「旅人號」觀光電車。',
          nav: '西鐵天神站',
          icon: <Train size={18} />
        },
        {
          time: '11:45',
          type: '景點',
          title: '宝満宮 竈門神社',
          desc: '抵達太宰府站後，搭乘「真秀羅場號」公車前往竈門神社。',
          about: '以「結緣」聞名，神社設計非常現代且精緻。這裡也是《鬼滅之刃》迷的聖地。',
          nav: 'https://maps.app.goo.gl/voYxFMHAqDuL4VtK7',
          icon: <MapPin size={18} />
        },
        {
          time: '13:00',
          type: '景點',
          title: '天開稻荷神社',
          desc: '搭乘公車於「三条公民館」下車，步行前往。',
          about: '位於天滿宮後方山坡，擁有整排紅色的稻荷鳥居，是求財與開運的隱藏版景點。',
          nav: 'https://maps.app.goo.gl/zMVNKwmaSQdJVLo46',
          icon: <MapPin size={18} />
        },
        {
          time: '14:00',
          type: '景點',
          title: '太宰府天滿宮 & 表參道',
          desc: '從天開稻荷神社往下走即達天滿宮主殿。參拜後逛表參道吃梅枝餅。',
          highlight: '午餐建議：表參道各式小吃或暖暮拉麵',
          about: '福岡最重要的神社之一，供奉學問之神。參道上的星巴克（隈研吾設計）與現烤梅枝餅是必訪重點。',
          nav: 'https://maps.app.goo.gl/yPywku4sE55BYYtx7',
          icon: <MapPin size={18} />,
          subItems: [
            { title: '逛表參道', desc: '各式伴手禮店與宮崎駿商店' },
            { title: '吃梅枝餅', desc: '現烤口感最佳，外酥內軟' }
          ]
        },
        {
          time: '16:30',
          type: '購物',
          title: '回天神逛街 or 休息',
          desc: '搭電車返回天神。可繼續購物補貨，或回民宿稍作休息。',
          showShoppingLink: true,
          shoppingTab: 'tenjin',
          shoppingText: '查看天神逛街地圖',
          nav: '天神駅',
          icon: <ShoppingBag size={18} />
        },
        {
          time: '19:00',
          type: '美食',
          title: '晚餐：中州屋台',
          desc: '傍晚前往那珂川邊，體驗道地的博多屋台文化。',
          about: '福岡的代表性夜景，可以在河邊一邊享受拉麵、烤串，一邊感受熱鬧的在地氛圍。',
          nav: '中州屋台',
          icon: <Utensils size={18} />
        }
      ]
    },
    {
      day: 4,
      date: '1/13 (週二)',
      title: '門司港復古建築・小倉城漫遊',
      location: '北九州',
      weather: '強風 6°C',
      image: 'https://loremflickr.com/800/600/castle,japan,retro?random=4',
      activities: [
        {
          time: '早上',
          type: '交通',
          title: '前往門司港',
          desc: '從博多搭 JR 到小倉轉車，車程約 1 小時。',
          about: '結束北九州一日遊，返回博多。',
          nav: '門司港站',
          icon: <Train size={18} />
        },
        {
          time: '中午',
          type: '美食',
          title: '門司港懷舊區',
          desc: '欣賞港口復古建築，路面平整好走。',
          highlight: '必吃：燒咖哩 (焗烤咖哩飯)',
          about: '明治大正時期的國際貿易港，保留許多西洋紅磚建築（舊門司海關、門司港車站）。「懷舊區」充滿浪漫氣氛，適合散步拍照。',
          nav: '門司港懷舊區',
          icon: <Utensils size={18} />
        },
        {
          time: '下午',
          type: '景點',
          title: '小倉城',
          desc: '參觀小倉城與周邊商店街。',
          about: '戰國名將細川忠興所築，天守閣外觀獨特（唐造樣式），周邊的旦過市場被稱為「北九州的廚房」。',
          nav: '小倉城',
          icon: <MapPin size={18} />
        },
        {
          time: '晚上',
          type: '交通',
          title: '返回博多',
          desc: '搭乘 JR 返回博多站，晚餐後回住宿。',
          about: '結束北九州一日遊，返回博多。',
          nav: '博多站',
          icon: <Train size={18} />
        }
      ]
    },
    {
      day: 5,
      date: '1/14 (週三)',
      title: '公園散步・伴手禮採買・歸途',
      location: '福岡市區',
      weather: '晴天 9°C',
      image: 'https://loremflickr.com/800/600/park,lake,nature?random=5',
      activities: [
        {
          time: '早上',
          type: '景點',
          title: '大濠公園',
          desc: '地鐵大濠公園站。環湖散步、舞鶴公園拍照。',
          about: '原為福岡城的護城河（大堀），仿照中國西湖設計，擁有廣大的湖泊與綠地，是福岡市民的休閒綠洲。',
          nav: '大濠公園',
          icon: <MapPin size={18} />
        },
        {
          time: '中午',
          type: '購物',
          title: '最後採買伴手禮',
          desc: '博多站購買明產、藥妝。',
          highlight: '必買：筑紫餅、一蘭拉麵包',
          about: '博多站是九州最大的車站，聚集了許多伴手禮店。推薦「筑紫餅」與「一蘭拉麵」包裝版。',
          nav: '博多站',
          icon: <ShoppingBag size={18} />
        },
        {
          time: '14:00',
          type: '交通',
          title: '前往機場',
          desc: '預留登機與安檢時間，準備搭機。',
          about: '帶著滿滿的回憶與戰利品，準備搭機返家。',
          nav: '福岡機場',
          icon: <Plane size={18} />
        }
      ]
    }
  ]
};