import { motion } from 'framer-motion';
import type { EnrichedPhoto } from '@/data/photos';
import PhotoArt from './PhotoArt';

/** 色彩小书：by color 模式的大色块卡 */
export default function PhotoCard({
  photo,
  index = 0,
  onClick,
}: {
  photo: EnrichedPhoto;
  index?: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="text-left"
    >
      <PhotoArt
        colorId={photo.colorId}
        seed={photo.seed}
        className="aspect-[3/4] w-full rounded-md shadow-book"
      />
      <p className="mt-2 font-round text-[13px] font-semibold text-accent">{photo.color.nameEn}</p>
      <p className="mt-0.5 text-[11px] font-medium text-fog">{photo.date.replace('-', '.')}</p>
    </motion.button>
  );
}
