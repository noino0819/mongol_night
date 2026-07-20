"use strict";
/* ================= 버저 퀴즈쇼 ================= */
/* 난이도 d — 1:몸풀기(순간 헷갈림) 2:반반 갈림 3:오개념 뒤집기("헐 진짜?" · 맞히면 +2) */
const BZ_OX = [
  { q: "상어는 포유류가 아니라 어류다", a: true, d: 1 },
  { q: "박쥐는 새가 아니라 포유류다", a: true, d: 1 },
  { q: "거미는 곤충이 아니다", a: true, d: 1 },
  { q: "고래는 어류가 아니라 포유류다", a: true, d: 1 },
  { q: "낙타 혹에는 물이 가득 차 있다", a: false, d: 1 },
  { q: "펭귄은 날지 못하는 새다", a: true, d: 1 },
  { q: "얼음은 물에 뜬다", a: true, d: 1 },
  { q: "달은 스스로 빛을 내지 못한다", a: true, d: 1 },
  { q: "한글은 세종대왕이 창제했다", a: true, d: 1 },
  { q: "남한에서 가장 높은 산은 한라산이다", a: true, d: 1 },
  { q: "코끼리는 풀을 먹는 초식동물이다", a: true, d: 1 },
  { q: "성인 피부는 몸에서 가장 큰 장기다", a: true, d: 1 },
  { q: "지구에서 가장 큰 동물은 코끼리다", a: false, d: 1 },
  { q: "금은 물에 뜬다", a: false, d: 1 },
  { q: "타조는 하늘을 나는 새다", a: false, d: 1 },
  { q: "천둥이 번개보다 먼저 도착한다", a: false, d: 1 },
  { q: "토끼는 고기를 먹는 육식동물이다", a: false, d: 1 },
  { q: "달에는 사람이 숨 쉴 공기가 있다", a: false, d: 1 },
  { q: "문어의 다리는 10개다", a: false, d: 1 },
  { q: "설탕은 물에 녹지 않는다", a: false, d: 1 },
  { q: "다이아몬드는 탄소로 이루어져 있다", a: true, d: 1 },
  { q: "무궁화는 대한민국의 국화다", a: true, d: 1 },
  { q: "참치는 민물에 사는 물고기다", a: false, d: 1 },
  { q: "태양은 지구보다 크다", a: true, d: 1 },
  { q: "사람의 몸은 대부분 물로 이루어져 있다", a: true, d: 1 },
  { q: "벌은 꿀을 만든다", a: true, d: 1 },
  { q: "뱀은 다리가 없다", a: true, d: 1 },
  { q: "기린은 목이 길다", a: true, d: 1 },
  { q: "곰은 겨울잠을 잔다", a: true, d: 1 },
  { q: "선인장은 사막에서 자란다", a: true, d: 1 },
  { q: "부엉이는 밤에 활동한다", a: true, d: 1 },
  { q: "나무는 광합성을 한다", a: true, d: 1 },
  { q: "태풍은 강한 바람을 몰고 온다", a: true, d: 1 },
  { q: "벚꽃은 봄에 핀다", a: true, d: 1 },
  { q: "소나무는 겨울에도 잎이 푸르다", a: true, d: 1 },
  { q: "물고기는 폐로 숨을 쉰다", a: false, d: 1 },
  { q: "해바라기 꽃은 파란색이다", a: false, d: 1 },
  { q: "개구리 몸은 털로 덮여 있다", a: false, d: 1 },
  { q: "지렁이는 다리가 여러 개다", a: false, d: 1 },
  { q: "사자는 풀만 먹고 산다", a: false, d: 1 },
  { q: "눈은 한여름에 자주 내린다", a: false, d: 1 },
  { q: "여우는 고양이과 동물이다", a: false, d: 1 },
  { q: "매미는 겨울에 시끄럽게 운다", a: false, d: 1 },
  { q: "오리 발에는 물갈퀴가 있다", a: true, d: 1 },
  { q: "거북은 등딱지를 지고 있다", a: true, d: 1 },
  { q: "개미는 무리 짓지 않고 혼자 산다", a: false, d: 1 },
  { q: "지구는 태양 주위를 돈다", a: true, d: 1 },
  { q: "바닷물은 짜다", a: true, d: 1 },
  { q: "오징어는 뼈가 단단한 척추동물이다", a: false, d: 1 },
  { q: "메뚜기는 날개가 전혀 없다", a: false, d: 1 },
  { q: "민들레는 꽃을 피우지 않는다", a: false, d: 1 },
  { q: "화산에서는 용암이 나온다", a: true, d: 1 },
  { q: "달팽이는 매우 빠르게 달린다", a: false, d: 1 },
  { q: "나비는 이빨로 먹이를 씹는다", a: false, d: 1 },
  { q: "닭은 알이 아닌 새끼를 낳는다", a: false, d: 1 },
  { q: "물은 100도에서 끓는다", a: true, d: 1 },
  { q: "사람의 정상 체온은 약 36.5도다", a: true, d: 1 },
  { q: "심장은 쉬지 않고 뛴다", a: true, d: 1 },
  { q: "눈물은 짠맛이 난다", a: true, d: 1 },
  { q: "빛은 소리보다 빠르다", a: true, d: 1 },
  { q: "태양계에서 가장 큰 행성은 목성이다", a: true, d: 1 },
  { q: "컴퓨터는 0과 1로 정보를 처리한다", a: true, d: 1 },
  { q: "GPS는 인공위성으로 위치를 찾는다", a: true, d: 1 },
  { q: "물은 수소와 산소로 이루어져 있다", a: true, d: 1 },
  { q: "태양은 별이다", a: true, d: 1 },
  { q: "토성에는 고리가 있다", a: true, d: 1 },
  { q: "무지개는 빛이 굴절돼 생긴다", a: true, d: 1 },
  { q: "헬륨을 마시면 목소리가 높아진다", a: true, d: 1 },
  { q: "사람은 폐로 숨을 쉰다", a: true, d: 1 },
  { q: "공기 중에 가장 많은 기체는 산소다", a: false, d: 1 },
  { q: "달은 지구보다 크다", a: false, d: 1 },
  { q: "소리는 빛보다 빠르다", a: false, d: 1 },
  { q: "사람은 이산화탄소를 들이마셔 숨쉰다", a: false, d: 1 },
  { q: "심장은 뼈로 이루어져 있다", a: false, d: 1 },
  { q: "지구는 태양계의 중심이다", a: false, d: 1 },
  { q: "화성은 지구보다 태양에 더 가깝다", a: false, d: 1 },
  { q: "태양계에서 가장 큰 행성은 토성이다", a: false, d: 1 },
  { q: "자석은 같은 극끼리 서로 끌어당긴다", a: false, d: 1 },
  { q: "산소는 색과 냄새가 있는 기체다", a: false, d: 1 },
  { q: "사람은 간이 없어도 살 수 있다", a: false, d: 1 },
  { q: "수성은 태양계에서 가장 큰 행성이다", a: false, d: 1 },
  { q: "사람의 몸에는 폐가 하나뿐이다", a: false, d: 1 },
  { q: "다이아몬드는 물렁물렁한 물질이다", a: false, d: 1 },
  { q: "일본의 수도는 도쿄다", a: true, d: 1 },
  { q: "미국의 수도는 뉴욕이다", a: false, d: 1 },
  { q: "경복궁은 서울에 있다", a: true, d: 1 },
  { q: "호주의 수도는 시드니다", a: false, d: 1 },
  { q: "자유의 여신상은 뉴욕에 있다", a: true, d: 1 },
  { q: "프랑스의 수도는 마르세유다", a: false, d: 1 },
  { q: "피라미드는 이집트에 있다", a: true, d: 1 },
  { q: "중국의 수도는 상하이다", a: false, d: 1 },
  { q: "서울의 옛 이름은 한양이다", a: true, d: 1 },
  { q: "캐나다의 수도는 토론토다", a: false, d: 1 },
  { q: "제주도는 한국에서 가장 큰 섬이다", a: true, d: 1 },
  { q: "에펠탑은 런던에 있다", a: false, d: 1 },
  { q: "백두산은 한라산보다 높다", a: true, d: 1 },
  { q: "불국사는 부산에 있다", a: false, d: 1 },
  { q: "세계에서 가장 넓은 나라는 러시아다", a: true, d: 1 },
  { q: "세계에서 가장 큰 대륙은 아프리카다", a: false, d: 1 },
  { q: "이탈리아는 장화 모양 반도다", a: true, d: 1 },
  { q: "남극에는 북극곰이 산다", a: false, d: 1 },
  { q: "캐나다 국기에는 단풍잎이 있다", a: true, d: 1 },
  { q: "일본 국기에는 별이 그려져 있다", a: false, d: 1 },
  { q: "태극기에는 괘가 4개 있다", a: true, d: 1 },
  { q: "주몽은 신라를 세웠다", a: false, d: 1 },
  { q: "광복절은 8월 15일이다", a: true, d: 1 },
  { q: "원시인은 공룡과 함께 살았다", a: false, d: 1 },
  { q: "한글날은 10월 9일이다", a: true, d: 1 },
  { q: "모나리자는 피카소가 그렸다", a: false, d: 1 },
  { q: "임진왜란 때 거북선이 쓰였다", a: true, d: 1 },
  { q: "피자는 미국에서 처음 만들어졌다", a: false, d: 1 },
  { q: "조선을 세운 왕은 이성계다", a: true, d: 1 },
  { q: "단군신화에는 곰과 호랑이가 나온다", a: true, d: 1 },
  { q: "몽골 화폐 단위는 투그릭이다", a: true, d: 1 },
  { q: "칭기즈칸의 본명은 테무진이다", a: true, d: 1 },
  { q: "나담 축제 3대 종목에 수영이 있다", a: false, d: 1 },
  { q: "몽골의 공용어는 중국어다", a: false, d: 1 },
  { q: "북극성은 밤하늘에서 가장 밝은 별이다", a: false, d: 1 },
  { q: "낮에도 하늘에는 별이 떠 있다", a: true, d: 1 },
  { q: "게르 한 채 짓는 데 보통 일주일 넘게 걸린다", a: false, d: 1 },
  { q: "자유의 여신상은 프랑스가 미국에 선물했다", a: true, d: 1 },
  { q: "피사의 사탑은 처음부터 기울게 설계됐다", a: false, d: 1 },
  { q: "세계에서 가장 높은 산은 K2다", a: false, d: 1 },
  { q: "모나리자는 루브르 박물관에 있다", a: true, d: 1 },
  { q: "거대 예수상은 브라질 리우에 있다", a: true, d: 1 },
  { q: "인천에서 울란바토르 비행은 10시간 넘게 걸린다", a: false, d: 1 },
  { q: "빅벤은 프랑스 파리에 있다", a: false, d: 1 },
  { q: "마라톤 풀코스는 42.195km다", a: true, d: 1 },
  { q: "첫 근대 올림픽은 파리에서 열렸다", a: false, d: 1 },
  { q: "축구 골키퍼는 어디서든 손을 쓸 수 있다", a: false, d: 1 },
  { q: "씨름은 올림픽 정식 종목이다", a: false, d: 1 },
  { q: "태권도는 올림픽 정식 종목이다", a: true, d: 1 },
  { q: "배구는 코트에 한 팀 6명이 선다", a: true, d: 1 },
  { q: "다이너마이트 발명가가 노벨상을 만들었다", a: true, d: 1 },
  { q: "청바지는 광부의 작업복에서 시작됐다", a: true, d: 1 },
  { q: "야생 펭귄은 북극에 산다", a: false, d: 1 },
  { q: "코알라는 곰과 동물이다", a: false, d: 1 },
  { q: "사람 몸의 절반 이상은 물이다", a: true, d: 1 },
  { q: "오이는 90% 이상이 수분이다", a: true, d: 1 },
  { q: "붕어빵에는 붕어가 들어간다", a: false, d: 1 },
  { q: "스타벅스 로고 속 캐릭터는 인어다", a: true, d: 1 },
  { q: "레고는 미국 브랜드다", a: false, d: 1 },
  { q: "새우깡에는 진짜 새우가 들어간다", a: true, d: 1 },
  { q: "기네스는 아일랜드 맥주다", a: true, d: 1 },
  { q: "티라미수는 프랑스 디저트다", a: false, d: 1 },
  { q: "스팸은 미국 회사 제품이다", a: true, d: 1 },
  { q: "누텔라는 미국 브랜드다", a: false, d: 1 },
  { q: "하리보는 독일 회사다", a: true, d: 1 },
  { q: "되네르 케밥은 튀르키예 음식이다", a: true, d: 1 },
  { q: "피시앤칩스는 미국에서 유래했다", a: false, d: 1 },
  { q: "타코는 멕시코 음식이다", a: true, d: 1 },
  { q: "콜드브루는 뜨거운 물로 내린 커피다", a: false, d: 1 },
  { q: "에스프레소는 이탈리아 말이다", a: true, d: 1 },
  { q: "라테는 이탈리아어로 우유라는 뜻이다", a: true, d: 1 },
  { q: "카페모카에는 초콜릿이 들어간다", a: true, d: 1 },
  { q: "땅콩은 나무 위에서 열린다", a: false, d: 1 },
  { q: "파인애플은 나무에서 열린다", a: false, d: 1 },
  { q: "막걸리는 증류주다", a: false, d: 1 },
  { q: "럼의 주원료는 사탕수수다", a: true, d: 1 },
  { q: "하이볼은 와인에 탄산수를 섞은 술이다", a: false, d: 1 },
  { q: "간장은 콩을 발효시켜 만든다", a: true, d: 1 },
  { q: "마요네즈에는 우유가 들어간다", a: false, d: 1 },
  { q: "설탕은 사탕수수로만 만든다", a: false, d: 1 },
  { q: "두부는 일본에서 처음 만들어졌다", a: false, d: 1 },
  { q: "오뎅은 일본어에서 온 말이다", a: true, d: 1 },
  { q: "월남쌈의 월남은 베트남이다", a: true, d: 1 },
  { q: "달고나는 설탕과 소다로 만든다", a: true, d: 1 },
  { q: "옥수수의 원산지는 유럽이다", a: false, d: 1 },
  { q: "츄러스는 스페인 간식이다", a: true, d: 1 },
  { q: "닭갈비로 유명한 도시는 전주다", a: false, d: 1 },
  { q: "삼계탕은 복날에 먹는 음식이다", a: true, d: 1 },
  { q: "떡국 떡은 가래떡을 썬 것이다", a: true, d: 1 },
  { q: "참기름은 참깨로 만든다", a: true, d: 1 },
  { q: "울란바토르는 세계에서 가장 추운 수도다", a: true, d: 2 },
  { q: "게르의 문은 전통적으로 북쪽을 향한다", a: false, d: 2 },
  { q: "고비사막은 모래보다 자갈·바위가 더 많다", a: true, d: 2 },
  { q: "칭기즈칸의 무덤은 아직 위치가 안 밝혀졌다", a: true, d: 2 },
  { q: "몽골은 바다와 접하지 않은 내륙국이다", a: true, d: 2 },
  { q: "몽골 국기에는 붉은 별이 그려져 있다", a: false, d: 2 },
  { q: "몽골 전통술 아이락에는 알코올이 들어있다", a: true, d: 2 },
  { q: "몽골은 대한민국보다 국토 면적이 넓다", a: true, d: 2 },
  { q: "몽골 시간은 한국보다 1시간 빠르다", a: false, d: 2 },
  { q: "몽골에는 사람보다 가축이 훨씬 많다", a: true, d: 2 },
  { q: "고비사막에서는 공룡 화석이 많이 발견됐다", a: true, d: 2 },
  { q: "홍학이 분홍색인 것은 먹이 때문이다", a: true, d: 2 },
  { q: "상어는 뼈 대신 연골로 이루어져 있다", a: true, d: 2 },
  { q: "해파리는 작은 뇌를 가지고 있다", a: false, d: 2 },
  { q: "문어의 심장은 3개다", a: true, d: 2 },
  { q: "벌새는 뒤로도 날 수 있다", a: true, d: 2 },
  { q: "코끼리는 네 발로 높이 점프할 수 있다", a: false, d: 2 },
  { q: "말벌은 사람을 한 번 쏘면 죽는다", a: false, d: 2 },
  { q: "타조는 뇌가 눈보다 크다", a: false, d: 2 },
  { q: "카멜레온이 색을 바꾸는 주 이유는 위장이다", a: false, d: 2 },
  { q: "위산은 금속도 녹일 만큼 강하다", a: true, d: 2 },
  { q: "갓난아기는 어른보다 뼈 개수가 적다", a: false, d: 2 },
  { q: "사람의 지문은 사람마다 모두 다르다", a: true, d: 2 },
  { q: "소리는 진공에서 전달되지 않는다", a: true, d: 2 },
  { q: "북극에는 야생 펭귄이 산다", a: false, d: 2 },
  { q: "계절 변화의 주 원인은 태양과의 거리다", a: false, d: 2 },
  { q: "피는 몸속에 있을 때 파란색이다", a: false, d: 2 },
  { q: "혀에는 맛을 느끼는 구역이 정해져 있다", a: false, d: 2 },
  { q: "박쥐는 앞을 못 보는 장님이다", a: false, d: 2 },
  { q: "꿀은 상온에서도 거의 상하지 않는다", a: true, d: 2 },
  { q: "초콜릿은 개에게 독이 될 수 있다", a: true, d: 2 },
  { q: "매운맛은 미각이 아니라 통증에 가깝다", a: true, d: 2 },
  { q: "화이트초콜릿에는 카카오 고형분이 없다", a: true, d: 2 },
  { q: "커피 원두는 열매가 아니라 뿌리에서 얻는다", a: false, d: 2 },
  { q: "청양고추는 한국에서 개발된 품종이다", a: true, d: 2 },
  { q: "당근을 많이 먹으면 시력이 좋아진다", a: false, d: 2 },
  { q: "바나나는 나무에서 열린다", a: false, d: 2 },
  { q: "만리장성은 우주에서 맨눈으로 보인다", a: false, d: 2 },
  { q: "이집트 피라미드는 노예들이 지었다", a: false, d: 2 },
  { q: "성인 몸의 약 90%는 물이다", a: false, d: 2 },
  { q: "해마는 물고기다", a: true, d: 2 },
  { q: "판다는 대나무를 즐겨 먹는다", a: true, d: 2 },
  { q: "두더지는 눈이 잘 보이지 않는다", a: true, d: 2 },
  { q: "두꺼비 피부에는 독이 있다", a: true, d: 2 },
  { q: "도마뱀은 위험하면 꼬리를 끊는다", a: true, d: 2 },
  { q: "개구리는 피부로도 숨을 쉰다", a: true, d: 2 },
  { q: "뱀은 혀로 냄새를 맡는다", a: true, d: 2 },
  { q: "모기는 암컷만 피를 빤다", a: true, d: 2 },
  { q: "꿀벌은 사람을 한 번 쏘면 죽는다", a: true, d: 2 },
  { q: "새는 이빨이 없다", a: true, d: 2 },
  { q: "버섯은 식물이 아니다", a: true, d: 2 },
  { q: "파리지옥은 벌레를 잡아먹는다", a: true, d: 2 },
  { q: "미모사는 건드리면 잎을 접는다", a: true, d: 2 },
  { q: "소금쟁이는 물 위를 걸어 다닌다", a: true, d: 2 },
  { q: "소금물은 맹물보다 낮은 온도에서 언다", a: true, d: 2 },
  { q: "밀물과 썰물은 달의 영향을 크게 받는다", a: true, d: 2 },
  { q: "오로라는 극지방에서 잘 보인다", a: true, d: 2 },
  { q: "사해는 염분이 높아 몸이 잘 뜬다", a: true, d: 2 },
  { q: "홍학은 한 다리로 서서 쉰다", a: true, d: 2 },
  { q: "딱따구리는 나무를 쪼아 벌레를 잡는다", a: true, d: 2 },
  { q: "소나무는 봄에 노란 꽃가루를 날린다", a: true, d: 2 },
  { q: "불가사리는 물고기의 한 종류다", a: false, d: 2 },
  { q: "코알라는 곰의 한 종류다", a: false, d: 2 },
  { q: "악어는 포유류에 속한다", a: false, d: 2 },
  { q: "버섯은 광합성으로 양분을 만든다", a: false, d: 2 },
  { q: "개구리는 물을 오직 입으로만 마신다", a: false, d: 2 },
  { q: "두꺼비는 평생 물속에서만 산다", a: false, d: 2 },
  { q: "무당벌레는 나뭇잎만 갉아 먹는다", a: false, d: 2 },
  { q: "닭은 색을 전혀 보지 못한다", a: false, d: 2 },
  { q: "태양은 지구 주위를 돈다", a: false, d: 2 },
  { q: "달은 스스로 빛을 내는 별이다", a: false, d: 2 },
  { q: "우박은 오직 겨울에만 내린다", a: false, d: 2 },
  { q: "불가사리는 잘린 팔을 되살리지 못한다", a: false, d: 2 },
  { q: "카멜레온 혀는 제 몸길이보다 짧다", a: false, d: 2 },
  { q: "지네는 다리가 딱 여섯 개다", a: false, d: 2 },
  { q: "반딧불이는 한낮에 가장 환하게 빛난다", a: false, d: 2 },
  { q: "이끼는 커다란 꽃을 피운다", a: false, d: 2 },
  { q: "잠자리 애벌레는 나무 위에서 산다", a: false, d: 2 },
  { q: "나방은 주로 한낮에만 활동한다", a: false, d: 2 },
  { q: "앵무새는 사람 말을 절대 흉내 내지 못한다", a: false, d: 2 },
  { q: "딸기는 씨가 열매 속에만 들어 있다", a: false, d: 2 },
  { q: "비둘기는 방향 감각이 매우 나쁘다", a: false, d: 2 },
  { q: "도마뱀붙이는 벽을 오르지 못한다", a: false, d: 2 },
  { q: "개미는 제 몸무게보다 무거운 건 못 든다", a: false, d: 2 },
  { q: "사람의 소장은 대장보다 길다", a: true, d: 2 },
  { q: "침에는 소화를 돕는 효소가 들어있다", a: true, d: 2 },
  { q: "진공에서는 깃털과 쇠구슬이 동시에 떨어진다", a: true, d: 2 },
  { q: "드라이아이스는 이산화탄소가 굳은 것이다", a: true, d: 2 },
  { q: "산성 용액은 파란 리트머스를 붉게 만든다", a: true, d: 2 },
  { q: "광섬유는 빛으로 데이터를 전송한다", a: true, d: 2 },
  { q: "블루투스는 무선 전파로 기기를 연결한다", a: true, d: 2 },
  { q: "태양광 패널은 열이 아니라 빛으로 전기를 만든다", a: true, d: 2 },
  { q: "심장은 근육으로 이루어져 있다", a: true, d: 2 },
  { q: "뇌는 잠자는 동안에도 활발히 활동한다", a: true, d: 2 },
  { q: "무게는 장소에 따라 달라져도 질량은 안 변한다", a: true, d: 2 },
  { q: "전자레인지는 물 분자를 진동시켜 데운다", a: true, d: 2 },
  { q: "헬륨은 우주에서 두 번째로 흔한 원소다", a: true, d: 2 },
  { q: "수소는 우주에서 가장 흔한 원소다", a: true, d: 2 },
  { q: "목성은 단단한 땅이 아니라 대부분 기체다", a: true, d: 2 },
  { q: "노이즈 캔슬링은 반대 소리로 소음을 없앤다", a: true, d: 2 },
  { q: "좌뇌는 오른쪽 몸을, 우뇌는 왼쪽 몸을 조절한다", a: true, d: 2 },
  { q: "사람은 한쪽 콩팥만으로도 살 수 있다", a: true, d: 2 },
  { q: "무선 충전은 전선 없이 전기를 전달한다", a: true, d: 2 },
  { q: "왼쪽 폐가 오른쪽 폐보다 크다", a: false, d: 2 },
  { q: "소리는 공기보다 물속에서 더 느리게 전달된다", a: false, d: 2 },
  { q: "지구는 완벽한 공 모양이다", a: false, d: 2 },
  { q: "명왕성은 지금도 태양계의 정식 행성이다", a: false, d: 2 },
  { q: "소금물은 맹물보다 낮은 온도에서 끓는다", a: false, d: 2 },
  { q: "달에서는 지구에서보다 몸무게가 무거워진다", a: false, d: 2 },
  { q: "오른쪽 폐는 엽이 두 개다", a: false, d: 2 },
  { q: "무거운 물체가 가벼운 것보다 항상 빨리 떨어진다", a: false, d: 2 },
  { q: "우주에서는 무게가 0이라 질량도 0이 된다", a: false, d: 2 },
  { q: "빛은 절대 휘지 않고 항상 직진만 한다", a: false, d: 2 },
  { q: "백열전구는 전기를 대부분 빛으로 바꾼다", a: false, d: 2 },
  { q: "이산화탄소는 공기보다 가볍다", a: false, d: 2 },
  { q: "기름은 물보다 무거워서 가라앉는다", a: false, d: 2 },
  { q: "5G는 4G보다 데이터 속도가 느리다", a: false, d: 2 },
  { q: "뜨거운 공기는 위로 안 뜨고 아래로 가라앉는다", a: false, d: 2 },
  { q: "근육은 쓰지 않으면 지방으로 변한다", a: false, d: 2 },
  { q: "사람 몸의 근육 개수는 뼈 개수보다 적다", a: false, d: 2 },
  { q: "위는 배의 오른쪽에 치우쳐 있다", a: false, d: 2 },
  { q: "성대는 가슴 속에 들어있다", a: false, d: 2 },
  { q: "인터넷과 월드와이드웹은 완전히 같은 말이다", a: false, d: 2 },
  { q: "컴퓨터를 끄면 저장 안 한 내용도 램에 남는다", a: false, d: 2 },
  { q: "순금은 매우 단단해서 잘 긁히지 않는다", a: false, d: 2 },
  { q: "금은 공기 중에서 녹슬어 색이 변한다", a: false, d: 2 },
  { q: "별자리의 별들은 실제로 가까이 붙어 있다", a: false, d: 2 },
  { q: "지구의 계절은 태양과의 거리 때문에 생긴다", a: false, d: 2 },
  { q: "리튬이온 배터리는 완전히 방전한 뒤 충전해야 좋다", a: false, d: 2 },
  { q: "튀르키예의 수도는 이스탄불이다", a: false, d: 2 },
  { q: "오스트리아의 수도는 빈이다", a: true, d: 2 },
  { q: "브라질의 수도는 리우데자네이루다", a: false, d: 2 },
  { q: "중국 국기에는 별이 5개 있다", a: true, d: 2 },
  { q: "스위스의 수도는 취리히다", a: false, d: 2 },
  { q: "튀르키예 국기에는 초승달이 있다", a: true, d: 2 },
  { q: "베트남의 수도는 호찌민이다", a: false, d: 2 },
  { q: "아르헨티나 국기에는 태양이 있다", a: true, d: 2 },
  { q: "뉴질랜드의 수도는 오클랜드다", a: false, d: 2 },
  { q: "러시아는 유럽과 아시아에 걸쳐 있다", a: true, d: 2 },
  { q: "포르투갈의 수도는 포르투다", a: false, d: 2 },
  { q: "이스탄불은 두 대륙에 걸쳐 있다", a: true, d: 2 },
  { q: "이집트의 수도는 알렉산드리아다", a: false, d: 2 },
  { q: "그린란드는 덴마크 영토다", a: true, d: 2 },
  { q: "미국 국기에는 별이 51개 있다", a: false, d: 2 },
  { q: "하와이는 미국의 50번째 주다", a: true, d: 2 },
  { q: "독일 국기에는 파란색이 들어간다", a: false, d: 2 },
  { q: "아프리카 최고봉은 킬리만자로다", a: true, d: 2 },
  { q: "영국은 유럽연합 회원국이다", a: false, d: 2 },
  { q: "안데스는 세계에서 가장 긴 산맥이다", a: true, d: 2 },
  { q: "캐나다는 러시아보다 넓다", a: false, d: 2 },
  { q: "마추픽추는 페루에 있다", a: true, d: 2 },
  { q: "세계에서 가장 깊은 호수는 카스피해다", a: false, d: 2 },
  { q: "타지마할은 인도에 있다", a: true, d: 2 },
  { q: "앙코르와트는 태국에 있다", a: false, d: 2 },
  { q: "캐나다는 영어와 프랑스어가 공용어다", a: true, d: 2 },
  { q: "브라질에서는 스페인어를 쓴다", a: false, d: 2 },
  { q: "신라에는 여왕이 있었다", a: true, d: 2 },
  { q: "오스트리아의 공용어는 오스트리아어다", a: false, d: 2 },
  { q: "고려의 수도는 개성이었다", a: true, d: 2 },
  { q: "한자는 소리를 나타내는 문자다", a: false, d: 2 },
  { q: "조선왕조는 500년 넘게 이어졌다", a: true, d: 2 },
  { q: "아랍어는 왼쪽에서 오른쪽으로 쓴다", a: false, d: 2 },
  { q: "측우기는 조선 시대에 만들어졌다", a: true, d: 2 },
  { q: "모국어 인구가 가장 많은 언어는 영어다", a: false, d: 2 },
  { q: "3·1운동은 1919년에 일어났다", a: true, d: 2 },
  { q: "영국의 화폐는 유로다", a: false, d: 2 },
  { q: "프랑스 혁명은 1789년에 시작됐다", a: true, d: 2 },
  { q: "신라의 수도는 평양이었다", a: false, d: 2 },
  { q: "진시황은 중국 최초의 황제다", a: true, d: 2 },
  { q: "미국의 초대 대통령은 링컨이다", a: false, d: 2 },
  { q: "폼페이는 화산 폭발로 묻혔다", a: true, d: 2 },
  { q: "제1차 세계대전은 19세기에 일어났다", a: false, d: 2 },
  { q: "인류 최초의 달 착륙은 1969년이다", a: true, d: 2 },
  { q: "타이타닉은 두 번째 항해에서 침몰했다", a: false, d: 2 },
  { q: "몽골어는 현재 키릴 문자를 주로 쓴다", a: true, d: 2 },
  { q: "몽골 전통 문자는 세로로 쓴다", a: true, d: 2 },
  { q: "울란바토르는 푸른 도시라는 뜻이다", a: false, d: 2 },
  { q: "몽골 낙타는 혹이 하나다", a: false, d: 2 },
  { q: "몽골에서 신자가 가장 많은 종교는 이슬람교다", a: false, d: 2 },
  { q: "게르 문지방을 밟는 건 몽골에서 금기다", a: true, d: 2 },
  { q: "수태차는 설탕 넣은 달콤한 밀크티다", a: false, d: 2 },
  { q: "허르헉은 달군 돌로 익히는 고기 요리다", a: true, d: 2 },
  { q: "마두금 악기에는 말 머리 조각이 있다", a: true, d: 2 },
  { q: "아이락은 소젖으로 만든다", a: false, d: 2 },
  { q: "모나리자 그림 속 여인은 눈썹이 없다", a: true, d: 2 },
  { q: "타지마할은 왕이 살던 궁전이다", a: false, d: 2 },
  { q: "베네치아 구시가지엔 자동차가 못 다닌다", a: true, d: 2 },
  { q: "비행기 블랙박스는 검은색이다", a: false, d: 2 },
  { q: "여객기 창문이 둥근 건 안전 때문이다", a: true, d: 2 },
  { q: "세계 최초의 지하철은 파리에 생겼다", a: false, d: 2 },
  { q: "에펠탑은 주기적으로 페인트를 새로 칠한다", a: true, d: 2 },
  { q: "이집트 스핑크스는 코가 없다", a: true, d: 2 },
  { q: "올림픽 오륜기에는 검은색이 있다", a: true, d: 2 },
  { q: "올림픽 성화는 로마에서 채화한다", a: false, d: 2 },
  { q: "컬링 스톤은 화강암으로 만든다", a: true, d: 2 },
  { q: "양궁 과녁 한가운데는 노란색이다", a: true, d: 2 },
  { q: "올림픽 금메달은 순금으로 만든다", a: false, d: 2 },
  { q: "유도는 중국에서 시작된 무술이다", a: false, d: 2 },
  { q: "배드민턴 셔틀콕의 깃털은 16개다", a: true, d: 2 },
  { q: "볼링 핀은 9개다", a: false, d: 2 },
  { q: "포스트잇은 실패한 접착제에서 탄생했다", a: true, d: 2 },
  { q: "코카콜라는 처음에 약국에서 팔렸다", a: true, d: 2 },
  { q: "이케아는 노르웨이 브랜드다", a: false, d: 2 },
  { q: "유튜브는 구글이 처음 만든 서비스다", a: false, d: 2 },
  { q: "인스턴트 라면은 중국에서 처음 나왔다", a: false, d: 2 },
  { q: "벨크로는 식물 가시에서 아이디어를 얻었다", a: true, d: 2 },
  { q: "샌드위치는 사람 이름에서 유래했다", a: true, d: 2 },
  { q: "초콜릿은 원래 마시는 음료였다", a: true, d: 2 },
  { q: "꿀은 잘 보관하면 거의 상하지 않는다", a: true, d: 2 },
  { q: "발톱이 손톱보다 빨리 자란다", a: false, d: 2 },
  { q: "성인의 뼈는 약 300개다", a: false, d: 2 },
  { q: "아기는 어른보다 뼈 개수가 많다", a: true, d: 2 },
  { q: "번개는 같은 곳에 두 번 치지 않는다", a: false, d: 2 },
  { q: "타조는 위험하면 모래에 머리를 묻는다", a: false, d: 2 },
  { q: "파인애플은 나무에 열린다", a: false, d: 2 },
  { q: "포카리스웨트는 일본 브랜드다", a: true, d: 2 },
  { q: "KFC 할아버지는 실존 인물이다", a: true, d: 2 },
  { q: "김치에는 원래부터 고춧가루가 들어갔다", a: false, d: 2 },
  { q: "고추는 임진왜란 무렵 한반도에 들어왔다", a: true, d: 2 },
  { q: "인스턴트 라면은 한국에서 처음 나왔다", a: false, d: 2 },
  { q: "한국 최초의 라면은 신라면이다", a: false, d: 2 },
  { q: "붕어빵은 일본 타이야키에서 유래했다", a: true, d: 2 },
  { q: "부대찌개는 한국전쟁 이후 생긴 음식이다", a: true, d: 2 },
  { q: "짜장면은 한국에서 지금의 모습이 됐다", a: true, d: 2 },
  { q: "호떡의 호는 중국을 가리키는 한자다", a: true, d: 2 },
  { q: "샴페인은 프랑스 지역 이름에서 왔다", a: true, d: 2 },
  { q: "코냑은 위스키의 일종이다", a: false, d: 2 },
  { q: "보드카의 어원은 불이다", a: false, d: 2 },
  { q: "진저에일의 진은 술 진을 뜻한다", a: false, d: 2 },
  { q: "싱글몰트는 여러 증류소 술을 섞은 거다", a: false, d: 2 },
  { q: "화이트와인은 보통 껍질째 발효한다", a: false, d: 2 },
  { q: "와인의 드라이는 신맛이 강하다는 뜻이다", a: false, d: 2 },
  { q: "에일과 라거는 발효 방식이 다르다", a: true, d: 2 },
  { q: "맥주의 라거는 저장한다는 뜻이다", a: true, d: 2 },
  { q: "맥주는 고대 이집트에서도 만들었다", a: true, d: 2 },
  { q: "디카페인 커피엔 카페인이 전혀 없다", a: false, d: 2 },
  { q: "커피 최대 생산국은 브라질이다", a: true, d: 2 },
  { q: "커피의 원산지는 브라질이다", a: false, d: 2 },
  { q: "커피 벨트는 적도 부근에 있다", a: true, d: 2 },
  { q: "루왁 커피는 사향고양이 배설물에서 얻는다", a: true, d: 2 },
  { q: "스타벅스 1호점은 뉴욕에 있다", a: false, d: 2 },
  { q: "핀란드는 1인당 커피 소비 최상위권이다", a: true, d: 2 },
  { q: "녹차와 홍차는 같은 찻잎으로 만든다", a: true, d: 2 },
  { q: "보리차에는 카페인이 있다", a: false, d: 2 },
  { q: "햄버거의 햄은 돼지고기 햄을 뜻한다", a: false, d: 2 },
  { q: "샌드위치는 백작 이름에서 유래했다", a: true, d: 2 },
  { q: "카스텔라는 일본에서 발전한 빵이다", a: true, d: 2 },
  { q: "돈가스는 일본에서 완성된 요리다", a: true, d: 2 },
  { q: "고로케는 프랑스 크로켓에서 왔다", a: true, d: 2 },
  { q: "스시는 생선 보존식에서 출발했다", a: true, d: 2 },
  { q: "모짜렐라는 원래 물소 젖으로 만들었다", a: true, d: 2 },
  { q: "발사믹 식초는 사과로 만든다", a: false, d: 2 },
  { q: "타바스코는 멕시코 브랜드다", a: false, d: 2 },
  { q: "감자의 원산지는 남미 안데스다", a: true, d: 2 },
  { q: "고구마와 감자는 같은 과 식물이다", a: false, d: 2 },
  { q: "토마토는 식물학적으로 과일이다", a: true, d: 2 },
  { q: "깻잎은 들깨의 잎이다", a: true, d: 2 },
  { q: "당면은 주로 밀가루로 만든다", a: false, d: 2 },
  { q: "게맛살은 주로 흰살생선 살로 만든다", a: true, d: 2 },
  { q: "감자는 식물의 뿌리 부분이다", a: false, d: 2 },
  { q: "배추의 원산지는 중국이다", a: true, d: 2 },
  { q: "팝콘은 아무 옥수수로나 만들 수 있다", a: false, d: 2 },
  { q: "클레오파트라 시대는 피라미드 건설보다 달 착륙에 가깝다", a: true, d: 3 },
  { q: "바이킹 전사들은 뿔 달린 투구를 썼다", a: false, d: 3 },
  { q: "나폴레옹은 당대 프랑스 남성 평균 키였다", a: true, d: 3 },
  { q: "사람은 평소 뇌의 10%만 사용한다", a: false, d: 3 },
  { q: "금붕어의 기억력은 3초밖에 안 된다", a: false, d: 3 },
  { q: "번개는 같은 장소에 두 번 치지 않는다", a: false, d: 3 },
  { q: "유리는 사실 아주 천천히 흐르는 액체다", a: false, d: 3 },
  { q: "비행기 모드에서도 사진은 찍을 수 있다", a: true, d: 3 },
  { q: "에펠탑은 여름에 열팽창으로 키가 커진다", a: true, d: 3 },
  { q: "바나나에는 미량의 방사성 물질이 들어있다", a: true, d: 3 },
  { q: "북반구가 여름일 때 지구는 태양에서 더 멀다", a: true, d: 3 },
  { q: "꿀벌은 소리로 동료에게 꽃 위치를 알린다", a: false, d: 3 },
  { q: "새우의 심장은 머리 부분에 있다", a: true, d: 3 },
  { q: "달팽이 입에는 수천 개의 이빨이 있다", a: true, d: 3 },
  { q: "문어의 피는 파란색이다", a: true, d: 3 },
  { q: "아이스크림은 소비기한 표시 의무가 없다", a: true, d: 3 },
  { q: "술을 마시면 체온이 오히려 떨어진다", a: true, d: 3 },
  { q: "솜사탕 기계는 치과의사가 발명에 참여했다", a: true, d: 3 },
  { q: "케첩은 한때 약으로 팔린 적이 있다", a: true, d: 3 },
  { q: "재채기를 하면서 눈을 뜨고 있을 수 없다", a: false, d: 3 },
  { q: "손톱과 머리카락은 죽은 뒤에도 계속 자란다", a: false, d: 3 },
  { q: "개는 색을 전혀 못 보고 흑백으로만 본다", a: false, d: 3 },
  { q: "세면대 물이 도는 방향은 남·북반구가 반대다", a: false, d: 3 },
  { q: "타조는 위험하면 머리를 모래에 파묻는다", a: false, d: 3 },
  { q: "몽골은 세계에서 인구밀도가 가장 낮은 독립국이다", a: true, d: 3 },
  { q: "기린의 목뼈 개수는 사람과 똑같다", a: true, d: 3 },
  { q: "고양이는 단맛을 잘 느끼지 못한다", a: true, d: 3 },
  { q: "나비는 발로 맛을 느낀다", a: true, d: 3 },
  { q: "뱀은 눈꺼풀이 없다", a: true, d: 3 },
  { q: "부엉이는 눈알을 굴리지 못한다", a: true, d: 3 },
  { q: "바퀴벌레는 머리가 잘려도 한동안 산다", a: true, d: 3 },
  { q: "지렁이는 암수한몸이다", a: true, d: 3 },
  { q: "바나나는 나무가 아닌 풀에서 열린다", a: true, d: 3 },
  { q: "은행나무는 암나무와 수나무가 따로 있다", a: true, d: 3 },
  { q: "선인장 가시는 잎이 변해서 생긴 것이다", a: true, d: 3 },
  { q: "사마귀 암컷은 수컷을 잡아먹기도 한다", a: true, d: 3 },
  { q: "전갈은 곤충이 아니라 거미의 친척이다", a: true, d: 3 },
  { q: "무지개는 항상 해의 반대쪽에 생긴다", a: true, d: 3 },
  { q: "소의 위는 네 칸으로 나뉘어 있다", a: true, d: 3 },
  { q: "카멜레온은 두 눈을 따로 움직인다", a: true, d: 3 },
  { q: "해마는 수컷이 새끼를 배 속에서 키운다", a: true, d: 3 },
  { q: "코뿔소 뿔은 단단한 뼈로 되어 있다", a: false, d: 3 },
  { q: "감자는 식물의 뿌리에 해당한다", a: false, d: 3 },
  { q: "대나무는 단단한 나무의 한 종류다", a: false, d: 3 },
  { q: "땅콩은 나무에 열리는 견과류다", a: false, d: 3 },
  { q: "매미는 어른벌레가 되어 몇 년을 산다", a: false, d: 3 },
  { q: "별은 밤에만 하늘에 나타난다", a: false, d: 3 },
  { q: "눈송이 결정은 대부분 동그란 원이다", a: false, d: 3 },
  { q: "토마토는 식물학적으로 뿌리채소다", a: false, d: 3 },
  { q: "천둥소리는 구름끼리 부딪쳐서 난다", a: false, d: 3 },
  { q: "태양은 별이 아니라 불덩어리 행성이다", a: false, d: 3 },
  { q: "바퀴벌레는 물속에서만 살 수 있다", a: false, d: 3 },
  { q: "지렁이는 눈으로 빛을 또렷이 본다", a: false, d: 3 },
  { q: "은행 열매는 향기로운 냄새로 유명하다", a: false, d: 3 },
  { q: "부엉이는 목을 전혀 돌리지 못한다", a: false, d: 3 },
  { q: "선인장은 물을 전혀 저장하지 못한다", a: false, d: 3 },
  { q: "모든 뱀은 알을 낳는다", a: false, d: 3 },
  { q: "개구리는 태어날 때부터 폐로 숨 쉰다", a: false, d: 3 },
  { q: "벌은 눈이 두 개뿐이다", a: false, d: 3 },
  { q: "나무의 나이테는 하루에 하나씩 생긴다", a: false, d: 3 },
  { q: "뇌 자체에는 통증을 느끼는 신경이 없다", a: true, d: 3 },
  { q: "뇌는 무게의 절반 이상이 지방이다", a: true, d: 3 },
  { q: "심장은 몸 밖으로 꺼내도 잠시 스스로 뛴다", a: true, d: 3 },
  { q: "성인 몸 뼈의 절반 이상이 손과 발에 있다", a: true, d: 3 },
  { q: "사람의 귀와 코는 나이 들어도 계속 자란다", a: true, d: 3 },
  { q: "소름은 털을 세우려던 반응의 흔적이다", a: true, d: 3 },
  { q: "딸꾹질은 횡격막이 갑자기 수축해서 생긴다", a: true, d: 3 },
  { q: "관절 뚝 소리는 뼈가 아니라 기포 터지는 거다", a: true, d: 3 },
  { q: "태양빛이 지구에 닿는 데 약 8분 걸린다", a: true, d: 3 },
  { q: "금성은 태양계에서 가장 뜨거운 행성이다", a: true, d: 3 },
  { q: "토성은 물보다 밀도가 낮아 물에 뜬다", a: true, d: 3 },
  { q: "목성은 나머지 모든 행성을 합친 것보다 무겁다", a: true, d: 3 },
  { q: "번개는 태양 표면보다 뜨겁다", a: true, d: 3 },
  { q: "달은 매년 지구에서 조금씩 멀어지고 있다", a: true, d: 3 },
  { q: "물은 4도일 때 부피가 가장 작다", a: true, d: 3 },
  { q: "밤하늘 별빛은 아주 먼 과거의 빛이다", a: true, d: 3 },
  { q: "최초의 컴퓨터 버그는 진짜 나방이었다", a: true, d: 3 },
  { q: "최초의 컴퓨터 마우스는 나무로 만들었다", a: true, d: 3 },
  { q: "이메일은 월드와이드웹보다 먼저 나왔다", a: true, d: 3 },
  { q: "로봇이라는 말은 체코어에서 나왔다", a: true, d: 3 },
  { q: "스마트폰은 아폴로 달착륙 컴퓨터보다 성능이 좋다", a: true, d: 3 },
  { q: "지구 중심에서 가장 먼 산은 에베레스트가 아니다", a: true, d: 3 },
  { q: "갓난아기의 무릎뼈는 뼈가 아니라 물렁뼈다", a: true, d: 3 },
  { q: "더 뜨거운 별일수록 붉은 별보다 푸르게 빛난다", a: true, d: 3 },
  { q: "심장은 하루에 약 1천 번 정도만 뛴다", a: false, d: 3 },
  { q: "어른의 뇌에서는 새 뇌세포가 절대 안 생긴다", a: false, d: 3 },
  { q: "기억은 녹화 영상처럼 뇌에 그대로 저장된다", a: false, d: 3 },
  { q: "사람은 좌뇌형, 우뇌형으로 뇌가 딱 나뉜다", a: false, d: 3 },
  { q: "새로운 걸 배워도 어른의 뇌 구조는 안 바뀐다", a: false, d: 3 },
  { q: "겨울에 쇠가 나무보다 차가운 건 온도가 낮아서다", a: false, d: 3 },
  { q: "달의 인력은 밀물과 썰물에 영향을 주지 않는다", a: false, d: 3 },
  { q: "순수한 물은 전기를 아주 잘 통한다", a: false, d: 3 },
  { q: "다이아몬드는 아무리 뜨거워도 불에 안 탄다", a: false, d: 3 },
  { q: "태양은 장작처럼 연소하며 빛과 열을 낸다", a: false, d: 3 },
  { q: "우주에 맨몸으로 나가면 몸이 곧바로 터진다", a: false, d: 3 },
  { q: "빅벤은 원래 종의 이름이다", a: true, d: 3 },
  { q: "아인슈타인은 상대성이론으로 노벨상을 받았다", a: false, d: 3 },
  { q: "에펠탑은 여름에 더 높아진다", a: true, d: 3 },
  { q: "간디는 노벨 평화상을 받았다", a: false, d: 3 },
  { q: "러시아와 미국은 4km도 안 떨어져 있다", a: true, d: 3 },
  { q: "노벨상에는 수학상이 있다", a: false, d: 3 },
  { q: "프랑스와 브라질은 국경을 맞대고 있다", a: true, d: 3 },
  { q: "에디슨은 전구를 세계 최초로 발명했다", a: false, d: 3 },
  { q: "남아공은 수도가 3개다", a: true, d: 3 },
  { q: "마젤란은 세계일주를 직접 완주했다", a: false, d: 3 },
  { q: "스위스 국기는 정사각형이다", a: true, d: 3 },
  { q: "포춘쿠키는 중국에서 유래했다", a: false, d: 3 },
  { q: "태국은 서양의 식민지가 된 적이 없다", a: true, d: 3 },
  { q: "감자의 원산지는 유럽이다", a: false, d: 3 },
  { q: "처칠은 노벨 문학상을 받았다", a: true, d: 3 },
  { q: "고추의 원산지는 한국이다", a: false, d: 3 },
  { q: "백제는 한때 서울 지역이 수도였다", a: true, d: 3 },
  { q: "오스트리아에는 야생 캥거루가 산다", a: false, d: 3 },
  { q: "직지는 구텐베르크 성경보다 먼저 나왔다", a: true, d: 3 },
  { q: "카자흐스탄의 수도는 알마티다", a: false, d: 3 },
  { q: "남한에서 가장 긴 강은 낙동강이다", a: true, d: 3 },
  { q: "미얀마의 수도는 양곤이다", a: false, d: 3 },
  { q: "사이판은 미국 땅이다", a: true, d: 3 },
  { q: "중국에서 가장 긴 강은 황하다", a: false, d: 3 },
  { q: "아프리카 대륙에 스페인 영토가 있다", a: true, d: 3 },
  { q: "헝가리어는 영어와 같은 어족이다", a: false, d: 3 },
  { q: "뉴질랜드에는 야생 뱀이 없다", a: true, d: 3 },
  { q: "노르웨이는 유럽연합 회원국이다", a: false, d: 3 },
  { q: "사우디아라비아에는 강이 없다", a: true, d: 3 },
  { q: "유로는 유럽연합 모든 나라가 쓴다", a: false, d: 3 },
  { q: "훈민정음은 원래 28자였다", a: true, d: 3 },
  { q: "두바이는 독립된 국가다", a: false, d: 3 },
  { q: "이탈리아 안에는 다른 나라가 2개 있다", a: true, d: 3 },
  { q: "고흐는 생전에 그림으로 떼돈을 벌었다", a: false, d: 3 },
  { q: "미라는 이집트에만 있다", a: false, d: 3 },
  { q: "몽골 인구 절반 가까이가 울란바토르에 산다", a: true, d: 3 },
  { q: "몽골 전통 씨름은 체급을 나눠 겨룬다", a: false, d: 3 },
  { q: "몽골의 독수리 사냥꾼은 대부분 카자흐족이다", a: true, d: 3 },
  { q: "고비사막에는 눈이 전혀 내리지 않는다", a: false, d: 3 },
  { q: "몽골 제국은 역사상 가장 넓은 연속 제국이다", a: true, d: 3 },
  { q: "몽골 유목민의 5대 가축에 돼지가 있다", a: false, d: 3 },
  { q: "은하수는 우리은하가 아닌 다른 은하다", a: false, d: 3 },
  { q: "몽골 초원에는 야생말 타키가 산다", a: true, d: 3 },
  { q: "만리장성은 달에서 맨눈으로 보인다", a: false, d: 3 },
  { q: "에펠탑은 원래 철거될 임시 건축물이었다", a: true, d: 3 },
  { q: "빅벤은 원래 시계가 아니라 종의 이름이다", a: true, d: 3 },
  { q: "시드니 오페라하우스 설계자는 호주인이다", a: false, d: 3 },
  { q: "나폴레옹 군대가 스핑크스 코를 부쉈다", a: false, d: 3 },
  { q: "네덜란드의 수도는 암스테르담이다", a: true, d: 3 },
  { q: "기장과 부기장은 보통 다른 기내식을 먹는다", a: true, d: 3 },
  { q: "비행 중 기내에선 단맛과 짠맛이 둔해진다", a: true, d: 3 },
  { q: "농구를 발명한 사람은 미국에서 태어났다", a: false, d: 3 },
  { q: "탁구는 중국에서 시작된 스포츠다", a: false, d: 3 },
  { q: "골프 홀의 지름은 108mm다", a: true, d: 3 },
  { q: "오륜기 색은 대륙마다 하나씩 정해져 있다", a: false, d: 3 },
  { q: "한국 첫 올림픽 금메달 종목은 레슬링이다", a: true, d: 3 },
  { q: "배드민턴 스매시는 시속 300km를 넘기도 한다", a: true, d: 3 },
  { q: "전자레인지는 레이더 연구 중에 발명됐다", a: true, d: 3 },
  { q: "츄파춥스 로고는 피카소가 그렸다", a: false, d: 3 },
  { q: "아디다스와 푸마의 창업자는 형제다", a: true, d: 3 },
  { q: "삼성은 처음부터 전자회사로 시작했다", a: false, d: 3 },
  { q: "닌텐도는 원래 화투를 만들던 회사다", a: true, d: 3 },
  { q: "노키아는 원래 제지 회사였다", a: true, d: 3 },
  { q: "전구를 최초로 발명한 사람은 에디슨이다", a: false, d: 3 },
  { q: "하와이안 피자는 캐나다에서 탄생했다", a: true, d: 3 },
  { q: "금붕어의 기억력은 3초다", a: false, d: 3 },
  { q: "기린과 사람은 목뼈 개수가 같다", a: true, d: 3 },
  { q: "키위의 원산지는 뉴질랜드다", a: false, d: 3 },
  { q: "고양이는 단맛을 못 느낀다", a: true, d: 3 },
  { q: "브로콜리와 양배추는 같은 종이다", a: true, d: 3 },
  { q: "멜론과 참외는 같은 종이다", a: true, d: 3 },
  { q: "딸기 겉의 알갱이가 진짜 열매다", a: true, d: 3 },
  { q: "바닐라는 난초과 식물이다", a: true, d: 3 },
  { q: "무화과의 꽃은 열매 속에서 핀다", a: true, d: 3 },
  { q: "홉은 대마와 같은 과 식물이다", a: true, d: 3 },
  { q: "소주 증류 기술은 몽골에서 전해졌다", a: true, d: 3 },
  { q: "위스키의 어원은 생명의 물이다", a: true, d: 3 },
  { q: "코카콜라엔 원래 코카인 성분이 있었다", a: true, d: 3 },
  { q: "통조림 따개는 통조림보다 늦게 나왔다", a: true, d: 3 },
  { q: "츄파춥스 로고는 살바도르 달리 작품이다", a: true, d: 3 },
  { q: "시판 와사비는 대부분 서양고추냉이다", a: true, d: 3 },
  { q: "믹스커피는 한국에서 세계 최초로 나왔다", a: true, d: 3 },
  { q: "유네스코에 오른 건 김치 아닌 김장 문화다", a: true, d: 3 },
  { q: "고추의 매운 성분은 씨에 가장 많다", a: false, d: 3 },
  { q: "씨 없는 수박은 유전자 조작 식품이다", a: false, d: 3 },
  { q: "카카오나무의 원산지는 아프리카다", a: false, d: 3 },
  { q: "파인애플의 원산지는 하와이다", a: false, d: 3 },
  { q: "마카다미아의 원산지는 하와이다", a: false, d: 3 },
  { q: "데킬라는 선인장으로 만든다", a: false, d: 3 },
  { q: "데킬라 병엔 원래 벌레가 들어 있다", a: false, d: 3 },
  { q: "진로 소주의 첫 마스코트는 두꺼비였다", a: false, d: 3 },
  { q: "소주병은 처음부터 초록색이었다", a: false, d: 3 },
  { q: "아라비카는 로부스타보다 카페인이 많다", a: false, d: 3 },
  { q: "시저샐러드는 카이사르 요리에서 왔다", a: false, d: 3 },
  { q: "파스타는 마르코 폴로가 들여온 음식이다", a: false, d: 3 },
  { q: "하와이안 피자는 하와이에서 탄생했다", a: false, d: 3 },
  { q: "나폴리탄 스파게티는 이탈리아 요리다", a: false, d: 3 },
  { q: "명란젓은 일본에서 한국으로 전해졌다", a: false, d: 3 },
  { q: "떡볶이는 처음부터 고추장 양념이었다", a: false, d: 3 },
  { q: "냉면은 원래 여름 별미로 시작됐다", a: false, d: 3 },
  { q: "크루아상은 프랑스에서 처음 만들어졌다", a: false, d: 3 },
  { q: "환타는 미국에서 처음 만들어졌다", a: false, d: 3 }
];
let bz = { sel: [], types: ["ox"], goal: 7, scores: [], cur: null, locked: [], phase: "idle", taps: [], winner: -1, oxUsed: [], tid: null, tapTid: null };

function bzReset(){
  clearInterval(bz.tid); bz.tid = null;
  clearTimeout(bz.tapTid); bz.tapTid = null;
  bz.phase = "idle";
  ["bz-setup","bz-play","bz-end"].forEach(id => $(id).style.display = "none");
  $("bz-setup").style.display = "";
  const box = $("bz-players");
  box.innerHTML = "";
  bz.sel = roster.slice(0, 4);
  roster.forEach(n => {
    const b = document.createElement("button");
    b.textContent = n;
    if (bz.sel.includes(n)) b.classList.add("sel");
    b.addEventListener("click", () => {
      if (bz.sel.includes(n)) bz.sel = bz.sel.filter(x => x !== n);
      else if (bz.sel.length < 4) bz.sel.push(n);
      else return alert("버저는 4개까지! 5명 이상은 2인 1팀으로 뭉치자");
      b.classList.toggle("sel", bz.sel.includes(n));
    });
    box.appendChild(b);
  });
}
$("bz-types").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
  const t = b.dataset.t;
  if (bz.types.includes(t)){
    if (bz.types.length === 1) return alert("최소 1개는 골라야지!");
    bz.types = bz.types.filter(x => x !== t);
  } else bz.types.push(t);
  b.classList.toggle("sel", bz.types.includes(t));
}));
$("bz-goal").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
  $("bz-goal").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
  b.classList.add("sel");
  bz.goal = +b.dataset.g;
}));
$("bz-start").addEventListener("click", () => {
  if (bz.sel.length < 2) return alert("2명 이상 선택!");
  bz.scores = bz.sel.map(() => 0);
  bz.oxUsed = [];
  ["bz-setup","bz-end"].forEach(id => $(id).style.display = "none");
  $("bz-play").style.display = "";
  bzNextQ();
});
/* 아랫줄 = 앞쪽 절반, 윗줄 = 나머지(180° 회전 배치) */
function bzIsTop(i){ return i >= Math.ceil(bz.sel.length / 2); }
function bzRenderZones(){
  const top = $("bz-top"), bottom = $("bz-bottom");
  top.innerHTML = ""; bottom.innerHTML = "";
  bz.sel.forEach((n, i) => {
    const z = document.createElement("button");
    z.className = "bz-zone"
      + (bz.phase === "buzz" && !bz.locked.includes(i) ? " live" : "")
      + (i === bz.winner ? " win" : "")
      + (bz.locked.includes(i) ? " lock" : "");
    z.innerHTML = "<b>" + escHtml(n) + "</b><span class=\"sc\">⭐ " + bz.scores[i] + "</span>";
    z.addEventListener("pointerdown", (e) => bzTap(i, e.timeStamp));
    z.addEventListener("contextmenu", (e) => e.preventDefault());
    /* 윗줄은 맞은편에서 보므로 역순으로 끼워 각자 정면에 오게 */
    if (bzIsTop(i)) top.insertBefore(z, top.firstChild);
    else bottom.appendChild(z);
  });
}
/* 문제 생성 */
function bzPickType(types){ return types[Math.floor(Math.random() * types.length)]; }
function bzMakeCalc(){
  const op = ["+","−","×"][Math.floor(Math.random() * 3)];
  let a, b;
  if (op === "×"){ a = 2 + Math.floor(Math.random() * 8); b = 2 + Math.floor(Math.random() * 8); }
  else { a = 2 + Math.floor(Math.random() * 29); b = 2 + Math.floor(Math.random() * 29); }
  if (op === "−" && b > a){ const t = a; a = b; b = t; }
  const ans = op === "+" ? a + b : op === "−" ? a - b : a * b;
  return { type: "calc", q: a + " " + op + " " + b + " = ?", a: ans };
}
/* 난이도 램프(순수): 선두 진행도 0~1 → 출제 난이도. 초반 몸풀기 → 중반 갈림 → 후반 역전각 */
function bzPickDiff(p){
  const r = Math.random();
  if (p < 0.34) return r < 0.6 ? 1 : 2;
  if (p < 0.67) return r < 0.2 ? 1 : (r < 0.8 ? 2 : 3);
  return r < 0.5 ? 3 : (r < 0.85 ? 2 : 1);
}
function bzMakeQ(){
  const t = bzPickType(bz.types);
  if (t === "ox"){
    const d = bzPickDiff(Math.max(0, ...bz.scores) / bz.goal);
    let pool = BZ_OX.map((x, k) => k).filter(k => !bz.oxUsed.includes(k) && BZ_OX[k].d === d);
    if (!pool.length) pool = BZ_OX.map((x, k) => k).filter(k => !bz.oxUsed.includes(k));
    if (!pool.length){ bz.oxUsed = []; pool = BZ_OX.map((x, k) => k).filter(k => BZ_OX[k].d === d); }
    const k = pool[Math.floor(Math.random() * pool.length)];
    bz.oxUsed.push(k);
    const it = BZ_OX[k];
    return { type: "ox", q: it.q, a: it.a, d: it.d, pts: it.d === 3 ? 2 : 1 };
  }
  if (t === "cho"){
    const cats = Object.keys(CHO_BANK);
    const c = cats[Math.floor(Math.random() * cats.length)];
    const w = CHO_BANK[c][Math.floor(Math.random() * CHO_BANK[c].length)];
    return { type: "cho", q: toCho(w), sub: c + " · " + w.length + "글자", a: w };
  }
  return bzMakeCalc();
}
function bzNextQ(){
  bz.cur = bzMakeQ();
  bz.locked = [];
  bz.taps = [];
  bz.winner = -1;
  bz.phase = "count";
  $("bz-mid").classList.remove("flip");
  $("bz-mid").innerHTML = "";
  bzRenderZones();
  let cd = 3;
  bzSetQ('<b style="font-size:32px">' + cd + "</b>");
  clearInterval(bz.tid);
  bz.tid = setInterval(() => {
    cd--;
    if (cd > 0){ bzSetQ('<b style="font-size:32px">' + cd + "</b>"); haptic(10); return; }
    clearInterval(bz.tid); bz.tid = null;
    bzShowQ();
  }, 800);
}
function bzSetQ(html, sub){
  const h = html + (sub ? '<span class="bz-sub">' + sub + "</span>" : "");
  $("bz-q").innerHTML = h;
  $("bz-q-flip").innerHTML = h;
}
function bzShowQ(){
  bz.phase = "buzz";
  bz.taps = [];
  bz.winner = -1;
  const c = bz.cur;
  if (c.type === "ox") bzSetQ(c.q + "?", c.d === 3 ? "🔥 어려움 — 맞히면 +2" : c.d === 1 ? "몸풀기 OX" : "⭕냐 ❌냐");
  else if (c.type === "cho") bzSetQ('<b style="letter-spacing:4px">' + c.q + "</b>", c.sub);
  else bzSetQ(c.q, "빠른 계산");
  $("bz-mid").classList.remove("flip");
  $("bz-mid").innerHTML = '<span class="tag">🔔 버저!</span>';
  bzRenderZones();
  haptic(20);
}
function bzTap(i, ts){
  if (bz.phase !== "buzz" || bz.locked.includes(i)) return;
  bz.taps.push({ i, ts });
  /* 50ms 수집창 — 동시 탭이면 pointerdown 타임스탬프 빠른 쪽이 승자 */
  if (!bz.tapTid) bz.tapTid = setTimeout(bzResolveTap, 50);
}
/* 순수 판정: 잠긴 사람 제외, 타임스탬프 최소가 승자. 없으면 -1 */
function bzPickWinner(taps, locked){
  let best = -1, bt = Infinity;
  for (const t of taps){
    if (locked.includes(t.i)) continue;
    if (t.ts < bt){ bt = t.ts; best = t.i; }
  }
  return best;
}
function bzResolveTap(){
  bz.tapTid = null;
  if (bz.phase !== "buzz") return;
  const w = bzPickWinner(bz.taps, bz.locked);
  bz.taps = [];
  if (w < 0) return;
  bz.winner = w;
  bz.phase = "answer";
  haptic([30, 40, 30]);
  bzRenderZones();
  bzAnswerUI();
}
function bzAnswerUI(){
  const c = bz.cur;
  const mid = $("bz-mid");
  mid.classList.toggle("flip", bzIsTop(bz.winner));
  let h = '<div class="bz-timer" id="bz-timer">5</div><div class="hint" style="margin:0">' + escHtml(bz.sel[bz.winner]) + ", 5초 안에 대답!</div>";
  if (c.type === "ox"){
    h += '<div class="bz-btns"><button id="bz-o">⭕</button><button id="bz-x">❌</button></div>';
  } else {
    h += '<div class="bz-btns"><button class="bz-sm" id="bz-reveal">' + (c.type === "cho" ? "정답 확인 (꾹)" : "정답 공개") + "</button></div>"
      + '<div class="bz-ans" id="bz-ans" style="visibility:hidden">' + c.a + "</div>"
      + '<div class="bz-btns"><button class="bz-sm" id="bz-ok">✅ 맞음</button><button class="bz-sm" id="bz-no">❌ 틀림</button></div>';
  }
  mid.innerHTML = h;
  if (c.type === "ox"){
    $("bz-o").addEventListener("click", () => bzJudge(c.a === true));
    $("bz-x").addEventListener("click", () => bzJudge(c.a === false));
  } else {
    if (c.type === "cho") holdReveal($("bz-reveal"), () => { $("bz-ans").style.visibility = ""; }, () => { $("bz-ans").style.visibility = "hidden"; });
    else $("bz-reveal").addEventListener("click", () => { $("bz-ans").style.visibility = ""; });
    $("bz-ok").addEventListener("click", () => bzJudge(true));
    $("bz-no").addEventListener("click", () => bzJudge(false));
  }
  let t = 5;
  clearInterval(bz.tid);
  bz.tid = setInterval(() => {
    t--;
    const el = $("bz-timer");
    if (el) el.textContent = t;
    if (t <= 0){ clearInterval(bz.tid); bz.tid = null; bzJudge(false); }
  }, 1000);
}
function bzAnsText(){ const c = bz.cur; return c.type === "ox" ? (c.a ? "⭕" : "❌") : String(c.a); }
function bzJudge(correct){
  if (bz.phase !== "answer") return;
  clearInterval(bz.tid); bz.tid = null;
  const w = bz.winner;
  bz.winner = -1;
  if (correct){
    const pts = bz.cur.pts || 1;
    bz.scores[w] += pts;
    haptic(60);
    if (bz.scores[w] >= bz.goal) return bzEnd(w);
    bz.phase = "gap";
    $("bz-mid").innerHTML = '<div class="bz-ans" style="color:var(--steppe)">⭕ 정답! +' + pts + "</div>";
    bzRenderZones();
    bz.tid = setTimeout(bzNextQ, 1000);
  } else {
    bz.scores[w] = Math.max(0, bz.scores[w] - 1);
    bz.locked.push(w);
    haptic([40, 60, 40]);
    if (bz.locked.length >= bz.sel.length){
      bz.phase = "reveal";
      bzRenderZones();
      $("bz-mid").classList.remove("flip");
      $("bz-mid").innerHTML = '<div class="hint" style="margin:0">전원 오답! 정답은</div><div class="bz-ans">' + bzAnsText() + '</div><button class="btn bz-next" id="bz-nq">다음 문제 →</button>';
      $("bz-nq").addEventListener("click", bzNextQ);
    } else {
      bz.phase = "gap";
      $("bz-mid").innerHTML = '<div class="bz-ans" style="color:var(--danger)">❌ 땡! −1</div><div class="hint" style="margin:0">같은 문제, 남은 사람 재버저!</div>';
      bzRenderZones();
      bz.tid = setTimeout(bzShowQ, 1000);
    }
  }
}
function bzEnd(w){
  clearInterval(bz.tid); bz.tid = null;
  clearTimeout(bz.tapTid); bz.tapTid = null;
  bz.phase = "end";
  ["bz-setup","bz-play"].forEach(id => $(id).style.display = "none");
  $("bz-end").style.display = "flex";
  $("bz-champ").textContent = "🏆 " + bz.sel[w];
  const rank = bz.sel.map((n, i) => ({ n, s: bz.scores[i] })).sort((a, b) => b.s - a.s);
  const medals = ["🥇","🥈","🥉"];
  $("bz-rank").innerHTML = '<div class="lbl">최종 스코어</div><div class="val" style="font-size:18px;line-height:2">' +
    rank.map((r, i) => (medals[i] || "·") + " " + escHtml(r.n) + " — " + r.s + "점").join("<br>") + "</div>";
}
$("bz-again").addEventListener("click", bzReset);

