import {
  Plane,
  Hotel,
  MapPin,
  Utensils,
  ShoppingBag,
  Train,
  Info,
} from "lucide-react";

export const tripData = {
  flight: [
    {
      date: "01/10",
      route: "TPE -> FUK",
      time: "12:40 - 16:00",
      flightNo: "AirAsia AK 1510",
      type: "flight",
    },
    {
      date: "01/14",
      route: "FUK -> TPE",
      time: "16:55 - 18:30",
      flightNo: "AirAsia AK 1511",
      type: "flight",
    },
  ],
  shopping: {
    tenjin: [
      {
        name: "HOKA Fukuoka Tenjin",
        building: "Standalone",
        floor: "1F",
        hours: "11:00 - 20:00",
        link: "https://maps.app.goo.gl/AhT9FQU2SYxCUhDA8",
      },
      {
        name: "Mina Tenjin",
        isBuilding: true,
        hours: "10:00 - 20:00",
        shops: [
          {
            name: "3COINS＋",
            floor: "B1F",
            link: "https://maps.app.goo.gl/CU5TtzJ3RE9v4tnY7",
          },
          {
            name: "UNIQLO",
            floor: "1F-2F",
            link: "https://maps.app.goo.gl/oiVDfiSjVvLoyRmk8",
          },
          {
            name: "GU",
            floor: "3F",
            link: "https://maps.app.goo.gl/o4hrRNPQzuM9d6Ni8",
          },
          {
            name: "LOFT",
            floor: "4F",
            link: "https://maps.app.goo.gl/67iMaH4ygF64y7xX8",
          },
        ],
      },
      {
        name: "天神地下街",
        building: "Underground",
        hours: "10:00 - 20:00",
        link: "https://maps.app.goo.gl/6wAuWeLaQ7m6FnHN8",
      },
      {
        name: "PARCO Fukuoka",
        isBuilding: true,
        hours: "10:00 - 20:30",
        shops: [
          {
            name: "Onitsuka Tiger",
            floor: "Main Bldg 3F",
            link: "https://maps.app.goo.gl/PKJcnZVR1Fb1w2rQA",
          },
          {
            name: "9090",
            floor: "Main Bldg 3F",
            link: "https://maps.app.goo.gl/ydb4n1qR4r4DadsHA",
          },
          {
            name: "Lui’s",
            floor: "Main Bldg 3F",
            link: "https://maps.app.goo.gl/5NbbUX4bjui2iu9u9",
          },
          {
            name: "ABC-MART Grand Stage",
            floor: "Main Bldg 3F",
            link: "https://maps.app.goo.gl/JfzZ8zZUNoo3xBRGA",
          },
          {
            name: "SNIDEL",
            floor: "Main Bldg 4F",
            link: "https://maps.app.goo.gl/cPGyvz7BgK8tWZ52A",
          },
          {
            name: "Francfranc",
            floor: "Main Bldg 5F",
            link: "https://maps.app.goo.gl/C3fXMNXPqefDycyL6",
          },
          {
            name: "BEAMS",
            floor: "New Bldg 1F-2F",
            link: "https://maps.app.goo.gl/AJSXxSANUdLgE1ah8",
          },
          {
            name: "HARE",
            floor: "New Bldg 3F",
            link: "https://maps.app.goo.gl/3vrmV18mAawmVqw1A",
          },
          {
            name: "FREAK’S STORE",
            floor: "New Bldg 4F",
            link: "https://maps.app.goo.gl/7tgNznxC4pkZjikk9",
          },
        ],
      },
      {
        name: "ABC-MART Grand Stage Tenjin",
        building: "Standalone",
        floor: "1F-3F",
        hours: "11:00 - 21:00",
        link: "https://maps.app.goo.gl/tp7eAykqyWW9T78BA",
      },
      {
        name: "Adidas Originals Shop",
        building: "Standalone",
        floor: "1F",
        hours: "11:00 - 20:00",
        link: "https://maps.app.goo.gl/pmogb8QkuJvjLonv8",
      },
      {
        name: "Factory",
        building: "Standalone",
        floor: "1F",
        hours: "13:00 - 18:00",
        link: "https://maps.app.goo.gl/RvSJVkHfFkSYMyMf8",
      },
      {
        name: "Dice & Dice",
        building: "Standalone",
        floor: "1F",
        hours: "13:00 - 18:00",
        link: "https://maps.app.goo.gl/Ua9n4WMQmYXZCYay8",
      },
      {
        name: "ZARA Tenjin Nishi-dori",
        building: "Standalone",
        floor: "1F-3F",
        hours: "11:00 - 21:00",
        link: "https://maps.app.goo.gl/Xrxwm1MxqdareXKo8",
      },
      {
        name: "大賀藥局 (Oga Pharmacy)",
        building: "Standalone",
        floor: "1F",
        hours: "10:00 - 22:00",
        link: "https://maps.app.goo.gl/VeBCd8cwSFmkfXfE8",
      },
    ],
    hakata: [
      {
        name: "AMU PLAZA Hakata",
        isBuilding: true,
        hours: "10:00 - 20:00",
        shops: [
          {
            name: "Le Dome (Édifice/Iéna)",
            floor: "3F",
            link: "https://maps.app.goo.gl/jzqbSAUmET3wF4NQ9",
          },
          {
            name: "BEAMS",
            floor: "3F",
            link: "https://maps.app.goo.gl/iCcZZhPZq8ejruLW6",
          },
          {
            name: "FREAK’S STORE",
            floor: "4F",
            link: "https://maps.app.goo.gl/b1izKYHJ4yMRgwDe9",
          },
          {
            name: "atmos",
            floor: "5F",
            link: "https://maps.app.goo.gl/n4Vs7cBi3YLRdhxQ6",
          },
          {
            name: "MUJI",
            floor: "6F",
            link: "https://maps.app.goo.gl/Gakfdg8VufxCiBU26",
          },
          {
            name: "ABC-MART",
            floor: "7F",
            link: "https://maps.app.goo.gl/2coZLK3pjuuhAiqB7",
          },
        ],
      },
      {
        name: "AMU EST",
        isBuilding: true,
        hours: "10:00 - 20:00",
        shops: [
          {
            name: "LOWRYS FARM",
            floor: "B1F",
            link: "https://maps.app.goo.gl/jeEdzq12MYoiFoeW7",
          },
          {
            name: "UNIQLO",
            floor: "1F",
            link: "https://maps.app.goo.gl/3BvK8xANZNywev6a7",
          },
        ],
      },
      {
        name: "KITTE Hakata",
        isBuilding: true,
        hours: "10:00 - 21:00",
        shops: [
          {
            name: "UNIQLO",
            floor: "8F",
            hours: "10:00 - 21:00",
            link: "https://maps.app.goo.gl/vpc2qq8bh7DoTbUN8",
          },
        ],
      },
      {
        name: "CANAL CITY Hakata",
        isBuilding: true,
        hours: "10:00 - 21:00",
        shops: [
          {
            name: "RAGEBLUE",
            floor: "North Bldg 2F",
            link: "https://maps.app.goo.gl/xFkdyyTTst84dLzy8",
          },
          {
            name: "MUJI",
            floor: "North Bldg 3F-4F",
            link: "https://maps.app.goo.gl/VLNEuqq8FgtDWhLW9",
          },
          {
            name: "Adidas Originals",
            floor: "Center Walk 1F",
            link: "https://maps.app.goo.gl/3odaPqBG6DA15sf39",
          },
          {
            name: "MOUSSY",
            floor: "Center Walk 2F",
            link: "https://maps.app.goo.gl/QxHoaxJfeXue31ng9",
          },
          {
            name: "Asics",
            floor: "Center Walk 2F",
            link: "https://maps.app.goo.gl/7UzytRJtTVGMkVbc8",
          },
          {
            name: "Levi’s",
            floor: "Center Walk 2F",
            link: "https://maps.app.goo.gl/Xiz2YmqPAR5d7fLy5",
          },
          {
            name: "ABC-MART Grand Stage",
            floor: "Center Walk 3F",
            link: "https://maps.app.goo.gl/R48HbE8Jj1mmJNZb9",
          },
          {
            name: "Alpen Fukuoka",
            floor: "South Bldg 1F-3F",
            link: "https://maps.app.goo.gl/ThnejdLYkkYmfB5H7",
          },
          {
            name: "Onitsuka Tiger",
            floor: "South Bldg 2F",
            link: "https://maps.app.goo.gl/3MKG63X1FCaWU94D9",
          },
        ],
      },
    ],
  },
  food: {
    tenjin: [
      {
        category: "咖啡廳",
        shops: [
          {
            name: "The Full Full",
            link: "https://maps.app.goo.gl/LHHurbd9sAQtgUo6A",
            hours: "10:00 - 20:00",
            desc: "著名的明太子法國麵包與烘焙咖啡。",
          },
          {
            name: "藍瓶咖啡 Blue Bottle Coffee",
            link: "https://maps.app.goo.gl/vfv5WZg1MmPDLGG78",
            hours: "08:00 - 20:00",
            desc: "精品咖啡，店內氛圍靜謐。",
          },
        ],
      },
      {
        category: "甜點",
        shops: [
          {
            name: "ASAKO IWAYANAGI FUKUOKA",
            link: "https://maps.app.goo.gl/cMMPu1wgPTrVmxwr9",
            hours: "11:00 - 20:00",
            desc: "精緻華麗的芭菲與甜點藝術。",
          },
        ],
      },
      {
        category: "丼飯",
        shops: [
          {
            name: "黒田飯",
            link: "https://maps.app.goo.gl/rXPeRvUyoAzfPSLW9",
            hours: "11:30 - 14:00 / 18:00 - 22:00",
            desc: "在地特色丼飯與日式料理。",
          },
        ],
      },
    ],
    nakasu: [
      {
        category: "拉麵",
        shops: [
          {
            name: "一蘭 本社総本店",
            link: "https://maps.app.goo.gl/bwLkRDyBGLX4QGtA6",
            hours: "24 小時營業",
            desc: "一蘭拉麵全球總本店，感受最道地的氛圍。",
          },
        ],
      },
      {
        category: "屋台",
        shops: [
          {
            name: "中洲屋台街",
            link: "https://maps.app.goo.gl/W1oZfQnYa5MgMoxV7",
            hours: "18:00 - 24:00",
            desc: "福岡最具代表性的夜間路邊攤文化。",
          },
        ],
      },
    ],
    hakata: [
      {
        category: "拉麵",
        shops: [
          {
            name: "博多一双",
            link: "https://maps.app.goo.gl/Y5Lria8iFp5oQdnU8",
            hours: "11:00 - 24:00",
            desc: "濃厚系的豚骨拉麵，排隊人氣名店。",
          },
          {
            name: "麺屋 いしヰ",
            link: "https://maps.app.goo.gl/Rb9mkZ127C1f5MyZ8",
            hours: "11:00 - 15:00 / 17:00 - 21:00",
            desc: "特色沾麵與精緻拉麵料理。",
          },
        ],
      },
      {
        category: "燒肉",
        shops: [
          {
            name: "博多 焼肉 八十八―YASOHACHI",
            link: "https://maps.app.goo.gl/rd1Kdn5bSxVEvvMu9",
            hours: "11:30 - 14:30 / 17:00 - 23:00",
            desc: "高品質和牛燒肉，環境優雅。",
          },
        ],
      },
      {
        category: "火鍋",
        shops: [
          {
            name: "博多牛腸鍋 前田屋",
            link: "https://maps.app.goo.gl/p6ZDh8ugnxabm7P69",
            hours: "11:00 - 15:00 / 17:00 - 23:00",
            desc: "福岡名物牛腸鍋，湯頭鮮美。",
          },
        ],
      },
      {
        category: "咖啡廳",
        shops: [
          {
            name: "Dacomecca",
            link: "https://maps.app.goo.gl/VvoVz7BfkViapyZn9",
            hours: "08:00 - 19:00",
            desc: "美術館般的麵包名店，視覺與味覺雙重享受。",
          },
          {
            name: "The Full Full Hakata",
            link: "https://maps.app.goo.gl/2dZFZWGBq3cLNTUy7",
            hours: "08:00 - 21:00",
            desc: "明太子法國麵包代表店，近博多站。",
          },
          {
            name: "FUK COFFEE",
            link: "https://maps.app.goo.gl/mFtDAdeWpFM2owAz9",
            hours: "08:00 - 20:00",
            desc: "以旅遊為主題的特色咖啡店。",
          },
        ],
      },
      {
        category: "甜點",
        shops: [
          {
            name: "蜂樂饅頭",
            link: "https://maps.app.goo.gl/k8gvtBbfNDp3h5Zd9",
            hours: "10:00 - 19:00",
            desc: "經典日式甜點，內餡飽滿紮實。",
          },
        ],
      },
      {
        category: "居酒屋",
        shops: [
          {
            name: "博多かわ屋",
            link: "https://maps.app.goo.gl/J1hb3Jk5zJUAJRR9A",
            hours: "17:00 - 24:00",
            desc: "招牌烤雞皮串，福岡必吃美食。",
          },
        ],
      },
    ],
  },
  accommodation: {
    name: "Flower Base Sakura",
    address: "Fukuoka",
    note: "Near Hakata Station",
    type: "hotel",
  },
  emergency: [
    { name: "Police", number: "110" },
    { name: "Fire/Ambulance", number: "119" },
    { name: "TECO Fukuoka", number: "+81-92-734-2810" },
  ],
  itinerary: [
    {
      day: 1,
      date: "1/10 (週六)",
      title: "抵達福岡・天神血拚・美食尋覓",
      location: "博多 / 天神",
      weather: "多雲 8°C",
      image:
        "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80",
      activities: [
        {
          time: "16:00",
          type: "交通",
          title: "抵達福岡機場",
          desc: "16:00 降落。建議搭乘計程車直接前往民宿（車程約 15 分鐘，車資約 1,500 日圓），省去長輩轉乘勞累。",
          about:
            "福岡機場距市區極近，被稱為「全日本最方便的機場」之一：從機場到博多/天神通常只要約 10～15 分鐘車程。若想最省體力，落地後直接搭計程車或機場接駁車最舒服；若改搭大眾運輸，建議用 IC 卡（Suica/ICOCA 等）或現場購票，行李多時優先走電梯動線，減少轉乘與拉行李的負擔。",
          nav: "福岡機場",
          icon: <Plane size={18} />,
        },
        {
          time: "17:00",
          type: "住宿",
          title: "入住民宿：Flower Base Sakura",
          desc: "辦理入住並放置行李。",
          about: "位於博多站南的安靜住宅區，體驗當地生活感。",
          nav: "https://maps.app.goo.gl/gcexBfMvJhPvTLsA9",
          address: "福岡市博多区博多駅南",
          icon: <Hotel size={18} />,
        },
        {
          time: "晚上",
          type: "購物",
          title: "天神商圈：買鞋與冬裝",
          desc: "主要目標：在 HOKA 購買爸媽好走的鞋子，並在 UNIQLO 補貨發熱衣與羽絨外套。",
          highlight: "必買：長輩健走鞋、發熱衣",
          showShoppingLink: true,
          shoppingTab: "tenjin",
          shoppingText: "查看天神逛街清單",
          about:
            "天神是九州最大的繁華街，百貨林立。HOKA 以其超厚底避震聞名，非常適合長輩健走；UNIQLO 日本定價約為台灣 7 折，必買發熱衣。",
          nav: "天神駅",
          icon: <ShoppingBag size={18} />,
        },
        {
          time: "晚餐",
          type: "美食",
          title: "天神美食饗宴",
          desc: "天神區美食豐富，可根據爸媽胃口選擇：居酒屋（體驗氛圍）、道地拉麵、福岡名產牛腸鍋，或是熱門的炸牛排。",
          highlight: "推薦項目：居酒屋、拉麵、牛腸鍋、炸牛排",
          about:
            "天神是福岡美食密度最高的區域之一，第一晚很適合先把「博多名物」吃一輪：豚骨拉麵（濃厚白湯、細麵，可加麵）、牛腸鍋（味噌或醬油湯底，牛腸油香搭配滿滿韭菜與高麗菜）、以及一口餃子。若爸媽口味偏清爽，建議改選烤雞串、關東煮或海鮮居酒屋更不負擔；想要更有儀式感再挑炸牛排（外酥內嫩，長輩可選熟度偏熟更安心）。小提醒：熱門店晚餐尖峰常要排隊或抽號碼牌，建議提早 30～60 分鐘到、或分流先去附近逛一下再回來。",
          nav: "天神美食",
          icon: <Utensils size={18} />,
        },
      ],
    },
    {
      day: 2,
      date: "1/11 (週日)",
      title: "由布院之森・溫泉小鎮一日遊",
      location: "由布院",
      weather: "晴天 5°C",
      image:
        "https://images.unsplash.com/photo-1624517607344-edd8277b1ba3?auto=format&fit=crop&w=1200&q=80",
      activities: [
        {
          time: "08:00",
          type: "美食",
          title: "早餐：Dacomecca",
          desc: "超人氣麵包店，裝潢華麗，麵包種類豐富。",
          hours: "08:00 - 19:00",
          about:
            "福岡超人氣麵包名店，店內像美術館一樣好拍，現烤出爐香氣很強。必吃推薦：炭烤香腸麵包（Dacomecca Dog，外酥內多汁）、明太子法棍（鹹香濃郁很有福岡味）、以及甜麵包類（奶油/卡士達系通常很安全）。想吃到熱門口味建議一開店就到或避開 11:30～13:30 人潮；帶長輩最適合買幾款分食，再配熱飲慢慢吃。",
          nav: "https://maps.app.goo.gl/kZhtsngZYEfiVaWn7",
          address: "福岡市博多区博多駅前4-14-1",
          icon: <Utensils size={18} />,
        },
        {
          time: "09:17",
          type: "交通",
          title: "特急ゆふいんの森１号",
          desc: "博多 09:17 出發（11:31 抵達）。享受觀光列車的風景。",
          about:
            "JR 九州最受歡迎的觀光列車之一，車廂大量使用木質裝飾與復古燈具，氛圍像森林裡的歐風客廳。沿途會穿越山谷與田園風景，接近由布院時能遠望由布岳。列車常有觀光列車限定的設計座椅與車內販售（飲料/甜點/紀念小物依班次而異），很適合當作旅程亮點。座位很熱門，建議事先劃位；帶長輩提早到月台、把行李先安置好，搭車體驗會更輕鬆。",
          nav: "博多站",
          icon: <Train size={18} />,
        },
        {
          time: "11:40",
          type: "美食",
          title: "午餐：由布まぶし 心",
          desc: "著名的豐後牛蓋飯三吃，抵達由布院後先享用午餐。",
          hours: "11:00 - 16:00 / 17:30 - 21:00",
          about:
            "由布院必吃的排隊名店，主打「豐後牛（大分和牛）」蓋飯三吃。必吃點法：一吃原味感受牛肉香氣與油脂；二吃加佐料（蔥花、海苔、芥末/柚子胡椒等）轉換風味；三吃淋高湯變茶泡飯，最後一口最暖胃。建議提早到店或避開正中午尖峰；若帶長輩且不習慣太生的口感，可挑熟度較高或詢問店家推薦。提醒：如果有長輩不吃牛，建議現場先詢問是否能改點雞/豬/海鮮或其他熟食餐點；若店內選擇不多，也可以直接在湯之坪街道改吃可樂餅、唐揚雞、烏龍麵等較好接受的午餐替代方案。",
          nav: "https://maps.app.goo.gl/nrTjZNdxC9RuhEv76",
          address: "大分県由布市湯布院町川北5-3",
          icon: <Utensils size={18} />,
        },
        {
          time: "13:00",
          type: "景點",
          title: "金鱗湖 & 足湯咖啡",
          desc: "欣賞金鱗湖美景，並在附近的足湯咖啡休息放鬆。",
          hours: "足湯 10:00 - 17:00",
          about:
            "金鱗湖最特別之處是「湖底同時湧出溫泉與清水」，秋冬清晨溫差大時很容易出現夢幻晨霧（朝霧），是由布院代表景色。名稱據說源於夕陽映照時水面像金色魚鱗般閃耀；當地也流傳神秘傳說（如神龍棲息等）。散步路線平緩、很適合長輩；想拍最美畫面建議一早到，之後再去足湯咖啡泡腳休息、喝熱飲保暖。",
          nav: "https://maps.app.goo.gl/7qR3wneN338Bngfv7",
          address: "大分県由布市湯布院町川上",
          icon: <MapPin size={18} />,
        },
        {
          time: "14:00",
          type: "購物",
          title: "由布院溫泉街散策",
          desc: "漫步湯之坪街道，品嚐各種特色小吃與伴手禮。",
          about:
            "湯之坪街道位於由布岳山腳下，街景帶點童話感，集合了甜點、雜貨、特色伴手禮與小吃攤。想吃必吃可以鎖定：布丁/起司蛋糕系甜點、可樂餅、唐揚雞、抹茶冰淇淋等，買幾樣分食最不膩也最省時間。天氣冷的話建議穿好走防滑的鞋，邊走邊吃邊拍照，最後再找咖啡店或足湯把腳暖回來。",
          nav: "湯之坪街道",
          icon: <ShoppingBag size={18} />,
          subItems: [
            {
              title: "湯布院金賞コロッケ (可樂餅)",
              hours: "09:00 - 17:30",
              desc: "金賞獎炸肉餅",
            },
            {
              title: "花麹菊家 (銅鑼燒布丁)",
              hours: "09:00 - 17:00",
              desc: "創意甜點",
            },
            { title: "湯布珈琲", hours: "11:00 - 17:00", desc: "休息喝咖啡" },
            {
              title: "吉吾 (中津唐揚雞)",
              hours: "11:00 - 16:00",
              desc: "酥脆多汁炸雞",
            },
            {
              title: "鞠智 (銅鑼燒)",
              hours: "10:00 - 17:00",
              desc: "精緻日式甜點",
            },
            {
              title: "由布院ミルヒ (布丁)",
              hours: "10:30 - 17:30",
              desc: "熱半熟起司蛋糕",
            },
            {
              title: "telato (抹茶)",
              hours: "10:30 - 16:30",
              desc: "特濃抹茶冰淇淋",
            },
          ],
        },
        {
          time: "15:56",
          type: "交通",
          title: "特急ゆふいんの森４号",
          desc: "由布院 15:56 出發（18:10 抵達博多）。",
          about:
            "回程同樣搭乘觀光列車，最適合在夕陽時段放慢步調看窗外風景。若車內有販售服務，可留意觀光列車限定甜點/飲料或紀念小物；也可以在由布院站先買便當或小點心上車慢慢吃。回程容易疲累，建議先上洗手間、把保暖外套準備好，讓爸媽一路坐到博多更舒服。",
          nav: "由布院站",
          icon: <Train size={18} />,
        },
        {
          time: "18:30",
          type: "美食",
          title: "晚餐：かわ屋",
          desc: "福岡著名的雞皮燒烤串，口感酥脆。",
          hours: "17:00 - 24:00",
          about:
            "福岡「雞皮串（かわ）」代表名店之一，招牌是把雞皮反覆烤製去油（常被形容要花好幾天工序），所以吃起來外層酥香、裡面仍保有 Q 彈，完全不像一般偏軟的雞皮。必吃：雞皮串（通常一串接一串停不下來），再加點幾樣經典烤物與清爽配菜解膩；不喝酒也可以搭配烏龍茶/汽水。熱門時段可能需要候位，帶長輩建議早點到或避開 19:00～21:00 高峰。",
          nav: "https://maps.app.goo.gl/AVqaPHZ7FuUB4ymj9",
          address: "福岡市中央区警固2-16-10",
          icon: <Utensils size={18} />,
        },
        {
          time: "晚上",
          type: "購物",
          title: "博多運河城逛街 or 休息",
          desc: "晚餐後可至運河城逛逛（有大型水舞秀），或直接回民宿休息。",
          showShoppingLink: true,
          shoppingTab: "hakata",
          shoppingText: "查看博多逛街清單",
          hasSurroundingsLink: true,
          about:
            "運河城是結合購物、娛樂的大型複合設施，每天晚上的水舞秀非常有名。",
          nav: "博多運河城",
          icon: <ShoppingBag size={18} />,
        },
      ],
    },
    {
      day: 3,
      date: "1/12 (週一)",
      title: "太宰府參拜・市區美食巡禮",
      location: "太宰府 / 博多",
      weather: "局部降雨 7°C",
      image:
        "https://images.unsplash.com/photo-1623310073404-fe9953eadb04?auto=format&fit=crop&w=1200&q=80",
      activities: [
        {
          time: "09:00",
          type: "美食",
          title: "早餐：藍瓶咖啡 Blue Bottle Coffee",
          desc: "在警固神社旁的藍瓶咖啡開啟悠閒的一天。",
          about:
            "位於警固神社境內/旁的精品咖啡店，空間把神社的靜謐感和現代設計融合得很好，很適合用咖啡把節奏放慢。必吃/必喝建議從經典拿鐵或手沖下手；不喝咖啡的人也能選茶飲或無咖啡因飲品，搭配簡單甜點當早餐。早上人潮相對舒服，想拍照或帶長輩坐著聊天，建議避開午前後尖峰。",
          nav: "https://maps.app.goo.gl/wXyNwvzSCbQStQYf6",
          address: "福岡市中央区天神2-2-20",
          icon: <Utensils size={18} />,
        },
        {
          time: "10:00",
          type: "景點",
          title: "警固神社",
          desc: "早餐後直接在境內參拜，欣賞繁華天神中的寧靜之地。",
          about:
            "警固神社坐落在天神最熱鬧的區域旁，卻保有一份安靜，是「城市裡的神社」代表。相傳長年守護福岡城下町，參拜重點多是祈求除厄、轉運與平安。這裡的特色之一是境內設施更貼近現代生活（例如足湯等），很適合作為逛街前的短暫休息點；帶長輩來走走、呼吸一下安靜空氣也很舒服。",
          nav: "https://maps.app.goo.gl/KKuU72EA69mACRVP9",
          address: "福岡市中央区天神2-2-20",
          icon: <MapPin size={18} />,
        },
        {
          time: "10:45",
          type: "交通",
          title: "前往太宰府",
          desc: "步行至西鐵天神站，搭乘電車前往太宰府（車程約 30 分鐘）。",
          about:
            "從天神出發前往太宰府相當方便，通常搭乘西鐵電車再轉太宰府線即可。若時間湊巧可搭到「旅人（たびと）號」觀光電車，車身與車內常見太宰府意象設計，氣氛更像小旅行。建議先確認回程時間，避免在景點逗留過久影響晚餐；帶長輩的話，盡量選擇有座位的車次並把轉乘路線（電梯位置）先看好。",
          nav: "西鐵天神站",
          icon: <Train size={18} />,
        },
        {
          time: "11:45",
          type: "景點",
          title: "宝満宮 竈門神社",
          desc: "抵達太宰府站後，搭乘「真秀羅場號」公車前往竈門神社。",
          about:
            "竈門神社位於寶滿山系一帶，以「結緣、戀愛成就」聞名，因此御守與繪馬很受歡迎。神社建築與授與所設計相對現代，和傳統神社氛圍不同，拍照很漂亮。近年也因名稱與傳說聯想，被《鬼滅之刃》粉絲視為朝聖點之一。若遇到雨天或天冷，山上風更大，建議帶好保暖外套；帶長輩可把參拜重點放在本殿周邊，避免走太多坡路。",
          nav: "https://maps.app.goo.gl/voYxFMHAqDuL4VtK7",
          address: "福岡県太宰府市内山883",
          icon: <MapPin size={18} />,
        },
        {
          time: "13:00",
          type: "景點",
          title: "天開稻荷神社",
          desc: "搭乘公車於「三条公民館」下車，步行前往。",
          about:
            "天開稻荷神社位於太宰府天滿宮後方山坡上，最吸睛的是整排朱紅色稻荷鳥居，拍照非常有氛圍。稻荷神多與五穀豐收、商業繁盛、財運開運相關，因此很多人會特地來求財、求生意順利。階梯不算太長但仍有上坡；帶長輩建議慢慢走、隨時休息，重點拍鳥居與參拜即可。",
          nav: "https://maps.app.goo.gl/zMVNKwmaSQdJVLo46",
          address: "福岡県太宰府市宰府4-7-1",
          icon: <MapPin size={18} />,
        },
        {
          time: "14:00",
          type: "景點",
          title: "太宰府天滿宮 & 表參道",
          desc: "從天開稻荷神社往下走即達天滿宮主殿。參拜後逛表參道吃梅枝餅。",
          highlight: "午餐建議：表參道各式小吃或暖暮拉麵",
          about:
            "太宰府天滿宮是九州最具代表性的神社之一，供奉「學問之神」菅原道真，因此祈求考運、學業與智慧特別有名。境內以梅花（道真公愛梅的故事）與歷史建築聞名，散步氛圍莊嚴又舒服。表參道必吃名物是現烤梅枝餅（外皮微脆、內餡紅豆，熱熱吃最好）；也可以順便逛隈研吾設計的星巴克建築、挑伴手禮。小提醒：人潮多時參道較擁擠，帶長輩建議避開正午並選擇平緩路線慢慢逛。",
          nav: "https://maps.app.goo.gl/yPywku4sE55BYYtx7",
          address: "福岡県太宰府市宰府4-7-1",
          icon: <MapPin size={18} />,
          subItems: [
            { title: "逛表參道", desc: "各式伴手禮店與宮崎駿商店" },
            { title: "吃梅枝餅", desc: "現烤口感最佳，外酥內軟" },
          ],
        },
        {
          time: "晚上",
          type: "購物",
          title: "回天神逛街 or 休息",
          desc: "搭電車返回天神。可繼續購物補貨，或回民宿稍作休息。",
          showShoppingLink: true,
          shoppingTab: "tenjin",
          shoppingText: "查看天神逛街清單",
          hasSurroundingsLink: true,
          nav: "天神駅",
          icon: <ShoppingBag size={18} />,
        },
        {
          time: "晚餐",
          type: "美食",
          title: "晚餐：中洲屋台",
          desc: "傍晚前往那珂川邊，體驗道地的博多屋台文化。",
          about:
            "屋台是福岡最具代表性的夜生活文化之一，沿著那珂川與中洲一帶點燈後氣氛非常熱鬧。必吃推薦：博多豚骨拉麵、關東煮、烤雞串、一口餃子、明太子系小菜（例如明太子玉子燒）等；多人同行最適合每樣點一點分食。屋台座位通常不多、翻桌快但仍可能排隊；帶長輩可先找有空位的屋台坐下再慢慢點餐，天冷時記得帶圍巾或暖暖包。",
          nav: "中洲屋台",
          icon: <Utensils size={18} />,
        },
      ],
    },
    {
      day: 4,
      date: "1/13 (週二)",
      title: "門司港復古建築・小倉城漫遊",
      location: "北九州",
      weather: "強風 6°C",
      image:
        "https://images.unsplash.com/photo-1650960183895-f3931f27bd6f?auto=format&fit=crop&w=1200&q=80",
      activities: [
        {
          time: "09:00",
          type: "美食",
          title: "早餐：The Full Full Hakata",
          desc: "明太子法國麵包非常有名的烘焙坊。",
          about:
            "博多人氣烘焙坊之一，招牌是明太子法國麵包：外皮酥脆、內部鬆軟，明太子醬鹹香濃郁非常「福岡」。想吃更完整可以再配一款甜麵包或咖啡當早餐；也很適合外帶回民宿分食，對長輩更友善。熱門時段常有人排隊，建議早點去或直接外帶邊走邊吃。",
          nav: "https://maps.app.goo.gl/CzvpSyu2RpvXhzZy5",
          address: "福岡市博多区祇園町9-3",
          icon: <Utensils size={18} />,
        },
        {
          time: "10:15",
          type: "交通",
          title: "前往小倉",
          desc: "吃完早餐步行至博多站，搭乘山陽新幹線前往小倉站（車程約 15 分鐘）。",
          about:
            "博多到小倉搭新幹線約 15～20 分鐘，是最省時也最舒適的移動方式之一，特別適合帶長輩。建議提前在車站把票/座位處理好（自由席或指定席皆可；行李多就選指定席更安心），上車前再買飲料與小點心。新幹線班次密集，抓好集合時間即可，行程彈性很高。",
          nav: "博多站 -> 小倉站",
          icon: <Train size={18} />,
        },
        {
          time: "11:00",
          type: "景點",
          title: "小倉城 & 八坂神社",
          desc: "參觀小倉城天守閣（唐造樣式）與相鄰的八坂神社。",
          about:
            "小倉城的歷史可追溯到戰國末期，著名武將細川忠興與其後藩主都在此留下痕跡。現在看到的天守雖為後世重建，但城郭布局與石垣仍能感受到北九州戰略要地的氣勢；登高也能俯瞰市景。相鄰的八坂神社則是在地人祈求除厄、家內平安與生意興隆的重要神社。建議參觀順序：先在城外拍全景與護城河，再進天守看展覽/眺望，最後到神社簡單參拜收尾，節奏最順也不會太累。",
          nav: "https://maps.app.goo.gl/yXQ7J2k8X5X7y5X7",
          address: "北九州市小倉北区城内2-1",
          icon: <MapPin size={18} />,
        },
        {
          time: "12:30",
          type: "交通",
          title: "前往門司港",
          desc: "從小倉站搭乘 JR 鹿兒島本線前往門司港站（車程約 15 分鐘）。",
          about:
            "從小倉到門司港搭 JR 約 15～20 分鐘，路線簡單好懂。門司港站本身就是國家重要文化財級的復古站舍，帶有大正/昭和早期風格，非常值得先在站內外拍照再開始散策。抵達後港區多為平坦步行路線，適合長輩慢慢走、邊看海邊建築邊休息。",
          nav: "小倉站 -> 門司港站",
          icon: <Train size={18} />,
        },
        {
          time: "13:00",
          type: "美食",
          title: "午餐：燒咖哩",
          desc: "在門司港隨意挑選一間餐廳品嚐名物「燒咖哩」。",
          about:
            "燒咖哩是門司港名物：把咖哩飯加上起司（有時還會加蛋/海鮮/漢堡排等配料），再放入烤箱焗烤到表面焦香，香氣非常迷人。必吃點法推薦：經典起司蛋黃款（濃郁滑順）、或海鮮燒咖哩（更有港町感）。長輩若怕辣可請店家做溫和口味，搭配沙拉/飲料更順口；剛上桌很燙，記得稍微放涼再吃。",
          nav: "門司港燒咖哩",
          address: "北九州市門司区港町",
          icon: <Utensils size={18} />,
        },
        {
          time: "14:00",
          type: "景點",
          title: "門司港懷舊區散策",
          desc: "參觀懷舊展望室與大連友好記念館，漫步港灣。",
          about:
            "門司港在明治～大正時期是日本重要的國際貿易港之一，曾是連結本州與九州、以及對外航線的門戶，因此留下大量洋風建築與「大正浪漫」港町氛圍。散策亮點：懷舊展望室可俯瞰港灣與關門海峽；大連友好記念館則呼應當年與海外港口交流的歷史脈絡。整體路線好走又好拍，建議用「海邊慢走 + 進室內景點休息」交替，對長輩最友善。",
          nav: "門司港懷舊區",
          address: "北九州市門司区港町",
          icon: <MapPin size={18} />,
          subItems: [
            {
              title: "懷舊展望室",
              desc: "眺望關門海峽絕景",
              nav: "https://maps.app.goo.gl/QVbQzT6F1mhy2Tcp8",
            },
            {
              title: "大連友好記念館",
              desc: "紅磚歐式建築",
              nav: "https://maps.app.goo.gl/hf2VS5aLUHRUdWzh6",
            },
          ],
        },
        {
          time: "16:00",
          type: "交通",
          title: "前往皿倉山",
          desc: "門司港站 -> 八幡站，再搭計程車/接駁車前往皿倉山纜車站。",
          about:
            "這段移動的目標是趕上皿倉山從黃昏到入夜的最佳觀景時段。通常會先搭 JR 到八幡站，再用計程車或接駁前往纜車站；若遇到天候不佳或風大，纜車可能調整班次，建議出發前快速確認營運資訊。帶長輩時，這段最好把保暖與點心先準備好（山上風大體感溫度低），上山後就能專心看夜景。",
          nav: "八幡站",
          icon: <Train size={18} />,
        },
        {
          time: "17:30",
          type: "景點",
          title: "皿倉山夜景",
          desc: "搭乘纜車與爬坡車登頂，欣賞日落至夜幕低垂的百億美元夜景。",
          about:
            "皿倉山是北九州最具代表性的觀景點之一，視野能一口氣看到市區燈海、港口與遠方海岸線，常被稱為百億美元夜景。搭乘纜車再轉爬坡車上山本身就是體驗的一部分，對長輩也相對輕鬆。建議抵達時間抓在日落前後，能同時看到夕陽、藍調時刻與全亮夜景；山頂風大且溫度低，務必帶帽子/圍巾與手套。",
          nav: "皿倉山",
          address: "北九州市八幡東区大字尾倉1481-1",
          icon: <MapPin size={18} />,
        },
        {
          time: "19:00",
          type: "交通",
          title: "返回博多",
          desc: "下山後回八幡站 -> 小倉站 -> 轉乘新幹線回博多。",
          about:
            "夜景結束後的回程以「少走路、少轉乘」為原則：先回到八幡/小倉再接新幹線回博多，時間短、座位舒適，長輩也比較不會累。若當天很晚，建議先確認末班車時間並預留轉乘緩衝；想更保險也可依當天狀況改用計程車到小倉再搭新幹線。",
          nav: "八幡站 -> 博多站",
          icon: <Train size={18} />,
        },
      ],
    },
    {
      day: 5,
      date: "1/14 (週三)",
      title: "公園散步・伴手禮採買・歸途",
      location: "福岡市區",
      weather: "晴天 9°C",
      image:
        "https://images.unsplash.com/photo-1736243355712-9db556734189?auto=format&fit=crop&w=1200&q=80",
      activities: [
        {
          time: "早上",
          type: "美食",
          title: "早餐：民宿簡單吃",
          desc: "享用前幾天預先買好的早餐，收拾行李準備退房。",
          about: "最後一天早晨，悠閒地在民宿度過。",
          nav: "民宿",
          icon: <Utensils size={18} />,
        },
        {
          time: "10:00",
          type: "住宿",
          title: "Check out & 寄放行李",
          desc: "10:00 辦理退房，將行李寄放在民宿（最晚可延後退房至 12:00）。",
          about: "輕鬆出門，享受最後的福岡時光。",
          nav: "民宿",
          icon: <Hotel size={18} />,
        },
        {
          time: "11:00",
          type: "景點",
          title: "大濠公園",
          desc: "搭乘地鐵至大濠公園站。環湖散步，享受城市綠洲的氛圍。",
          about:
            "大濠公園原本是福岡城外護城河的一部分，後來整備成都市公園，據說概念仿照「西湖」的水景設計，因此環湖散步非常舒服。公園有寬敞平坦的步道、湖中島與橋景，四季風景都漂亮，是福岡市民最愛的日常休閒地。帶長輩建議以「慢走一小圈 + 找長椅休息」的節奏進行，也可以順路安排咖啡或甜點作為中繼站。",
          nav: "大濠公園",
          icon: <MapPin size={18} />,
        },
        {
          time: "備選",
          type: "美食",
          title: "&LOCALS 大濠公園",
          desc: "位於公園內的時尚咖啡廳，販售九州在地食材製作的餐點與飲品。（想吃可以來）",
          about:
            "位於大濠公園內的人氣咖啡餐飲空間，主打九州在地食材與舒服的湖景氛圍，是散步途中最理想的休息點。必吃推薦：八女茶相關飲品（茶香很有層次）、稻荷壽司/輕食組合，鹹甜都有、也很適合長輩。若天氣好可選靠窗或戶外座位，邊看湖邊散步人潮邊慢慢吃，節奏很療癒。",
          nav: "https://maps.app.goo.gl/PfVJNtWqruEuEME19",
          address: "福岡市中央区大濠公園1-9",
          icon: <Utensils size={18} />,
        },
        {
          time: "甜點",
          type: "美食",
          title: "Parfait Lab PINSIRIO",
          desc: "品嚐精緻的芭菲（聖代）甜點。",
          about:
            "大濠公園附近的人氣甜點店，以像藝術品一樣分層精緻的芭菲（Parfait）聞名，通常會使用當季水果、冰淇淋與脆餅/果凍等層次堆疊，吃起來香氣與口感變化很多。必吃建議：優先點當季水果口味（最能吃到新鮮香氣），兩人分食一份也很剛好。座位有限時可能需要候位，怕等的話可以改成外帶或把它當成散步後的獎勵點。",
          nav: "https://maps.app.goo.gl/jHGg9naMgRfus2VU7",
          address: "福岡市中央区黒門8-15",
          icon: <Utensils size={18} />,
        },
        {
          time: "12:30",
          type: "景點",
          title: "舞鶴公園 & 福岡城跡",
          desc: "步行前往鄰近的舞鶴公園，參觀福岡城遺跡。",
          about:
            "舞鶴公園一帶是福岡城（又名舞鶴城）的城址，由黑田長政在江戶初期築城，是九州重要的近世城郭之一。雖然天守閣已不復存在，但石垣、城門遺構與護城河格局仍能想像當年城郭規模；春天櫻花季尤其著名。散步建議以平緩路段為主：走到視野好的石垣拍照、看城跡輪廓即可，不必追求走完全區，對長輩更輕鬆。",
          nav: "舞鶴公園",
          icon: <MapPin size={18} />,
        },
        {
          time: "午餐",
          type: "美食",
          title: "午餐：Sanuki Udon Shinari",
          desc: "品嚐著名的讚岐烏龍麵（志成）。",
          about:
            "福岡口碑很高的烏龍麵名店，麵條帶有讚岐系的彈性與滑順口感，湯頭也很乾淨耐喝。必吃推薦：經典熱湯烏龍（暖胃、很適合長輩）、或冷的沾麵/拌麵（口感更Q）；配菜一定要加點炸物（例如牛蒡天婦羅或當日推薦），外酥內香很加分。尖峰時段可能排隊，若想省時間可避開 12:00～13:30。",
          nav: "https://maps.app.goo.gl/5JTUN5zRNpAtbtMW7",
          address: "福岡市中央区大手門3-3-24",
          icon: <Utensils size={18} />,
        },
        {
          time: "14:00",
          type: "交通",
          title: "回民宿領取行李 & 前往機場",
          desc: "從大濠公園站回民宿拿行李，接著從博多站前往福岡機場。",
          about:
            "最後一天移動建議用「少轉乘、早到機場」策略：先回民宿取行李再前往博多/機場。福岡機場到市區距離短，但安檢與報到仍建議預留充足緩衝（尤其行李多或帶長輩）。若搭地鐵，博多到機場非常快；若搭計程車則更省體力但費用較高。抵達後可先讓爸媽在候機區休息、再慢慢處理登機手續，節奏會更從容。",
          nav: "民宿 -> 博多站 -> 福岡機場",
          icon: <Train size={18} />,
        },
      ],
    },
  ],
};
