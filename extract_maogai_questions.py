import re
import json

# 文件路径
input_file = '毛概复习题库.txt'
output_file = '毛概复习题库.json'

# 正则表达式
chapter_re = re.compile(r'^(导论|第[一二三四五六七八九十]+章|结束语)')
choice_type_re = re.compile(r'^一、单项选择题')
judge_type_re = re.compile(r'^二、判断题')
choice_q_re = re.compile(r'^(\d+)[、.](.*)')
option_re = re.compile(r'^[A-D]．(.*)')
answer_re = re.compile(r'^答案：([A-D])；')
source_re = re.compile(r'考题来源[:：](.*)')
judge_q_re = re.compile(r'^(\d+)[、.](.*)[（(](对|错)[)）]')
explanation_re = re.compile(r'^解析[:：](.*)')

# 读取文件
with open(input_file, 'r', encoding='utf-8') as f:
    lines = [line.rstrip() for line in f]

questions = []
current_chapter = None
current_type = None

idx = 0
while idx < len(lines):
    line = lines[idx]
    # 章节
    if chapter_re.match(line):
        current_chapter = line.strip()
        current_type = None
    # 题型
    elif choice_type_re.match(line):
        current_type = '一、单选题'
    elif judge_type_re.match(line):
        current_type = '二、判断题'
    # 选择题
    elif current_type == '一、单选题' and choice_q_re.match(line):
        m = choice_q_re.match(line)
        question = m.group(2).strip()
        options = []
        idx += 1
        # 读取选项
        while idx < len(lines) and option_re.match(lines[idx]):
            opt_line = lines[idx]
            opt_key = opt_line[0]
            opt_val = opt_line[2:].strip()
            options.append(f"{opt_key}.{opt_val}")
            idx += 1
        # 读取答案
        answer = ''
        if idx < len(lines) and answer_re.match(lines[idx]):
            answer = answer_re.match(lines[idx]).group(1)
            idx += 1
        # 读取考题来源（可选）
        if idx < len(lines) and source_re.match(lines[idx]):
            idx += 1
        # analysis 字段（选择题一般无解析）
        analysis = '解析：无'
        questions.append({
            'chapter': current_chapter,
            'type': current_type,
            'question': question,
            'options': options,
            'answer': answer,
            'analysis': analysis
        })
        continue
    # 判断题
    elif current_type == '二、判断题' and judge_q_re.match(line):
        m = judge_q_re.match(line)
        question = m.group(2).strip() + '（' + m.group(3) + '）'
        answer = m.group(3)
        idx += 1
        # 解析
        analysis = '解析：无'
        if idx < len(lines) and explanation_re.match(lines[idx]):
            analysis = '解析：' + explanation_re.match(lines[idx]).group(1).strip()
            idx += 1
        # 考题来源（可选）
        if idx < len(lines) and source_re.match(lines[idx]):
            idx += 1
        # 判断题 options 为空
        options = []
        # answer 转为"正确"/"错误"
        answer_map = {'对': '正确', '错': '错误'}
        answer = answer_map.get(answer, answer)
        questions.append({
            'chapter': current_chapter,
            'type': current_type,
            'question': question,
            'options': options,
            'answer': answer,
            'analysis': analysis
        })
        continue
    idx += 1

# 写入JSON
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({'questions': questions}, f, ensure_ascii=False, indent=2)

print(f'题目已提取并保存到 {output_file}') 