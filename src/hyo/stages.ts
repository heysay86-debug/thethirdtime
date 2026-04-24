/**
 * 육효점 스테이지 설정
 *
 * 각 효마다 다른 나무의 가지를 모아 점을 친다.
 * 복길(신령 상태)이 나무들 사이를 떠다니며 가지를 모아온다.
 */

export interface HyoStage {
  yaoIndex: number;
  treeName: string;
  treeEmoji: string;
  intro: string;
  splitPrompt: string;
  complete: string;
  // 신령 패스: 나무들 사이를 왔다갔다한 뒤 목적지에 도착
  spiritPath: { x: number; y: number; duration: number }[];
}

// 입장 시 시작 위치
export const START_POS = { x: 38, y: 72 };

// 제단 도착 위치 (완성 시)
export const ALTAR_POS = { x: 48, y: 28 };

export const STAGES: HyoStage[] = [
  {
    yaoIndex: 0,
    treeName: '복숭아나무',
    treeEmoji: '🍑',
    intro: '첫 번째 가지는\n복숭아나무에서 꺾어왔네.\n사악한 기운을 물리치는\n벽사의 나무지.',
    splitPrompt: '가지를 탭하여\n둘로 나누게.',
    complete: '이 기호를 기억해두게.',
    spiritPath: [
      { x: 22, y: 85, duration: 800 },   // 복숭아1
      { x: 38, y: 83, duration: 600 },   // 복숭아2
      { x: 50, y: 87, duration: 600 },   // 복숭아3
      { x: 38, y: 83, duration: 500 },   // 복숭아2 복귀 (가지 수집 완료)
    ],
  },
  {
    yaoIndex: 1,
    treeName: '벼락맞은 나무',
    treeEmoji: '⚡',
    intro: '두 번째 가지는\n벼락맞은 나무에서 가져왔네.\n하늘의 뜻이 깃든\n영험한 나무지.',
    splitPrompt: '가지를 탭하여\n둘로 나누게.',
    complete: '이 기호를 기억해두게.',
    spiritPath: [
      { x: 50, y: 80, duration: 700 },   // 길 위
      { x: 72, y: 75, duration: 900 },   // 벼락맞은 나무
      { x: 55, y: 78, duration: 600 },   // 돌아오기
    ],
  },
  {
    yaoIndex: 2,
    treeName: '월계수',
    treeEmoji: '🌿',
    intro: '세 번째 가지는\n월계수에서 꺾어왔네.\n승리와 영광의\n나무지.',
    splitPrompt: '가지를 탭하여\n둘로 나누게.',
    complete: '이 기호를 기억해두게.',
    spiritPath: [
      { x: 35, y: 78, duration: 600 },   // 계단 하단
      { x: 18, y: 68, duration: 800 },   // 왼쪽 작은 나무
      { x: 55, y: 65, duration: 900 },   // 월계수 (큰 나무)
      { x: 45, y: 67, duration: 500 },   // 약간 뒤로
    ],
  },
  {
    yaoIndex: 3,
    treeName: '편백나무',
    treeEmoji: '🌲',
    intro: '네 번째 가지는\n편백나무에서 가져왔네.\n정화와 치유의\n나무지.',
    splitPrompt: '가지를 탭하여\n둘로 나누게.',
    complete: '이 기호를 기억해두게.',
    spiritPath: [
      { x: 30, y: 60, duration: 700 },   // 계단 중간
      { x: 15, y: 55, duration: 800 },   // 크리스탈 근처
      { x: 28, y: 55, duration: 600 },   // 편백 1
      { x: 38, y: 52, duration: 600 },   // 편백 2
      { x: 33, y: 54, duration: 400 },   // 중간
    ],
  },
  {
    yaoIndex: 4,
    treeName: '자작나무',
    treeEmoji: '🌳',
    intro: '다섯 번째 가지는\n자작나무에서 꺾어왔네.\n새로운 시작을 알리는\n희망의 나무지.',
    splitPrompt: '가지를 탭하여\n둘로 나누게.',
    complete: '이 기호를 기억해두게.',
    spiritPath: [
      { x: 25, y: 55, duration: 600 },   // 돌탑 근처
      { x: 18, y: 58, duration: 700 },   // 자작나무
      { x: 22, y: 62, duration: 500 },   // 왼쪽 나무
      { x: 18, y: 58, duration: 500 },   // 자작나무 복귀
    ],
  },
  {
    yaoIndex: 5,
    treeName: '이름 없는 나무',
    treeEmoji: '🌑',
    intro: '마지막 가지는...\n이름 없는 나무에서 가져왔네.\n아무도 이 나무의 이름을\n모른다네.',
    splitPrompt: '가지를 탭하여\n둘로 나누게.',
    complete: '이 기호를 기억해두게.',
    spiritPath: [
      { x: 30, y: 50, duration: 700 },   // 계단 올라가며
      { x: 38, y: 42, duration: 800 },   // 계단 상단
      { x: 45, y: 38, duration: 600 },   // 제단 앞
    ],
  },
];
