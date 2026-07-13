"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleCheckBig,
  FileOutput,
  FileText,
  Gauge,
  Layers3,
  LockKeyhole,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  WandSparkles,
} from "lucide-react";

import styles from "./career-wiki-landing.module.css";

const steps = [
  ["resume", "上传简历", "简历", "先让系统理解你的真实经历", "支持上传现有简历或手动补充内容。开始匹配前，会提醒你完善个人信息和关键项目。", "基础档案", "待确认", Upload],
  ["jd", "粘贴 JD", "JD", "把招聘要求拆成可行动的判断", "识别岗位职责、关键技能和加分项，形成后续项目匹配、简历定制与学习计划的统一目标。", "岗位方向", "AI 应用工程师", FileText],
  ["fit", "项目匹配", "匹配", "知道哪些项目值得写，哪些不该硬写", "给出投递建议、竞争力判断和推荐项目，并把证据不足的内容留在风险区。", "匹配度", "78 / 100", Target],
  ["tailor", "定制简历", "定制", "围绕目标岗位重排和改写经历", "系统主动追问缺少的细节，建议补充数据，并在用户确认后生成正式版本。", "推荐改写", "12 条", WandSparkles],
  ["template", "切换模板", "模板", "在内容可信的前提下提升呈现质量", "Modern、ATS 和 Compact 覆盖视觉展示、机器解析和一页纸投递场景。", "模板", "3 种", Layers3],
  ["export", "导出 PDF", "导出", "确认无风险后生成正式投递版本", "导出前检查证据、敏感信息、空内容和夸大表述，让最终文件可以直接审核。", "导出状态", "检查通过", FileOutput],
] as const;

const templates = {
  modern: { label: "Modern", caption: "突出 AI 项目与产品化能力", accent: "bg-[#2457ff]" },
  ats: { label: "ATS", caption: "结构保守，方便招聘系统解析", accent: "bg-[#111318]" },
  compact: { label: "Compact", caption: "高信息密度，适合一页纸", accent: "bg-[#b9f227]" },
} as const;

type StepId = (typeof steps)[number][0];
type TemplateId = keyof typeof templates;

function MediaPlaceholder({ label, note, className = "" }: { label: string; note: string; className?: string }) {
  return (
    <div className={`${styles.mediaPlaceholder} ${className}`} role="img" aria-label={`${label}：${note}`}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/10">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <div><p className="text-sm font-semibold">{label}</p><p className="mt-1 max-w-md text-xs leading-5 opacity-70">{note}</p></div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 text-sm font-semibold text-career-primary">{children}</p>;
}

export function CareerWikiLanding() {
  const [activeStep, setActiveStep] = useState<StepId>("fit");
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>("modern");
  const selectedStep = steps.find(([id]) => id === activeStep) ?? steps[0];
  const SelectedIcon = selectedStep[7];
  const selectedTemplate = templates[activeTemplate];

  return (
    <main className={`${styles.root} min-h-dvh overflow-x-hidden bg-career-canvas text-career-ink`}>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f8fb]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2457ff] sm:gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-career-ink text-white"><ScanSearch className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block truncate text-sm font-bold">Career Wiki Agent</span><span className="hidden text-xs text-black/50 sm:block">Evidence-aware career copilot</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="首页导航">
            <a href="#workflow" className="hover:text-[#2457ff]">产品流程</a><a href="#matching" className="hover:text-[#2457ff]">岗位匹配</a><a href="#templates" className="hover:text-[#2457ff]">简历模板</a><a href="#learning" className="hover:text-[#2457ff]">学习计划</a>
          </nav>
          <Link href="/career-wiki/quick-start" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-[#111318] px-3 text-sm font-semibold text-white hover:bg-[#2457ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2457ff] sm:px-4"><span className="hidden sm:inline">开始</span>一键生成<ArrowRight className="size-4" /></Link>
        </div>
      </header>

      <section className="bg-[#111318] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
          <div className={`${styles.heroCopy} max-w-4xl`}>
            <p className="mb-7 text-sm font-semibold text-career-proof">为应届生和 1-3 年经验求职者设计</p>
            <h1 className="text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-7xl">不只帮你写简历，<br /><span className="text-career-proof">帮你判断该投什么。</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">上传简历，粘贴 JD。系统给出项目匹配、竞争力判断和定制简历，正式内容由你确认。</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/career-wiki/quick-start" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#b9f227] px-6 text-sm font-bold text-[#111318] hover:bg-white">一键生成求职方案<ArrowRight className="size-4" /></Link>
              <a href="#demo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 px-6 text-sm font-semibold hover:bg-white/10"><Play className="size-4" />查看完整流程</a>
            </div>
          </div>
          <div className={`${styles.heroVisual} mt-14 border-t border-white/15 pt-8 lg:mt-20`}><MediaPlaceholder label="首页主视觉" note="后续生成：工作台全景，展示 JD 匹配、简历定制和导出状态；适合 16:9 视频封面与首屏动效。" className="min-h-[280px] border-white/20 bg-[#181b22] text-white sm:min-h-[380px] lg:min-h-[500px]" /></div>
        </div>
      </section>

      <section id="demo" className="border-b border-black/10 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel>交互式产品演示</SectionLabel>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">一次完整体验，从原始简历到可投递版本</h2>
          <p className="mt-5 max-w-2xl leading-7 text-black/60">点击步骤查看每个环节解决的问题。这里展示的是产品流程，不会提交你的数据。</p>
          <div className="mt-10 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2" role="tablist" aria-label="产品演示步骤">
              {steps.map(([id, label, , , , , , Icon], index) => <button key={id} type="button" role="tab" aria-selected={id === activeStep} onClick={() => setActiveStep(id)} className={`flex min-h-14 min-w-[150px] cursor-pointer items-center gap-3 rounded-lg border px-4 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#2457ff] lg:w-full ${id === activeStep ? "border-[#2457ff] bg-[#2457ff] text-white" : "border-black/10 bg-[#f7f8fb] hover:border-black/30"}`}><Icon className="size-4 shrink-0" /><span><span className="mr-2 text-xs opacity-60">0{index + 1}</span>{label}</span></button>)}
            </div>
            <div key={activeStep} role="tabpanel" className={`${styles.panelEnter} rounded-lg bg-career-ink p-6 text-white sm:p-10`}>
              <div className="flex flex-col justify-between gap-10 sm:flex-row">
                <div className="max-w-xl"><span className="flex size-12 items-center justify-center rounded-lg bg-[#b9f227] text-[#111318]"><SelectedIcon className="size-6" /></span><p className="mt-8 text-xs font-semibold uppercase text-[#b9f227]">当前步骤 · {selectedStep[2]}</p><h3 className="mt-3 text-2xl font-semibold sm:text-3xl">{selectedStep[3]}</h3><p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">{selectedStep[4]}</p></div>
                <div className="border-t border-white/15 pt-5 sm:w-44 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"><p className="text-xs text-white/45">{selectedStep[5]}</p><p className="mt-2 text-xl font-semibold">{selectedStep[6]}</p><p className="mt-2 text-xs text-white/40">演示数据</p></div>
              </div>
              <div className="mt-10 grid gap-3 border-t border-white/15 pt-6 text-sm sm:grid-cols-3"><div><p className="text-xs text-white/40">输入</p><p className="mt-2">个人经历 + 目标 JD</p></div><div><p className="text-xs text-white/40">判断</p><p className="mt-2">匹配 + 证据 + 风险</p></div><div><p className="text-xs text-white/40">输出</p><p className="mt-2">正式简历 + 学习计划</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><SectionLabel>One connected workflow</SectionLabel><h2 className="text-3xl font-semibold leading-tight sm:text-5xl">不是六个散落的工具，而是一条求职决策链</h2><p className="mt-5 leading-7 text-black/60">同一份个人信息贯穿岗位分析、项目筛选、内容确认和简历交付。</p></div><MediaPlaceholder label="流程图" note="后续生成：上传简历 → JD 分析 → 项目匹配 → 人工确认 → 模板预览 → PDF 导出。" className="min-h-[250px] bg-white" /></div>
          <ol className="mt-12 grid border-l border-t border-black/10 sm:grid-cols-2 lg:grid-cols-3">{steps.map(([id, label, , title, , , , Icon], index) => <li key={id} className="min-h-[180px] border-b border-r border-black/10 bg-white p-6"><div className="flex justify-between"><span className="text-xs font-semibold text-black/35">0{index + 1}</span><Icon className="size-5 text-[#2457ff]" /></div><h3 className="mt-8 text-lg font-semibold">{label}</h3><p className="mt-2 text-sm leading-6 text-black/55">{title}</p></li>)}</ol>
        </div>
      </section>

      <section id="matching" className="bg-[#dfe7ff] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div><SectionLabel>JD fit intelligence</SectionLabel><h2 className="text-3xl font-semibold leading-tight sm:text-5xl">先判断值不值得投，再决定简历怎么写</h2><p className="mt-5 leading-7 text-black/65">系统把结论压缩成三件真正影响行动的事情：投递建议、竞争力判断、推荐项目。</p><div className="mt-9 divide-y divide-black/10 border-y border-black/10">{[[Gauge,"投递建议","建议投递，但先补强评测与部署证据"],[BriefcaseBusiness,"竞争力判断","项目方向匹配，工程落地证明仍偏弱"],[Target,"推荐项目","Finance-Agent-Lab、ReviewFlow AI"]].map(([Icon,label,value]) => { const RowIcon=Icon as typeof Gauge; return <div key={label as string} className="flex gap-4 py-5"><RowIcon className="mt-0.5 size-5 shrink-0" /><div><p className="text-sm font-semibold">{label as string}</p><p className="mt-1 text-sm text-black/60">{value as string}</p></div></div>; })}</div></div>
          <div className="space-y-4"><div className="rounded-lg bg-[#111318] p-7 text-white"><div className="flex justify-between"><div><p className="text-xs text-white/45">匹配分数 · 演示数据</p><p className="mt-3 text-5xl font-semibold">78</p></div><span className="h-fit rounded-full bg-[#b9f227] px-3 py-1 text-xs font-bold text-[#111318]">值得准备</span></div><div className="mt-7 h-2 rounded-full bg-white/10"><div className="h-full w-[78%] rounded-full bg-[#b9f227]" /></div><div className="mt-7 grid grid-cols-3 text-center"><div><b>82</b><p className="text-xs text-white/45">关键词</p></div><div><b>76</b><p className="text-xs text-white/45">项目证据</p></div><div><b>64</b><p className="text-xs text-white/45">能力覆盖</p></div></div></div><MediaPlaceholder label="产品图" note="后续生成：真实 JD 匹配结果页面，突出投递建议、竞争力判断和推荐项目。" className="min-h-[220px] bg-white" /></div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="order-2 rounded-lg border border-black/10 bg-[#f7f8fb] p-6 sm:p-8 lg:order-1"><div className="flex justify-between border-b border-black/10 pb-5"><div><p className="font-semibold">内容确认队列</p><p className="mt-1 text-xs text-black/45">3 条待确认 · 演示数据</p></div><ShieldCheck className="size-6 text-[#2457ff]" /></div><div className="mt-5 space-y-3">{[["已验证","基于项目文档重写结果描述",true],["需补充","请补充处理数据量或效率变化",false],["有风险","WIP 项目不能表述为已生产上线",false]].map(([label,text,passed]) => <div key={label as string} className="flex min-h-16 gap-3 rounded-lg border border-black/10 bg-white p-4"><span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${passed ? "bg-[#b9f227]" : "bg-[#ffd9d2]"}`}>{passed ? <Check className="size-3.5" /> : "!"}</span><div><p className="text-xs font-semibold">{label as string}</p><p className="mt-1 text-sm text-black/60">{text as string}</p></div></div>)}</div></div>
          <div className="order-1 lg:order-2"><SectionLabel>Human-in-the-loop</SectionLabel><h2 className="text-3xl font-semibold leading-tight sm:text-5xl">AI 可以追问和建议，但正式简历必须由你确认</h2><p className="mt-5 leading-7 text-black/60">没有证据的内容留在待补充区，WIP 项目不会被包装成成熟产品。</p><ul className="mt-8 space-y-4">{["主动追问项目细节和量化结果","暂存缺少证据的内容，不进入正式简历","对比原简历与定制版本的改写差异"].map(item => <li key={item} className="flex gap-3 text-sm font-medium"><CircleCheckBig className="size-5 shrink-0 text-[#2457ff]" />{item}</li>)}</ul></div>
        </div>
      </section>

      <section id="templates" className="bg-[#111318] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <SectionLabel>简历模板与交付</SectionLabel>
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">同一份可信内容，适配不同投递场景</h2>
              <p className="mt-5 max-w-2xl leading-7 text-white/60">切换模板只改变呈现方式，不绕过证据校验。</p>
            </div>
            <div className="flex gap-2" role="tablist" aria-label="简历模板选择">
              {(Object.keys(templates) as TemplateId[]).map((id) => (
                <button key={id} type="button" role="tab" aria-selected={activeTemplate === id} onClick={() => setActiveTemplate(id)} className={`min-h-11 cursor-pointer rounded-lg border px-4 text-sm font-semibold ${activeTemplate === id ? "border-white bg-white text-career-ink" : "border-white/20 hover:border-white/60"}`}>
                  {templates[id].label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div key={activeTemplate} className={`${styles.panelEnter} min-h-[500px] rounded-lg bg-[#e8e9ee] p-4 sm:p-8`}>
              <div className="mx-auto min-h-[440px] max-w-[620px] bg-white p-7 text-career-ink shadow-2xl sm:p-10">
                <div className={`h-2 w-16 ${selectedTemplate.accent}`} />
                <div className="mt-5 flex justify-between border-b border-black/15 pb-6"><div><p className="text-2xl font-bold">候选人姓名</p><p className="mt-1 text-sm text-black/55">AI 应用工程师</p></div><p className="text-right text-xs text-black/40">联系信息已隐藏<br />正式导出时检查</p></div>
                <div className="mt-7 grid gap-7 sm:grid-cols-[1fr_2fr]">
                  <div><b className="text-xs">核心技能</b><ul className="mt-3 space-y-2 text-xs leading-5 text-black/65"><li>TypeScript / Next.js</li><li>LLM Application</li><li>Data Automation</li><li>Evidence Validation</li></ul></div>
                  <div><b className="text-xs">项目经历</b>{[
                    { name: "Finance-Agent-Lab", bullet: "构建可追溯的财务数据处理流程，保留结果证据与人工复核节点。" },
                    { name: "ReviewFlow AI · WIP", bullet: "实现评审工作流原型，当前保持 WIP 状态，不夸大为生产系统。" },
                  ].map((project) => <div key={project.name} className="mt-4"><p className="text-xs font-semibold">{project.name}</p><p className="mt-2 text-xs leading-5 text-black/60">{project.bullet}</p></div>)}</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-8"><div><p className="text-sm font-semibold text-white/55">当前模板</p><p className="mt-2 text-3xl font-semibold">{selectedTemplate.label}</p><p className="mt-3 text-sm text-white/60">{selectedTemplate.caption}</p><div className="mt-7 space-y-3 text-sm">{["A4 打印布局","浏览器保存 PDF","导出前安全检查","重复导出不覆盖"].map(item => <p key={item} className="flex gap-2"><Check className="size-4 text-career-proof" />{item}</p>)}</div></div><MediaPlaceholder label="交付效果图" note="后续生成：三种模板并列的最终 PDF、HTML 与 Markdown 交付效果。" className="min-h-[180px] border-white/20 bg-[#181b22] text-white" /></div>
          </div>
        </div>
      </section>

      <section id="learning" className="bg-[#b9f227] py-20 sm:py-24"><div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8"><div><SectionLabel>7-day interview sprint</SectionLabel><h2 className="text-3xl font-semibold leading-tight sm:text-5xl">缺什么就补什么，只做最接近面试结果的准备</h2><p className="mt-5 leading-7 text-black/65">学习计划以目标 JD 为边界，把技能差距转成七天任务。每天都有明确输出，而不是泛泛推荐课程。</p><div className="mt-8 flex flex-wrap gap-2">{["JD 高频问题","项目讲述","技能补强","模拟面试"].map(item => <span key={item} className="rounded-full border border-black/20 bg-white/50 px-3 py-2 text-xs font-semibold">{item}</span>)}</div></div><div><MediaPlaceholder label="场景图" note="后续生成：求职者在七日冲刺看板中完成任务、整理项目讲述并准备面试。" className="min-h-[260px] border-black/15 bg-[#d5ff70]" /><div className="mt-4 grid grid-cols-7 gap-1.5">{Array.from({length:7},(_,i)=><div key={i} className={`flex aspect-square items-center justify-center rounded-md border border-black/15 text-xs font-bold ${i<3?"bg-[#111318] text-white":"bg-white/55"}`}>D{i+1}</div>)}</div></div></div></section>

      <section className="bg-white py-20 sm:py-24"><div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"><div><SectionLabel>Built for the first career moves</SectionLabel><h2 className="text-3xl font-semibold leading-tight sm:text-5xl">为经历不多，但需要把每段经历讲清楚的人设计</h2><div className="mt-9 grid gap-4 sm:grid-cols-2"><div className="rounded-lg border border-black/10 bg-[#f7f8fb] p-6"><b>应届生</b><p className="mt-3 text-sm leading-6 text-black/55">不知道项目该怎么选，也难以判断自己和岗位差在哪里。</p></div><div className="rounded-lg border border-black/10 bg-[#f7f8fb] p-6"><b>1–3 年经验</b><p className="mt-3 text-sm leading-6 text-black/55">经历开始增多，但缺少针对岗位重组内容的高效方法。</p></div></div></div><div className="rounded-lg bg-[#111318] p-8 text-white"><LockKeyhole className="size-7 text-[#b9f227]" /><h3 className="mt-7 text-2xl font-semibold">现在先把本地体验做好</h3><p className="mt-4 text-sm leading-7 text-white/60">当前版本面向本地真实使用和身边用户测试。不会自动登录招聘平台，不会自动抓取账号页面，也不会自动投递或私信 HR。</p><div className="mt-8 border-t border-white/15 pt-6 text-sm"><p className="flex gap-2"><ShieldCheck className="size-4 text-[#b9f227]" />真实数据用于本地测试</p><p className="mt-3 flex gap-2"><ShieldCheck className="size-4 text-[#b9f227]" />公开展示使用脱敏内容</p></div></div></div></section>

      <section className="border-y border-black/10 py-20 sm:py-24"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8"><div><SectionLabel>Showcase assets</SectionLabel><h2 className="text-3xl font-semibold">为后续视频和路演预留真实素材位</h2><p className="mt-4 text-sm leading-7 text-black/55">当前只固定内容结构和画面比例，品牌方向确认后再统一生成正式素材。</p></div><MediaPlaceholder label="用户头像" note="后续替换：创作者头像或经过授权的真实测试用户头像，不伪造用户评价。" className="min-h-[240px] bg-white" /><MediaPlaceholder label="社媒预览图" note="后续生成：适合视频封面和社交平台发布的 16:9 产品预览图。" className="min-h-[240px] bg-[#ffd9d2]" /></div></section>

      <section className="bg-[#2457ff] py-20 text-white sm:py-24"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 px-4 sm:px-6 lg:flex-row lg:items-end lg:px-8"><div><p className="text-xs font-semibold uppercase text-white/60">Career Wiki Agent · Local MVP</p><h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">用一个真实 JD，完成第一次完整定制</h2><p className="mt-5 max-w-2xl leading-7 text-white/70">选择简历，粘贴 JD，一次生成项目匹配和待审核简历。</p></div><Link href="/career-wiki/quick-start" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-[#111318] hover:bg-[#b9f227]">开始一键生成<ChevronRight className="size-4" /></Link></div></section>
      <footer className="bg-[#111318] text-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-white/45 sm:px-6 md:flex-row md:justify-between lg:px-8"><p>Career Wiki Agent · Evidence-aware career preparation</p><p>Local-first MVP · Human confirmation · No automatic applications</p></div></footer>
    </main>
  );
}
