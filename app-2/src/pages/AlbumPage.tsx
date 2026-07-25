import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tabs, Drawer } from 'animal-island-ui';
import PhotoCard from '@/components/PhotoCard';
import PhotoArt from '@/components/PhotoArt';
import PhotoDetail from '@/components/PhotoDetail';
import MapPanel from '@/components/MapPanel';
import { enrichedPhotos, type EnrichedPhoto } from '@/data/photos';
import { ANIMALS } from '@/data/animals';
import { getColor } from '@/data/colors';

const SCROLL_H = 'h-[calc(100dvh-210px)] sm:h-[630px]';

export default function AlbumPage() {
  const [selected, setSelected] = useState<EnrichedPhoto | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const groups = new Map<string, EnrichedPhoto[]>();
    for (const p of enrichedPhotos) {
      const key = p.date.replace('-', '.');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return [...groups.entries()];
  }, []);

  const photosOfColor = colorFilter ? enrichedPhotos.filter((p) => p.colorId === colorFilter) : [];

  return (
    <div className="flex h-full flex-col pb-24 pt-2">
      {/* Tabs 顶格居中，两边无留白 */}
      <div className="flex-1">
        <Tabs
          className="tabs-nowrap tabs-center"
          items={[
            {
              key: 'color',
              label: '按颜色',
              children: (
                <div className={`${SCROLL_H} overflow-y-auto no-scrollbar`}>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-5 px-2 pt-3">
                    {ANIMALS.map((a, i) => {
                      const c = getColor(a.colorId);
                      const count = enrichedPhotos.filter((p) => p.colorId === a.colorId).length;
                      return (
                        <motion.button
                          key={a.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.3 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => setColorFilter(a.colorId)}
                          className="flex flex-col items-center"
                        >
                          <span
                            className="flex h-20 w-20 items-center justify-center rounded-[26px] text-4xl shadow-book"
                            style={{ background: `linear-gradient(160deg, ${c.hex}55, ${c.soft})` }}
                          >
                            <motion.span
                              animate={{ y: [0, -3, 0] }}
                              transition={{ repeat: Infinity, duration: 2.8, delay: i * 0.2, ease: 'easeInOut' }}
                            >
                              {a.emoji}
                            </motion.span>
                          </span>
                          <p className="mt-2 font-round text-[11px] font-semibold text-[#3b3b3e]">{c.name}</p>
                          <p className="text-[9px] font-medium text-[#9d9da2]">
                            {a.name} · {count} 张
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ),
            },
            {
              key: 'date',
              label: '按日期',
              children: (
                <div className={`${SCROLL_H} space-y-5 overflow-y-auto px-2 no-scrollbar pt-3`}>
                  {/* 手机相册式：按日期分组 + 统一方格 */}
                  {byDate.map(([date, photos]) => (
                    <section key={date}>
                      <p className="px-1 font-round text-[13px] font-semibold text-[#3b3b3e]">{date}</p>
                      <div className="mt-2 grid grid-cols-4 gap-1.5">
                        {photos.map((p, i) => (
                          <motion.button
                            key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setSelected(p)}
                          >
                            <PhotoArt colorId={p.colorId} seed={p.seed} className="aspect-square w-full rounded-lg shadow-book" />
                          </motion.button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ),
            },
            {
              key: 'map',
              label: '地图',
              children: (
                <div className={`${SCROLL_H} px-2 pt-3`}>
                  <MapPanel />
                </div>
              ),
            },
            {
              key: 'gallery',
              label: '画廊',
              children: (
                <div className={`${SCROLL_H} overflow-y-auto px-2 no-scrollbar pt-3`}>
                  <div className="grid grid-cols-4 gap-2">
                    {enrichedPhotos.map((p, i) => (
                      <motion.button
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02, duration: 0.25 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setSelected(p)}
                        className="relative"
                      >
                        <PhotoArt colorId={p.colorId} seed={p.seed} className="aspect-square w-full rounded-lg shadow-book" />
                        <span className="absolute bottom-1 left-1.5 font-round text-[8px] font-semibold tracking-wide text-white/90 drop-shadow-sm">
                          {p.date.replace('-', '.')}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 某只动物（颜色）的照片列表 */}
      <Drawer
        open={colorFilter !== null}
        placement="bottom"
        height="70%"
        className="phone-drawer"
        title={colorFilter ? `${getColor(colorFilter).name} · ${ANIMALS.find((a) => a.colorId === colorFilter)?.name ?? ''}` : undefined}
        onClose={() => setColorFilter(null)}
      >
        <div className="grid grid-cols-3 gap-x-2 gap-y-6 pb-6">
          {photosOfColor.map((p, i) => (
            <PhotoCard
              key={p.id}
              photo={p}
              index={i}
              onClick={() => {
                setColorFilter(null);
                setSelected(p);
              }}
            />
          ))}
          {photosOfColor.length === 0 && (
            <p className="col-span-3 py-8 text-center text-[12px] font-medium opacity-60">
              这个颜色还没有照片，去拍一张吧 📷
            </p>
          )}
        </div>
      </Drawer>

      {/* 全屏照片详情 */}
      <AnimatePresence>
        {selected && <PhotoDetail photo={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
