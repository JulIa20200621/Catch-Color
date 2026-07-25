import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Layers, Route, Sparkles } from 'lucide-react';
import { Card, Button } from 'animal-island-ui';
import PhotoArt from '@/components/PhotoArt';
import PhotoDetail from '@/components/PhotoDetail';
import { WALK_DAYS, TRACK_COLORS, enrichedPhotos, type EnrichedPhoto } from '@/data/photos';
import { getColor } from '@/data/colors';

/** 地图面板：当日概要 + 颜色之路彩蛋 + 日期切换 + 轨迹地图（用于相册子 Tab） */
export default function MapPanel() {
  const [dayIdx, setDayIdx] = useState(0);
  const [merge, setMerge] = useState(false);
  const [preview, setPreview] = useState<EnrichedPhoto | null>(null);
  const [detail, setDetail] = useState<EnrichedPhoto | null>(null);

  const day = WALK_DAYS[dayIdx];
  const routePath = (r: { x: number; y: number }[]) =>
    r.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const daysToRender = merge ? WALK_DAYS : [day];

  return (
    <div className="flex h-full flex-col">
      {/* 本周颜色之路（数据分析彩蛋） */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Card color="app-blue">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#5b8ec4]">
              <Sparkles size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-round text-[11px] font-semibold leading-snug">
                本周颜色之路 · 全城最蓝的一条路
              </p>
              <p className="mt-0.5 text-[9px] font-medium leading-snug opacity-80">
                滨江步道 · 本周 132 人在此捕捉到「晴空蓝」
              </p>
            </div>
            <div className="flex shrink-0 -space-x-2">
              {['blue', 'cyan', 'blue'].map((id, i) => (
                <PhotoArt key={i} colorId={id} seed={600 + i} className="h-9 w-9 rounded-full ring-2 ring-white" />
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 当日概要 */}
      <div className="mt-3">
        <Card>
          <div className="grid grid-cols-3 py-0.5 text-center">
            {[
              { v: `${day.distance}`, u: 'km', label: '散步距离' },
              { v: `${day.pins.length}`, u: '张', label: '拍照张数' },
              { v: `${day.colorKinds}`, u: '种', label: '捕捉颜色' },
            ].map((s, i) => (
              <div key={s.label} className={i > 0 ? 'border-l border-black/10' : ''}>
                <p className="font-round text-lg font-semibold">
                  {s.v}
                  <span className="ml-0.5 text-[10px] font-medium opacity-60">{s.u}</span>
                </p>
                <p className="mt-0.5 text-[10px] font-medium opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 日期切换 */}
      <div className="mt-3 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setDayIdx((i) => Math.min(WALK_DAYS.length - 1, i + 1))}
          disabled={dayIdx === WALK_DAYS.length - 1}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e2ce] bg-[#fdfbf2] text-[#3b3b3e] disabled:opacity-30"
        >
          <ChevronLeft size={15} />
        </motion.button>
        <div className="flex items-center gap-2">
          {WALK_DAYS.map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === dayIdx ? 'bg-[#e59266]' : 'bg-[#d6ccb2]'}`} />
          ))}
          <span className="ml-1 font-round text-[14px] font-semibold text-[#3b3b3e]">
            {day.date.replace('-', '月')}日
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setDayIdx((i) => Math.max(0, i - 1))}
          disabled={dayIdx === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e2ce] bg-[#fdfbf2] text-[#3b3b3e] disabled:opacity-30"
        >
          <ChevronRight size={15} />
        </motion.button>
      </div>

      {/* 地图主体 */}
      <div className="relative mt-3 flex-1 overflow-hidden rounded-2xl" style={{ background: '#eef0dc' }}>
        <svg viewBox="0 0 340 700" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect x="24" y="40" width="126" height="118" rx="20" fill="#f8f3e0" />
          <rect x="182" y="58" width="128" height="92" rx="20" fill="#fdf9ea" />
          <rect x="42" y="200" width="98" height="108" rx="20" fill="#fdf9ea" />
          <rect x="212" y="300" width="106" height="136" rx="20" fill="#f8f3e0" />
          <rect x="32" y="462" width="118" height="118" rx="20" fill="#fdf9ea" />
          <path d="M 0 350 C 80 330, 140 380, 200 360 S 320 340, 340 355 L 340 400 C 260 385, 180 420, 100 405 S 20 395, 0 405 Z" fill="#c4e2da" />
          <path d="M 0 250 L 340 230" stroke="#fffdf4" strokeWidth="14" strokeLinecap="round" />
          <path d="M 160 0 L 180 700" stroke="#fffdf4" strokeWidth="12" strokeLinecap="round" />
          <path d="M 0 520 L 340 540" stroke="#fffdf4" strokeWidth="12" strokeLinecap="round" />

          {daysToRender.map((d, di) => {
            const lineColor = merge ? TRACK_COLORS[di % TRACK_COLORS.length] : '#e59266';
            return (
              <g key={d.date}>
                <motion.path
                  d={routePath(d.route)}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="1 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.4, ease: 'easeInOut', delay: di * 0.2 }}
                />
                <circle cx={d.route[0].x} cy={d.route[0].y} r="9" fill="#fffdf4" stroke={lineColor} strokeWidth="4" />
              </g>
            );
          })}

          {daysToRender.map((d, di) =>
            d.pins.map((pin, pi) => {
              const photo = enrichedPhotos.find((p) => p.id === pin.photoId);
              if (!photo) return null;
              const c = getColor(photo.colorId);
              return (
                <motion.g
                  key={`${d.date}-${pi}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + (di + pi) * 0.12, type: 'spring', stiffness: 300, damping: 15 }}
                  onClick={() => setPreview(photo)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={pin.x} cy={pin.y} r="15" fill={c.hex} opacity="0.3" />
                  <circle cx={pin.x} cy={pin.y} r="9" fill={c.hex} stroke="#fffdf4" strokeWidth="3.5" />
                </motion.g>
              );
            }),
          )}
        </svg>

        {/* 点位缩略图预览 */}
        <AnimatePresence>
          {preview && (
            <motion.button
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={() => {
                setDetail(preview);
                setPreview(null);
              }}
              className="absolute bottom-4 left-1/2 w-40 -translate-x-1/2 rounded-xl bg-white p-2 pb-2.5 shadow-float"
            >
              <PhotoArt colorId={preview.colorId} seed={preview.seed} className="aspect-[4/3] w-full rounded-lg" />
              <p className="mt-1.5 truncate px-0.5 text-left font-round text-[11px] font-semibold text-[#3b3b3e]">
                {preview.title}
              </p>
              <p className="px-0.5 text-left text-[9px] font-medium text-[#9d9da2]">
                {preview.time} · 点击查看大图 →
              </p>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作 */}
      <div className="mt-3 flex gap-3">
        <Button
          type={merge ? 'primary' : 'default'}
          icon={<Layers size={14} />}
          block
          onClick={() => setMerge((v) => !v)}
        >
          {merge ? '合并轨迹：开' : '合并轨迹'}
        </Button>
        <Button
          icon={<Route size={14} />}
          block
          onClick={() => {
            setMerge(true);
            setDayIdx(0);
          }}
        >
          查看全部路线
        </Button>
      </div>

      {/* 全屏照片详情 */}
      <AnimatePresence>
        {detail && <PhotoDetail photo={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </div>
  );
}
