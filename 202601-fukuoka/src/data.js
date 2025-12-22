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
      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
      activities: [
        {
          time: '16:00',
          type: '交通',
          title: '抵達福岡機場',
          desc: '16:00 降落。建議搭乘計程車直接前往民宿（車程約 15 分鐘，車資約 1,500 日圓），省去長輩轉乘勞累。',
          about: '福岡機場距市區極近，被稱為「全日本最方便的機場」。',
          nav: '福岡機場',
          icon: <Plane size={18} />
        },
        {
          time: '17:00',
          type: '住宿',
          title: '入住民宿：Flower Base Sakura',
          desc: '辦理入住並放置行李。',
          about: '位於博多站南的安靜住宅區，體驗當地生活感。',
          nav: 'https://maps.app.goo.gl/gcexBfMvJhPvTLsA9',
          address: '福岡市博多区博多駅南',
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
      image: 'https://images.unsplash.com/photo-1624517607344-edd8277b1ba3?auto=format&fit=crop&w=1200&q=80',
      activities: [
        {
          time: '08:00',
          type: '美食',
          title: '早餐：Dacomecca',
          desc: '超人氣麵包店，裝潢華麗，麵包種類豐富。',
          hours: '08:00 - 19:00',
          about: '福岡超人氣麵包店，主打炭烤香腸麵包 (Dacomecca Dog) 與明太子法棍，裝潢華麗宛如美術館，是近期福岡必訪名店。',
          nav: 'https://maps.app.goo.gl/kZhtsngZYEfiVaWn7',
          address: '福岡市博多区博多駅前4-14-1',
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
          address: '大分県由布市湯布院町川北5-3',
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
          address: '大分県由布市湯布院町川上',
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
          address: '福岡市中央区警固2-16-10',
          icon: <Utensils size={18} />
        },
        {
          time: '晚上',
          type: '購物',
          title: '博多運河城逛街 or 休息',
          desc: '晚餐後可至運河城逛逛（有大型水舞秀），或直接回民宿休息。',
          showShoppingLink: true,
          shoppingTab: 'hakata',
          shoppingText: '查看博多逛街地圖',
          hasSurroundingsLink: true,
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
      image: 'https://images.unsplash.com/photo-1623310073404-fe9953eadb04?auto=format&fit=crop&w=1200&q=80',
      activities: [
        {
          time: '09:00',
          type: '美食',
          title: '早餐：藍瓶咖啡 Blue Bottle Coffee',
          desc: '在警固神社旁的藍瓶咖啡開啟悠閒的一天。',
          about: '位於警固神社境內，是福岡超人氣的精品咖啡店。環境與神社融合，非常適合早晨放鬆。',
          nav: 'https://maps.app.goo.gl/wXyNwvzSCbQStQYf6',
          address: '福岡市中央区天神2-2-20',
          icon: <Utensils size={18} />
        },
        {
          time: '10:00',
          type: '景點',
          title: '警固神社',
          desc: '早餐後直接在境內參拜，欣賞繁華天神中的寧靜之地。',
          about: '守護福岡城下町的神社，以祈求消除災難與轉運聞名，其足湯也是一大特色。',
          nav: 'https://maps.app.goo.gl/KKuU72EA69mACRVP9',
          address: '福岡市中央区天神2-2-20',
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
          address: '福岡県太宰府市内山883',
          icon: <MapPin size={18} />
        },
        {
          time: '13:00',
          type: '景點',
          title: '天開稻荷神社',
          desc: '搭乘公車於「三条公民館」下車，步行前往。',
          about: '位於天滿宮後方山坡，擁有整排紅色的稻荷鳥居，是求財與開運的隱藏版景點。',
          nav: 'https://maps.app.goo.gl/zMVNKwmaSQdJVLo46',
          address: '福岡県太宰府市宰府4-7-1',
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
          address: '福岡県太宰府市宰府4-7-1',
          icon: <MapPin size={18} />,
          subItems: [
            { title: '逛表參道', desc: '各式伴手禮店與宮崎駿商店' },
            { title: '吃梅枝餅', desc: '現烤口感最佳，外酥內軟' }
          ]
        },
        {
          time: '晚上',
          type: '購物',
          title: '回天神逛街 or 休息',
          desc: '搭電車返回天神。可繼續購物補貨，或回民宿稍作休息。',
          showShoppingLink: true,
          shoppingTab: 'tenjin',
          shoppingText: '查看天神逛街地圖',
          hasSurroundingsLink: true,
          nav: '天神駅',
          icon: <ShoppingBag size={18} />
        },
        {
          time: '晚餐',
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
      image: 'https://images.unsplash.com/photo-1650960183895-f3931f27bd6f?auto=format&fit=crop&w=1200&q=80',
      activities: [
        {
          time: '09:00',
          type: '美食',
          title: '早餐：The Full Full Hakata',
          desc: '明太子法國麵包非常有名的烘焙坊。',
          about: '酥脆的法棍搭配滿滿的明太子醬，是博多的超人氣早餐選擇。',
          nav: 'https://maps.app.goo.gl/CzvpSyu2RpvXhzZy5',
          address: '福岡市博多区祇園町9-3',
          icon: <Utensils size={18} />
        },
        {
          time: '10:15',
          type: '交通',
          title: '前往小倉',
          desc: '吃完早餐步行至博多站，搭乘山陽新幹線前往小倉站（車程約 15 分鐘）。',
          about: '搭乘新幹線是最快速的方式，節省交通時間。',
          nav: '博多站 -> 小倉站',
          icon: <Train size={18} />
        },
        {
          time: '11:00',
          type: '景點',
          title: '小倉城 & 八坂神社',
          desc: '參觀小倉城天守閣（唐造樣式）與相鄰的八坂神社。',
          about: '小倉城是戰國名將細川忠興所築；八坂神社則以祈求除厄與生意興隆聞名。',
          nav: 'https://maps.app.goo.gl/yXQ7J2k8X5X7y5X7',
          address: '北九州市小倉北区城内2-1',
          icon: <MapPin size={18} />
        },
        {
          time: '12:30',
          type: '交通',
          title: '前往門司港',
          desc: '從小倉站搭乘 JR 鹿兒島本線前往門司港站（車程約 15 分鐘）。',
          about: '門司港站本身就是國家重要文化財，復古的站舍非常值得拍照。',
          nav: '小倉站 -> 門司港站',
          icon: <Train size={18} />
        },
        {
          time: '13:00',
          type: '美食',
          title: '午餐：燒咖哩',
          desc: '在門司港隨意挑選一間餐廳品嚐名物「燒咖哩」。',
          about: '門司港的代表性美食，濃郁咖哩加上起司焗烤，香氣四溢。',
          nav: '門司港燒咖哩',
          address: '北九州市門司区港町',
          icon: <Utensils size={18} />
        },
        {
          time: '14:00',
          type: '景點',
          title: '門司港懷舊區散策',
          desc: '參觀懷舊展望室與大連友好記念館，漫步港灣。',
          about: '漫步在充滿大正浪漫風情的港區，欣賞懷舊洋樓群與港灣美景。',
          nav: '門司港懷舊區',
          address: '北九州市門司区港町',
          icon: <MapPin size={18} />,
          subItems: [
            { title: '懷舊展望室', desc: '眺望關門海峽絕景', nav: 'https://maps.app.goo.gl/QVbQzT6F1mhy2Tcp8' },
            { title: '大連友好記念館', desc: '紅磚歐式建築', nav: 'https://maps.app.goo.gl/hf2VS5aLUHRUdWzh6' }
          ]
        },
        {
          time: '16:00',
          type: '交通',
          title: '前往皿倉山',
          desc: '門司港站 -> 八幡站，再搭計程車/接駁車前往皿倉山纜車站。',
          about: '準備前往欣賞著名的「新日本三大夜景」之一。',
          nav: '八幡站',
          icon: <Train size={18} />
        },
        {
          time: '17:30',
          type: '景點',
          title: '皿倉山夜景',
          desc: '搭乘纜車與爬坡車登頂，欣賞日落至夜幕低垂的百億美元夜景。',
          about: '視野極佳，是北九州最浪漫的景點。山頂風大請注意保暖。',
          nav: '皿倉山',
          address: '北九州市八幡東区大字尾倉1481-1',
          icon: <MapPin size={18} />
        },
        {
          time: '19:00',
          type: '交通',
          title: '返回博多',
          desc: '下山後回八幡站 -> 小倉站 -> 轉乘新幹線回博多。',
          about: '結束充實的北九州一日遊，搭乘舒適的新幹線返回福岡市區。',
          nav: '八幡站 -> 博多站',
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
      image: 'https://images.unsplash.com/photo-1736243355712-9db556734189?auto=format&fit=crop&w=1200&q=80',
      activities: [
        {
          time: '早上',
          type: '美食',
          title: '早餐：民宿簡單吃',
          desc: '享用前幾天預先買好的早餐，收拾行李準備退房。',
          about: '最後一天早晨，悠閒地在民宿度過。',
          nav: '民宿',
          icon: <Utensils size={18} />
        },
        {
          time: '10:00',
          type: '住宿',
          title: 'Check out & 寄放行李',
          desc: '10:00 辦理退房，將行李寄放在民宿（最晚可延後退房至 12:00）。',
          about: '輕鬆出門，享受最後的福岡時光。',
          nav: '民宿',
          icon: <Hotel size={18} />
        },
        {
          time: '11:00',
          type: '景點',
          title: '大濠公園',
          desc: '搭乘地鐵至大濠公園站。環湖散步，享受城市綠洲的氛圍。',
          about: '原為福岡城的護城河，仿照中國西湖設計，是福岡市民最愛的休閒場所。',
          nav: '大濠公園',
          icon: <MapPin size={18} />
        },
        {
          time: '備選',
          type: '美食',
          title: '&LOCALS 大濠公園',
          desc: '位於公園內的時尚咖啡廳，販售九州在地食材製作的餐點與飲品。（想吃可以來）',
          about: '八女茶與稻荷壽司是招牌，建築本身也相當有特色，適合休憩。',
          nav: 'https://maps.app.goo.gl/PfVJNtWqruEuEME19',
          address: '福岡市中央区大濠公園1-9',
          icon: <Utensils size={18} />
        },
        {
          time: '甜點',
          type: '美食',
          title: 'Parfait Lab PINSIRIO',
          desc: '品嚐精緻的芭菲（聖代）甜點。',
          about: '位於大濠公園附近的人氣甜點店，以如同藝術品般的芭菲聞名。',
          nav: 'https://maps.app.goo.gl/jHGg9naMgRfus2VU7',
          address: '福岡市中央区黒門8-15',
          icon: <Utensils size={18} />
        },
        {
          time: '12:30',
          type: '景點',
          title: '舞鶴公園 & 福岡城跡',
          desc: '步行前往鄰近的舞鶴公園，參觀福岡城遺跡。',
          about: '福岡城又名「舞鶴城」，雖天jf閣已不復存在，但石垣與城門仍保留著過往的威嚴。',
          nav: '舞鶴公園',
          icon: <MapPin size={18} />
        },
        {
          time: '午餐',
          type: '美食',
          title: '午餐：Sanuki Udon Shinari',
          desc: '品嚐著名的讚岐烏龍麵（志成）。',
          about: '福岡排名頂尖的烏龍麵店，麵條勁道，炸物也相當出色。',
          nav: 'https://maps.app.goo.gl/5JTUN5zRNpAtbtMW7',
          address: '福岡市中央区大手門3-3-24',
          icon: <Utensils size={18} />
        },
        {
          time: '14:00',
          type: '交通',
          title: '回民宿領取行李 & 前往機場',
          desc: '從大濠公園站回民宿拿行李，接著從博多站前往福岡機場。',
          about: '預留充足時間辦理登機手續，帶著滿滿的回憶返家。',
          nav: '民宿 -> 博多站 -> 福岡機場',
          icon: <Train size={18} />
        }
      ]
    }
  ]
};