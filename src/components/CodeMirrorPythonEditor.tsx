import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  type Completion,
  type CompletionContext,
  completionKeymap,
  snippetCompletion,
} from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from '@codemirror/language';
import { type Diagnostic, lintGutter, lintKeymap, setDiagnostics } from '@codemirror/lint';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState } from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { useEffect, useImperativeHandle, useRef } from 'react';
import type { PythonDiagnostic } from '../types';

export type IdeThemeMode = 'vscode-dark' | 'aurora-dark' | 'vscode-light';

export interface CodeMirrorEditorHandle {
  focus: () => void;
  jumpToLine: (line: number, col?: number) => void;
  insertSnippet: (text: string) => void;
}

const PYTHON_KEYWORDS: Completion[] = [
  'def',
  'class',
  'return',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'break',
  'continue',
  'in',
  'not',
  'and',
  'or',
  'import',
  'from',
  'as',
  'with',
  'try',
  'except',
  'finally',
  'pass',
  'lambda',
  'True',
  'False',
  'None',
  'self',
  'super',
  'global',
  'yield',
  'raise',
  'is',
  'del',
].map((kw) => ({ label: kw, type: 'keyword', detail: '关键字' }));

const PYTHON_BUILTINS: Completion[] = [
  { label: 'print', type: 'function', apply: 'print()', detail: 'print(*args, sep=" ", end="\\n")' },
  { label: 'input', type: 'function', apply: 'input()', detail: '读取一行字符串 str' },
  { label: 'int', type: 'type', apply: 'int()', detail: '转为整数（截断小数）' },
  { label: 'float', type: 'type', apply: 'float()', detail: '转为浮点数' },
  { label: 'str', type: 'type', apply: 'str()', detail: '转为字符串' },
  { label: 'bool', type: 'type', apply: 'bool()', detail: '转为布尔值' },
  { label: 'len', type: 'function', apply: 'len()', detail: '返回序列/字典/集合长度' },
  { label: 'range', type: 'function', apply: 'range()', detail: 'range(start, stop, step) 左闭右开' },
  { label: 'map', type: 'function', apply: 'map(int, input().split())', detail: '批量类型转换' },
  { label: 'sum', type: 'function', apply: 'sum()', detail: '求和' },
  { label: 'min', type: 'function', apply: 'min()', detail: '最小值' },
  { label: 'max', type: 'function', apply: 'max()', detail: '最大值' },
  { label: 'sorted', type: 'function', apply: 'sorted()', detail: 'sorted(iter, key=..., reverse=...)' },
  { label: 'enumerate', type: 'function', apply: 'enumerate()', detail: '同时遍历 (下标, 元素)' },
  { label: 'zip', type: 'function', apply: 'zip()', detail: '并行遍历多个序列' },
  { label: 'open', type: 'function', apply: 'open("", "r", encoding="utf-8")', detail: '打开文件' },
  { label: 'ord', type: 'function', apply: 'ord()', detail: '字符 -> ASCII 码 (A=65, a=97)' },
  { label: 'chr', type: 'function', apply: 'chr()', detail: 'ASCII 码 -> 字符' },
  { label: 'abs', type: 'function', apply: 'abs()', detail: '绝对值' },
  { label: 'round', type: 'function', apply: 'round()', detail: '四舍五入' },
  { label: 'list', type: 'type', apply: 'list()', detail: '列表构造函数' },
  { label: 'dict', type: 'type', apply: 'dict()', detail: '字典构造函数' },
  { label: 'set', type: 'type', apply: 'set()', detail: '空集合必须用 set()' },
  { label: 'tuple', type: 'type', apply: 'tuple()', detail: '元组构造函数' },
  { label: 'type', type: 'function', apply: 'type()', detail: '查看对象类型' },
  { label: 'repr', type: 'function', apply: 'repr()', detail: '显示隐藏空格与换行符' },
  { label: 'eval', type: 'function', apply: 'eval()', detail: '解析逗号分隔元组等表达式' },
];

const PYTHON_SNIPPETS: Completion[] = [
  snippetCompletion('with open("${filename}", "${r}", encoding="utf-8") as ${f}:\n    ${content} = ${f}.read()\n    ${}', {
    label: 'withopen',
    type: 'text',
    detail: '片段：with open UTF-8 安全读文件',
  }),
  snippetCompletion(
    'try:\n    with open("${data.txt}", "r", encoding="utf-8") as f:\n        content = f.read()\nexcept FileNotFoundError:\n    import sys\n    content = sys.stdin.read()\n${}',
    {
      label: 'tryfile',
      type: 'text',
      detail: '片段：文件不存在回退 sys.stdin',
    }
  ),
  snippetCompletion(
    'import csv\nwith open("${in.csv}", "r", encoding="utf-8", newline="") as f:\n    rows = list(csv.reader(f))\nheader, data = rows[0], rows[1:]\ndata.sort(key=lambda x: sum(map(float, x[4:])), reverse=True)\n${}',
    {
      label: 'csvsort',
      type: 'text',
      detail: '片段：CSV 读取与总分降序模板',
    }
  ),
  snippetCompletion(
    'def is_prime(n):\n    if n < 2:\n        return False\n    i = 2\n    while i * i <= n:\n        if n % i == 0:\n            return False\n        i += 1\n    return True\n${}',
    {
      label: 'prime',
      type: 'text',
      detail: '片段：√n 素数判定函数（含 n<2）',
    }
  ),
  snippetCompletion(
    'def gcd(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n${}',
    {
      label: 'gcd',
      type: 'text',
      detail: '片段：辗转相除求最大公约数',
    }
  ),
  snippetCompletion(
    'while True:\n    x = int(input())\n    if x == ${0}:\n        break\n    ${}',
    {
      label: 'sentinel',
      type: 'text',
      detail: '片段：哨兵循环标准模板',
    }
  ),
  snippetCompletion(
    'class ${ClassName}:\n    def __init__(self, ${args}):\n        self.${attr} = ${args}\n\n    def __str__(self):\n        return f"${ClassName}({self.${attr}})"\n${}',
    {
      label: 'classdef',
      type: 'text',
      detail: '片段：Python 类定义模板',
    }
  ),
  snippetCompletion('if __name__ == "__main__":\n    ${main()}', {
    label: 'ifmain',
    type: 'text',
    detail: '片段：主入口守卫',
  }),
  snippetCompletion(
    'cnt = {}\nfor ${item} in ${seq}:\n    cnt[${item}] = cnt.get(${item}, 0) + 1\nranked = sorted(cnt.items(), key=lambda kv: -kv[1])\n${}',
    {
      label: 'dictcount',
      type: 'text',
      detail: '片段：字典计数 + 降序排序三件套',
    }
  ),
];

const DOT_COMPLETIONS: Record<string, Completion[]> = {
  math: [
    { label: 'sqrt', type: 'function', apply: 'sqrt()', detail: '平方根（返回 float）' },
    { label: 'pi', type: 'constant', detail: '圆周率 π ≈ 3.141592653589793' },
    { label: 'fabs', type: 'function', apply: 'fabs()', detail: '浮点绝对值（常用于浮点判等）' },
    { label: 'ceil', type: 'function', apply: 'ceil()', detail: '向上取整' },
    { label: 'floor', type: 'function', apply: 'floor()', detail: '向下取整' },
    { label: 'pow', type: 'function', apply: 'pow()', detail: '乘方' },
  ],
  csv: [
    { label: 'reader', type: 'function', apply: 'reader(f)', detail: '逐行读取 CSV -> 列表迭代器' },
    { label: 'writer', type: 'function', apply: 'writer(f)', detail: '创建 CSV 写入器（需 newline=""）' },
  ],
  random: [
    { label: 'seed', type: 'function', apply: 'seed(10)', detail: '固定随机种子便于复现' },
    { label: 'randint', type: 'function', apply: 'randint(1, 100)', detail: '闭区间 [a, b] 随机整数' },
    { label: 'random', type: 'function', apply: 'random()', detail: '[0.0, 1.0) 随机浮点' },
    { label: 'choice', type: 'function', apply: 'choice()', detail: '随机抽取一个元素' },
  ],
  sys: [
    { label: 'stdin.read', type: 'function', apply: 'stdin.read()', detail: '读取全部标准输入' },
    { label: 'exit', type: 'function', apply: 'exit()', detail: '退出程序' },
  ],
  __common__: [
    { label: 'split', type: 'method', apply: 'split()', detail: '切分字符串 -> list' },
    { label: 'strip', type: 'method', apply: 'strip()', detail: '去除首尾空白与 \\n' },
    { label: 'replace', type: 'method', apply: 'replace("", "")', detail: '替换全部子串（返回新串）' },
    { label: 'join', type: 'method', apply: 'join()', detail: '用分隔符拼接字符串列表' },
    { label: 'lower', type: 'method', apply: 'lower()', detail: '转小写' },
    { label: 'upper', type: 'method', apply: 'upper()', detail: '转大写' },
    { label: 'isdigit', type: 'method', apply: 'isdigit()', detail: '是否全为数字字符' },
    { label: 'isalpha', type: 'method', apply: 'isalpha()', detail: '是否全为字母' },
    { label: 'format', type: 'method', apply: 'format()', detail: '格式化字符串' },
    { label: 'append', type: 'method', apply: 'append()', detail: '列表尾部追加 1 个元素（原地）' },
    { label: 'extend', type: 'method', apply: 'extend()', detail: '列表合并另一可迭代对象' },
    { label: 'remove', type: 'method', apply: 'remove()', detail: '删除首个匹配元素' },
    { label: 'pop', type: 'method', apply: 'pop()', detail: '弹出元素' },
    { label: 'index', type: 'method', apply: 'index()', detail: '返回首次出现下标' },
    { label: 'sort', type: 'method', apply: 'sort()', detail: '原地排序（返回 None）' },
    { label: 'reverse', type: 'method', apply: 'reverse()', detail: '原地反转（返回 None）' },
    { label: 'count', type: 'method', apply: 'count()', detail: '统计出现次数' },
    { label: 'get', type: 'method', apply: 'get(, 0)', detail: '字典安全取值不报 KeyError' },
    { label: 'items', type: 'method', apply: 'items()', detail: '字典 (键, 值) 视图' },
    { label: 'keys', type: 'method', apply: 'keys()', detail: '字典键视图' },
    { label: 'values', type: 'method', apply: 'values()', detail: '字典值视图' },
    { label: 'add', type: 'method', apply: 'add()', detail: '集合添加元素' },
    { label: 'discard', type: 'method', apply: 'discard()', detail: '集合安全删除不报错' },
    { label: 'read', type: 'method', apply: 'read()', detail: '整读文件内容' },
    { label: 'readlines', type: 'method', apply: 'readlines()', detail: '按行读入列表（含 \\n）' },
    { label: 'write', type: 'method', apply: 'write("\\n")', detail: '写入字符串（不自动换行）' },
    { label: 'writerow', type: 'method', apply: 'writerow()', detail: 'CSV 写入单行' },
    { label: 'writerows', type: 'method', apply: 'writerows()', detail: 'CSV 批量写入多行' },
  ],
};

function pythonIntelliSense(context: CompletionContext) {
  const dotMatch = context.matchBefore(/([A-Za-z_]\w*)\.(\w*)$/);
  if (dotMatch) {
    const [full, obj, prop] = dotMatch.text.match(/^([A-Za-z_]\w*)\.(\w*)$/) ?? [];
    if (full && obj) {
      const specific = DOT_COMPLETIONS[obj] ?? DOT_COMPLETIONS.__common__;
      return {
        from: dotMatch.to - (prop?.length ?? 0),
        options: specific,
      };
    }
  }

  const word = context.matchBefore(/[A-Za-z_]\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  // Collect user-defined identifiers in current document for local autocomplete
  const docText = context.state.doc.toString();
  const seen = new Set<string>();
  const localIds: Completion[] = [];
  const defRe = /\b(?:def|class)\s+([A-Za-z_]\w*)|^([A-Za-z_]\w*)\s*=/gm;
  let m: RegExpExecArray | null;
  while ((m = defRe.exec(docText)) !== null) {
    const id = m[1] || m[2];
    if (id && !seen.has(id) && id !== word.text) {
      seen.add(id);
      localIds.push({
        label: id,
        type: m[1] ? 'function' : 'variable',
        detail: '当前文件符号',
      });
    }
  }

  return {
    from: word.from,
    options: [...PYTHON_SNIPPETS, ...localIds, ...PYTHON_BUILTINS, ...PYTHON_KEYWORDS],
  };
}

// VS Code Dark+ Highlight Style
const vscodeDarkHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword], color: '#c586c0', fontWeight: '600' },
  { tag: [t.operatorKeyword, t.definitionKeyword], color: '#569cd6', fontWeight: '600' },
  { tag: [t.atom, t.bool, t.null, t.self], color: '#569cd6' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#dcdcaa' },
  { tag: [t.className, t.typeName], color: '#4ec9b0', fontWeight: '600' },
  { tag: [t.string, t.special(t.string)], color: '#ce9178' },
  { tag: [t.number, t.integer, t.float], color: '#b5cea8' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#6a9955', fontStyle: 'italic' },
  { tag: [t.variableName], color: '#9cdcfe' },
  { tag: [t.propertyName], color: '#9cdcfe' },
  { tag: [t.operator, t.punctuation], color: '#d4d4d4' },
  { tag: [t.bracket, t.paren, t.squareBracket, t.brace], color: '#ffd700' },
]);

const vscodeLightHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword], color: '#af00db', fontWeight: '600' },
  { tag: [t.operatorKeyword, t.definitionKeyword], color: '#0000ff', fontWeight: '600' },
  { tag: [t.atom, t.bool, t.null, t.self], color: '#0000ff' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#795e26' },
  { tag: [t.className, t.typeName], color: '#267f99', fontWeight: '600' },
  { tag: [t.string, t.special(t.string)], color: '#a31515' },
  { tag: [t.number, t.integer, t.float], color: '#098658' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#008000', fontStyle: 'italic' },
  { tag: [t.variableName, t.propertyName], color: '#001080' },
  { tag: [t.operator, t.punctuation], color: '#383a42' },
]);

function createEditorTheme(mode: IdeThemeMode, fontSize: number) {
  const isLight = mode === 'vscode-light';
  const bg = mode === 'vscode-dark' ? '#1e1e1e' : mode === 'aurora-dark' ? '#111114' : '#ffffff';
  const gutterBg = mode === 'vscode-dark' ? '#1e1e1e' : mode === 'aurora-dark' ? '#0e0e11' : '#f8fafc';
  const activeLine =
    mode === 'vscode-dark'
      ? 'rgba(255, 255, 255, 0.045)'
      : mode === 'aurora-dark'
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(15, 23, 42, 0.04)';
  const selection =
    mode === 'vscode-dark'
      ? '#264f78'
      : mode === 'aurora-dark'
        ? 'rgba(217, 155, 38, 0.24)'
        : '#add6ff';
  const fg = isLight ? '#1e293b' : '#d4d4d4';
  const gutterFg = isLight ? '#94a3b8' : '#6e7681';
  const activeGutterFg = isLight ? '#0f172a' : '#e4e4e7';

  return [
    EditorView.theme(
      {
        '&': {
          backgroundColor: bg,
          color: fg,
          height: '100%',
          fontSize: `${fontSize}px`,
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        },
        '.cm-scroller': {
          overflow: 'auto',
          lineHeight: '1.65',
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        },
        '.cm-content': {
          caretColor: isLight ? '#0f172a' : '#e5a93c',
          padding: '10px 0 60px 0',
        },
        '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: isLight ? '#0f172a' : '#e5a93c',
          borderLeftWidth: '2px',
        },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
          backgroundColor: selection,
        },
        '.cm-activeLine': { backgroundColor: activeLine },
        '.cm-gutters': {
          backgroundColor: gutterBg,
          color: gutterFg,
          borderRight: isLight
            ? '1px solid rgba(15, 23, 42, 0.08)'
            : '1px solid rgba(148, 163, 184, 0.12)',
          paddingRight: '4px',
        },
        '.cm-activeLineGutter': {
          backgroundColor: activeLine,
          color: activeGutterFg,
          fontWeight: '600',
        },
        '.cm-foldGutter .cm-gutterElement': {
          padding: '0 4px',
          cursor: 'pointer',
        },
        '.cm-tooltip': {
          backgroundColor: isLight ? '#ffffff' : '#252526',
          border: isLight ? '1px solid #cbd5e1' : '1px solid #454545',
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          color: fg,
        },
        '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
          padding: '4px 10px',
          fontSize: '12px',
        },
        '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
          backgroundColor: isLight ? '#0ea5e9' : '#094771',
          color: '#ffffff',
        },
        '.cm-completionDetail': {
          opacity: 0.72,
          marginLeft: '10px',
          fontStyle: 'normal',
          fontSize: '11px',
        },
        '.cm-panels': {
          backgroundColor: isLight ? '#f1f5f9' : '#252526',
          color: fg,
          borderBottom: isLight ? '1px solid #cbd5e1' : '1px solid #3c3c3c',
        },
        '.cm-panel.cm-search': {
          padding: '6px 10px',
          fontSize: '12px',
        },
        '.cm-panel.cm-search input, .cm-panel.cm-search button': {
          borderRadius: '6px',
          fontSize: '12px',
        },
        '.cm-diagnostic-error': {
          borderLeft: '3px solid #f43f5e',
          paddingLeft: '8px',
        },
      },
      { dark: !isLight }
    ),
    syntaxHighlighting(isLight ? vscodeLightHighlight : vscodeDarkHighlight),
  ];
}

export function CodeMirrorPythonEditor({
  ref,
  value,
  filename,
  themeMode,
  fontSize,
  wordWrap,
  diagnostics,
  onChange,
  onRunShortcut,
  onSaveShortcut,
  onCursorChange,
}: {
  ref?: React.Ref<CodeMirrorEditorHandle>;
  value: string;
  filename: string;
  themeMode: IdeThemeMode;
  fontSize: number;
  wordWrap: boolean;
  diagnostics: PythonDiagnostic[];
  onChange: (next: string) => void;
  onRunShortcut: () => void;
  onSaveShortcut: () => void;
  onCursorChange: (pos: { line: number; col: number; selected: number }) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeComp = useRef(new Compartment());
  const langComp = useRef(new Compartment());
  const wrapComp = useRef(new Compartment());

  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRunShortcut);
  const onSaveRef = useRef(onSaveShortcut);
  const onCursorRef = useRef(onCursorChange);
  onChangeRef.current = onChange;
  onRunRef.current = onRunShortcut;
  onSaveRef.current = onSaveShortcut;
  onCursorRef.current = onCursorChange;

  const isPython = filename.toLowerCase().endsWith('.py');

  useImperativeHandle(ref, () => ({
    focus() {
      viewRef.current?.focus();
    },
    jumpToLine(line: number, col = 1) {
      const view = viewRef.current;
      if (!view) return;
      const clampedLine = Math.max(1, Math.min(line, view.state.doc.lines));
      const lineInfo = view.state.doc.line(clampedLine);
      const pos = Math.min(lineInfo.to, lineInfo.from + Math.max(0, col - 1));
      view.dispatch({
        selection: { anchor: pos },
        effects: EditorView.scrollIntoView(pos, { y: 'center' }),
      });
      view.focus();
    },
    insertSnippet(text: string) {
      const view = viewRef.current;
      if (!view) return;
      const sel = view.state.selection.main;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: text },
        selection: { anchor: sel.from + text.length },
      });
      view.focus();
    },
  }));

  useEffect(() => {
    if (!hostRef.current) return;

    const customKeys = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onRunRef.current();
          return true;
        },
      },
      {
        key: 'F5',
        run: () => {
          onRunRef.current();
          return true;
        },
      },
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        indentUnit.of('    '),
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        lintGutter(),
        customKeys,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        langComp.current.of(
          isPython ? [python(), autocompletion({ override: [pythonIntelliSense] })] : []
        ),
        themeComp.current.of(createEditorTheme(themeMode, fontSize)),
        wrapComp.current.of(wordWrap ? EditorView.lineWrapping : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
          if (update.selectionSet || update.docChanged) {
            const sel = update.state.selection.main;
            const lineInfo = update.state.doc.lineAt(sel.head);
            onCursorRef.current({
              line: lineInfo.number,
              col: sel.head - lineInfo.from + 1,
              selected: Math.abs(sel.to - sel.from),
            });
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync value when switching files or loading templates
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // Reconfigure theme / font size
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeComp.current.reconfigure(createEditorTheme(themeMode, fontSize)),
    });
  }, [themeMode, fontSize]);

  // Reconfigure language when switching between .py and .csv/.txt
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: langComp.current.reconfigure(
        isPython ? [python(), autocompletion({ override: [pythonIntelliSense] })] : []
      ),
    });
  }, [isPython]);

  // Reconfigure word wrap
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: wrapComp.current.reconfigure(wordWrap ? EditorView.lineWrapping : []),
    });
  }, [wordWrap]);

  // Apply real-time Python AST diagnostics (red squigglies!)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (!isPython || diagnostics.length === 0) {
      view.dispatch(setDiagnostics(view.state, []));
      return;
    }
    const mapped: Diagnostic[] = [];
    for (const d of diagnostics) {
      const lineNum = Math.max(1, Math.min(d.line, view.state.doc.lines));
      const lineObj = view.state.doc.line(lineNum);
      const from = Math.min(lineObj.to, lineObj.from + Math.max(0, d.col - 1));
      const endLineNum = Math.max(lineNum, Math.min(d.endLine ?? lineNum, view.state.doc.lines));
      const endLineObj = view.state.doc.line(endLineNum);
      const to = Math.max(
        from + (from < lineObj.to ? 1 : 0),
        Math.min(endLineObj.to, endLineObj.from + Math.max(0, (d.endCol ?? d.col + 1) - 1))
      );
      mapped.push({
        from,
        to,
        severity: d.severity,
        message: d.message,
      });
    }
    view.dispatch(setDiagnostics(view.state, mapped));
  }, [diagnostics, isPython]);

  return <div ref={hostRef} className="h-full w-full overflow-hidden" />;
}
