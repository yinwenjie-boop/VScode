import type { TargetLevel } from '../types'

const LEVEL_DESC: Record<TargetLevel, string> = {
  excellent: 'excellent（13–15 分优秀档）',
  good: 'good（10–12 分良好档）',
  pass: 'pass（7–9 分及格档）',
}

export function buildGradePrompt(p: {
  topic: string
  requirements: string
  studentEssay: string
  targetLevel: TargetLevel
}): string {
  return `你是一位经验丰富的中国初中英语阅卷老师，专门批改初三学生的中考英语作文。请严格按照中考评分标准批改以下作文。

【作文题目】${p.topic}
【题目要求】${p.requirements}
【学生作文】
${p.studentEssay}

【学生目标档位】${LEVEL_DESC[p.targetLevel]}

【评分标准】
- 内容（5分）：是否切题、要点是否完整、内容是否充实
- 语言（5分）：语法准确性、用词丰富度、句式多样性
- 结构（3分）：篇章连贯、逻辑清晰、过渡自然
- 书写（2分）：拼写、标点、大小写规范

【批改要求】
1. 严格按照初三学生水平评分，不要给虚高分数。初三学生平均分通常在 9-11 分
2. 批注用中文，让学生能听懂
3. 改写示范要基于学生原本的思路，不要完全推翻重写
4. 至少找出 2 个亮点句给予肯定
5. 重点改进方向要具体可操作，不要说"加强语法"这种空话

请严格按以下 JSON 格式输出，不要有任何额外文字、不要用 markdown 代码块包裹：

{
  "total_score": 数字,
  "dimension_scores": {
    "content": 数字,
    "language": 数字,
    "structure": 数字,
    "writing": 数字
  },
  "sentence_feedback": [
    {
      "original": "学生原句",
      "issue": "问题描述",
      "suggestion": "建议改写",
      "type": "grammar/word/expression/none 中的一个"
    }
  ],
  "overall_comment": "整体评语，先肯定优点再指出问题，200字左右",
  "rewrite": "基于学生原作思路的高分改写版本",
  "highlights": ["亮点句1", "亮点句2"],
  "key_improvements": ["具体改进方向1", "具体改进方向2", "具体改进方向3"]
}`
}
