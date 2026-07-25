import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PenLine } from 'lucide-react';
import { Card, Button, Notification } from 'animal-island-ui';
import PhotoArt from '@/components/PhotoArt';
import { PHOTOS, type Photo } from '@/data/photos';
import { MOODS } from '@/data/friends';
import { getColor } from '@/data/colors';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const YEAR = 2026;
const MONTH = 7; // 7 月

export default function DiaryPage() {
  const [selectedDay, setSelectedDay] = useState(23);
  const [mood, setMood] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState<Record<number, { mood: number; text: string }>>({});

  /** 日历格子 */
  const cells = useMemo(() => {
    const first = new Date(YEAR, MONTH - 1, 1).getDay(); // 0=周日
    const offset = (first + 6) % 7; // 周一开头
    const days = new Date(YEAR, MONTH, 0).getDate();
    const arr: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) arr.push(d);
    return arr;
  }, []);

  /** 每天的照片 */
  const photosOfDay = (day: number): Photo[] =>
    PHOTOS.filter((p) => p.date === `07-${String(day).padStart(2, '0')}`);

  const dayPhotos = photosOfDay(selectedDay);
  const savedEntry = saved[selectedDay];

  const save = () => {
    if (mood === null && !text.trim()) {
      Notification.warning({ message: '记一笔心情或写点什么吧', position: 'top' });
      return;
    }
    setSaved((s) => ({ ...s, [selectedDay]: { mood: mood ?? 2, text } }));
    Notification.success({ message: '手帐已写好 📖', position: 'top' });
  };

  return (
    <div className="h-full overflow-y-auto px-5 pb-24 pt-2 no-scrollbar">
      {/* 月历 */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="font-round text-sm font-semibold">{YEAR} 年 {MONTH} 月</p>
          <span className="font-round text-[10px] font-medium opacity-60">本月 9 天有颜色足迹</span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-[10px] font-medium opacity-50">{w}</span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={`e${i}`} />;
            const dayPh = photosOfDay(day);
            const hasDiary = !!saved[day];
            const isSelected = day === selectedDay;
            return (
              <button key={day} onClick={() => { setSelectedDay(day); setMood(saved[day]?.mood ?? null); setText(saved[day]?.text ?? ''); }} className="flex flex-col items-center gap-1 py-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-round text-[12px] transition-colors ${
                    isSelected
                      ? 'bg-[#2e2e31] font-semibold text-white'
                      : dayPh.length > 0
                        ? 'font-semibold text-[#3b3b3e]'
                        : 'text-[#b4a88e]'
                  }`}
                >
                  {day}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {hasDiary ? (
                    <span className="text-[8px]">📖</span>
                  ) : (
                    dayPh.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: getColor(p.colorId).hex }}
                      />
                    ))
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 当日手帐 */}
      <AnimatePresence mode="wait">
        <motion.section
          key={selectedDay}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-4"
        >
          <Card>
            <div className="flex items-center justify-between">
              <p className="font-round text-sm font-semibold">
                {MONTH} 月 {selectedDay} 日 · 手帐
              </p>
              <PenLine size={14} className="opacity-50" />
            </div>

            {/* 当日照片 */}
            {dayPhotos.length > 0 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {dayPhotos.map((p) => (
                  <PhotoArt key={p.id} colorId={p.colorId} seed={p.seed} className="h-20 w-20 shrink-0 rounded-xl" />
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-white/60 px-3 py-3 text-center text-[11px] font-medium opacity-70">
                这一天还没有颜色足迹，去散散步吧 🐾
              </p>
            )}

            {/* 心情 */}
            <p className="mt-4 text-[11px] font-semibold opacity-70">那天的心情</p>
            <div className="mt-2 flex justify-between">
              {MOODS.map((m, i) => (
                <motion.button
                  key={m.label}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setMood(i)}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl px-1.5 py-1 transition-colors ${
                    mood === i ? 'bg-white/80 shadow-sm' : ''
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className={`text-[8px] font-medium ${mood === i ? 'font-semibold' : 'opacity-60'}`}>{m.label}</span>
                </motion.button>
              ))}
            </div>

            {/* 文字 */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="写几句今天的想法…比如：在天台看到了汽水一样的蓝。"
              rows={3}
              className="mt-4 w-full resize-none rounded-xl bg-white/70 p-3 text-[12px] font-medium leading-relaxed text-[#3b3b3e] outline-none placeholder:text-[#b4a88e]"
            />

            <div className="mt-3">
              <Button type="primary" block onClick={save}>
                {savedEntry ? '更新手帐' : '写好啦'}
              </Button>
            </div>
          </Card>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
