import type { Topic } from '../types'

export const TOPICS: Topic[] = [
  {
    id: 'environment',
    title: '环境保护',
    englishTitle: 'How to Protect Our Environment',
    requirements:
      '环境保护是全社会共同的责任。请围绕"我们应该怎么做"写一篇短文，谈谈目前存在的环境问题，并提出至少 3 条具体可行的建议。词数 80–100。',
    frequency: '高频',
    guidance: {
      analysis:
        '题目要点：①现状（污染/浪费等）②至少 3 条建议 ③呼吁行动。注意使用 should / can 提建议，用 First / Second / Third 等连词组织条理。',
      structure:
        '开头：1–2 句指出环境问题严重。\n主体：分点写 3 条建议（如节能、减塑、绿色出行、植树）。\n结尾：呼吁大家立即行动，共同保护地球。',
      vocabulary:
        'protect the environment / save energy / reduce pollution / plant trees / public transport / recycle / disposable / sort the rubbish / take action / make a difference',
    },
  },
  {
    id: 'healthy-life',
    title: '健康生活',
    englishTitle: 'How to Live a Healthy Life',
    requirements:
      '健康对学生尤其重要。请结合自身情况谈谈如何拥有健康的生活方式，至少从饮食、运动、作息三个方面展开。词数 80–100。',
    frequency: '高频',
    guidance: {
      analysis:
        '题目要点：饮食 / 运动 / 作息 三方面缺一不可。可以加入"心态/远离手机"作为加分点。',
      structure:
        '开头：提出健康生活的重要性。\n主体：分别写 eat healthily / exercise regularly / keep good sleep。\n结尾：表达自己今后将坚持。',
      vocabulary:
        'a balanced diet / vegetables and fruit / junk food / take exercise / go jogging / go to bed early / stay up late / keep fit / in good shape',
    },
  },
  {
    id: 'learning-english',
    title: '学习方法',
    englishTitle: 'My Way of Learning English',
    requirements:
      '请向同学们介绍你学习英语的有效方法（至少 3 条），并谈谈坚持学习给你带来的变化。词数 80–100。',
    frequency: '高频',
    guidance: {
      analysis:
        '题目要点：①方法（不少于 3 条）②带来的变化/收获。注意要写"自己的方法"，用第一人称 + 一般现在时。',
      structure:
        '开头：英语对我而言很重要。\n主体：分点介绍方法（背单词、看美剧、读原版、和同学练对话等）。\n结尾：方法让我进步，建议大家试试。',
      vocabulary:
        'recite words / keep a diary / watch English movies / read aloud / practice with classmates / make progress / lose interest / build confidence',
    },
  },
  {
    id: 'traditional-culture',
    title: '中国传统文化',
    englishTitle: 'My Favorite Chinese Traditional Festival / Culture',
    requirements:
      '请你向外国笔友介绍一项你最喜欢的中国传统文化或节日（如春节、中秋、京剧、书法等），说明它的由来、活动和你喜欢的原因。词数 80–100。',
    frequency: '高频',
    guidance: {
      analysis:
        '题目要点：①是什么 ②活动/特点 ③喜欢的原因。注意"介绍给外国人"，开头可用 Dear ... I want to introduce ...',
      structure:
        '开头：选择一个文化/节日并简短介绍。\n主体：when / what people do / why important。\n结尾：欢迎你来中国一起体验。',
      vocabulary:
        'Spring Festival / Mid-Autumn Festival / family reunion / set off fireworks / paste couplets / mooncakes / a long history / traditional / be popular with',
    },
  },
  {
    id: 'my-dream',
    title: '我的梦想',
    englishTitle: 'My Dream',
    requirements:
      '每个人都有自己的梦想。请围绕"我的梦想"写一篇短文，说明梦想是什么、为什么有这个梦想、打算怎样去实现。词数 80–100。',
    frequency: '常考',
    guidance: {
      analysis:
        '题目要点：①梦想是什么 ②原因 ③如何实现。一般用一般现在时讲梦想本身，will + 动词原形讲计划。',
      structure:
        '开头：直接点题——我的梦想是 become a / be a ...\n主体：原因（受谁影响、为何向往）+ 实现路径（学习、坚持、参加活动）。\n结尾：我相信只要努力就一定能实现。',
      vocabulary:
        'dream of being / inspire / look up to / work hard / never give up / step by step / come true / make my dream a reality',
    },
  },
  {
    id: 'best-friend',
    title: '我的好朋友 / 友谊',
    englishTitle: 'My Best Friend',
    requirements:
      '请介绍你最好的朋友，包括他/她的外貌、性格、爱好，以及一件让你印象深刻、体现友谊的事情。词数 80–100。',
    frequency: '常考',
    guidance: {
      analysis:
        '题目要点：①外貌 ②性格 ③爱好 ④一件事。一件事是重点，要写完整的小故事（时间/地点/经过/感受）。',
      structure:
        '开头：介绍朋友是谁、认识多久。\n主体：外貌+性格+爱好（简洁），然后展开一件具体的事。\n结尾：表达对友谊的珍惜。',
      vocabulary:
        'kind and helpful / good at / share with / be willing to / cheer me up / get along well / a true friend / mean a lot to me',
    },
  },
  {
    id: 'internet',
    title: '网络的利与弊',
    englishTitle: 'Internet: Good or Bad?',
    requirements:
      '互联网已经深入我们的生活，给学生既带来便利也带来困扰。请谈谈网络的好处和坏处，并说说你的看法。词数 80–100。',
    frequency: '高频',
    guidance: {
      analysis:
        '题目要点：①好处（至少 2 条）②坏处（至少 2 条）③个人观点。注意用 on the one hand / on the other hand 平衡两面。',
      structure:
        '开头：网络是把双刃剑。\n主体：On one hand ... 好处；On the other hand ... 坏处。\n结尾：我认为应正确使用网络（in my opinion, we should ...）。',
      vocabulary:
        'search for information / online learning / make friends / be addicted to / waste time / harm our eyes / use ... properly / a double-edged sword',
    },
  },
  {
    id: 'volunteer',
    title: '志愿活动',
    englishTitle: 'Doing Volunteer Work',
    requirements:
      '请描述你最近参加的一次志愿活动：时间、地点、做了什么、有什么感受。也可以谈谈志愿活动对你的意义。词数 80–100。',
    frequency: '中频',
    guidance: {
      analysis:
        '题目要点：时间/地点/做什么/感受 四要素齐全。时态以一般过去时为主。',
      structure:
        '开头：上个月/上周末我参加了一次志愿活动。\n主体：在哪里、做了哪些事（清洁、关爱老人、做翻译等）。\n结尾：感受 + 今后还会继续参加。',
      vocabulary:
        'volunteer work / take part in / clean up / nursing home / pick up rubbish / help others / meaningful / make me proud / be willing to',
    },
  },
  {
    id: 'unforgettable',
    title: '难忘的经历',
    englishTitle: 'An Unforgettable Experience',
    requirements:
      '请以"An Unforgettable Experience"为题，写一段你印象最深的一次经历，要求叙述完整、感受真实。词数 80–100。',
    frequency: '常考',
    guidance: {
      analysis:
        '题目要点：完整的小故事（起因/经过/结果/感受）。可以选第一次/旅行/比赛/失败/帮助他人等。',
      structure:
        '开头：一句话点出事情的概括（去年/去年暑假，发生了一件让我难忘的事）。\n主体：按时间顺序展开，注意细节。\n结尾：感受/启示——这件事让我懂得了…',
      vocabulary:
        'it happened / at first / then / finally / be excited / be nervous / I learned that / I will never forget',
    },
  },
  {
    id: 'advice-letter',
    title: '给XX的建议信',
    englishTitle: 'A Letter of Advice to ...',
    requirements:
      '你的笔友 Mike 最近因为学习压力大、睡眠不好而烦恼。请你给他写一封信，给出至少 3 条建议，帮他缓解压力。词数 80–100。',
    frequency: '高频',
    guidance: {
      analysis:
        '题目要点：①书信格式（Dear Mike / Yours, Li Hua）②至少 3 条建议 ③语气友好。用 you should / why not / it is a good idea to。',
      structure:
        'Dear Mike,\n开头：I\'m sorry to hear that ... 表达关心。\n主体：分条提建议（早睡、运动、聊天、放松等）。\n结尾：I hope my advice helps. + Yours, Li Hua。',
      vocabulary:
        'be under pressure / relax yourself / talk to / take a deep breath / listen to music / get enough sleep / cheer up / it works for me',
    },
  },
]

export function findTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id)
}
