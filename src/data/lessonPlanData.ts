export interface BlueprintRow {
  topic: string;
  problems: string;
  stars: 1 | 2 | 3;
}

export interface PatternRow {
  clue: string;
  template: string;
}

export interface ChapterLessonPlan {
  chapter: number;
  title: string;
  tagline: string;
  blueprint: BlueprintRow[];
  patterns: PatternRow[];
  mistakes: string[];
  highlightCode?: {
    title: string;
    code: string;
    stdin?: string;
  };
}

export interface SelfTestItem {
  id: number;
  chapter: number;
  prompt: string;
  hint: string;
  labId?: string;
}

export interface FormatRuleRow {
  rule: string;
  detail: string;
}

export const LESSON_PLANS_4_TO_8: ChapterLessonPlan[] = [
  {
    chapter: 4,
    title: '第 4 章 · 循环结构',
    tagline: 'for/range、while、break/continue、哨兵循环、素数、枚举、Fibonacci 与嵌套排版',
    blueprint: [
      { topic: 'for + range 三种形式（含倒序步长）', problems: '几乎所有循环题', stars: 3 },
      { topic: 'while 循环与循环变量更新', problems: '密码正确吗、韩信点兵、猜数', stars: 3 },
      { topic: 'break / continue / 循环 else 子句', problems: '素数判断、猜数、3次登录', stars: 3 },
      { topic: '累加 / 累乘 / 计数三种模式', problems: '求和、阶乘、统计正负数', stars: 3 },
      { topic: '哨兵循环（读到特定值结束）', problems: '求平均值、统计正负数', stars: 3 },
      { topic: '嵌套循环与格式排版', problems: '乘法口诀表、画三角形、二维处理', stars: 3 },
      { topic: '素数判断（n>=2 + 试除到 √n）', problems: '显示素数、可逆素数、哥德巴赫', stars: 3 },
      { topic: '枚举找最小解 / 递推 / 字符移位', problems: '韩信点兵、Fibonacci、凯撒加密', stars: 2 },
      { topic: '随机数 seed + 循环模拟', problems: '猜数游戏(seed 10)、蒙特卡罗 π', stars: 2 },
    ],
    patterns: [
      { clue: '“输入若干数，以 0 / 负数结束”', template: 'while True: x=int(input()); if x==0: break; ...' },
      { clue: '“求 n 以内素数 / 区间素数”', template: '先判 x>=2，内层 while i*i<=x 试除 + flag' },
      { clue: '“求满足某条件的最小整数”', template: 'n=1; while True: if 条件: print(n); break; n+=1' },
      { clue: '“前 n 项递推（Fibonacci）”', template: 'a, b = b, a + b 或列表 seq.append(seq[i-1]+seq[i-2])' },
      { clue: '“打印图案 / 乘法口诀表”', template: '外层行、内层列，用 "*"*i 或 " ".join(row)' },
      { clue: '“3 次登录验证，全错提示失败”', template: 'for i in range(3): if ok: break; else: print("失败")' },
      { clue: '“字母加密 / 循环移位”', template: 'chr((ord(ch) - ord("a") + k) % 26 + ord("a"))' },
    ],
    mistakes: [
      'range(1, n) 少算了 n —— 要含 n 必须写 range(1, n + 1)',
      '累乘变量初始写成 0，结果永远是 0（必须初始化 p = 1）',
      'while 循环体忘了更新变量 → 死循环',
      '素数判断漏掉 n < 2（1 和负数都不是素数！）',
      '哨兵循环里先判正负再判 0，导致结束标志 0 被算进负数',
      '嵌套循环内层变量名与外层重名覆盖',
      'break 只跳出当前这一层循环，不会跳出外层',
      '"*" * 0 是空字符串，画星号三角形 i 从 1 开始',
    ],
    highlightCode: {
      title: '教案新增：for-else 登录判定 & 蒙特卡罗求 π',
      code: `# 1. for-else：循环没被 break 才执行 else
attempts = ["111", "222", "333"]
for pwd in attempts:
    if pwd == "123":
        print("登录成功")
        break
else:
    print("三次都错，账户锁定！")

# 2. 蒙特卡罗求 π（固定 seed 可复现）
import random
random.seed(1)
n = 10000
hits = sum(1 for _ in range(n) if random.random()**2 + random.random()**2 <= 1)
print(f"蒙特卡罗估算 π ≈ {4 * hits / n:.6f}")`,
    },
  },
  {
    chapter: 5,
    title: '第 5 章 · 函数与模块化',
    tagline: 'def/return、None、默认参数、万年历 7 函数模块化、GCD/LCM、哥德巴赫与亲密数',
    blueprint: [
      { topic: 'def 定义、参数传递与 return', problems: '全部函数题（51072/51073）', stars: 3 },
      { topic: '函数间调用 / 主函数 main() 结构', problems: '万年历、所有编程题', stars: 3 },
      { topic: '返回值机制（无 return 默认返回 None）', problems: '单选高频 + 编程', stars: 3 },
      { topic: '多函数模块化拆分', problems: '万年历 7 函数、模块化 GCD', stars: 3 },
      { topic: '经典算法函数化（GCD/素数/阶乘/因子和）', problems: '可逆素数、哥德巴赫、亲密数', stars: 3 },
      { topic: '默认参数 & 布尔函数（is_xxx）', problems: 'is_runnian、is_prime、allPassed', stars: 2 },
    ],
    patterns: [
      { clue: '“定义函数 f(x) 返回…”', template: 'def f(x): ... return 结果，主程序调用并 print' },
      { clue: '“判断是否…” 类（闰年/素数）', template: '返回 True/False 的布尔函数，调用处直接 if is_xxx():' },
      { clue: '“大型任务 / 万年历模块化”', template: '按职责拆小函数：算天数 → (总天数+3)%7 算周几 → 排版打印' },
      { clue: '“求最大公约数与最小公倍数”', template: 'while b != 0: a, b = b, a % b；LCM = orig_a // g * orig_b' },
      { clue: '“亲密数 / 哥德巴赫防重复”', template: '亲密数限制 B > n；哥德巴赫找到第一组立即 break' },
    ],
    mistakes: [
      '函数体忘记写 return → 调用处拿到 None',
      '函数定义写在调用之后（Python 必须先 def 再调用）',
      '参数名与全局变量重名，局部/全局作用域搞混',
      '补函数填空题误删或改动框架已有代码',
      '填空缩进未核对模板行尾导致 IndentationError（51073 血泪教训）',
      '默认参数写成可变对象如 def f(a=[])（避免踩坑）',
    ],
    highlightCode: {
      title: '教案经典：万年历基准日核心模块（1800-1-1 周三）',
      code: `def isLeapYear(y):
    return (y % 4 == 0 and y % 100 != 0) or y % 400 == 0

def getDaysInMonth(y, m):
    if m in (1, 3, 5, 7, 8, 10, 12): return 31
    if m in (4, 6, 9, 11): return 30
    return 29 if isLeapYear(y) else 28

def getStartDay(year, month):
    total = sum(366 if isLeapYear(y) else 365 for y in range(1800, year))
    total += sum(getDaysInMonth(year, m) for m in range(1, month))
    return (total + 3) % 7  # 0=周日, 1=周一 ... 6=周六

names = ["日", "一", "二", "三", "四", "五", "六"]
print("2026年11月1日是星期" + names[getStartDay(2026, 11)])`,
    },
  },
  {
    chapter: 6,
    title: '第 6 章 · 列表与二维数组',
    tagline: '索引切片、原地 vs 新建方法、引用赋值陷阱、计数数组、映射表、二维列表与推导式',
    blueprint: [
      { topic: '创建、正负索引、切片与 [::-1] 反转', problems: '数列翻转、身份证、L[-3]', stars: 3 },
      { topic: 'append / remove / index / sort / reverse', problems: '一维列表 A、51581', stars: 3 },
      { topic: '引用赋值陷阱（s2 = s1 vs s1[:]）', problems: '单选必考', stars: 3 },
      { topic: '列表当计数数组（[0]*26）', problems: '随机小写字符统计（51687）', stars: 3 },
      { topic: '二维列表 a[i][j] 双循环', problems: '成绩评分（51595）、对角线乘积', stars: 3 },
      { topic: '列表当映射表（校验码 / 月份 / 天数）', problems: '身份证 15 升 18、一年第几天', stars: 2 },
      { topic: '列表推导式与 enumerate', problems: '筛选、批量构造与带下标遍历', stars: 2 },
    ],
    patterns: [
      { clue: '“求最小/最大值及其下标”', template: 'm = min(ls); k = ls.index(m)（首次出现下标）' },
      { clue: '“统计 26 个字母出现次数”', template: 'counts = [0]*26; counts[ord(ch)-ord("a")] += 1' },
      { clue: '“二维成绩表按人/按题统计”', template: '外层行 i、内层列 j 遍历 records[i][j]' },
      { clue: '“日期转换 / 身份证校验码”', template: '月天数表 days[1]=29；codes = "10X98765432"[s % 11]' },
      { clue: '“保留原顺序去重（不许用 set）”', template: 'res = []; for x in ls: if x not in res: res.append(x)' },
    ],
    mistakes: [
      's2 = s1 是引用共享不是复制！真复制用 s2 = s1[:] 或 list(s1)',
      'append([4, 5]) 把整个列表当成 1 个元素追加（合并要用 extend 或 +）',
      'reverse() 和 sort() 原地修改且返回 None，绝不能写 ls = ls.reverse()',
      'remove(x) 只删第一个匹配，index(x) 只返回首次出现下标',
      '[2] in [1, 2, 3] 是 False（元素级匹配，不是子列表包含）',
      '二维列表 a[i][j] 行列下标写反成 a[j][i]',
      '边遍历边删除元素会跳过元素 —— 必须遍历副本 for x in ls[:]',
      '切片越界不报错，但可能悄悄返回空列表',
    ],
    highlightCode: {
      title: '教案经典：身份证 15 位升 18 位校验码 & 副本安全删除',
      code: `# 1. 身份证第 18 位校验码映射表
id17 = "11010120050819341"
weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
codes = "10X98765432"
s = sum(int(id17[i]) * weights[i] for i in range(17))
print("完整 18 位身份证:", id17 + codes[s % 11])

# 2. 遍历副本安全删除偶数
nums = [1, 2, 4, 5, 6, 7]
for x in nums[:]:
    if x % 2 == 0:
        nums.remove(x)
print("安全删偶数后:", nums)`,
    },
  },
  {
    chapter: 7,
    title: '第 7 章 · 字典、集合与元组',
    tagline: 'get() 防 KeyError、字典计数与排序、重复键规则、集合 & | - ^ 运算、元组解包',
    blueprint: [
      { topic: '字典创建、键访问、KeyError 与 get()', problems: '电话簿、生词本、多用户登录', stars: 3 },
      { topic: '字典计数三件套 + 按键/按值排序', problems: '字符统计、字母统计、词频 TopN', stars: 3 },
      { topic: '遍历 keys / values / items()', problems: '字典作业全部 + 单选', stars: 3 },
      { topic: '重复键覆盖规则 & 键顺序', problems: '51998 单选高频', stars: 2 },
      { topic: '集合自动去重 & 交并差对称差 (& | - ^)', problems: '选课问题、双色球、51598', stars: 3 },
      { topic: '空集合 set() vs 空字典 {}、pop 无序性', problems: '单选必考、去重循环 len<5', stars: 2 },
      { topic: '元组不可变与解包、字典嵌套', problems: 'a,b=b,a、嵌套查询', stars: 2 },
    ],
    patterns: [
      { clue: '“查某人电话/词典，没有输出 not found”', template: 'd.get(key, "not found")' },
      { clue: '“统计字符/单词出现次数”', template: 'd[k] = d.get(k, 0) + 1' },
      { clue: '“按字母序输出统计结果”', template: 'for k in sorted(d): print(k, d[k])' },
      { clue: '“按次数降序取前 N（词频 TopN）”', template: 'sorted(d.items(), key=lambda kv: -kv[1])[:N]' },
      { clue: '“同时选 / 只选某几门课”', template: '总人数 c1|c2|c3，只选一 c1-c2-c3，全选 c1&c2&c3' },
      { clue: '“凑满 N 个不重复输入”', template: 's = set(); while len(s) < N: s.add(eval(input()))' },
    ],
    mistakes: [
      '{} 创建的是空字典，空集合必须写 set()！',
      'd[k] 访问不存在的键直接报 KeyError，查询一律优先用 d.get(k, 默认值)',
      '字面量重复键：值以最后一次为准，键顺序保持首次出现位置',
      '集合无序，s.pop() 弹出元素不可预测，且不能索引 s[0]（TypeError）',
      's.discard(x) 不存在不报错；s.remove(x) 不存在会报 KeyError',
      'set(ls) 去重后会丢掉列表原来的顺序',
      '元组不可变，t[0] = 9、append、remove 全报错',
      'for k in d 遍历的是键（key），不是值',
    ],
    highlightCode: {
      title: '教案经典：选课集合交并差 & 字典嵌套访问',
      code: `c1 = {"张三", "李四", "王五"}
c2 = {"李四", "赵六"}
c3 = {"张三", "李四", "钱七"}
print("总选课人数:", len(c1 | c2 | c3))
print("只选第1门:", c1 - c2 - c3)
print("三门都选:", c1 & c2 & c3)
print("对称差 c1^c2:", c1 ^ c2)

students = {"001": {"name": "张三", "score": 90}, "002": {"name": "李四", "score": 85}}
print("嵌套查询 001:", students["001"]["name"], students["001"]["score"])`,
    },
  },
  {
    chapter: 8,
    title: '第 8 章 · 数据文件与 CSV',
    tagline: 'with open 模式、encoding、stdin 回退、逐行解析、词频 Top10、CSV 排序与防引号坑',
    blueprint: [
      { topic: 'open 模式 r/w/a、encoding 与 with 自动关闭', problems: '全部文件题', stars: 3 },
      { topic: 'read() / readlines() / 逐行遍历 & write 不换行', problems: '大小写转换、字符统计写文件', stars: 3 },
      { topic: 'try/except FileNotFoundError 回退 sys.stdin', problems: '52361、51599、51600 必备保护', stars: 3 },
      { topic: '逐行解析 strip + split（表达式/姓名分数）', problems: '文件加减法、姓名分数统计', stars: 3 },
      { topic: '词频统计完整流程（含弯引号替换！）', problems: 'cup 简介词频 Top10', stars: 3 },
      { topic: 'csv.reader / csv.writer 与按总分 lambda 排序', problems: '51600 成绩排序 80 分大题', stars: 3 },
      { topic: 'csv.writer 自动加引号陷阱 & utf-8-sig', problems: '体能训练营 CSV 报告', stars: 3 },
    ],
    patterns: [
      { clue: '“读 xxx.txt 并把结果写入 yyy.txt”', template: 'with open(..., encoding="utf-8") + f.write(line + "\\n")' },
      { clue: '“评测可能不给输入文件”', template: 'try: open(...) except FileNotFoundError: sys.stdin.read()' },
      { clue: '“文本词频统计 TopN”', template: '标点(含弯引号)→空格 → lower → split → dict计数 → sorted(-kv[1])' },
      { clue: '“CSV 按多列总分降序排序”', template: 'data.sort(key=lambda x: sum(map(float, x[4:])), reverse=True)' },
      { clue: '“CSV 含列表/逗号但要求无双引号”', template: '放弃 csv.writer，直接 f.write(...) 手写文本行！' },
    ],
    mistakes: [
      '"w" 模式会立即清空已有文件内容；想保留原内容追加必须用 "a"',
      'f.write() 不会自动加换行符，每行末尾必须自己拼 "\\n"',
      '忘记写 encoding="utf-8" 易导致 Windows 下 gbk 解码报错；Excel 中文 CSV 用 utf-8-sig',
      '读入的行尾带 "\\n"，解析前先 .strip() 或直接用 split()',
      'csv.writer 会给含逗号字段自动套双引号 → 判题要求无引号时改手写',
      '使用 csv 模块时 open() 漏写 newline="" 会导致 Windows 下多出空行',
      '输出文件名拼错（如 result.txt 写成 results.txt）直接 0 分',
      '词频题标点串丢了弯引号 ’ ‘ “ ” → China’s 切不开导致排名全偏',
    ],
    highlightCode: {
      title: '教案经典：文件表达式解析（jisuan）& 词频弯引号处理',
      code: `# 1. 模拟逐行解析 a+b / a-b 并保留 2 位小数
lines = ["121+20.5", "15-2.3", "8.5+1.5"]
for x in lines:
    if "+" in x:
        a, b = x.split("+")
        r = float(a) + float(b)
    else:
        a, b = x.split("-")
        r = float(a) - float(b)
    print(f"{x} = {r:.2f}")

# 2. 弯引号 ’ 处理对比
text = "China’s cup, China’s pride!"
for ch in ",!’‘“”":
    text = text.replace(ch, " ")
print("正确切词:", text.lower().split())`,
    },
  },
];

export const PLATFORM_FORMAT_RULES: FormatRuleRow[] = [
  { rule: '提示符逐字符对照', detail: '如 input("How many numbers are there?") 问号后无空格，多一个空格即判错。' },
  { rule: '行尾空格控制', detail: '期望行尾有空格用 print(x, end=" ")；期望无行尾空格用 " ".join(...) 一次 print。' },
  { rule: '结尾换行', detail: '部分题期望末尾无换行（end=" " 自然满足），部分要求换行，须严格对照样例。' },
  { rule: '整数不要 .2f', detail: '期望输出 36 时写成 36.00 会判错；只有样例含小数才做浮点格式化。' },
  { rule: '数值类型 int vs float', detail: 'Ring 圆环题实战坑：样例输出 20 用 int，输出 20.0 才用 float！' },
  { rule: '浮点精度不盲目截断', detail: '如 51601 样例 area=7.0685834705770345 为 str() 直出，不要擅自四舍五入。' },
  { rule: '填空缩进两派规则', detail: '先看空位前静态代码行尾："\\n    " 顶格写，裸 "\\n" 自带缩进写。' },
  { rule: '文件输出细节', detail: '文件名精确拼写；write() 每行手补 \\n；Excel 中文 CSV 用 utf-8-sig。' },
  { rule: '提交前本地自测', detail: '每次先跑样例并用 repr() 核对空格与换行，判错立刻展开 judgeDetails.jsp。' },
];

export const FIFTEEN_MIN_SELF_TEST: SelfTestItem[] = [
  { id: 1, chapter: 4, prompt: '输出 1~100 所有素数，每行 5 个。', hint: '素数函数 is_prime(x)（排除 x<2，试除到 √x）+ 枚举计数每 5 个换行。', labId: 'lab-exam-ch4-prime' },
  { id: 2, chapter: 4, prompt: '输入若干整数以 0 结束，输出最大值、最小值、平均值（保留 2 位小数）。', hint: 'while True 哨兵循环首行 if x == 0: break，再用列表或实时跟踪 max/min/sum/count。' },
  { id: 3, chapter: 5, prompt: '写函数 is_leap(y) 返回是否闰年，再写 days_in_month(y, m) 返回该月天数。', hint: '(y%4==0 and y%100!=0) or y%400==0 + 月天数列表（2 月按闰年特判 29/28）。' },
  { id: 4, chapter: 5, prompt: '求两个正整数的 GCD（最大公约数）和 LCM（最小公倍数），各写一个函数。', hint: '辗转相除 while b!=0: a, b = b, a % b；LCM = a // g * b（先除后乘）。', labId: 'lab-exam-ch5-gcd' },
  { id: 5, chapter: 6, prompt: '对列表 [3, 1, 4, 1, 5, 9, 2, 6] 输出去重后的升序列表（不许用 set，用循环）。', hint: 'res = []; for x in ls: if x not in res: res.append(x)，最后 res.sort()。' },
  { id: 6, chapter: 6, prompt: '输入 n，用二维列表生成并输出 n 行杨辉三角。', hint: '首尾元素均为 1，中间元素 row[j] = prev[j-1] + prev[j]。', labId: 'lab-exam-ch6-pascal' },
  { id: 7, chapter: 7, prompt: '统计输入字符串中每个字符出现次数，按次数降序输出前 3。', hint: 'dict.get 计数 + sorted(cnt.items(), key=lambda kv: -kv[1])[:3]。', labId: 'lab-exam-ch7-freq' },
  { id: 8, chapter: 7, prompt: '收集 A、B、C 三人的选课（集合），输出：总选课人数、只选 A 的、三门都选的。', hint: 'len(A | B | C)、A - B - C、A & B & C。', labId: 'lab-exam-ch7-courses' },
  { id: 9, chapter: 8, prompt: '读 score.txt（每行 姓名 分数），按分数降序写入 rank.txt（每行 名次 姓名 分数）。', hint: '逐行 split 建 (name, score) 元组列表 → sort(key=lambda x: -x[1]) → enumerate 写入。', labId: 'lab-exam-ch8-rank' },
  { id: 10, chapter: 8, prompt: '读 words.txt（每行一个单词），统计出现次数，按次数降序取前 5 写入 top.txt。', hint: 'dict 计数 + sorted(cnt.items(), key=lambda kv: -kv[1])[:5] + with open 逐行 write + \\n。', labId: 'lab-exam-ch8-topwords' },
];

export const CRAM_30_MIN_CHECKLIST = [
  {
    title: '① 六大必背默写模板',
    color: 'emerald',
    items: [
      '素数判断：n >= 2 且 while i * i <= n',
      '哨兵循环：while True 首行立即判哨兵 break',
      '字典计数：cnt[k] = cnt.get(k, 0) + 1 + sorted(cnt.items(), key=lambda kv: -kv[1])',
      '辗转相除 GCD：while b != 0: a, b = b, a % b；LCM = a // g * b',
      '文件安全读写：with open(..., encoding="utf-8") + FileNotFoundError 回退 stdin',
      'CSV 总分排序：data.sort(key=lambda x: sum(map(float, x[4:])), reverse=True)',
    ],
  },
  {
    title: '② 提交前必查 5 项格式',
    color: 'amber',
    items: [
      '提示符空格逐字符对齐（问号后有无空格）',
      '行尾空格与结尾换行（join vs end=" "）',
      '整数不乱加 .2f，样例 20 别输出 20.0',
      '输出文件名一字不差（result.txt vs results.txt）',
      '填空缩进先看前一行静态代码行尾，绝不改动模板框架',
    ],
  },
  {
    title: '③ 六大最高频易错警报',
    color: 'rose',
    items: [
      'range(1, n) 不含尾 n；累乘初值必须是 1 不是 0',
      's2 = s1 是引用共享，真复制用 s1[:]；reverse()/sort() 返回 None',
      '{} 是空字典，空集合必须写 set()；集合无序不能 s[0]',
      'f.write() 不自动换行，必须手动补 "\\n"',
      'csv.writer 给含逗号字段自动加双引号 → 要求无引号改手写 f.write',
      'Python 没有 private 关键字，私有属性用双下划线 __xxx',
    ],
  },
];
