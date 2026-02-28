export const tripData = {
  flight: [
    {
      date: "03/01",
      route: "TPE -> NRT",
      time: "15:40 - 19:55",
      flightNo: "Peach MM 628",
      type: "flight",
      baggage: "手提行李：合計兩件總共7kg\n托運行李：共一件20kg"
    },
    {
      date: "03/05",
      route: "HND -> HKD",
      time: "09:40 - 11:00",
      flightNo: "ANA NH 553",
      type: "flight",
      baggage: "手提行李：合計兩件總共10kg\n托運行李：不限件數，總重20kg"
    },
    {
      date: "03/10",
      route: "CTS -> TPE",
      time: "11:55 - 15:35",
      flightNo: "Tigerair IT 235",
      type: "flight",
      baggage: "手提行李：合計兩件總共10kg\n托運行李：不限件數，總重20kg"
    },
  ],
  shopping: {
    shinjuku: [
      {
        name: "LUMINE EST新宿",
        floor: "B2～8F",
        hours: "平日 11:00～21:00 / 土日祝 10:30～21:00",
        link: "https://maps.app.goo.gl/gGehBqdLvvwf1EPX7",
      },
      {
        name: "Beams japan",
        floor: "B1F～5F",
        hours: "11:00～20:00",
        link: "https://maps.app.goo.gl/ce7Gq8GwySsuCn5s7",
      },
    ],
    shibuya: [
      {
        name: "niko and ... TOKYO",
        floor: "1F・2F",
        hours: "11:00～21:00",
        link: "https://maps.app.goo.gl/LyskAo9oSNLDCYa56",
      },
      {
        name: "HARE",
        floor: "1F",
        hours: "平日 12:00～20:00 / 土日祝 11:00～20:00",
        link: "https://maps.app.goo.gl/Msij3cYXSbJVBZX7A",
      },
      {
        name: "FREAK'S STORE",
        floor: "1F",
        hours: "11:00～21:00",
        link: "https://maps.app.goo.gl/qnsq6EaxZX8tHXiN9",
      },
      {
        name: "RAGEBLUE",
        floor: "1F",
        hours: "11:00～21:00",
        link: "https://maps.app.goo.gl/Hb89UjoGYNg4JjRH7",
      },
      {
        name: "mizuno",
        floor: "1F",
        hours: "10:00～21:00",
        link: "https://maps.app.goo.gl/CtTQtoNdzmxSs8d6A",
      },
      {
        name: "ABC-MART GRAND STAGE",
        floor: "B1F",
        hours: "10:00～21:00",
        link: "https://maps.app.goo.gl/haTSzwVNuUGQ8V6q6",
      },
      {
        name: "澀谷 PARCO",
        floor: "B1F～7F",
        hours: "物販 11:00～21:00 / 飲食 11:30～23:00",
        link: "https://maps.app.goo.gl/9Sbx1wuiwd2KdhAw5",
      },
    ],
    nakameguro: [],
    daikanyama: [],
  },
  food: {
    sapporo: [
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
    hakodate: [
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
  accommodation: [
    {
      region: "東京",
      name: "LANDABOUT TOKYO",
      address: "東京都台東区根岸1-3-13",
      checkIn: "03/01 15:00",
      checkOut: "03/05 11:00",
      mapUrl: "https://maps.app.goo.gl/ex4LRq41YRcABJ17A",
      type: "hotel",
      note: "禁菸客房、免費 WiFi、餐廳（Landabout Table）提供歐陸式早餐（07:00–10:00，約 JPY 1,650／人）。最近車站：鶯谷站步行約3分鐘",
    },
    {
      region: "函館",
      name: "OMO5 函館 by 星野集團",
      address: "北海道函館市若松町24-1",
      checkIn: "03/05 15:00",
      checkOut: "03/06 11:00",
      mapUrl: "https://maps.app.goo.gl/CAbQZTZLamMNQpm99",
      type: "hotel",
      note: "溫泉（源泉掛流式）、OMO Base 公共空間（咖啡廳/酒吧/露台）、海鮮自助早餐、免費 WiFi。從 JR 函館車站步行約5分鐘。免費巡迴接駁巴士（函館免費周遊巴士）",
    },
    {
      region: "小樽",
      name: "小樽格里茲頂級飯店",
      address: "北海道小樽市稲穂1丁目3-13",
      checkIn: "03/06 15:00",
      checkOut: "03/07 11:00",
      mapUrl: "https://maps.app.goo.gl/CbCAumFE6t2d5ya48",
      type: "hotel",
      note: "免費 WiFi、現代化設計。詳細資訊請參考官方網站",
    },
    {
      region: "富良野",
      name: "THE ARBANO",
      address: "北海道富良野市錦町富良野市西き町7-13",
      checkIn: "03/07 15:00",
      checkOut: "03/08 10:00",
      mapUrl: "https://maps.app.goo.gl/XdBVGQVBCHp6vLHD8",
      type: "airbnb",
      note: "Airbnb 住宿。詳細資訊請參考 Airbnb 頁面",
    },
    {
      region: "札幌",
      name: "札幌格蘭貝爾酒店",
      address: "北海道札幌市中央区南三条西8丁目10-1",
      checkIn: "03/08 15:00",
      checkOut: "03/09 11:00",
      mapUrl: "https://maps.app.goo.gl/WvqwfNPh7w1TcUGw8",
      type: "hotel",
      note: "天空露天風呂（屋頂露天浴池）、和洋自助早餐約60種、免費 WiFi。從地鐵「すすきの駅」步行約8分鐘",
    },
    {
      region: "新千歲",
      name: "機場航站飯店",
      address: "新千歲機場國內航站樓內",
      checkIn: "03/09 14:00",
      checkOut: "03/10 11:00",
      mapUrl: "https://maps.app.goo.gl/QL8d9AqpSWEfANd79",
      type: "hotel",
      note: "直接連接國內航站樓、免費 WiFi、機場溫泉（住客免費使用）、日式/西式自助早餐（6:00-9:30）。從 JR 新千歲機場站步行約5分鐘",
    },
  ],
  emergency: [
    { name: "Police", number: "110" },
    { name: "Fire/Ambulance", number: "119" },
    { name: "TECO Sapporo", number: "+81-80-1460-2568" },
  ],
  itinerary: [
    {
      day: 1,
      date: "03/01 (週日)",
      title: "成田入境・東京・鶯谷",
      location: "東京",
      image:
        "banner/D1.jpg",
      activities: [
        {
          time: "19:55",
          type: "交通",
          title: "成田機場",
          desc: "抵達成田機場",
          about: "成田國際機場（NRT），從桃園搭乘 Peach MM 628 抵達。",
          address: "千葉県成田市古込1-1",
          nav: "https://maps.app.goo.gl/GaGa6ZAqwHCVqP1G8",
        },
        {
          time: "20:30",
          type: "交通",
          title: "SKYLINER → 日暮里 → 山手線 → 鶯谷",
          desc: "搭 SKYLINER 到日暮里，轉山手線到鶯谷站",
          about: "成田機場可搭乘京成 SKYLINER 至日暮里站（約 41 分鐘），再轉 JR 山手線至鶯谷站。",
          address: "東京都荒川区西日暮里2丁目",
          nav: "https://maps.app.goo.gl/s8f6id1d54QoEYX3A",
        },
        {
          time: "21:30",
          type: "住宿",
          title: "LANDABOUT TOKYO",
          desc: "回飯店 check in",
          about: "位於鶯谷站附近的飯店。",
          address: "東京都台東区根岸1-3-13",
          nav: "https://maps.app.goo.gl/LoCEGcwt8JWx4JNZ8",
        },
        {
          time: "晚上",
          type: "景點",
          title: "萩之湯",
          desc: "錢湯／澡堂",
          about: "鶯谷一帶的錢湯，可放鬆一天的疲勞。",
          address: "東京都台東区根岸1-2-11",
          nav: "https://maps.app.goo.gl/X82L9xMEcy8MxLqs9",
        },
      ],
    },
    {
      day: 2,
      date: "03/02 (週一)",
      title: "谷根千・新宿",
      location: "東京",
      weather: "",
      image:
        "banner/D2.jpg",
      activities: [
        {
          time: "上午",
          type: "景點",
          title: "谷根千（谷中・根津・千駄木）",
          desc: "散步、古民家咖啡、寺社、貓街等",
          about: "谷根千是谷中、根津、千駄木的合稱，保留下町風情，適合散步與喫茶。",
          address: "東京都台東区谷中3-13-1",
          nav: "谷中銀座",
        },
        {
          time: "下午",
          type: "景點",
          title: "新宿",
          desc: "逛街、用餐（可搭配逛街清單・新宿）",
          about: "新宿站周邊百貨與商圈，可逛 LUMINE EST、BEAMS JAPAN 等。",
          address: "東京都新宿区西新宿1-1-4",
          nav: "新宿駅",
        },
      ],
    },
    {
      day: 3,
      date: "03/03 (週二)",
      title: "中目黑・代官山・渋谷",
      location: "東京",
      weather: "",
      image:
        "banner/D3.png",
      activities: [
        {
          time: "上午",
          type: "景點",
          title: "中目黑",
          desc: "目黑川沿線、咖啡與選物店",
          about: "中目黑站與目黑川周邊，櫻花季以外也適合散步與咖啡巡禮。",
          address: "東京都目黒区上目黒2-1-3",
          nav: "中目黒駅",
        },
        {
          time: "中午",
          type: "景點",
          title: "代官山",
          desc: "蔦屋書店、複合設施、雜貨・服飾",
          about: "代官山站周邊，可逛蔦屋書店、複合設施與特色小店。",
          address: "東京都渋谷区代官山町17-5",
          nav: "代官山駅",
        },
        {
          time: "下午",
          type: "景點",
          title: "渋谷",
          desc: "逛街、用餐（可搭配逛街清單・澀谷）",
          about: "渋谷站周邊，可逛 niko and ...、PARCO、HARE 等（見逛街清單）。",
          address: "東京都渋谷区渋谷2-24-12",
          nav: "渋谷駅",
        },
      ],
    },
    {
      day: 4,
      date: "03/04 (週三)",
      title: "Tokyo Disney Sea",
      location: "東京",
      image:
        "banner/D4.webp",
      activities: [
        {
          time: "全日",
          type: "景點",
          title: "Tokyo Disney Sea",
          desc: "東京迪士尼海洋（Tokyo DisneySea）是全世界唯一以海洋為主題的迪士尼樂園，結合七大主題海港與原創故事，適合大人與情侶悠閒探索。",
          about: `【遊樂設施】
                  ・長髮公主遊船
                  ・茉莉公主飛天魔毯
                  ・小胖的飛魚雲霄飛車
                  ・長髮公主餐廳
                  ・美人魚礁石區
                  ・小飛俠夢幻島歷險記
                  ・驚魂古塔
                  ・地心探險之旅
                  ・印第安納瓊斯冒險旅程：水晶骷髏頭魔宮
                  ・翱翔：夢幻奇航
                  ・玩具總動員瘋狂遊戲屋 Toy Story Mania！

                  【美食】
                  ・壽司捲（鮮蝦雞條）— 海濱小吃亭
                  ・熱狗堡 — 德倫西餐車
                  ・救生圈包子（鮮蝦）— 海邊小吃

                  【遊行・表演】
                  ・Duffy：11:30、14:10
                  ・晚間遊行：19:30
                  ・煙火：20:45
                  ・Dance the globe：12:50、14:35、16:55、18:40`,
          address: "千葉県浦安市舞浜1-13",
          nav: "https://maps.app.goo.gl/7USkcdGR7SbW8p5n6",
        },
      ],
    },
    {
      day: 5,
      date: "03/05 (週四)",
      title: "函館",
      location: "函館",
      image:
        "banner/D5.jpg",
      activities: [
        {
          time: "11:00",
          type: "交通",
          title: "函館機場",
          desc: "抵達函館機場（淩、卓 11:00／華、腸、昕、婷 11:10）",
          about: "函館機場是北海道南部的主要機場，距離函館市區約20分鐘車程。",
          address: "北海道函館市高松町511",
          nav: "https://maps.app.goo.gl/x4hXUNJfDWaXzRQE8",
        },
        {
          time: "13:00",
          type: "住宿",
          title: "OMO5 函館 by 星野集團",
          desc: "約 13:00 抵達 check in",
          about: "OMO5 函館 by 星野集團位於函館市中心，距離 JR 函館車站步行約5分鐘。飯店提供溫泉、OMO Base 公共空間等設施。",
          address: "北海道函館市若松町14-10",
          nav: "https://maps.app.goo.gl/S9t1am97onepnjgMA",
        },
        {
          time: "13:30",
          type: "美食",
          title: "函館朝市",
          desc: "午餐：村上海膽 Uni Murakami Hakodate station store／幸運小丑漢堡",
          about: "函館朝市是北海道最著名的海鮮市場之一。可至村上海膽或幸運小丑漢堡用餐。",
          address: "北海道函館市若松町9-19",
          nav: "https://maps.app.goo.gl/mYjStQtZ83zRFViF7",
        },
        {
          time: "14:30",
          type: "景點",
          title: "五稜郭公園",
          desc: "約 14:30 抵達，停留 1～1.5 小時。五稜郭展望台 ¥1200／人。附近道立函館美術館（付費）。停車：1 小時內 ¥200，之後每 30 分鐘加 ¥100",
          about: "五稜郭是日本第一座西式星形要塞。可登上五稜郭展望台俯瞰星形全景。可順訪六花亭五稜郭店。",
          address: "北海道函館市五稜郭町44",
          nav: "https://maps.app.goo.gl/ufBxf8vVNVifaaky8",
        },
        {
          time: "16:30",
          type: "景點",
          title: "金森紅磚倉庫",
          desc: "約 16:30 抵達，停留約半小時。去紅磚倉庫前可先順路去根室花丸抽號碼牌",
          about: "金森紅磚倉庫是函館港邊的歷史建築群，已改建為購物中心、餐廳和咖啡廳。",
          address: "北海道函館市末広町14-12",
          nav: "https://maps.app.goo.gl/umaRj8LyCLXsiHjE8",
        },
        {
          time: "16:45",
          type: "景點",
          title: "八幡坂",
          desc: "打卡八幡坂",
          about: "八幡坂是函館著名的坡道景點，可眺望港灣與街景。",
          address: "北海道函館市末広町",
          nav: "https://maps.app.goo.gl/4xBfb9QqYgHXdH1A7",
        },
        {
          time: "18:00",
          type: "美食",
          title: "根室花丸迴轉壽司",
          desc: "晚餐：根室花丸迴轉壽司",
          about: "根室花丸是北海道知名的迴轉壽司連鎖店，以新鮮海鮮與合理價格著稱。建議提早抽號碼牌。",
          address: "北海道函館市若松町11-4",
          nav: "https://maps.app.goo.gl/HdMioSLM9vxt46bJ6",
        },
        {
          time: "19:00",
          type: "景點",
          title: "函館山觀景台",
          desc: "搭乘函館市電至「十字街站」，再步行約 10 分鐘至纜車站。纜車營運 10:00–21:00（約 10–15 分鐘一班）",
          about: "函館山夜景被譽為世界三大夜景之一，可俯瞰函館市區與港灣燈火。",
          address: "北海道函館市元町19-7",
          nav: "https://maps.app.goo.gl/6UkUrdin8vWHvTzZ7",
        },
      ],
    },
        {
      day: 6,
      date: "03/06 (週五)",
      title: "洞爺湖、小樽",
      location: "洞爺湖→小樽",
      image:
        "banner/D6.jpg",
      activities: [
        {
          time: "07:00",
          type: "住宿",
          title: "OMO5 函館 by 星野集團",
          desc: "飯店早餐，8 點出發 check out",
          about: "從函館出發，開始今天的旅程。",
          address: "北海道函館市若松町14-10",
          nav: "https://maps.app.goo.gl/UyHbbQHmB77HFu91A",
        },
        {
          time: "10:30",
          type: "景點",
          title: "洞爺湖",
          desc: "預計 10:30 抵達，停留約 1 小時。洞爺湖噴泉廣場／筒倉展望台（有停車場）",
          about: "洞爺湖是北海道著名的火山口湖，可至噴泉廣場或筒倉展望台欣賞湖光山色。",
          address: "北海道虻田郡洞爺湖町洞爺湖温泉",
          nav: "https://maps.app.goo.gl/utSPDs9ExoC92D3u8",
        },
        {
          time: "12:00",
          type: "美食",
          title: "Lake Hill Farm",
          desc: "Lake Hill Farm 午餐，約 12 點離開",
          about: "Lake Hill Farm 為農場與花園景觀餐廳，可享用午餐並選購農場產品。",
          address: "北海道有珠郡壮瞥町字滝之町291-5",
          nav: "https://maps.app.goo.gl/8Hw5K77t1J6zoEGX7",
        },
        {
          time: "13:00",
          type: "景點",
          title: "地獄谷",
          desc: "預計 13 點抵達，停留約半小時。登別地獄谷駐車場：¥500（計次）",
          about: "地獄谷是登別溫泉的著名景點，火山口遺跡不斷冒出硫磺蒸汽，形成獨特的地熱景觀。",
          address: "北海道登別市登別温泉町",
          nav: "https://maps.app.goo.gl/QJjYmJci62psSQbM9",
        },
        {
          time: "16:30",
          type: "景點",
          title: "小樽運河",
          desc: "預計 16:30 抵達。小樽停車可考慮北一硝子附近 Kitaichigarasu Tokuyaku Parking Lot，第 1 小時 ¥300，之後每 20 分 ¥100",
          about: "小樽運河兩旁保留明治時代倉庫建築，已改建為商店與餐廳，夜晚點燈景色浪漫。",
          address: "北海道小樽市港町",
          nav: "https://maps.app.goo.gl/jzkRgzkDFRYxjs7Y6",
        },
        {
          time: "17:00",
          type: "住宿",
          title: "小樽格里茲頂級飯店",
          desc: "check in",
          about: "小樽格里茲頂級飯店位於小樽市中心，交通便利。",
          address: "北海道小樽市堺町1-2-15",
          nav: "https://maps.app.goo.gl/KUahNhDZormojLe5A",
        },
        {
          time: "19:00",
          type: "美食",
          title: "小樽倉庫 No.1 啤酒釀造所",
          desc: "19 點用餐",
          about: "小樽倉庫 No.1 啤酒釀造所可參觀釀造過程，並在餐廳品嚐啤酒與美食。",
          address: "北海道小樽市港町5-4",
          nav: "https://maps.app.goo.gl/E9tEB4tJdBhwXGfs7",
        },
      ],
        },
        {
      day: 7,
      date: "03/07 (週六)",
      title: "旭川、美瑛",
      location: "旭川→美瑛→富良野",
      image:
        "banner/D7.webp",
      activities: [
        {
          time: "07:00",
          type: "住宿",
          title: "小樽格里茲頂級飯店",
          desc: "check out，出發",
          about: "從小樽出發，前往旭川、美瑛。",
          address: "北海道小樽市堺町1-2-15",
          nav: "https://maps.app.goo.gl/KUahNhDZormojLe5A",
        },
        {
          time: "10:30",
          type: "景點",
          title: "旭山動物園",
          desc: "預計 10:30 抵達，13:00 離開。冬期営業 10:30–15:30（最終入園 15:00）。企鵝散步 11:00。正門停車場免費",
          about: "旭山動物園是日本最北端的動物園，以獨特展示方式聞名。企鵝散步與北極熊展示非常受歡迎。",
          address: "北海道旭川市東旭川町倉沼",
          nav: "https://maps.app.goo.gl/voi5uEaxTgHE2n42A",
        },
        {
          time: "13:30",
          type: "美食",
          title: "KINGBEAR 旭川綠町店",
          desc: "午餐 13:30，用餐約 1 小時",
          about: "KINGBEAR 旭川綠町店提供日式料理，位於旭川市中心。",
          address: "北海道旭川市緑町2-1-1",
          nav: "https://maps.app.goo.gl/QmT4cSwqD75de7Mw5",
        },
        {
          time: "15:30",
          type: "景點",
          title: "Mild seven hills",
          desc: "預計 15:30 抵達",
          about: "Mild seven hills 是富良野地區的著名景點，可欣賞山丘與自然風光。",
          address: "北海道富良野市字中御料",
          nav: "https://maps.app.goo.gl/nAEWDPGQ7RGkpyYJ7",
        },
        {
          time: "16:30",
          type: "景點",
          title: "Christmas Tree",
          desc: "預計 16:30 抵達",
          about: "Christmas Tree 是富良野著名地標，雪地中孤立的聖誕樹，為熱門拍照景點。",
          address: "北海道富良野市字中御料",
          nav: "https://maps.app.goo.gl/f8Kf5mpgYUHPkkyc6",
        },
        {
          time: "18:00",
          type: "景點",
          title: "森林精靈露台",
          desc: "預計 18:00 抵達",
          about: "森林精靈露台（Ningle Terrace）由多間小木屋組成的手工藝品商店區，夜晚點燈浪漫。",
          address: "北海道富良野市字中御料",
          nav: "https://maps.app.goo.gl/Jx3ieZPwaw8kzLxv6",
        },
        {
          time: "18:30",
          type: "住宿",
          title: "THE ARBANO",
          desc: "check in",
          about: "THE ARBANO 為富良野住宿（Airbnb），詳細資訊請參考旅程資訊中的住宿。",
          address: "北海道富良野市北の峰町",
          nav: "https://maps.app.goo.gl/9vH6xausqp2NPrGA7",
        },
        {
          time: "19:30",
          type: "美食",
          title: "Kumagera",
          desc: "19:30 用餐",
          about: "Kumagera 是富良野地區知名餐廳，提供日式料理與宴會服務。",
          address: "北海道富良野市朝日町1-22",
          nav: "https://maps.app.goo.gl/3BKMu3xMF19CUfmx8",
        },
      ],
        },
        {
      day: 8,
      date: "03/08 (週日)",
      title: "富良野、札幌",
      location: "富良野→札幌",
      image:
        "banner/D8.jpg",
      activities: [
        {
          time: "10:00",
          type: "住宿",
          title: "THE ARBANO",
          desc: "check out",
          about: "THE ARBANO 為富良野住宿（Airbnb），退房後前往札幌。",
          address: "北海道富良野市北の峰町",
          nav: "https://maps.app.goo.gl/9vH6xausqp2NPrGA7",
        },
        {
          time: "10:40",
          type: "美食",
          title: "迴轉壽司 Topical",
          desc: "10:40 用餐，之後前往札幌",
          about: "迴轉壽司 Topical 提供新鮮海鮮壽司，用餐後出發往札幌。",
          address: "北海道富良野市朝日町14-1",
          nav: "https://maps.app.goo.gl/evHxcx5TWUULVQQ77",
        },
        {
          time: "14:00",
          type: "住宿",
          title: "札幌格蘭貝爾酒店",
          desc: "check in",
          about: "札幌格蘭貝爾酒店位於札幌市中心，從地鐵すすきの駅步行約 8 分鐘。",
          address: "北海道札幌市中央区南3条西4-1",
          nav: "https://maps.app.goo.gl/dWeCwfmfp65NpHCB6",
        },
        {
          time: "15:00",
          type: "購物",
          title: "狸小路商店街",
          desc: "狸小路商店街",
          about: "狸小路商店街是札幌最著名的購物街，全長約 1 公里，商店、餐廳與藥妝店林立。",
          address: "北海道札幌市中央区南2条西1～7丁目",
          nav: "https://maps.app.goo.gl/dyZw3zmyz6oBXtWK8",
        },
        {
          time: "16:00",
          type: "景點",
          title: "大通公園",
          desc: "大通公園",
          about: "大通公園是札幌市中心大型公園，全長約 1.5 公里，冬季會舉辦雪祭。",
          address: "北海道札幌市中央区大通西1～12丁目",
          nav: "https://maps.app.goo.gl/Xo3B9Vj1iEB1RmnC7",
        },
        {
          time: "17:00",
          type: "景點",
          title: "札幌啤酒博物館",
          desc: "札幌啤酒博物館",
          about: "札幌啤酒博物館展示啤酒歷史與釀造過程，可了解日本啤酒文化。",
          address: "北海道札幌市東区北7条東9丁目1-1",
          nav: "https://maps.app.goo.gl/LCQRvQ9rAdxasEsP7",
        },
        {
          time: "19:00",
          type: "美食",
          title: "開拓使館燒肉",
          desc: "19:00 用餐（札幌啤酒園開拓使館）",
          about: "開拓使館提供成吉思汗烤肉與啤酒，是體驗北海道美食的熱門餐廳。",
          address: "北海道札幌市東区北7条東9丁目1-1",
          nav: "https://maps.app.goo.gl/SFY7eBeMf8Lk1Gd77",
        },
      ],
        },
        {
      day: 9,
      date: "03/09 (週一)",
      title: "札幌",
      location: "札幌→新千歲機場",
      image:
        "banner/D9.jpg",
      activities: [
        {
          time: "12:00",
          type: "美食",
          title: "Rojiura Curry SAMURAI",
          desc: "午餐：湯咖哩",
          about: "Rojiura Curry SAMURAI 是札幌知名的湯咖哩餐廳，提供多種口味湯咖哩。",
          address: "北海道札幌市中央区南3条西3",
          nav: "https://maps.app.goo.gl/crBn6YN4x6ubVgxbA",
        },
        {
          time: "14:00",
          type: "景點",
          title: "白色戀人公園",
          desc: "參觀白色戀人公園",
          about: "白色戀人公園以白色戀人餅乾聞名，可參觀製作過程、體驗甜點繪畫並選購伴手禮。",
          address: "北海道札幌市西区宮の沢2-2-11-36",
          nav: "https://maps.app.goo.gl/FomtVck54UFPx9vc8",
        },
        {
          time: "17:00",
          type: "交通",
          title: "新千歲機場",
          desc: "前往新千歲機場",
          about: "新千歲機場為北海道主要國際機場，建議預留充足時間辦理登機與出境。",
          address: "北海道千歳市美々",
          nav: "https://maps.app.goo.gl/VKjQjaqHa6iV4vzj7",
        },
      ],
        },
        {
      day: 10,
      date: "03/10 (週二)",
      title: "新千歲機場・返台",
      location: "北海道",
      weather: "",
      image:
        "banner/D10.webp",
      activities: [
        {
          time: "上午",
          type: "交通",
          title: "新千歲機場",
          desc: "辦理登機、托運、出境。建議起飛前 2～3 小時抵達。",
          about: "新千歲機場（CTS）國際線航廈。可預留時間逛機場賣店、用餐。",
          address: "北海道千歳市美々",
          nav: "https://maps.app.goo.gl/VKjQjaqHa6iV4vzj7",
        },
        {
          time: "11:55",
          type: "交通",
          title: "Tigerair IT 235｜CTS → TPE",
          desc: "11:55 新千歲起飛 → 15:35 抵達桃園",
          about: "虎航 IT 235。手提行李合計兩件共 10kg、托運不限件數總重 20kg。",
          address: "北海道千歳市美々",
          nav: "新千歳空港",
        },
      ],
    },
  ],
};
