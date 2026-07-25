import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sticker, Share2, Trash2, Plus, RotateCw, ZoomIn, Wand2, Check } from 'lucide-react';
import { Modal, Button, Notification } from 'animal-island-ui';
import PhotoArt from './PhotoArt';
import type { EnrichedPhoto } from '@/data/photos';
import { ANIMALS } from '@/data/animals';

interface StickerItem {
  key: number;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

type Template = 'none' | 'meta' | 'hex' | 'poem';
type Ratio = '1:1' | '3:4' | '4:3' | '9:16';

const TEMPLATES: { key: Template; label: string }[] = [
  { key: 'none', label: '无文案' },
  { key: 'meta', label: '时间地点' },
  { key: 'hex', label: '色号' },
  { key: 'poem', label: '诗句 / 自定义' },
];

const RATIOS: { key: Ratio; cls: string }[] = [
  { key: '1:1', cls: 'aspect-square' },
  { key: '3:4', cls: 'aspect-[3/4]' },
  { key: '4:3', cls: 'aspect-[4/3]' },
  { key: '9:16', cls: 'aspect-[9/16]' },
];

/** 全屏照片详情：贴纸 / 编辑 / 分享 / 删除 */
export default function PhotoDetail({
  photo,
  onClose,
}: {
  photo: EnrichedPhoto;
  onClose: () => void;
}) {
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [stickerPanel, setStickerPanel] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef(0);

  /* 编辑器 */
  const [editing, setEditing] = useState(false);
  const [template, setTemplate] = useState<Template>('meta');
  const [ratio, setRatio] = useState<Ratio>('3:4');
  const [poem, setPoem] = useState('把夏天折进信纸里。');
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);

  const unlockedAnimals = ANIMALS.filter((a) => a.unlocked);

  const addSticker = (emoji: string) => {
    keyRef.current += 1;
    const k = keyRef.current;
    setStickers((s) => [...s, { key: k, emoji, x: 0, y: 0, scale: 1, rotate: 0 }]);
    setSelected(k);
    setStickerPanel(false);
  };

  const patch = (key: number, p: Partial<StickerItem>) =>
    setStickers((s) => s.map((it) => (it.key === key ? { ...it, ...p } : it)));

  const doShare = (where: string) => {
    setShareOpen(false);
    Notification.success({ message: where, description: `${photo.title} · ${photo.color.name}`, position: 'top' });
  };

  const doDelete = () => {
    setDeleteOpen(false);
    Notification.success({ message: '已删除这张照片', position: 'top' });
    setTimeout(onClose, 400);
  };

  const caption =
    template === 'meta'
      ? `${photo.date.replace('-', '月')}日 ${photo.time} · ${photo.location}`
      : template === 'hex'
        ? `${photo.color.nameEn} ${photo.color.hex}`
        : template === 'poem'
          ? poem
          : '';

  const ratioCls = RATIOS.find((r) => r.key === ratio)!.cls;

  /* ---------- 编辑模式 ---------- */
  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex flex-col bg-[#f8f8f0]"
      >
        <div className="flex items-center justify-between px-5 pt-3">
          <p className="font-round text-lg font-semibold text-[#3b3b3e]">编辑照片</p>
          <button
            onClick={() => setEditing(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8e2ce] bg-[#fdfbf2] text-[#3b3b3e]/70"
          >
            <X size={16} />
          </button>
        </div>

        {/* 画框 */}
        <div className="flex flex-1 items-center justify-center px-8">
          <motion.div layout className="w-full max-w-[300px] rounded-md bg-white p-3 pb-4 shadow-float">
            <div ref={frameRef} className={`relative w-full overflow-hidden rounded-sm ${ratioCls}`}>
              <motion.div
                drag
                dragMomentum={false}
                dragConstraints={frameRef}
                dragElastic={0.1}
                onDragEnd={(_, info) => setImgPos((p) => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }))}
                style={{ x: imgPos.x, y: imgPos.y }}
                className="absolute -inset-8 cursor-grab active:cursor-grabbing"
              >
                <PhotoArt colorId={photo.colorId} seed={photo.seed} className="absolute inset-0" />
              </motion.div>
            </div>
            {caption && (
              <p className="mt-3 truncate px-1 text-center font-round text-[11px] font-medium text-[#6b6b70]">
                {caption}
              </p>
            )}
          </motion.div>
        </div>
        <p className="text-center text-[10px] font-medium text-[#b4a88e]">按住照片拖动，调整它在画框里的位置</p>

        {/* 编辑工具 */}
        <div className="px-5 pb-8 pt-3">
          <p className="text-[11px] font-semibold text-[#9d9da2]">文案模板</p>
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTemplate(t.key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 font-round text-[11px] font-semibold transition-colors ${
                  template === t.key ? 'bg-[#2e2e31] text-white' : 'border border-[#e8e2ce] bg-[#fdfbf2] text-[#3b3b3e]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {template === 'poem' && (
            <input
              value={poem}
              onChange={(e) => setPoem(e.target.value)}
              placeholder="写一句属于你的话…"
              className="mt-2 w-full rounded-full border border-[#e8e2ce] bg-[#fdfbf2] px-4 py-2 text-[12px] font-medium outline-none placeholder:text-[#b4a88e]"
            />
          )}

          <p className="mt-4 text-[11px] font-semibold text-[#9d9da2]">画框比例</p>
          <div className="mt-2 flex gap-2">
            {RATIOS.map((r) => (
              <button
                key={r.key}
                onClick={() => { setRatio(r.key); setImgPos({ x: 0, y: 0 }); }}
                className={`rounded-full px-3.5 py-1.5 font-round text-[11px] font-semibold transition-colors ${
                  ratio === r.key ? 'bg-[#2e2e31] text-white' : 'border border-[#e8e2ce] bg-[#fdfbf2] text-[#3b3b3e]'
                }`}
              >
                {r.key}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <Button
              type="primary"
              block
              icon={<Check size={14} />}
              onClick={() => {
                setEditing(false);
                Notification.success({ message: '已保存到作品集 🖼️', position: 'top' });
              }}
            >
              完成
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---------- 查看模式 ---------- */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col bg-[#f8f8f0]"
    >
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-5 pt-3">
        <div>
          <p className="font-round text-lg font-semibold text-[#3b3b3e]">{photo.color.name}</p>
          <p className="text-[11px] font-medium tracking-widest text-[#9d9da2]">{photo.color.hex}</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8e2ce] bg-[#fdfbf2] text-[#3b3b3e]/70"
        >
          <X size={16} />
        </button>
      </div>

      {/* 照片区（贴纸可拖拽） */}
      <div className="relative mx-5 mt-4 flex-1 overflow-hidden rounded-2xl" ref={areaRef}>
        <PhotoArt colorId={photo.colorId} seed={photo.seed} className="absolute inset-0" />
        {stickers.map((st) => (
          <motion.div
            key={st.key}
            drag
            dragMomentum={false}
            dragConstraints={areaRef}
            onTap={() => setSelected(st.key)}
            className="absolute left-1/2 top-1/3 cursor-grab active:cursor-grabbing"
            style={{ x: st.x, y: st.y }}
            onDragEnd={(_, info) => patch(st.key, { x: st.x + info.offset.x, y: st.y + info.offset.y })}
            animate={{ scale: st.scale, rotate: st.rotate }}
          >
            <span
              className="block text-5xl drop-shadow-md"
              style={selected === st.key ? { outline: '2px dashed #7c81d8', outlineOffset: 4, borderRadius: 12 } : undefined}
            >
              {st.emoji}
            </span>
          </motion.div>
        ))}

        {/* 贴纸编辑小工具条 */}
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow-float"
          >
            <button
              className="flex items-center gap-1 font-round text-[11px] font-semibold text-[#3b3b3e]"
              onClick={() => {
                const st = stickers.find((s) => s.key === selected);
                if (st) patch(selected, { scale: Math.min(2.2, st.scale + 0.2) });
              }}
            >
              <ZoomIn size={13} /> 放大
            </button>
            <span className="h-3 w-px bg-[#e8e2ce]" />
            <button
              className="flex items-center gap-1 font-round text-[11px] font-semibold text-[#3b3b3e]"
              onClick={() => {
                const st = stickers.find((s) => s.key === selected);
                if (st) patch(selected, { rotate: st.rotate + 30 });
              }}
            >
              <RotateCw size={13} /> 旋转
            </button>
            <span className="h-3 w-px bg-[#e8e2ce]" />
            <button
              className="flex items-center gap-1 font-round text-[11px] font-semibold text-[#d65f5f]"
              onClick={() => {
                setStickers((s) => s.filter((it) => it.key !== selected));
                setSelected(null);
              }}
            >
              <Trash2 size={13} /> 移除
            </button>
          </motion.div>
        )}
      </div>

      {/* 时间地点 */}
      <p className="mt-3 px-5 text-[12px] font-medium text-[#9d9da2]">
        📅 {photo.date.replace('-', '月')}日 {photo.time} · 📍 {photo.location}
      </p>

      {/* 底部操作栏 */}
      <div className="mt-3 grid grid-cols-4 gap-2 px-5 pb-8">
        <Button icon={<Sticker size={14} />} onClick={() => setStickerPanel((v) => !v)}>
          贴纸
        </Button>
        <Button icon={<Wand2 size={14} />} onClick={() => setEditing(true)}>
          编辑
        </Button>
        <Button icon={<Share2 size={14} />} onClick={() => setShareOpen(true)}>
          分享
        </Button>
        <Button icon={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)}>
          删除
        </Button>
      </div>

      {/* 贴纸选择面板：已解锁动物 */}
      <AnimatePresence>
        {stickerPanel && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="absolute bottom-24 left-4 right-4 z-10 rounded-2xl border border-[#e8e2ce] bg-[#fdfbf2] p-4 shadow-float"
          >
            <p className="font-round text-[12px] font-semibold text-[#3b3b3e]">选择一只已解锁的伙伴</p>
            <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
              {unlockedAnimals.map((a) => (
                <button key={a.id} onClick={() => addSticker(a.emoji)} className="flex shrink-0 flex-col items-center gap-1">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                    {a.emoji}
                  </span>
                  <span className="text-[9px] font-medium text-[#9d9da2]">{a.name.slice(-3)}</span>
                </button>
              ))}
              <span className="flex shrink-0 items-center text-[10px] font-medium text-[#b4a88e]">
                <Plus size={12} className="mr-1" /> 集齐更多颜色解锁新贴纸
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 分享选择 */}
      <Modal
        open={shareOpen}
        title="分享这张照片"
        typewriter={false}
        width={300}
        onClose={() => setShareOpen(false)}
        footer={
          <>
            <Button block onClick={() => doShare('已发布到社区 🌿')}>发布到社区</Button>
            <Button block onClick={() => doShare('已保存到本地相册')}>保存到本地</Button>
            <Button type="primary" block onClick={() => doShare('已分享到其他平台')}>分享到其他平台</Button>
          </>
        }
      >
        <p className="text-center text-[12px] font-medium opacity-75">想把「{photo.color.name}」带去哪里？</p>
      </Modal>

      {/* 删除二次确认 */}
      <Modal
        open={deleteOpen}
        title="确定删除吗？"
        typewriter={false}
        width={300}
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <Button onClick={() => setDeleteOpen(false)}>再想想</Button>
            <Button type="primary" onClick={doDelete}>确定删除</Button>
          </>
        }
      >
        <p className="text-center text-[12px] font-medium leading-relaxed opacity-75">
          「{photo.title}」删除后就不能恢复了哦。
        </p>
      </Modal>
    </motion.div>
  );
}
