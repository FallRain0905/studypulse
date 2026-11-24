import type { CodingLab } from '../types';

export const CODING_LABS: CodingLab[] = [
  // === ★ 4~8 章最新考试范围：51600 CSV 文件读写 课堂练习 (4 题) ===
  {
    id: 'lab-51600-1',
    chapter: 8,
    title: '统计文件中的字符个数（字典实现）',
    type: 'fill-blank',
    source: '★ 考纲 4~8 章 · 作业 51600 题 1',
    scoreLabel: '填空 10 分',
    isExamScope: true,
    difficulty: '基础',
    description:
      '从文件 src.txt 读取数据，统计不计大小写情况下每个英文字母的出现次数（用字典实现），并按小写字母升序输出。注意单数用 time，复数用 times。',
    requirements: [
      '空 (1)：使用 with open 语句以 UTF-8 只读方式打开 filename，文件对象命名为 infile（注意 4 空格缩进！）。',
      '空 (2)：按字母升序遍历字典 counts 的键，循环变量名为 letter（注意 8 空格缩进！）。',
      '空 (3)：定义 countLetters(line, counts) 函数，统计纯小写字母 a~z 出现次数。',
    ],
    sampleInputDesc: '已预置虚拟文件 src.txt（两行英文句子）',
    sampleOutputDesc: '按 a~z 升序输出每个出现字母的次数，单数 time、复数 times',
    virtualFiles: {
      'src.txt': 'This is a Book.\nWE like reading.\n',
    },
    templateCode: `def main():
    filename = "src.txt"
    # 使用 with open 语句自动管理文件资源
{{1}}
        counts = {}  # 使用字典存储字母计数

        for line in infile:
            countLetters(line.lower(), counts)

        # 显示结果,确保字母按字母顺序显示
{{2}}
            count = counts[letter]
            print(f"{letter} appears {count} time{'s' if count != 1 else ''}")

# 定义统计字符串中每个字母的出现次数的函数countLetters
{{3}}

if __name__ == "__main__":
    main()
`,
    starterCode: '',
    blanks: [
      {
        id: '1',
        label: '空 (1) 打开文件语句',
        placeholder: '    with open(filename, "r", encoding="utf-8") as infile:',
        indentHint: '高危坑：模板前一行以裸换行结尾，此空须自带 4 空格缩进！',
        answer: '    with open(filename, "r", encoding="utf-8") as infile:',
      },
      {
        id: '2',
        label: '空 (2) 按键升序遍历字典',
        placeholder: '        for letter in sorted(counts):',
        indentHint: '位于 with 块内，须自带 8 空格缩进！',
        answer: '        for letter in sorted(counts):',
      },
      {
        id: '3',
        label: '空 (3) 定义 countLetters(line, counts) 函数',
        placeholder: 'def countLetters(line, counts):\n    ...',
        indentHint: '顶层函数定义，顶格写（0 缩进）',
        answer: `def countLetters(line, counts):
    for ch in line:
        if 'a' <= ch <= 'z':
            counts[ch] = counts.get(ch, 0) + 1`,
        multiline: true,
      },
    ],
    expectedOutput: `a appears 2 times
b appears 1 time
d appears 1 time
e appears 3 times
g appears 1 time
h appears 1 time
i appears 4 times
k appears 2 times
l appears 1 time
n appears 1 time
o appears 2 times
r appears 1 time
s appears 2 times
t appears 1 time
w appears 1 time`,
    referenceAnswer: `# 空(1)
    with open(filename, "r", encoding="utf-8") as infile:
# 空(2)
        for letter in sorted(counts):
# 空(3)
def countLetters(line, counts):
    for ch in line:
        if 'a' <= ch <= 'z':
            counts[ch] = counts.get(ch, 0) + 1`,
    explanation: [
      'with open(...) as infile: 自动管理文件关闭；显式指定 encoding="utf-8" 防解码异常。',
      'sorted(counts) 对字典排序默认遍历其键（key），得到按字母升序的列表。',
      "用 'a' <= ch <= 'z' 过滤标点与空白，counts[ch] = counts.get(ch, 0) + 1 是标准字典计数写法。",
    ],
    pitfallNote:
      '【两次 0 分踩坑实录】本题空 (1) 前一行静态代码行尾无空格，平台不会自动补缩进，必须自带 4 空格缩进！提交填空前务必观察前一行行尾。',
  },
  {
    id: 'lab-51600-2',
    chapter: 8,
    title: '成绩排序-文件（CSV 读写与排序）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 作业 51600 题 2',
    scoreLabel: '编程 80 分',
    isExamScope: true,
    difficulty: '中等',
    description:
      '读取 UTF-8 编码的 sdjw-in.csv（列：序号,学号,姓名,班级,高数,英语,政治,体育,历史），按后 5 科总分降序排序，保留原表头并写入 sdjw-out.csv。',
    requirements: [
      '使用标准库 csv 模块读写文件，open 时务必加 newline=""。',
      '表头 rows[0] 不参与排序，仅对数据行 rows[1:] 按总分降序排列。',
      '总分相同保持原相对顺序（Python sort 稳定排序）。',
    ],
    sampleInputDesc: '已预置 sdjw-in.csv（5 位同学样例数据，陈晓总分 446 最高）',
    sampleOutputDesc: '生成的 sdjw-out.csv 按总分从高到低排列，表头不变',
    virtualFiles: {
      'sdjw-in.csv': `序号,学号,姓名,班级,高数,英语,政治,体育,历史
1,2019010027,杨东,资源19-1班,92,68,85,51,70
2,2018011928,苏斌,材料18-3班,51,64,59,79,66
3,2019010088,陈晓,软件19-2班,95,88,91,84,88
4,2019010105,林悦,计科19-1班,80,82,78,86,84
5,2018011203,周航,通信18-2班,70,72,68,75,71
`,
    },
    starterCode: `import csv

# 读取 sdjw-in.csv，按后 5 科总分降序排序，写入 sdjw-out.csv
with open("sdjw-in.csv", "r", encoding="utf-8", newline="") as f:
    rows = list(csv.reader(f))

# TODO: 分离表头和数据，排序后写回 sdjw-out.csv
`,
    expectedOutputFile: 'sdjw-out.csv',
    expectedOutput: `序号,学号,姓名,班级,高数,英语,政治,体育,历史
3,2019010088,陈晓,软件19-2班,95,88,91,84,88
4,2019010105,林悦,计科19-1班,80,82,78,86,84
1,2019010027,杨东,资源19-1班,92,68,85,51,70
5,2018011203,周航,通信18-2班,70,72,68,75,71
2,2018011928,苏斌,材料18-3班,51,64,59,79,66`,
    referenceAnswer: `import csv

with open("sdjw-in.csv", "r", encoding="utf-8", newline="") as f:
    rows = list(csv.reader(f))

header = rows[0]
data = rows[1:]
data.sort(key=lambda x: sum(map(float, x[4:])), reverse=True)

with open("sdjw-out.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(data)`,
    explanation: [
      'csv.reader 返回逐行字符串列表，rows[0] 为表头，rows[1:] 为数据主体。',
      'x[4:] 切片取第 5 列起的 5 科成绩，map(float, ...) 转浮点后 sum() 求和，reverse=True 实现降序。',
      'newline="" 是 Python 官方文档对 csv 模块的强制推荐，可避免 Windows 下多出空行。',
    ],
  },
  {
    id: 'lab-51600-3',
    chapter: 8,
    title: '成绩排序-添加总分列（CSV 扩展）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 作业 51600 题 3',
    scoreLabel: '编程 10 分',
    isExamScope: true,
    difficulty: '中等',
    description:
      '在上一题基础上，输出文件 sdjw-out.csv 末尾新增一列「总分」：表头变为 ...,历史,总分，每行末尾附浮点形式总分（如 446.0）。',
    requirements: [
      '表头拼接 ["总分"]。',
      '每行末尾拼接总分 sum(map(float, row[4:]))，写出为浮点形式（如 446.0）。',
      '按总分降序写入 sdjw-out.csv。',
    ],
    sampleInputDesc: '已预置 sdjw-in.csv（同上题）',
    sampleOutputDesc: 'sdjw-out.csv 增加总分列，第一行数据末尾为 446.0',
    virtualFiles: {
      'sdjw-in.csv': `序号,学号,姓名,班级,高数,英语,政治,体育,历史
1,2019010027,杨东,资源19-1班,92,68,85,51,70
2,2018011928,苏斌,材料18-3班,51,64,59,79,66
3,2019010088,陈晓,软件19-2班,95,88,91,84,88
`,
    },
    starterCode: `import csv

with open("sdjw-in.csv", "r", encoding="utf-8", newline="") as f:
    rows = list(csv.reader(f))

# TODO: 添加总分列并降序写入 sdjw-out.csv
`,
    expectedOutputFile: 'sdjw-out.csv',
    expectedOutput: `序号,学号,姓名,班级,高数,英语,政治,体育,历史,总分
3,2019010088,陈晓,软件19-2班,95,88,91,84,88,446.0
1,2019010027,杨东,资源19-1班,92,68,85,51,70,366.0
2,2018011928,苏斌,材料18-3班,51,64,59,79,66,319.0`,
    referenceAnswer: `import csv

with open("sdjw-in.csv", "r", encoding="utf-8", newline="") as f:
    rows = list(csv.reader(f))

header = rows[0] + ["总分"]
data = rows[1:]
data.sort(key=lambda x: sum(map(float, x[4:])), reverse=True)

with open("sdjw-out.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(header)
    for row in data:
        writer.writerow(row + [sum(map(float, row[4:]))])`,
    explanation: [
      'header = rows[0] + ["总分"] 扩展表头。',
      'sum(map(float, row[4:])) 返回 float（如 446.0），正好符合题目要求的浮点格式。',
    ],
  },
  {
    id: 'lab-51600-4',
    chapter: 8,
    title: '体能训练营成绩统计（避开 csv.writer 引号坑！）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 作业 51600 题 4',
    scoreLabel: '综合必练',
    isExamScope: true,
    difficulty: '综合',
    description:
      '读取 results.txt（第1行10题标准答案，第2行各题分值，第3行起为学员编号+10个答案）。计算每位学员得分、全员平均分（保留2位小数）、最高/最低分及最高/最低答对人数对应的题号列表，写入 SmartPulse_Report.csv（utf-8-sig）。',
    requirements: [
      '报告分为「--- 学员成绩榜单 ---」和「--- 训练营全员统计摘要 ---」两区，中间留一个空行。',
      '题目序号从 1 起算，如 [1, 3, 5, 6, 8, 10] 不能带双引号！',
      '文件不存在时建议 try/except FileNotFoundError 回退 sys.stdin.read()。',
    ],
    sampleInputDesc: '已预置 results.txt（3 位学员答题记录）',
    sampleOutputDesc: '生成无多余双引号的 SmartPulse_Report.csv',
    virtualFiles: {
      'results.txt': `A B C D A B C D A B
10 10 10 10 10 10 10 10 10 10
Athlete_01 A B C D A B C D A B
Athlete_02 B C D A B C D A B C
Athlete_03 A C C A A B D D B B
`,
    },
    starterCode: `import sys

# 读取 results.txt，统计成绩并写入 SmartPulse_Report.csv
# 注意：不要让 [1, 3, 5, ...] 被自动套上双引号！
`,
    expectedOutputFile: 'SmartPulse_Report.csv',
    expectedOutput: `--- 学员成绩榜单 ---
学员编号,最终得分
Athlete_01,100
Athlete_02,0
Athlete_03,60

--- 训练营全员统计摘要 ---
指标名称,指标数值
全员平均分,53.33
最高分,100
最低分,0
最高分题目序号,[1, 3, 5, 6, 8, 10]
该题答对人数,2
最低分题目序号,[2, 4, 7, 9]
该题答对人数,1`,
    referenceAnswer: `import sys

def read_data(filename):
    try:
        with open(filename, "r", encoding="utf-8") as f:
            lines = f.read().split("\\n")
    except FileNotFoundError:
        lines = sys.stdin.read().split("\\n")
    std, scores, students = None, [], []
    for line in lines:
        parts = line.split()
        if not parts:
            continue
        if std is None:
            std = parts
        elif not scores:
            scores = [int(x) for x in parts]
        else:
            students.append((parts[0], parts[1:]))
    return std, scores, students

std, scores, students = read_data("results.txt")
totals = [(name, sum(scores[j] for j in range(10) if ans[j] == std[j])) for name, ans in students]
correct = [sum(1 for _, ans in students if ans[j] == std[j]) for j in range(10)]
mx, mn = max(correct), min(correct)
hi_s = [j + 1 for j in range(10) if correct[j] == mx]
lo_s = [j + 1 for j in range(10) if correct[j] == mn]
all_scores = [t for _, t in totals]
avg = sum(all_scores) / len(all_scores)

with open("SmartPulse_Report.csv", "w", encoding="utf-8-sig", newline="") as f:
    f.write("--- 学员成绩榜单 ---\\n")
    f.write("学员编号,最终得分\\n")
    for name, t in totals:
        f.write(f"{name},{t}\\n")
    f.write("\\n")
    f.write("--- 训练营全员统计摘要 ---\\n")
    f.write("指标名称,指标数值\\n")
    f.write(f"全员平均分,{avg:.2f}\\n")
    f.write(f"最高分,{max(all_scores)}\\n")
    f.write(f"最低分,{min(all_scores)}\\n")
    f.write(f"最高分题目序号,[{', '.join(map(str, hi_s))}]\\n")
    f.write(f"该题答对人数,{mx}\\n")
    f.write(f"最低分题目序号,[{', '.join(map(str, lo_s))}]\\n")
    f.write(f"该题答对人数,{mn}\\n")`,
    explanation: [
      '拆分为读数据、算总分、统计题号、写报告四个清晰步骤。',
      '用 f.write() 手写行而不是 csv.writer，彻底规避含逗号列表被自动加双引号的问题。',
    ],
    pitfallNote:
      '【实战经典坑】使用 csv.writer 会输出 最高分题目序号,"[1, 3, 5, 6, 8, 10]"，多出一对双引号直接判 0 分！改用 f.write() 手写即可一次全过。',
  },

  // === ★ 4~8 章教案核心自测编程实验（第 4~8 章全覆盖！）===
  {
    id: 'lab-exam-ch4-prime',
    chapter: 4,
    title: '★ 教案必练：区间素数筛选（第 4 章循环）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 教案自测',
    scoreLabel: '考纲必刷',
    isExamScope: true,
    difficulty: '中等',
    description:
      '输入两个正整数 m 和 n（空格分隔），找出 [m, n] 闭区间内的所有素数，按空格分隔输出在一行（注意：1 不是素数，试除到 √x 即可）。',
    requirements: ['必须排除 x < 2。', '用试除法 i * i <= x 提升效率，用 join 避免行尾多余空格。'],
    defaultStdin: '1 30\n',
    sampleInputDesc: '1 30',
    sampleOutputDesc: '2 3 5 7 11 13 17 19 23 29',
    starterCode: `m, n = map(int, input().split())
# TODO: 输出 [m, n] 内所有素数，空格分隔
`,
    expectedOutput: '2 3 5 7 11 13 17 19 23 29',
    referenceAnswer: `m, n = map(int, input().split())
primes = []
for x in range(m, n + 1):
    if x < 2:
        continue
    ok = True
    i = 2
    while i * i <= x:
        if x % i == 0:
            ok = False
            break
        i += 1
    if ok:
        primes.append(str(x))
print(" ".join(primes))`,
    explanation: ['用 " ".join(primes) 天然避免行尾多余空格！'],
  },
  {
    id: 'lab-exam-ch4-caesar',
    chapter: 4,
    title: '★ 教案必练：凯撒密码循环移位加密（第 4 章循环）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 第 4 章',
    scoreLabel: '考纲必刷',
    isExamScope: true,
    difficulty: '中等',
    description:
      '输入第一行为明文字符串，第二行为整数位移 k。将其中的小写字母循环后移 k 位（a~z 回绕）、大写字母循环后移 k 位（A~Z 回绕），非字母字符保持不变并输出结果。',
    requirements: [
      '核心公式：chr((ord(ch) - ord("a") + k) % 26 + ord("a"))。',
      '非字母字符（空格、数字、标点）原样保留。',
    ],
    defaultStdin: 'Hello Python XYZ!\n3\n',
    sampleInputDesc: '明文 Hello Python XYZ!，偏移 3',
    sampleOutputDesc: 'Khoor Sbwkrq ABC!',
    starterCode: `text = input()
k = int(input())
# TODO: 实现大小写字母的凯撒循环移位加密
`,
    expectedOutput: 'Khoor Sbwkrq ABC!',
    referenceAnswer: `text = input()
k = int(input())
res = []
for ch in text:
    if 'a' <= ch <= 'z':
        res.append(chr((ord(ch) - ord('a') + k) % 26 + ord('a')))
    elif 'A' <= ch <= 'Z':
        res.append(chr((ord(ch) - ord('A') + k) % 26 + ord('A')))
    else:
        res.append(ch)
print("".join(res))`,
    explanation: ['减基准值映射至 0~25，加 k 后 % 26 实现循环回绕，再加回基准值并用 chr() 转字符。'],
  },
  {
    id: 'lab-exam-ch5-gcd',
    chapter: 5,
    title: '★ 教案自测 4：函数求 GCD 与 LCM（第 5 章函数）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 教案附录 B 题 4',
    scoreLabel: '考纲必刷',
    isExamScope: true,
    difficulty: '基础',
    description:
      '输入两个空格分隔的正整数 a 和 b，编写函数 whileGCD(a, b)（辗转相除法）求最大公约数，以及 lcm(a, b) 求最小公倍数，一行输出两者（空格分隔）。',
    requirements: ['使用辗转相除法 while b != 0: a, b = b, a % b。', 'LCM 推荐先除后乘：a // g * b。'],
    defaultStdin: '48 18\n',
    sampleInputDesc: '48 18',
    sampleOutputDesc: '6 144',
    starterCode: `def whileGCD(a, b):
    # TODO: 辗转相除法求最大公约数
    pass

def calcLCM(a, b):
    # TODO: 利用 GCD 求最小公倍数
    pass

a, b = map(int, input().split())
print(whileGCD(a, b), calcLCM(a, b))
`,
    expectedOutput: '6 144',
    referenceAnswer: `def whileGCD(a, b):
    while b != 0:
        a, b = b, a % b
    return a

def calcLCM(a, b):
    return a // whileGCD(a, b) * b

a, b = map(int, input().split())
print(whileGCD(a, b), calcLCM(a, b))`,
    explanation: ['利用数学恒等式 GCD(a,b) = GCD(b, a%b)，元组解包同步更新直到余数为 0。'],
  },
  {
    id: 'lab-exam-ch6-pascal',
    chapter: 6,
    title: '★ 教案自测 6：二维列表输出杨辉三角（第 6 章列表）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 教案附录 B 题 6',
    scoreLabel: '考纲必刷',
    isExamScope: true,
    difficulty: '中等',
    description:
      '输入正整数 n，使用二维列表生成并输出前 n 行杨辉三角，每行数字之间以单个空格分隔（无行尾空格）。',
    requirements: [
      '第 i 行（从 0 起）有 i+1 个元素，首尾为 1。',
      '中间元素满足 tri[i][j] = tri[i-1][j-1] + tri[i-1][j]。',
    ],
    defaultStdin: '5\n',
    sampleInputDesc: '5',
    sampleOutputDesc: '1\n1 1\n1 2 1\n1 3 3 1\n1 4 6 4 1',
    starterCode: `n = int(input())
# TODO: 用二维列表构造并逐行打印 n 行杨辉三角
`,
    expectedOutput: `1
1 1
1 2 1
1 3 3 1
1 4 6 4 1`,
    referenceAnswer: `n = int(input())
tri = []
for i in range(n):
    row = [1] * (i + 1)
    for j in range(1, i):
        row[j] = tri[i - 1][j - 1] + tri[i - 1][j]
    tri.append(row)
for row in tri:
    print(" ".join(map(str, row)))`,
    explanation: ['每行初始化全 1，再填充中间位置，最后用 " ".join(map(str, row)) 干净输出。'],
  },
  {
    id: 'lab-exam-ch7-freq',
    chapter: 7,
    title: '★ 教案自测 7：字符频次统计 Top3（第 7 章字典）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 教案附录 B 题 7',
    scoreLabel: '考纲必刷',
    isExamScope: true,
    difficulty: '基础',
    description:
      '输入一行英文字符串（忽略空格，区分大小写按原样或全转小写——本题统一转小写并仅统计字母），统计每个字母出现次数，按次数降序输出前 3 名（格式：字母 次数）。同次数保持首次出现顺序。',
    requirements: [
      '用字典 cnt[ch] = cnt.get(ch, 0) + 1 统计。',
      '用 sorted(cnt.items(), key=lambda kv: -kv[1])[:3] 稳定降序取前 3。',
    ],
    defaultStdin: 'banana apple python\n',
    sampleInputDesc: 'banana apple python',
    sampleOutputDesc: 'a 4\nn 3\np 3',
    starterCode: `s = input().lower()
# TODO: 统计字母频次并按次数降序输出前 3（每行: 字母 次数）
`,
    expectedOutput: `a 4
n 3
p 3`,
    referenceAnswer: `s = input().lower()
cnt = {}
for ch in s:
    if 'a' <= ch <= 'z':
        cnt[ch] = cnt.get(ch, 0) + 1
for ch, c in sorted(cnt.items(), key=lambda kv: -kv[1])[:3]:
    print(ch, c)`,
    explanation: ['Python 字典保持插入序，配合稳定排序 key=lambda kv: -kv[1]，次数相同时自动保留先出现的字母。'],
  },
  {
    id: 'lab-exam-ch7-courses',
    chapter: 7,
    title: '★ 教案自测 8：三人选课集合交并差（第 7 章集合）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 教案附录 B 题 8',
    scoreLabel: '考纲必刷',
    isExamScope: true,
    difficulty: '基础',
    description:
      '输入三行，分别是 A、B、C 三门课的选课学生名单（空格分隔）。依次分三行输出：① 总选课人数（去重）；② 只选 A 的人数；③ 三门都选的人数。',
    requirements: ['用 set(input().split()) 读入三门课集合。', '善用集合运算符 |（并）、-（差）、&（交）。'],
    defaultStdin: 'Tom Jerry Alice Bob\nJerry Bob Lucy\nAlice Bob Tom\n',
    sampleInputDesc: '三行学生名单',
    sampleOutputDesc: '5\n0\n1',
    starterCode: `a = set(input().split())
b = set(input().split())
c = set(input().split())
# TODO: 依次输出总人数、只选A人数、三门都选人数
`,
    expectedOutput: `5
0
1`,
    referenceAnswer: `a = set(input().split())
b = set(input().split())
c = set(input().split())
print(len(a | b | c))
print(len(a - b - c))
print(len(a & b & c))`,
    explanation: ['总人数 len(a | b | c)=5，只选 A 为 a - b - c（空集 0），三门都选仅 Bob（1）。'],
  },
  {
    id: 'lab-exam-ch8-rank',
    chapter: 8,
    title: '★ 教案自测 9：读 score.txt 排序写入 rank.txt（第 8 章文件）',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 教案附录 B 题 9',
    scoreLabel: '考纲必刷',
    isExamScope: true,
    difficulty: '中等',
    description:
      '读取 score.txt（每行「姓名 分数」），按分数从高到低排序，将结果写入 rank.txt，每行格式为「名次 姓名 分数」（名次从 1 开始）。',
    requirements: ['使用 with open UTF-8 读写。', '每行解析为 (姓名, int(分数)) 元组列表，按分数降序排序，写入时每行手补 \\n。'],
    sampleInputDesc: '已预置 score.txt（4 名同学姓名与分数）',
    sampleOutputDesc: '生成 rank.txt，按分数降序标出名次 1~4',
    virtualFiles: {
      'score.txt': `张三 85\n李四 96\n王五 78\n赵六 91\n`,
    },
    starterCode: `# TODO: 读取 score.txt，按分数降序写入 rank.txt（每行: 名次 姓名 分数）
`,
    expectedOutputFile: 'rank.txt',
    expectedOutput: `1 李四 96
2 赵六 91
3 张三 85
4 王五 78`,
    referenceAnswer: `pairs = []
with open("score.txt", "r", encoding="utf-8") as f:
    for line in f:
        parts = line.split()
        if len(parts) >= 2:
            pairs.append((parts[0], int(parts[1])))

pairs.sort(key=lambda x: -x[1])

with open("rank.txt", "w", encoding="utf-8") as f:
    for idx, (name, sc) in enumerate(pairs, start=1):
        f.write(f"{idx} {name} {sc}\\n")`,
    explanation: ['enumerate(pairs, start=1) 优雅生成从 1 起的名次，f.write 末尾记得补 \\n。'],
  },
  {
    id: 'lab-exam-ch8-topwords',
    chapter: 8,
    title: '★ 教案自测 10：读 words.txt 统计词频 Top5 写 top.txt',
    type: 'coding',
    source: '★ 考纲 4~8 章 · 教案附录 B 题 10',
    scoreLabel: '综合必刷',
    isExamScope: true,
    difficulty: '中等',
    description:
      '读取 words.txt（每行一个英文单词，忽略大小写），统计每个单词出现次数，按次数降序取前 5 写入 top.txt（每行格式：单词 次数）。',
    requirements: ['行首尾空白用 .strip() 清洗并转小写。', '字典计数 + sorted(cnt.items(), key=lambda kv: -kv[1])[:5] 写入 top.txt。'],
    sampleInputDesc: '已预置 words.txt（15 行英文单词）',
    sampleOutputDesc: '生成 top.txt，输出频次最高的 5 个单词与次数',
    virtualFiles: {
      'words.txt': `python\ncode\nPython\nloop\nlist\npython\ndict\ncode\nfile\nlist\ncode\npython\nloop\ndict\nset\n`,
    },
    starterCode: `# TODO: 读取 words.txt，统计词频 Top5 写入 top.txt
`,
    expectedOutputFile: 'top.txt',
    expectedOutput: `python 4
code 3
loop 2
list 2
dict 2`,
    referenceAnswer: `cnt = {}
with open("words.txt", "r", encoding="utf-8") as f:
    for line in f:
        w = line.strip().lower()
        if w:
            cnt[w] = cnt.get(w, 0) + 1

top5 = sorted(cnt.items(), key=lambda kv: -kv[1])[:5]
with open("top.txt", "w", encoding="utf-8") as f:
    for w, c in top5:
        f.write(f"{w} {c}\\n")`,
    explanation: ['完整串联第 7 章字典统计与第 8 章文件读写，是期末综合大题的核心母题！'],
  },

  // === 作业 51601 Module10-3 面向对象-继承和多态 (新更 2 题) ===
  {
    id: 'lab-51601-6',
    chapter: 10,
    title: 'GeometricObject 图形系统（继承·多态·动态绑定 5 空）',
    type: 'fill-blank',
    source: '作业 51601 · 题 6（新更）',
    scoreLabel: '填空 25 分',
    isExamScope: false,
    difficulty: '中等',
    description:
      '通用基类 GeometricObject 及其子类 Circle、Rectangle。完成 5 个空位：Circle 继承基类、super() 初始化父类属性、getInfo 多态调用面积、创建 2×4 矩形并输出信息。',
    requirements: [
      '空 (1)：填写 Circle 继承的基类名（GeometricObject）。',
      '空 (2)：调用父类构造方法初始化默认 color/filled。',
      '空 (3)：多态动态绑定调用任意图形 g 的面积方法。',
      '空 (4)(5)：创建宽 2 高 4 的 Rectangle(2, 4) 并调用 getInfo(rectangle1)。',
    ],
    sampleInputDesc: '无输入（固定演示 3 种图形的多态输出）',
    sampleOutputDesc: '按基类、圆、矩形顺序输出完整精度面积（勿四舍五入！）',
    templateCode: `import math

class GeometricObject:
    def __init__(self, color="green", filled=True):
        self.__color = color
        self.__filled = filled

    def __str__(self):
        return "color is " + self.__color + " and filled is " + str(self.__filled)

    def getArea(self):
        return 0

class Circle({{1}}):
    def __init__(self, radius):
        {{2}}
        self.__radius = radius

    def getArea(self):
        return math.pi * self.__radius ** 2

    def __str__(self):
        return "A circle: radius is " + str(self.__radius) + " and " + super().__str__()

class Rectangle(GeometricObject):
    def __init__(self, width, height):
        super().__init__()
        self.__width = width
        self.__height = height

    def getArea(self):
        return self.__width * self.__height

    def __str__(self):
        return "A RectAngle: " + str(self.__width) + "*" + str(self.__height) + " and " + super().__str__()

def getInfo(g):
    s = {{3}}
    print(g, "area=" + str(s))

g1 = GeometricObject()
circle1 = Circle(1.5)
rectangle1 = {{4}}
getInfo(g1)
getInfo(circle1)
{{5}}
`,
    starterCode: '',
    blanks: [
      {
        id: '1',
        label: '空 (1) Circle 继承的父类名',
        placeholder: 'GeometricObject',
        indentHint: '行内基类名位（不加冒号）',
        answer: 'GeometricObject',
      },
      {
        id: '2',
        label: '空 (2) 调用父类构造方法',
        placeholder: 'super().__init__()',
        indentHint: '模板已缩进，顶格写表达式即可',
        answer: 'super().__init__()',
      },
      {
        id: '3',
        label: '空 (3) 多态计算任意图形 g 的面积',
        placeholder: 'g.getArea()',
        indentHint: '行内表达式位',
        answer: 'g.getArea()',
      },
      {
        id: '4',
        label: '空 (4) 创建宽 2 高 4 的矩形对象',
        placeholder: 'Rectangle(2, 4)',
        indentHint: '行内表达式位',
        answer: 'Rectangle(2, 4)',
      },
      {
        id: '5',
        label: '空 (5) 调用 getInfo 输出 rectangle1',
        placeholder: 'getInfo(rectangle1)',
        indentHint: '顶格语句位',
        answer: 'getInfo(rectangle1)',
      },
    ],
    expectedOutput: `color is green and filled is True area=0
A circle: radius is 1.5 and color is green and filled is True area=7.0685834705770345
A RectAngle: 2*4 and color is green and filled is True area=8`,
    referenceAnswer: `# 空(1): GeometricObject
# 空(2): super().__init__()
# 空(3): g.getArea()
# 空(4): Rectangle(2, 4)
# 空(5): getInfo(rectangle1)`,
    explanation: [
      'super().__init__() 复用基类初始化 color="green", filled=True。',
      'getInfo(g) 内的 g.getArea() 在运行时根据 g 的实际类型动态绑定到 GeometricObject / Circle / Rectangle 的 getArea，完全无需 if/elif 判断类型！',
    ],
    pitfallNote:
      '【精度提醒】area=7.0685834705770345 是 str(s) 直接输出的完整浮点精度，千万不要擅自四舍五入！',
  },
  {
    id: 'lab-51601-7',
    chapter: 10,
    title: 'Ring 圆环类的实现（继承 + 私有域 + super().__str__）',
    type: 'coding',
    source: '作业 51601 · 题 7（新更）',
    scoreLabel: '编程 25 分',
    isExamScope: false,
    difficulty: '综合',
    description:
      '继承给定的 GeometricObject 类，设计 Ring 圆环类：私有域内半径（默认1）、外半径（默认2）、序号；实现 getInnerRadius()、getArea()（外圆减内圆）和覆盖 __str__()（拼接 super().__str__()）。输入内半径,外半径,学号 / 颜色 / 1或0，按要求 5 行输出。',
    requirements: [
      '半径务必用 int 解析（样例输出 10 与 20，用 float 输出 10.0 会判错！）。',
      '__str__ 覆盖：`"The "+str(self.__ringID)+" Ring\'s:"+super().__str__()+",outerRadius is "+str(self.__outerRadius)`。',
      '面积保留 3 位小数：`"The area is {:.3f}".format(...)`。',
    ],
    defaultStdin: '10,20,20200101111\nblue\n1\n',
    sampleInputDesc: '10,20,20200101111 / blue / 1',
    sampleOutputDesc: '5 行描述、面积(942.478)、内半径(10)、颜色(blue)、填充(True)',
    starterCode: `import math

class GeometricObject:
    def __init__(self, color="green", filled=True):
        self.color = color
        self.filled = filled
    def getColor(self):
        return self.color
    def setColor(self, color):
        self.color = color
    def isFilled(self):
        return self.filled
    def setFilled(self, filled):
        self.filled = filled
    def __str__(self):
        return "color is " + self.color + " and filled is " + str(self.filled)

# TODO: 定义 Ring(GeometricObject) 类及 main() 主流程
`,
    expectedOutput: `The 20200101111 Ring's:color is blue and filled is True,outerRadius is 20
The area is 942.478
The innerRadius is 10
Color is blue
Filled is True`,
    referenceAnswer: `import math

class GeometricObject:
    def __init__(self, color="green", filled=True):
        self.color = color
        self.filled = filled
    def getColor(self):
        return self.color
    def setColor(self, color):
        self.color = color
    def isFilled(self):
        return self.filled
    def setFilled(self, filled):
        self.filled = filled
    def __str__(self):
        return "color is " + self.color + " and filled is " + str(self.filled)

class Ring(GeometricObject):
    def __init__(self, innerRadius=1, outerRadius=2, ringID=0):
        super().__init__()
        self.__innerRadius = innerRadius
        self.__outerRadius = outerRadius
        self.__ringID = ringID

    def getInnerRadius(self):
        return self.__innerRadius

    def getArea(self):
        return math.pi * (self.__outerRadius ** 2 - self.__innerRadius ** 2)

    def __str__(self):
        return "The " + str(self.__ringID) + " Ring's:" + super().__str__() + ",outerRadius is " + str(self.__outerRadius)

def main():
    parts = input().split(",")
    innerRadius = int(parts[0])
    outerRadius = int(parts[1])
    ringID = parts[2]
    color = input()
    filled = input() == "1"
    r20200101111 = Ring(innerRadius, outerRadius, ringID)
    r20200101111.setColor(color)
    r20200101111.setFilled(filled)
    print(r20200101111.__str__())
    print("The area is {:.3f}".format(r20200101111.getArea()))
    print("The innerRadius is", r20200101111.getInnerRadius())
    print("Color is", r20200101111.getColor())
    print("Filled is", r20200101111.isFilled())

main()`,
    explanation: [
      '双下划线前缀 self.__innerRadius 实现私有数据域；super().__init__() 完成基类初始化。',
      '圆环面积 = π(R² − r²) = π(400 - 100) ≈ 942.478。',
    ],
    pitfallNote:
      '【51601 实测踩坑】半径千万不要默认用 float()，否则输出 outerRadius is 20.0 与样例 20 不符判错！学号保持 str 原样。',
  },

  // === 作业 51603 Module10-2 面向对象 (6 题) ===
  {
    id: 'lab-51603-2',
    chapter: 10,
    title: 'Point 类：三维两点距离（同类对象协作）',
    type: 'fill-blank',
    source: '作业 51603 · 题 2',
    scoreLabel: '填空 10 分',
    isExamScope: false,
    difficulty: '基础',
    description:
      '定义三维坐标点类 Point，实现构造方法 __init__(self, x, y, z) 与成员方法 dist_from(self, other) 计算两点间欧氏距离。',
    requirements: [
      '构造方法将 x, y, z 保存为实例属性 self.x, self.y, self.z。',
      'dist_from(self, other) 接收另一个 Point 对象，返回 √(Δx²+Δy²+Δz²)。',
    ],
    defaultStdin: '0 0 0\n1 1 1\n',
    sampleInputDesc: '两行三维坐标：0 0 0 和 1 1 1',
    sampleOutputDesc: '1.73',
    templateCode: `import math

{{1}}

x1, y1, z1 = map(float, input().split())
x2, y2, z2 = map(float, input().split())
p1 = Point(x1, y1, z1)
p2 = Point(x2, y2, z2)
print("{:.2f}".format(p1.dist_from(p2)))
`,
    starterCode: '',
    blanks: [
      {
        id: '1',
        label: '空 (1) 完整定义 Point 类',
        placeholder: 'class Point:\n    def __init__(self, x, y, z):\n        ...',
        indentHint: '顶层类定义，顶格写',
        multiline: true,
        answer: `class Point():
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

    def dist_from(self, other):
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2 + (self.z - other.z) ** 2)`,
      },
    ],
    expectedOutput: '1.73',
    referenceAnswer: `class Point():
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

    def dist_from(self, other):
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2 + (self.z - other.z) ** 2)`,
    explanation: [
      'other 参数是另一个 Point 实例，方法内部可通过 other.x / other.y / other.z 访问对方属性。',
    ],
  },
  {
    id: 'lab-51603-4',
    chapter: 10,
    title: 'Time 类增加 nextHour 方法（24小时取模）',
    type: 'fill-blank',
    source: '作业 51603 · 题 4',
    scoreLabel: '填空 10 分',
    isExamScope: false,
    difficulty: '基础',
    description:
      '为已有 Time 类补充成员方法 nextHour(self)，将时间推进到下一个整点（24 小时制，23 时推进后变为 00 时，分秒不变）。',
    requirements: ['只推进 self.hour，利用 % 24 处理跨零点。', '类方法须带 4 空格缩进。'],
    defaultStdin: '23 59 7\n',
    sampleInputDesc: '23 59 7',
    sampleOutputDesc: '00:59:07',
    templateCode: `class Time:
    def __init__(self, h=0, m=0, s=0):
        self.hour = h
        self.minute = m
        self.second = s

    def showTime(self):
        print("{:0>2}:{:0>2}:{:0>2}".format(self.hour, self.minute, self.second))

{{1}}

h, m, s = map(int, input().split())
t = Time(h, m, s)
t.nextHour()
t.showTime()
`,
    starterCode: '',
    blanks: [
      {
        id: '1',
        label: '空 (1) 补充 nextHour 方法',
        placeholder: '    def nextHour(self):\n        self.hour = (self.hour + 1) % 24',
        indentHint: '类方法须带 4 空格缩进',
        multiline: true,
        answer: `    def nextHour(self):
        self.hour = (self.hour + 1) % 24`,
      },
    ],
    expectedOutput: '00:59:07',
    referenceAnswer: `    def nextHour(self):
        self.hour = (self.hour + 1) % 24`,
    explanation: ['取模 (self.hour + 1) % 24 优雅处理 23 -> 0 跨零点进位。'],
  },
  {
    id: 'lab-51603-5',
    chapter: 10,
    title: 'Student 类增加 allPassed 布尔方法',
    type: 'fill-blank',
    source: '作业 51603 · 题 5',
    scoreLabel: '填空 10 分',
    isExamScope: false,
    difficulty: '基础',
    description:
      '为 Student 类增加成员方法 allPassed(self)，判别学生 mathScore、engScore、proScore 三科是否全部 >= 60，全部及格返回 True，否则返回 False。',
    requirements: ['直接返回三科均 >= 60 的布尔表达式，用 and 连接。'],
    defaultStdin: '78 60 92\n',
    sampleInputDesc: '78 60 92',
    sampleOutputDesc: 'All passed.',
    templateCode: `class Student:
    def __init__(self, m, e, p):
        self.mathScore = m
        self.engScore = e
        self.proScore = p

{{1}}

m, e, p = map(float, input().split())
s = Student(m, e, p)
print("All passed." if s.allPassed() else "Not all passed.")
`,
    starterCode: '',
    blanks: [
      {
        id: '1',
        label: '空 (1) 定义 allPassed 方法',
        placeholder: '    def allPassed(self):\n        return ...',
        indentHint: '类方法须带 4 空格缩进',
        multiline: true,
        answer: `    def allPassed(self):
        return self.mathScore >= 60 and self.engScore >= 60 and self.proScore >= 60`,
      },
    ],
    expectedOutput: 'All passed.',
    referenceAnswer: `    def allPassed(self):
        return self.mathScore >= 60 and self.engScore >= 60 and self.proScore >= 60`,
    explanation: ['布尔方法直接 return 逻辑表达式，简洁清晰。'],
  },
  {
    id: 'lab-51603-6',
    chapter: 10,
    title: 'Circle 类封装（四空联动：类定义 + 调用 + 表达式位）',
    type: 'fill-blank',
    source: '作业 51603 · 题 6',
    scoreLabel: '填空 20 分',
    isExamScope: false,
    difficulty: '中等',
    description:
      '完成 Circle 类（含 r=0 默认构造、带 >0 防御性校验的 setRadius、getRadius、perimeter 周长方法），并在主流程中创建对象、将半径翻倍并输出。',
    requirements: [
      '空 (1)：定义 Circle 类，setRadius(self, r) 仅在 r > 0 时修改 self.r。',
      '空 (2)(3)：创建对象 c1 并通过 setter/getter 将半径翻倍。',
      '空 (4)：format() 内的表达式空位，只填 c1.perimeter()。',
    ],
    defaultStdin: '1\n',
    sampleInputDesc: '输入半径 1',
    sampleOutputDesc: 'c1半径=1.0,c1周长=6.3\nc1半径=2.0,c1周长=12.6',
    templateCode: `import math

{{1}}

r1 = float(input())
{{2}}
print("c1半径={:.1f},c1周长={:.1f}".format(c1.getRadius(), {{4}}))
{{3}}
print("c1半径={:.1f},c1周长={:.1f}".format(c1.getRadius(), c1.perimeter()))
`,
    starterCode: '',
    blanks: [
      {
        id: '1',
        label: '空 (1) Circle 类定义',
        placeholder: 'class Circle:\n    ...',
        indentHint: '顶格类定义',
        multiline: true,
        answer: `class Circle():
    def __init__(self, r=0):
        self.r = r

    def setRadius(self, r):
        if r > 0:
            self.r = r

    def getRadius(self):
        return self.r

    def perimeter(self):
        return 2 * math.pi * self.r`,
      },
      {
        id: '2',
        label: '空 (2) 创建对象 c1',
        placeholder: 'c1 = Circle(r1)',
        indentHint: '顶格语句',
        answer: 'c1 = Circle(r1)',
      },
      {
        id: '3',
        label: '空 (3) 半径改为 2 倍',
        placeholder: 'c1.setRadius(c1.getRadius() * 2)',
        indentHint: '顶格语句',
        answer: 'c1.setRadius(c1.getRadius() * 2)',
      },
      {
        id: '4',
        label: '空 (4) 行内周长表达式',
        placeholder: 'c1.perimeter()',
        indentHint: 'format(...) 参数位置，只填表达式！',
        answer: 'c1.perimeter()',
      },
    ],
    expectedOutput: 'c1半径=1.0,c1周长=6.3\nc1半径=2.0,c1周长=12.6',
    referenceAnswer: `class Circle():
    def __init__(self, r=0): self.r = r
    def setRadius(self, r):
        if r > 0: self.r = r
    def getRadius(self): return self.r
    def perimeter(self): return 2 * math.pi * self.r`,
    explanation: ['setRadius 中的 if r > 0 是封装防御性校验的经典示例。'],
  },
  {
    id: 'lab-51603-7',
    chapter: 10,
    title: 'Triangle 类：等边浮点判定与海伦面积',
    type: 'fill-blank',
    source: '作业 51603 · 题 7',
    scoreLabel: '填空 15 分',
    isExamScope: false,
    difficulty: '中等',
    description:
      '定义 Triangle 类：__init__(self, a, b, c) 保存三边；IsEquilateralTriangle(self) 使用 math.fabs(n-m) <= 0.001 判断是否等边；getArea(self) 用海伦公式返回面积。',
    requirements: [
      '浮点比较严禁直接 ==，须用 math.fabs(self.a - self.b) <= 0.001 and math.fabs(self.b - self.c) <= 0.001。',
      '海伦公式：p = (a+b+c)/2，S = sqrt(p*(p-a)*(p-b)*(p-c))。',
    ],
    defaultStdin: '4,4,4\n',
    sampleInputDesc: '4,4,4',
    sampleOutputDesc: '面积: 6.93\n等边三角形',
    templateCode: `import math

{{1}}

a, b, c = map(float, input().split(","))
if a + b > c and a + c > b and b + c > a:
    t = Triangle(a, b, c)
    print(f"面积: {t.getArea():.2f}")
    print("等边三角形" if t.IsEquilateralTriangle() else "非等边三角形")
else:
    print("The input is not a triangle.")
`,
    starterCode: '',
    blanks: [
      {
        id: '1',
        label: '空 (1) 完整定义 Triangle 类',
        placeholder: 'class Triangle:\n    ...',
        indentHint: '顶格类定义',
        multiline: true,
        answer: `class Triangle():
    def __init__(self, a, b, c):
        self.a = a
        self.b = b
        self.c = c

    def IsEquilateralTriangle(self):
        return math.fabs(self.a - self.b) <= 0.001 and math.fabs(self.b - self.c) <= 0.001

    def getArea(self):
        p = (self.a + self.b + self.c) / 2
        return math.sqrt(p * (p - self.a) * (p - self.b) * (p - self.c))`,
      },
    ],
    expectedOutput: '面积: 6.93\n等边三角形',
    referenceAnswer: `class Triangle():
    def __init__(self, a, b, c):
        self.a, self.b, self.c = a, b, c
    def IsEquilateralTriangle(self):
        return math.fabs(self.a - self.b) <= 0.001 and math.fabs(self.b - self.c) <= 0.001
    def getArea(self):
        p = (self.a + self.b + self.c) / 2
        return math.sqrt(p * (p - self.a) * (p - self.b) * (p - self.c))`,
    explanation: ['合法三角形判定已在 main 中完成，类方法专注面积和等边逻辑即可。'],
  },
  {
    id: 'lab-51603-8',
    chapter: 10,
    title: '组合图形面积计算（三角形 + 3 个半圆）',
    type: 'coding',
    source: '作业 51603 · 题 8',
    scoreLabel: '编程 10 分',
    isExamScope: false,
    difficulty: '综合',
    description:
      '输入逗号分隔的三角形三边 a,b,c，用面向对象方式分别定义 Triangle 类与 Circle 类，计算「1 个三角形 + 以三边为直径朝外的 3 个半圆」组合图形总面积，保留 2 位小数输出。',
    requirements: [
      '分别封装 Triangle.getArea()（海伦公式）和 Circle.getArea()（半圆面积 π(d/2)²/2）。',
      '使用 math.pi，输出结果保留两位小数（如 3,4,5 -> 25.63）。',
    ],
    defaultStdin: '3,4,5\n',
    sampleInputDesc: '3,4,5',
    sampleOutputDesc: '25.63',
    starterCode: `import math

# TODO: 定义 Triangle 类和 Circle 类，读入 a,b,c 并输出组合面积（保留2位小数）
`,
    expectedOutput: '25.63',
    referenceAnswer: `import math

class Triangle():
    def __init__(self, a, b, c):
        self.a = a
        self.b = b
        self.c = c

    def getArea(self):
        p = (self.a + self.b + self.c) / 2
        return math.sqrt(p * (p - self.a) * (p - self.b) * (p - self.c))

class Circle():
    def __init__(self, d):
        self.d = d

    def getArea(self):
        return math.pi * (self.d / 2) ** 2 / 2

a, b, c = map(float, input().split(","))
tri = Triangle(a, b, c)
total = tri.getArea() + Circle(a).getArea() + Circle(b).getArea() + Circle(c).getArea()
print("{:.2f}".format(total))`,
    explanation: ['各部件封装自身面积公式，主程序只做组合相加，清晰体现面向对象职责分离。'],
  },

  // === 前置基础巩固 (第 2~3 章) ===
  {
    id: 'lab-exam-ch2-id',
    chapter: 2,
    title: '基础巩固：身份证出生日期与性别提取',
    type: 'coding',
    source: '基础巩固 · 第 2 章',
    scoreLabel: '基础练手',
    isExamScope: false,
    difficulty: '基础',
    description:
      '输入一个 18 位身份证号，提取出生年月日（第 7~14 位）并按 YYYY-MM-DD 格式输出，同时根据第 17 位奇偶性输出性别（奇数为男，偶数为女）。',
    requirements: [
      '使用切片提取年份 s[6:10]、月份 s[10:12]、日 s[12:14]。',
      '第 17 位下标为 16（int(s[16]) % 2 == 1 为男）。',
    ],
    defaultStdin: '11010120050819341X\n',
    sampleInputDesc: '11010120050819341X',
    sampleOutputDesc: '2005-08-19\n男',
    starterCode: `s = input().strip()
# TODO: 切片提取出生日期与第 17 位性别并输出
`,
    expectedOutput: '2005-08-19\n男',
    referenceAnswer: `s = input().strip()
print(f"{s[6:10]}-{s[10:12]}-{s[12:14]}")
print("男" if int(s[16]) % 2 == 1 else "女")`,
    explanation: ['自然序第 7~14 位对应切片下标 6:14（左闭右开）。'],
  },
  {
    id: 'lab-exam-ch3-tariff',
    chapter: 3,
    title: '基础巩固：阶梯电价分段累加计算',
    type: 'coding',
    source: '基础巩固 · 第 3 章',
    scoreLabel: '基础练手',
    isExamScope: false,
    difficulty: '基础',
    description:
      '输入月用电量（千瓦时）：0~180 度按 0.5 元/度，181~400 度超出部分按 0.55 元/度，400 度以上超出部分按 0.8 元/度。计算并输出电费，保留 2 位小数。',
    requirements: ['必须分段累加，不可用总电量直接乘最高单价。', '保留 2 位小数输出。'],
    defaultStdin: '500\n',
    sampleInputDesc: '500',
    sampleOutputDesc: '291.00',
    starterCode: `kwh = float(input())
# TODO: 分段累加计算电费并保留两位小数输出
`,
    expectedOutput: '291.00',
    referenceAnswer: `kwh = float(input())
if kwh <= 180:
    fee = kwh * 0.5
elif kwh <= 400:
    fee = 180 * 0.5 + (kwh - 180) * 0.55
else:
    fee = 180 * 0.5 + 220 * 0.55 + (kwh - 400) * 0.8
print(f"{fee:.2f}")`,
    explanation: ['500 度 = 180×0.5(90) + 220×0.55(121) + 100×0.8(80) = 291.00 元。'],
  },
];
