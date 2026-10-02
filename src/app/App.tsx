import { Suspense } from "react";
import { StackView, type ViewSpec } from "./views/StackView.tsx";
import { useUrlState } from "./hooks/useUrlState.ts";
import { SeriesBar, SeriesFooter } from "./components/Brand.tsx";

const REVISION = "時系列表は公表のたびに 1990 年度まで遡って改訂される。ここでは 2024 年度確報の系列を使う。";

const VIEWS = [
  {
    id: "supply",
    label: "供給",
    hint: "資源別",
    spec: {
      chunk: "supply",
      title: "一次エネルギー国内供給",
      lead: "国内に供給されたエネルギーを、元の資源ごとに。発電や石油精製に回る分も含む。",
      notes: [
        "区分は表のまま。水力は揚水発電を除き、再生可能は水力を除く。",
        "未活用は、廃棄物からのエネルギー回収や廃熱の利用など。",
        REVISION,
      ],
    },
  },
  {
    id: "final",
    label: "消費",
    hint: "使う形",
    spec: {
      chunk: "final",
      title: "最終エネルギー消費（エネルギー源別）",
      lead: "工場・オフィス・家庭・運輸で実際に使われた形で数える。電力と熱は、発電所や熱供給で転換された後の形。",
      notes: ["未活用は 1990 年代は 0。", REVISION],
    },
  },
  {
    id: "sector",
    label: "部門",
    hint: "使う場所",
    spec: {
      chunk: "sector",
      title: "最終エネルギー消費（部門別）",
      lead: "同じ最終消費を、使った部門で分ける。",
      notes: [
        "企業・事業所他は農林水産鉱業建設・製造業・業務他（第三次産業）の和、運輸は旅客・貨物の和。",
        "自家用車の燃料は家庭ではなく運輸（旅客）に入る。",
        REVISION,
      ],
    },
  },
  {
    id: "power",
    label: "電源",
    hint: "発電量",
    spec: {
      chunk: "power",
      title: "発電電力量（電源構成）",
      lead: "発電した電気を、電源ごとに。2010 年度から。",
      notes: [
        "表注: 2009 年度以前は電力調査統計の自家発電でバイオマスが別掲されていないため、電源構成は 2010 年度から掲載。",
        "ゼロエミッション電源（原子力・水力・太陽光・風力・地熱・バイオマスの和）は小計なので表示しない。",
        REVISION,
      ],
    },
  },
] as const satisfies readonly { id: string; label: string; hint: string; spec: ViewSpec }[];

type ViewId = (typeof VIEWS)[number]["id"];

export function App() {
  const [view, setView] = useUrlState<ViewId>("view", "supply", (v) => VIEWS.some((x) => x.id === v));
  const current = VIEWS.find((v) => v.id === view)!;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule bg-paper/85 backdrop-blur-sm">
        <SeriesBar />
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-end justify-between gap-4 px-6 pt-5">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">日本は何のエネルギーに頼ってきたか</h1>
            <p className="text-[11px] text-muted">資源エネルギー庁「総合エネルギー統計」</p>
          </div>
          <nav className="-mb-px flex gap-1" aria-label="ビュー">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-current={view === v.id ? "page" : undefined}
                className={`cursor-pointer border-b-2 px-3 pt-1 pb-2 text-[13px] transition-colors duration-150 ${
                  view === v.id
                    ? "border-accent font-semibold text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {v.label}
                <span className="ml-1.5 text-[10px] font-normal text-faint max-sm:hidden">{v.hint}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <Suspense key={view} fallback={<Loading />}>
        <StackView spec={current.spec} />
      </Suspense>

      <footer className="mx-auto w-full max-w-[1240px] px-6 pt-2 pb-10 text-[11px] leading-relaxed text-faint">
        出典: 資源エネルギー庁「総合エネルギー統計」時系列表（参考表）、2024 年度確報（2026 年 4 月 14 日公表）。
        単位は PJ（ペタジュール、10の15乗ジュール）と億kWh。
        <SeriesFooter />
      </footer>
    </div>
  );
}

function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-16 text-[12px] text-faint">読み込み中</div>
  );
}
