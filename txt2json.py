import json
import re

# 输入输出文件名
INPUT_FILE = '毛概复习题库.txt'
OUTPUT_FILE = 'questions.json'

# 章节标题正则
chapter_pattern = re.compile(r'^(导论|第[一二三四五六七八九十]+章)\s*.*')
# 题型正则
single_choice_pattern = re.compile(r'^(一、)?(单项选择题|单选题)')
judge_pattern = re.compile(r'^(二、)?判断题')
# 选择题题干正则
choice_q_pattern = re.compile(r'^(\d+)[、.．]\s*(.+)')
# 选项正则
option_pattern = re.compile(r'^([A-D])[．\.]?(.+)')
# 答案正则
answer_pattern = re.compile(r'^答案[:：]\s*([A-D])|^答案[:：]\s*（?([对错])）?')
# 解析正则
explanation_pattern = re.compile(r'^解析[:：](.+)')


def parse_txt_to_json(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = [line.rstrip() for line in f]

    data = []
    chapter = None
    qtype = None
    questions = []
    i = 0
    def save_block():
        nonlocal questions, qtype, chapter
        if chapter and qtype and questions:
            data.append({
                'chapter': chapter,
                'type': qtype,
                'questions': questions
            })
            questions = []

    while i < len(lines):
        line = lines[i]
        # 章节
        chapter_match = chapter_pattern.match(line)
        if chapter_match:
            save_block()
            chapter = chapter_match.group(0)
            qtype = None
            i += 1
            continue
        # 题型
        if single_choice_pattern.match(line):
            save_block()
            qtype = '单项选择题'
            i += 1
            continue
        if judge_pattern.match(line):
            save_block()
            qtype = '判断题'
            i += 1
            continue
        # 选择题
        if qtype == '单项选择题':
            q_match = choice_q_pattern.match(line)
            if q_match:
                qtext = q_match.group(2).strip()
                options = []
                # 读取A/B/C/D四个选项
                for j in range(1, 5):
                    if i + j < len(lines):
                        opt_line = lines[i + j]
                        opt_match = option_pattern.match(opt_line)
                        if opt_match:
                            options.append(opt_match.group(2).strip())
                # 查找答案和解析
                answer = ''
                explanation = ''
                k = i + 5
                while k < len(lines):
                    if answer_pattern.match(lines[k]):
                        am = answer_pattern.match(lines[k])
                        answer = am.group(1) or am.group(2)
                        k += 1
                        continue
                    if explanation_pattern.match(lines[k]):
                        em = explanation_pattern.match(lines[k])
                        explanation = em.group(1).strip()
                        k += 1
                        continue
                    # 遇到下一个题目或空行就停止
                    if choice_q_pattern.match(lines[k]) or not lines[k].strip() or judge_pattern.match(lines[k]) or single_choice_pattern.match(lines[k]) or chapter_pattern.match(lines[k]):
                        break
                    k += 1
                questions.append({
                    'question': qtext,
                    'options': options,
                    'answer': answer,
                    'explanation': explanation
                })
                i = k - 1
        # 判断题
        elif qtype == '判断题':
            # 题干
            j_match = re.match(r'^(\d+)[、.．]\s*(.+)[（(]([对错])）?([)）])?', line)
            if j_match:
                qtext = j_match.group(2).strip()
                answer = j_match.group(3)
                explanation = ''
                # 查找解析
                if i+1 < len(lines) and explanation_pattern.match(lines[i+1]):
                    em = explanation_pattern.match(lines[i+1])
                    explanation = em.group(1).strip()
                    i += 1
                questions.append({
                    'question': qtext,
                    'answer': answer,
                    'explanation': explanation
                })
            else:
                # 另一种格式：题干在一行，答案在下一行
                if i+1 < len(lines) and answer_pattern.match(lines[i+1]):
                    qtext = line.strip()
                    am = answer_pattern.match(lines[i+1])
                    answer = am.group(1) or am.group(2)
                    explanation = ''
                    if i+2 < len(lines) and explanation_pattern.match(lines[i+2]):
                        em = explanation_pattern.match(lines[i+2])
                        explanation = em.group(1).strip()
                        i += 1
                    questions.append({
                        'question': qtext,
                        'answer': answer,
                        'explanation': explanation
                    })
        i += 1
    save_block()
    # 写入json
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    parse_txt_to_json(INPUT_FILE, OUTPUT_FILE) 