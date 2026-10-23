import { useEffect, useRef, useState } from 'react'
import { resolveUploadUrl } from '../../services/apiClient'
import type { ReviewImageResponse } from '../../services/reviewService.types'
import './Reviews.css'

export default function ReviewImages({ images = [] }: { images?: ReviewImageResponse[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (selected !== null && dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [selected])
  if (images.length === 0) return null
  const change = (direction: number) => setSelected((index) => index === null ? null : (index + direction + images.length) % images.length)
  return <>
    <div className="review-photos" aria-label="Ảnh đính kèm đánh giá">
      {images.map((image, index) => <button key={image.id} type="button" onClick={() => setSelected(index)} aria-label={`Xem ảnh đánh giá ${index + 1}`}>
        <img src={resolveUploadUrl(image.filePath)} alt={`Ảnh đánh giá ${index + 1}`} loading="lazy" />
      </button>)}
    </div>
    {selected !== null ? <dialog ref={dialog} className="review-lightbox" aria-label="Xem ảnh đánh giá"
      onClose={() => setSelected(null)} onCancel={() => setSelected(null)}
      onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close() }}
      onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1) } if (event.key === 'ArrowRight') { event.preventDefault(); change(1) } }}>
      <div className="review-lightbox-content">
        <button className="review-lightbox-close" type="button" onClick={() => dialog.current?.close()} aria-label="Đóng ảnh">×</button>
        <img src={resolveUploadUrl(images[selected].filePath)} alt={`Ảnh đánh giá ${selected + 1}`} />
        <div className="review-lightbox-controls">
          <button type="button" disabled={images.length < 2} onClick={() => change(-1)} aria-label="Ảnh đánh giá trước">‹</button>
          <span aria-live="polite">{selected + 1} / {images.length}</span>
          <button type="button" disabled={images.length < 2} onClick={() => change(1)} aria-label="Ảnh đánh giá tiếp theo">›</button>
        </div>
      </div>
    </dialog> : null}
  </>
}
