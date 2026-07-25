import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, SwitchCamera, Check, RotateCcw, RefreshCw } from 'lucide-react';
import { Button, Notification } from 'animal-island-ui';
import PhotoArt from '@/components/PhotoArt';
import { TARGET_COLORS, COLORS } from '@/data/colors';

const ZOOMS = ['0.5x', '1x', '2x'];
type ShootMode = 'single' | 'multi';

export default function CameraPage() {
  const [mode, setMode] = useState<ShootMode | null>(null); // 开拍前询问
  const [targetIdx, setTargetIdx] = useState(0);
  const [shotCount, setShotCount] = useState(0); // 单色模式：已拍张数
  const [collected, setCollected] = useState<string[]>([]); // 多色模式：已收集颜色
  const [flash, setFlash] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [captured, setCaptured] = useState<string | null>(null); // 识别到的颜色 id

  const color = TARGET_COLORS[targetIdx];
  const capturedColor = captured ? COLORS.find((c) => c.id === captured)! : null;

  const shoot = () => {
    // Mock 识别：单色模式识别为目标色；多色模式从 12 色里随机
    const recognized =
      mode === 'single'
        ? color.id
        : COLORS[Math.floor(Math.random() * COLORS.length)].id;
    setCaptured(recognized);
  };

  const keep = () => {
    if (!capturedColor) return;
    if (mode === 'single') {
      setShotCount((n) => n + 1);
    } else {
      setCollected((list) => (list.includes(capturedColor.id) ? list : [...list, capturedColor.id]));
      // 多色模式：收藏后自动换下一目标色
      setTargetIdx((i) => (i + 1) % TARGET_COLORS.length);
    }
    setCaptured(null);
    Notification.success({
      message: '已收藏到色彩日记',
      description: `${capturedColor.name} ${capturedColor.hex}`,
      position: 'top',
    });
  };

  const counterText =
    mode === 'single' ? `已拍：${shotCount} 张` : `已收集：${collected.length} 色`;

  return (
    <div className="flex h-full flex-col pb-24 pt-2">
      {/* 顶部：今日颜色 + 计数 */}
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border border-black/5" style={{ background: color.hex }} />
          <span className="font-round text-[13px] font-semibold text-[#3b3b3e]">
            今天的颜色：{mode === 'single' ? color.name : '任意'}
          </span>
          <button
            onClick={() => setTargetIdx((i) => (i + 1) % TARGET_COLORS.length)}
            className="flex items-center gap-0.5 font-round text-[12px] font-medium text-[#7c81d8]"
          >
            <RefreshCw size={11} />
            换一色
          </button>
        </div>
        <span className="font-round text-[12px] font-semibold text-[#9d9da2]">{counterText}</span>
      </div>

      {/* 取景器：全宽无留白 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mt-3 flex-1 overflow-hidden"
        style={{ background: `linear-gradient(170deg, #f4f4f2 0%, ${color.soft} 160%)` }}
      >
        {/* 虚线网格 */}
        <div className="absolute inset-0">
          <div className="absolute left-1/3 top-0 h-full w-px border-l border-dashed border-[#dcdcd9]" />
          <div className="absolute left-2/3 top-0 h-full w-px border-l border-dashed border-[#dcdcd9]" />
          <div className="absolute top-1/3 left-0 w-full border-t border-dashed border-[#dcdcd9]" />
          <div className="absolute top-2/3 left-0 w-full border-t border-dashed border-[#dcdcd9]" />
        </div>

        {/* 顶部参数 */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-5 pt-4">
          <span className="font-round text-[13px] font-medium tracking-wide text-[#3b3b3e]/70">
            iso 100 / f 1.8
          </span>
          <span className="flex items-center gap-1.5">
            <motion.span
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="h-2 w-2 rounded-full bg-[#dba9a3]"
            />
            <span className="font-round text-[13px] font-medium tracking-wide text-[#3b3b3e]/70">live</span>
          </span>
        </div>

        {/* 焦距 */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-5 rounded-full border border-[#e8e2ce] bg-[#fdfbf2] px-6 py-2">
          {ZOOMS.map((z, i) => (
            <button
              key={z}
              onClick={() => setZoom(i)}
              className={`font-round text-[13px] tracking-wide transition-colors ${
                zoom === i ? 'font-semibold text-[#3b3b3e]' : 'font-medium text-[#9d9da2]'
              }`}
            >
              {z}
            </button>
          ))}
        </div>

        {/* 闪光动画 */}
        <AnimatePresence>
          {captured && (
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="pointer-events-none absolute inset-0 bg-white"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* 快门行：颜色跟随目标色 */}
      <div className="mt-4 flex items-center justify-center gap-14">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setFlash((f) => !f)}
          className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors"
          style={{
            borderColor: `${color.hex}`,
            background: flash ? color.hex : color.soft,
            color: flash ? '#fff' : '#3b3b3e',
          }}
          aria-label="闪光灯"
        >
          <Zap size={17} strokeWidth={1.6} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={shoot}
          className="flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 p-1.5"
          style={{ borderColor: color.hex }}
          aria-label="拍摄"
        >
          <motion.span
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="h-full w-full rounded-full"
            style={{ background: color.hex }}
          />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85, rotate: 180 }}
          className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors"
          style={{ borderColor: color.hex, background: color.soft, color: '#3b3b3e' }}
          aria-label="翻转镜头"
        >
          <SwitchCamera size={17} strokeWidth={1.6} />
        </motion.button>
      </div>

      {/* 开拍前：选择拍摄模式（自制圆角卡片，文字完整展示） */}
      <AnimatePresence>
        {mode === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#3b3b3e]/25 px-8 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="w-full max-w-[320px] rounded-[24px] bg-[#fdfbf2] p-6 shadow-float"
            >
              <p className="text-center font-round text-lg font-bold text-[#3b3b3e]">今天想怎么拍？</p>
              <p className="mt-3 text-center text-[13px] font-medium leading-relaxed text-[#6b6b70]">
                专注捕捉「{color.name}」，
                <br />
                还是把 12 种颜色都收进口袋？
              </p>
              <div className="mt-5 space-y-3">
                <Button block onClick={() => setMode('single')}>
                  🎯 一个颜色拍多张
                </Button>
                <Button type="primary" block onClick={() => setMode('multi')}>
                  🌈 收集不同颜色
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 拍立得弹层（居中对齐） */}
      <AnimatePresence>
        {capturedColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#3b3b3e]/25 backdrop-blur-[2px]"
          >
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.5, y: 80, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, y: 0, opacity: 1, rotate: -2 }}
                exit={{ scale: 0.7, y: 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 19 }}
                className="w-64 rounded-md bg-white p-3 pb-5 shadow-float"
              >
                <PhotoArt colorId={capturedColor.id} seed={66} className="aspect-square w-full rounded-sm" />
                <div className="mt-4 flex items-end justify-between px-1">
                  <div>
                    <p className="font-round text-lg font-semibold text-[#7c81d8]">{capturedColor.nameEn}</p>
                    <p className="mt-0.5 text-[11px] font-medium tracking-widest text-[#9d9da2]">
                      {capturedColor.name} · {capturedColor.hex}
                    </p>
                  </div>
                  <span
                    className="h-5 w-5 rounded-full border border-black/5"
                    style={{ background: capturedColor.hex }}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-7 flex items-center gap-3"
              >
                <Button icon={<RotateCcw size={13} />} onClick={() => setCaptured(null)}>
                  重新拍摄
                </Button>
                <Button type="primary" icon={<Check size={13} />} onClick={keep}>
                  收藏这一色
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
