import type { ChapterMeta, HomeworkEntry, KnowledgePoint, PitfallItem } from '../types';

export const CHAPTERS: ChapterMeta[] = [
  {
    chapter: 1,
    title: '基础语法与输入输出',
    shortTitle: '第 1 章 基础语法',
    subtitle: 'print / input / 类型转换 / 运算符 / 格式化 / math',
    isExamScope: false,
    homeworkIds: ['50046'],
    accent: 'emerald',
    icon: 'Terminal',
    summary: '前置基础：input 字符串转换、/ 与 // 整除、数位提取与 f-string 格式化。',
  },
  {
    chapter: 2,
    title: '字符串处理',
    shortTitle: '第 2 章 字符串',
    subtitle: '索引切片 / split & join / ASCII 互转 / 不可变性',
    isExamScope: false,
    homeworkIds: ['50469'],
    accent: 'cyan',
    icon: 'Type',
    summary: '前置基础：左闭右开切片、s[::-1] 反转、split/join/replace 及 ord/chr 编解码。',
  },
  {
    chapter: 3,
    title: '选择结构',
    shortTitle: '第 3 章 选择结构',
    subtitle: 'if-elif-else / 逻辑运算 / 闰年 / 阶梯计费 / 浮点比较',
    isExamScope: false,
    homeworkIds: ['50585'],
    accent: 'amber',
    icon: 'GitBranch',
    summary: '前置基础：多分支边界顺序、复合逻辑括号、阶梯分段累加与浮点近似判断。',
  },
  {
    chapter: 4,
    title: '循环结构',
    shortTitle: '第 4 章 循环结构',
    subtitle: 'for & range / while / for-else / 哨兵 / 素数 / 凯撒 / 递推嵌套',
    isExamScope: true,
    homeworkIds: ['50693', '51070'],
    accent: 'rose',
    icon: 'Repeat',
    summary: '★ 考纲核心：哨兵循环、√n 素数试除、韩信点兵枚举、Fibonacci 递推与嵌套排版。',
  },
  {
    chapter: 5,
    title: '函数与模块化',
    shortTitle: '第 5 章 函数',
    subtitle: 'def & return / None / 默认参数 / GCD & LCM / 万年历模块化',
    isExamScope: true,
    homeworkIds: ['51072', '51073', '51402', '51343'],
    accent: 'violet',
    icon: 'Boxes',
    summary: '★ 考纲核心：多函数模块化协作、辗转相除 GCD/LCM、基准日推星期及填空缩进规则。',
  },
  {
    chapter: 6,
    title: '列表与二维数组',
    shortTitle: '第 6 章 列表',
    subtitle: '引用语义 / 原地 vs 新建 / 计数数组 / 映射表 / 二维列表',
    isExamScope: true,
    homeworkIds: ['51581', '51595', '51687'],
    accent: 'indigo',
    icon: 'List',
    summary: '★ 考纲核心：区分原地修改与新列表、s2=s1 引用共享、计数数组、校验码映射与二维遍历。',
  },
  {
    chapter: 7,
    title: '字典、集合与元组',
    shortTitle: '第 7 章 字典集合元组',
    subtitle: 'get 计数三件套 / 集合交并差对称差 / 元组解包 / 嵌套字典',
    isExamScope: true,
    homeworkIds: ['51597', '51998', '51598'],
    accent: 'teal',
    icon: 'Database',
    summary: '★ 考纲核心：d.get 计数与降序排序、集合去重及 & | - ^ 运算、元组不可变与解包交换。',
  },
  {
    chapter: 8,
    title: '数据文件与 CSV',
    shortTitle: '第 8 章 文件与 CSV',
    subtitle: 'with open / stdin 回退 / 词频 Top10 / csv 排序 / 防引号坑',
    isExamScope: true,
    homeworkIds: ['51599', '52361', '51600'],
    accent: 'sky',
    icon: 'FileSpreadsheet',
    summary: '★ 考纲核心：utf-8/utf-8-sig、FileNotFoundError 回退、CSV 排序及引号/弯引号两大实战坑。',
  },
  {
    chapter: 10,
    title: '面向对象（封装·继承·多态）',
    shortTitle: '第 10 章 面向对象',
    subtitle: 'class / __init__ / self / super() / 方法重写 / 多态与鸭子类型',
    isExamScope: false,
    homeworkIds: ['51603', '51601'],
    accent: 'violet',
    icon: 'Cpu',
    summary: '延伸进阶（51603 + 51601）：封装校验、继承与 super()、多态动态绑定、双下划线私有属性。',
  },
];

export const KNOWLEDGE_POINTS: KnowledgePoint[] = [
  // Chapter 1
  {
    id: 'ch1-io',
    chapter: 1,
    title: 'input() 永远返回字符串 & 批量读入',
    summary: '参与算术运算前必须显式转换为 int 或 float，根据分隔符选择 split()+map 或 eval()。',
    isExamScope: false,
    bullets: [
      'input() 无论输入数字还是文字，返回类型恒为 str。',
      '空格分隔一行多个数：a, b = map(int, input().split())。',
      '逗号分隔输入（如 1,2,3）：可用 a, b, c = eval(input())，但空格分隔用 eval 会直接 SyntaxError！',
      'int("36.5") 会报 ValueError，带小数点的字符串必须用 float("36.5")。',
    ],
    examples: [
      {
        title: '标准输入转换与多值拆包',
        code: `raw = "3 5"\na, b = map(int, raw.split())\nprint(f"a={a}, b={b}, a+b={a+b}")\n\nx, y, z = map(float, "1.5,2.5,3.0".split(","))\nprint("总和:", x + y + z)`,
      },
    ],
    pitfall: '用 eval(input()) 读取空格分隔的 "3 5" 会触发 SyntaxError；直接对 input() 做 * 9 / 5 会导致字符串重复后在 / 处报 TypeError。',
  },
  {
    id: 'ch1-ops',
    chapter: 1,
    title: '算术运算符与数位提取套路',
    summary: '重点区分普通除法 /（永远返回 float）与向下整除 //，以及 % 10 和 // 10 组合提取任意数位。',
    isExamScope: false,
    bullets: [
      '7 / 2 == 3.5，甚至 4 / 2 == 2.0（普通除法永远返回 float）。',
      '7 // 2 == 3，向下取整：注意 -7 // 2 == -4（不是 -3！）。',
      '乘方是 **（2 ** 3 == 8），不是 ^（^ 是按位异或，2 ^ 3 == 1）。',
      '数位提取：个位 n % 10，十位 n // 10 % 10，百位 n // 100 % 10，去掉后三位 n // 1000。',
    ],
    examples: [
      {
        title: '除法对比与五位数逐位剥离',
        code: `print("4 / 2 =", 4 / 2, type(4 / 2))\nprint("7 // 2 =", 7 // 2, "| -7 // 2 =", -7 // 2)\nprint("2 ** 3 =", 2 ** 3, "| 2 ^ 3 =", 2 ^ 3)\n\nn = 12345\nprint("万千百十个:", n // 10000, n // 1000 % 10, n // 100 % 10, n // 10 % 10, n % 10, sep="-")`,
      },
    ],
    pitfall: '把 ^ 当作乘方、或误以为 4 / 2 返回整数 int 2 是基础语法高频失分点。',
  },
  {
    id: 'ch1-format',
    chapter: 1,
    title: 'print 控制、f-string 格式化与 math 模块',
    summary: '严格按样例格式输出：控制小数位、对齐宽度、sep 分隔符与 end 结尾符。',
    isExamScope: false,
    bullets: [
      'print("a", "b", sep="-") 改变多项之间的分隔符（默认空格）；end="" 控制末尾不换行（默认 "\\n"）。',
      'f"{x:.2f}" 保留 2 位小数；f"{123:>6}" 右对齐总宽 6；f"{x:10.2f}" 宽度与小数组合。',
      'math.pi 获取圆周率，math.sqrt(16) 返回 4.0（类型为 float，使用前必须 import math）。',
      'int(3.9) 直接截断小数部分得到 3，不会四舍五入。',
    ],
    examples: [
      {
        title: '格式化输出与海伦公式实战',
        code: `import math\n\na, b, c = 3, 4, 5\np = (a + b + c) / 2\narea = math.sqrt(p * (p - a) * (p - b) * (p - c))\nprint(f"面积: {area:.2f}")\nprint(f"右对齐: |{123:>6}|")\nprint("A", "B", "C", sep=" -> ", end=" [DONE]\\n")`,
      },
    ],
    pitfall: '题目样例输出整数 36 时千万不要用 :.2f 输出 36.00；评测对多余空格和小数位零容忍。',
  },

  // Chapter 2
  {
    id: 'ch2-slice',
    chapter: 2,
    title: '字符串索引与切片（左闭右开）',
    summary: '正向从 0 起、负向从 -1 起；切片 s[start:stop:step] 含头不含尾，s[::-1] 一键反转。',
    isExamScope: false,
    bullets: [
      's = "Python"：s[0] 是 "P"，s[-1] 是 "n"，len(s) 为 6。',
      's[0:3] 取下标 0,1,2 -> "Pyt"；s[2:] 从第 3 个到结尾 -> "thon"。',
      '18 位身份证提取出生日期（第 7~14 位）：下标 6 到 13，切片写 s[6:14]（共 8 位）。',
      's[::-1] 步长为 -1 实现字符串逆序，数字字符串反转后可用 int() 去掉前导零。',
    ],
    examples: [
      {
        title: '身份证切片与路径提取实战',
        code: `id_card = "11010120050819341X"\nbirth = id_card[6:14]\nprint(f"出生日期: {birth[:4]}年{birth[4:6]}月{birth[6:]}日")\n\ns = "Python"\nprint("反转:", s[::-1])\npath = "C:/Users/test/report.txt"\nprint("文件名:", path.split("/")[-1], "| 扩展名:", path.split(".")[-1])`,
      },
    ],
    pitfall: '第 7~14 位写成 s[7:14] 会漏掉第 7 位！自然计数减 1 才是起始下标，结束下标不变。',
  },
  {
    id: 'ch2-methods',
    chapter: 2,
    title: '常用字符串方法、不可变性与 ASCII',
    summary: '字符串不可变，所有方法都返回新字符串而非原地修改；牢记 ord("A")=65、ord("a")=97、ord("0")=48。',
    isExamScope: false,
    bullets: [
      's.strip() 去首尾空白；s.split(",") 切分返回 list；"-".join(["a","b"]) 拼接返回 str。',
      's.replace(old, new) 替换全部匹配；s.count(sub) 计数；s.find(sub) 找不到返回 -1。',
      'ord("A")==65，ord("a")==97，ord("0")==48，大小写编码相差 32；chr() 为逆运算。',
      '所有字符串方法不改原串，必须重新赋值 s = s.replace(...)。',
    ],
    examples: [
      {
        title: '字符串方法与 ASCII 凯撒移位演示',
        code: `s = "  Hello Python World  "\nprint("拆词拼接:", "-".join(s.strip().split()))\nprint("A:", ord("A"), "a:", ord("a"), "0:", ord("0"))\nshifted = "".join(chr((ord(c) - 97 + 3) % 26 + 97) for c in "xyz")\nprint("'xyz' 凯撒+3 ->", shifted)`,
      },
    ],
    pitfall: '调用 s.replace("a", "X") 却不重新赋值 s = s.replace(...)，原字符串不会发生任何改变！',
  },

  // Chapter 3
  {
    id: 'ch3-branch',
    chapter: 3,
    title: '选择结构、闰年、阶梯计费与浮点容差',
    summary: '多分支自上而下命中即跳出；牢记闰年复合条件、阶梯分段累加、三数三次比较与浮点容差。',
    isExamScope: false,
    bullets: [
      '闰年：(y % 4 == 0 and y % 100 != 0) or (y % 400 == 0)（1900 不是闰年）。',
      '三角形判定必须先判“能否构成三角形”，再判等边/等腰，否则 0,0,0 会误判为等边。',
      '阶梯电价是分段累加；三数从小到大三次比较顺序固定：先 a/b，再 b/c，最后再 a/b。',
      '假值：0、""、[]、{}、None 为 False；浮点判等用 abs(x - y) < 1e-9 或 math.fabs(n-m) <= 0.001。',
    ],
    examples: [
      {
        title: '闰年、阶梯电价与浮点容差验证',
        code: `for y in [1900, 2000, 2024]:\n    print(y, "闰年?", (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0))\n\nkwh = 500\nfee = 180 * 0.5 + 220 * 0.55 + (kwh - 400) * 0.8\nprint("500度电费:", fee)\nprint("0.1+0.2==0.3 ?", 0.1 + 0.2 == 0.3, "| 容差判断:", abs((0.1 + 0.2) - 0.3) < 1e-9)`,
      },
    ],
  },

  // Chapter 4 (★ Exam Scope)
  {
    id: 'ch4-loops',
    chapter: 4,
    title: '★ for / range、while、for-else 与哨兵循环',
    summary: 'range 含头不含尾；循环 else 仅在未触发 break 时执行；哨兵值必须第一时间拦截 break。',
    isExamScope: true,
    bullets: [
      'range(5) -> 0..4；range(1, 6) -> 1..5；倒序负步长 range(10, 0, -2) -> 10,8,6,4,2。',
      '累加初值 s = 0；累乘初值 p = 1（设为 0 则永远乘得 0！）。',
      'for/while 的 else 子句：只有循环正常跑完、没有触发 break 时才会执行（非常适合 3 次密码登录题！）。',
      '哨兵循环：while True 首行立即判哨兵值（如 x == 0）并 break，再做正负统计，防哨兵污染计数。',
    ],
    examples: [
      {
        title: 'range 步长、break/continue 与 for-else 登录',
        code: `print("倒序偶数:", list(range(10, 0, -2)))\n\nfor i in range(1, 10):\n    if i == 3: continue\n    if i == 6: break\n    print(i, end=" ")\nprint()\n\nfor pwd in ["111", "222", "333"]:\n    if pwd == "123":\n        print("登录成功")\n        break\nelse:\n    print("三次都错（未 break 触发 else）")`,
      },
    ],
    pitfall: '哨兵循环若先判 x > 0 else neg += 1，再判 0，会把结束标志 0 误计入负数；break 只跳出当前一层循环！',
  },
  {
    id: 'ch4-algo',
    chapter: 4,
    title: '★ 素数判定、韩信点兵、Fibonacci、凯撒与蒙特卡罗',
    summary: '第 4 章大题必考五大算法模板：√n 素数试除、从小到大枚举 break、元组同步递推、移位取模与固定随机种子。',
    isExamScope: true,
    bullets: [
      '素数判定：必须先排除 n < 2（1 不是素数！），试除到 √n（i * i <= n）即可，每行 8 个宽度 6 右对齐用 f"{x:>6}"。',
      '枚举最小解（韩信点兵）：n=1 从小到大 while True 枚举 + 命中即 break（3余2、5余3、7余2 -> 23）。',
      'Fibonacci 递推：同步更新 a, b = b, a + b，每行 6 个宽度 10 右对齐；列表版 seq.append(seq[i-1]+seq[i-2])。',
      '蒙特卡罗求 π 与猜数游戏：务必先 random.seed(...) 固定种子保证判题可复现。',
    ],
    examples: [
      {
        title: '素数、韩信点兵与 Fibonacci 一网打尽',
        code: `def is_prime(n):\n    if n < 2: return False\n    i = 2\n    while i * i <= n:\n        if n % i == 0: return False\n        i += 1\n    return True\n\nprint("20以内素数:", [x for x in range(1, 21) if is_prime(x)])\n\nn = 1\nwhile True:\n    if n % 3 == 2 and n % 5 == 3 and n % 7 == 2:\n        print("韩信点兵最小解:", n)\n        break\n    n += 1\n\na, b = 1, 1\nfib = []\nfor _ in range(10):\n    fib.append(a)\n    a, b = b, a + b\nprint("Fibonacci 前 10 项:", fib)`,
      },
    ],
  },

  // Chapter 5 (★ Exam Scope)
  {
    id: 'ch5-func',
    chapter: 5,
    title: '★ 函数定义、返回值、GCD/LCM 与万年历模块化',
    summary: 'def 定义、return 立即返回（无 return 返回 None）；大问题按单一职责拆分为多个协作小函数。',
    isExamScope: true,
    bullets: [
      '默认参数如 def g(a, b=10):，未传 b 时自动取 10；单独写 return 等价于返回 None。',
      '辗转相除 GCD：while two != 0: one, two = two, one % two；LCM = a // g * b（先除后乘）。',
      '亲密数去重：条件写 yinzihe(B) == n and B > n；哥德巴赫找到首个素数对立即 break。',
      '万年历模块化：以 1800-01-01 为周三作基准，(总天数 + 3) % 7 推算任意日期星期几。',
    ],
    examples: [
      {
        title: '辗转相除 GCD/LCM、可逆素数与万年历核心',
        code: `def gcd(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n\ndef lcm(a, b):\n    return a // gcd(a, b) * b\n\ndef is_leap(y):\n    return (y % 4 == 0 and y % 100 != 0) or y % 400 == 0\n\nprint("GCD(48, 18) =", gcd(48, 18), "| LCM =", lcm(48, 18))\nprint("1200 反转去零:", int(str(1200)[::-1]))\nprint("2024 闰年:", is_leap(2024))`,
      },
    ],
    pitfall: '函数填空题必须先看模板行尾是否自带空格缩进，避免平台二次缩进导致 IndentationError（作业 51073 教训）。',
  },

  // Chapter 6 (★ Exam Scope)
  {
    id: 'ch6-list',
    chapter: 6,
    title: '★ 列表引用语义、原地方法、计数数组与二维列表',
    summary: '列表可变，s2 = s1 是引用共享而非拷贝；区分原地方法（返回 None）与新建列表；掌握二维遍历与映射表。',
    isExamScope: true,
    bullets: [
      's2 = s1 是引用共享！真复制必须用 s2 = s1[:] 或 list(s1)；遍历删元素必须遍历副本 for x in ls[:]。',
      'ls.append([4, 5]) 整体当 1 个元素追加（合并用 extend 或 +）；ls.reverse() / ls.sort() 原地修改且返回 None！',
      '成员测试为元素级：[2] in [1, 2, 3, 4] 为 False，2 in [1, 2, 3, 4] 才为 True。',
      '计数数组：counts = [0] * 26，下标 ord(c) - ord("a")；身份证校验码映射 "10X98765432"[s % 11]。',
      '二维列表：a[i][j] 第 i 行第 j 列，主对角线为 a[i][i]；支持列表推导式 [x for x in ls if x > 0]。',
    ],
    examples: [
      {
        title: '引用共享、对角线乘积、计数数组与副本安全删元素',
        code: `s1 = [4, 5, 6]\ns2 = s1\ns1[1] = 0\nprint("引用共享 -> s1:", s1, "s2:", s2)\n\na = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\np = 1\nfor i in range(len(a)):\n    p *= a[i][i]\nprint("主对角线乘积:", p)\n\nls = [1, 2, 4, 5, 6]\nfor x in ls[:]:\n    if x % 2 == 0: ls.remove(x)\nprint("副本遍历安全删偶数:", ls)`,
      },
    ],
    pitfall: '写 ls = ls.reverse() 或 ls = ls.sort() 会把 ls 覆盖成 None！边遍历原列表边 remove 会跳过相邻元素！',
  },

  // Chapter 7 (★ Exam Scope)
  {
    id: 'ch7-dict-set',
    chapter: 7,
    title: '★ 字典计数排序、集合交并差对称差与元组解包',
    summary: '字典用 get() 防 KeyError、sorted(-kv[1]) 按频次降序；集合用 set() 建空集并支持 & | - ^；元组不可变可解包。',
    isExamScope: true,
    bullets: [
      'd["不存在的键"] 抛 KeyError；d.get(k, 默认值) 安全访问；重复键以后一次赋值为准、键顺序按首次出现。',
      '字典计数与 TopN：d[k] = d.get(k, 0) + 1；按字母序 sorted(d)；按次数降序 sorted(d.items(), key=lambda kv: -kv[1])[:N]。',
      '空集合必须写 set()（{} 是空字典！）；集合无序不可索引 s[0]；discard(x) 不存在不报错，remove(x) 报 KeyError；pop() 结果不确定。',
      '集合运算：& 交集、| 并集、- 差集、^ 对称差（并减交）；去重循环 while len(s) < 5: s.add(...)。',
      '元组不可变但可解包 a, b = b, a；支持字典嵌套 students["001"]["name"]。',
    ],
    examples: [
      {
        title: '字典计数 TopN、集合运算与字典嵌套',
        code: `text = "This is a Book about Python"\ncnt = {}\nfor ch in text.lower():\n    if "a" <= ch <= "z":\n        cnt[ch] = cnt.get(ch, 0) + 1\ntop3 = sorted(cnt.items(), key=lambda kv: -kv[1])[:3]\nprint("字母频次 Top3:", top3)\n\nA, B = {1, 2, 3}, {2, 3, 5, 7}\nprint("交:", A & B, "并:", A | B, "差:", A - B, "对称差:", A ^ B)`,
      },
    ],
    pitfall: '{} 是空字典不是空集合；集合无序不能用下标 s[0] 访问，set(ls) 去重会丢失原列表顺序。',
  },

  // Chapter 8 (★ Exam Scope)
  {
    id: 'ch8-file-csv',
    chapter: 8,
    title: '★ with open 文件读写、stdin 回退、词频与 CSV 排序',
    summary: '用 with open 自动关文件、加 FileNotFoundError 回退 stdin；掌握词频去弯引号、CSV 排序与防引号坑。',
    isExamScope: true,
    bullets: [
      'open 模式："r" 只读、"w" 清空覆写、"a" 末尾追加；write() 不自动加 \\n，每行自己补。',
      '中文文本用 encoding="utf-8"；给 Excel 看的中文 CSV 用 encoding="utf-8-sig"；csv 模块务必加 newline=""。',
      '文件不存在保护：try: open(...) except FileNotFoundError: sys.stdin.read()，保证评测给不给文件都能跑。',
      'CSV 按总分降序：data.sort(key=lambda x: sum(map(float, x[4:])), reverse=True)（稳定排序）。',
      '词频统计去标点必须包含弯引号 ’ ‘ “ ”（U+2018/2019/201C/201D）；含逗号字段期望无双引号时弃用 csv.writer 改手写 f.write()。',
    ],
    examples: [
      {
        title: 'CSV 内存模拟排序与 csv.writer 引号坑对比',
        code: `import csv, io\n\nraw = "学号,姓名,高数,英语\\n101,杨东,92,68\\n102,陈晓,98,95\\n103,苏斌,75,80"\nrows = list(csv.reader(io.StringIO(raw)))\nheader, data = rows[0] + ["总分"], rows[1:]\ndata.sort(key=lambda x: sum(map(float, x[2:])), reverse=True)\n\nprint(",".join(header))\nfor r in data:\n    print(",".join(r + [str(sum(map(float, r[2:])))]))\n\nbuf = io.StringIO()\ncsv.writer(buf).writerow(["最高分题目序号", "[1, 3, 5]"])\nprint("\\ncsv.writer 自动加引号:", buf.getvalue().strip())`,
      },
    ],
    pitfall: 'csv.writer 写出 "[1, 3, 5]" 会自动套双引号判错；write() 漏补 \\n 或文件名拼错直接 0 分！',
  },

  // Chapter 10 (51603 + 51601)
  {
    id: 'ch10-oop-basic',
    chapter: 10,
    title: '类与对象、__init__、self 与封装思想（51603）',
    summary: '类是模板、对象是实例；__init__ 自动调用；self 指向当前实例；封装通过 setter 校验保护数据域。',
    isExamScope: false,
    bullets: [
      '面向对象三大特性：封装、继承、多态（区别于顺序/分支/循环三大控制结构）。',
      '__init__(self, ...) 创建对象时自动执行；调用 c.getArea() 时 Python 自动绑定 self，不手动传。',
      '实例属性既可在 __init__ 中定义，也可在创建后动态添加（如 p.newAttr = 10）；未定义 __init__ 也能正常创建实例。',
      '方法参数可以是同类对象（dist_from(self, other)）；setter 加防御性校验（if r > 0: self.r = r）。',
    ],
    examples: [
      {
        title: 'Triangle + Circle 多类组合面积实战',
        code: `import math\n\nclass Triangle:\n    def __init__(self, a, b, c):\n        self.a, self.b, self.c = a, b, c\n    def getArea(self):\n        p = (self.a + self.b + self.c) / 2\n        return math.sqrt(p * (p - self.a) * (p - self.b) * (p - self.c))\n\nclass Circle:\n    def __init__(self, d):\n        self.d = d\n    def getArea(self):\n        return math.pi * (self.d / 2) ** 2 / 2\n\na, b, c = 3, 4, 5\ntotal = Triangle(a, b, c).getArea() + Circle(a).getArea() + Circle(b).getArea() + Circle(c).getArea()\nprint(f"3,4,5 组合图形总面积: {total:.2f}")`,
      },
    ],
  },
  {
    id: 'ch10-oop-inherit',
    chapter: 10,
    title: '继承、super()、方法重写、多态与私有属性（51601 新更）',
    summary: '掌握 class Sub(Base)、super().__init__()、super().__str__() 扩展、鸭子类型动态绑定与双下划线私有约定。',
    isExamScope: false,
    bullets: [
      '继承语法：class Circle(GeometricObject):；子类写了自己的 __init__ 后，必须调 super().__init__() 复用父类属性初始化！',
      '方法重写与多态：不同子类实现同名 getArea()/fly()，统一函数 getInfo(g) 调用 g.getArea() 时在运行时动态绑定到实际类型。',
      'Python 没有 private 关键字！私有属性靠双下划线前缀 self.__radius（名称改写为 _类名__radius）。',
      '鸭子类型：fun(animal) 不检查继承关系，只要对象有 eat() 就能执行——看是否为子类必须检查 class X(父类) 括号！',
      'super().__str__() 可在子类 __str__ 中拼接父类描述，实现扩展而非完全替换。',
    ],
    examples: [
      {
        title: '51601 GeometricObject + Ring 继承与多态演示',
        code: `import math\n\nclass GeometricObject:\n    def __init__(self, color="green", filled=True):\n        self.color, self.filled = color, filled\n    def __str__(self):\n        return f"color is {self.color} and filled is {self.filled}"\n    def getArea(self): return 0\n\nclass Ring(GeometricObject):\n    def __init__(self, inner=1, outer=2, rid="001"):\n        super().__init__()\n        self.__inner, self.__outer, self.__rid = inner, outer, rid\n    def getArea(self):\n        return math.pi * (self.__outer**2 - self.__inner**2)\n    def __str__(self):\n        return f"The {self.__rid} Ring's:{super().__str__()},outerRadius is {self.__outer}"\n\nr = Ring(10, 20, "20200101111")\nr.color = "blue"\nprint(r)\nprint(f"The area is {r.getArea():.3f}")`,
      },
    ],
    pitfall: 'Python 没有 private 关键字（单选陷阱）；Ring 题半径用 float 解析会输出 20.0 而不是样例要求的 20；str() 直出的长精度浮点不要擅自四舍五入！',
  },
];

export const PITFALL_VAULT: PitfallItem[] = [
  {
    id: 'pit-indent',
    chapter: 8,
    category: '格式与判题',
    severity: 'critical',
    title: '程序片段填空：两种缩进行为（两次 0 分血泪教训）',
    wrongExample: '# 51600 题1 空(1) 直接顶格写：\nwith open(filename, "r", encoding="utf-8") as infile:\n# -> IndentationError 或模板作用域异常',
    rightExample: '# 先看空位前静态代码行尾：\n# 若以 "\\n    " 结尾 -> 平台自动加缩进 -> 顶格写\n# 若以 "\\n" 裸换行结尾 -> 平台不加 -> 自带 4 空格缩进！',
    lesson: '千万不要凭前几次作业的经验假设缩进行为！每个空位都先看模板行尾，再决定顶格还是自带缩进，也看清是完整语句位、表达式位还是继承类名位。',
    source: '作业 51600 题 1 & 作业 51073 遗留教训',
  },
  {
    id: 'pit-csv-quote',
    chapter: 8,
    category: '文件与CSV',
    severity: 'critical',
    title: 'csv.writer 对含逗号字段自动加双引号导致判错',
    wrongExample: 'writer.writerow(["最高分题目序号", "[1, 3, 5]"])\n# 实际输出: 最高分题目序号,"[1, 3, 5]"  ← 多出双引号直接判错！',
    rightExample: 'f.write("最高分题目序号," + "[" + ", ".join(map(str, hi_s)) + "]\\n")\n# 实际输出: 最高分题目序号,[1, 3, 5]  ← 与期望逐字符一致',
    lesson: '先分清题目是「真 CSV 语义」还是「只是扩展名叫 .csv 的纯文本」。只要期望输出包含手写列表或对引号敏感，直接用 f.write() 手写最稳妥！',
    source: '作业 51600 题 4（体能训练营报告）',
  },
  {
    id: 'pit-curly-quotes',
    chapter: 8,
    category: '文件与CSV',
    severity: 'high',
    title: '词频统计漏掉弯引号（’ ‘ “ ”）导致单词切不开',
    wrongExample: 'biaodian = ",.!?\'"  # 漏了 Unicode 弯引号\n# "China’s" 切不开，词频 Top10 全偏！',
    rightExample: 'biaodian = ",.!?\'\\"’‘“”"\nfor ch in biaodian:\n    text = text.replace(ch, " ")',
    lesson: '复制标点串时，U+2018/2019/201C/201D 弯引号极易丢失，一定要显式检查并保留。',
    source: '作业 51599（cup 简介词频 Top10）',
  },
  {
    id: 'pit-51601-int-float',
    chapter: 10,
    category: '面向对象',
    severity: 'critical',
    title: 'Ring 圆环题：输入半径别默认用 float，且别盲目四舍五入（51601 新坑）',
    wrongExample: 'innerRadius = float(parts[0])  # 输出 The innerRadius is 10.0（样例是 10！）\n# 51601 题6 把 area=7.0685834705770345 手动改 .2f -> 判错！',
    rightExample: 'innerRadius = int(parts[0])    # 样例输出 10/20 不带小数点 -> 用 int\n# 样例给长浮点精度 -> str(s) 原样直出，不要擅自四舍五入',
    lesson: '输入数值到底用 int 还是 float，完全由样例输出决定：输出 20 用 int，输出 20.0 才用 float！',
    source: '作业 51601 题 6 & 题 7 实测踩坑',
  },
  {
    id: 'pit-51601-private-duck',
    chapter: 10,
    category: '面向对象',
    severity: 'high',
    title: 'Python 没有 private 关键字 + 代码图须放大看继承括号（51601）',
    wrongExample: '# 误以为 Python 有 private 关键字 -> 单选直接踩坑\n# 没看清图片中 class Person(object): 误以为 Person 继承了 Animal',
    rightExample: 'self.__radius = radius   # 双下划线前缀实现私有（名称改写为 _类名__radius）\n# 看清基类括号：class Person(object) 不是 Animal 子类，但鸭子类型仍可传进 fun()',
    lesson: '记住两条铁律：Python 没 private 关键字；看继承关系必须盯紧 class X(父类) 里的基类名。',
    source: '作业 51601 单选 4 & 单选 5',
  },
  {
    id: 'pit-mutable-ref',
    chapter: 6,
    category: '语法陷阱',
    severity: 'critical',
    title: '列表引用赋值、遍历删除跳元素 & {} 是空字典不是集合',
    wrongExample: 's2 = s1; s1[1] = 0          # s2 一起变！\nrev = L.reverse()           # rev 是 None！\nfor x in ls: ls.remove(x)   # 边遍历边删会跳过元素！\ns = {}                      # 这是空字典，不是空集合！',
    rightExample: 's2 = s1[:]                  # 浅拷贝切片\nrev = L[::-1]               # 返回反转新列表\nfor x in ls[:]: ...         # 遍历副本安全删除\ns = set()                   # 空集合必须用 set()',
    lesson: '第 6~7 章考纲绝对高频陷阱！考前务必把这四条逐一过一遍。',
    source: '第 6~7 章 教案易错清单',
  },
  {
    id: 'pit-sentinel-order',
    chapter: 4,
    category: '算法逻辑',
    severity: 'high',
    title: '哨兵循环先判正负再判 0 + 素数漏判 n < 2 + 累乘初值 0',
    wrongExample: 'p = 0                       # 累乘永远 0！\nif x > 0: pos += 1\nelse: neg += 1\nif x == 0: break            # 0 先落进 else 了！',
    rightExample: 'p = 1                       # 累乘初值为 1\nwhile True:\n    x = int(input())\n    if x == 0: break        # 哨兵判断永远放最前\n    if x > 0: pos += 1\n    else: neg += 1',
    lesson: '哨兵值必须第一时间拦截并 break；素数必须先排除 n < 2（1 不是素数）；range(1, n) 少算 n。',
    source: '第 4 章 教案易错清单',
  },
  {
    id: 'pit-platform-local',
    chapter: 'platform',
    category: '平台实战',
    severity: 'critical',
    title: '上机交题铁律：本地跑样例 + repr() 抠空格换行',
    wrongExample: '写完凭感觉直接提交 -> 问号后多一个空格 / 末尾少换行 -> 总览页只显示“输出错误”',
    rightExample: '1. 本地跑通全部样例，用 repr(out) 核对空格与换行\n2. 判错必展开 judgeDetails.jsp 看真实差异\n3. 提示符如 "How many numbers are there?" 逐字符核对',
    lesson: '先本地验证再提交能消灭 90% 的格式错误；0 分选做题的坑（如 CSV 引号、Ring 精度）在计分题里都会复现！',
    source: '附 A 跨章节平台实战经验',
  },
];

export const HOMEWORK_CATALOG: HomeworkEntry[] = [
  { chapter: 0, assignId: '50045', title: 'Hello Python', coreTask: 'print 输出、平台提交流程', keyTech: '基础输出' },
  { chapter: 1, assignId: '50046', title: '基础语法与输入输出（9题）', coreTask: '生日歌/圆周长面积/温标转换/立方和/五位数剥离/两点距离/四则运算/海伦公式/倒置四位数', keyTech: 'int/float, // & %, math.sqrt, .2f' },
  { chapter: 2, assignId: '50469', title: '字符串处理（8题）', coreTask: 'ASCII互转/身份证日期/跑步速度/首字母大写/删子串/文件路径/姓名解析/网址拆解', keyTech: 'ord/chr, 切片 s[6:14], split/replace/find' },
  { chapter: 3, assignId: '50585', title: '选择结构（10题）', coreTask: '身份证按位判断/三商品排序/验证码/闰年/字符分类/猜数/一元二次方程/BMI/五分制/阶梯电价', keyTech: 'if-elif-else, 复合条件, 分段累加' },
  { chapter: 4, assignId: '50693', title: '★ 循环结构（12题）', coreTask: '密码验证/猜数(seed 10)/字符统计/大小写互换/哨兵平均与正负/凯撒加密/蒙特卡罗π/素数/韩信点兵/星号三角', keyTech: 'while+break, 哨兵循环, √n 试除, 移位公式' },
  { chapter: 4, assignId: '51070', title: '★ 循环进阶（2题）', coreTask: '乘法口诀表前 n 行、Fibonacci 前 n 项排版（宽10右对齐每行6个）', keyTech: '嵌套 for, a,b=b,a+b, {:>10}' },
  { chapter: 5, assignId: '51072', title: '★ 函数作业（10题）', coreTask: '等级评定/三角形类型/乘法表/整数反转/365天锻炼/月份天数/可逆素数/哥德巴赫/GCD&LCM/亲密数', keyTech: 'def/return, 函数复用, 辗转相除' },
  { chapter: 5, assignId: '51073', title: '★ 函数课堂作业 1', coreTask: '打印 n×n 乘法表（50分满分）+ 函数实现素数问题（缩进错遗留0分，需重开）', keyTech: '每行8个 %6d, 缩进规则', note: '遗留待重开' },
  { chapter: 5, assignId: '51402', title: '★ 万年历模块化（100分）', coreTask: '按 1800-1-1 周三基准计算任意年月完整日历', keyTech: 'getStartDay / getTotalNumberOfDays 模块化' },
  { chapter: 5, assignId: '51343', title: '★ 最大公约数-模块化', coreTask: 'forGCD / whileGCD 双文件上传题（过期未交，需重开）', keyTech: '模块拆分与导入', note: '遗留待重开' },
  { chapter: 6, assignId: '51581', title: '★ 列表 6-1（单选×6 + 6题）', coreTask: '最小值下标/日期转换/一年第几天/数列翻转/字母最多/一维列表A', keyTech: '引用语义, index/remove/sort, 月天数表' },
  { chapter: 6, assignId: '51595', title: '★ 列表 6-2（单选×2 + 2题）', coreTask: '成绩评分二维列表（50分）、Fib 前 20 项和（50分）', keyTech: 'records[i][j] 双循环, 对角线乘积' },
  { chapter: 6, assignId: '51687', title: '★ 列表 6-3（2题）', coreTask: '随机小写字符统计（50分）、身份证 15 位升 18 位（50分）', keyTech: '26元计数数组, 加权因子与校验码映射' },
  { chapter: 7, assignId: '51597', title: '★ 字典 7-1（4题）', coreTask: '电话簿/字母统计/生词本查词/多用户3次登录模拟', keyTech: 'd.get(k, default), 字典计数' },
  { chapter: 7, assignId: '51998', title: '★ 字典 7-2（单选×9 + 1题）', coreTask: '字典核心概念 + 随机字符统计-字典实现（28分）', keyTech: 'KeyError, items(), 重复键覆盖' },
  { chapter: 7, assignId: '51598', title: '★ 集合与元组 7-3（单选×4 + 4题）', coreTask: '维纳年龄(18)/选课集合多问/不同数操作/双色球模拟', keyTech: 'set去重, & | - ^ 运算, while len<5' },
  { chapter: 8, assignId: '51599', title: '★ 文件读写 8-1（6题）', coreTask: '体能评分/大小写转换/cup词频Top10/文件加减法/生成词汇表/姓名分数统计', keyTech: 'with open, 标点含弯引号转空格, sorted' },
  { chapter: 8, assignId: '52361', title: '★ 文件读写 8-2（2题）', coreTask: '文件字母频率统计(26列表)、字符统计写 result.txt', keyTech: 'try/except 回退 stdin, f.write 逐行' },
  { chapter: 8, assignId: '51600', title: '★ CSV 文件读写课堂练习（100分）', coreTask: '字典字符统计填空/成绩排序CSV/加总分列/体能训练营CSV报告', keyTech: 'csv.reader/writer, lambda 排序, 防引号坑' },
  { chapter: 10, assignId: '51603', title: 'Module10-2 面向对象-类与封装（100分）', coreTask: '概念单选/Point距离/Student调用与allPassed/Time.nextHour/Circle封装/Triangle/组合图形面积', keyTech: 'class, __init__, self, setter 封装, 多类组合' },
  { chapter: 10, assignId: '51601', title: 'Module10-3 面向对象-继承和多态（新更·满分）', coreTask: '单选×5 + GeometricObject 图形多态5空填空（25分）+ Ring 圆环类实现（25分）', keyTech: 'super().__init__(), __str__扩展, 鸭子类型, __私有域', note: '新更归档' },
];
