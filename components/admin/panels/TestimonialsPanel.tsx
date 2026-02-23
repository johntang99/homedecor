interface TestimonialItem {
  id?: string;
  quote?: string;
  quoteCn?: string;
  author?: string;
  authorCn?: string;
  title?: string;
  titleCn?: string;
  category?: string;
  projectSlug?: string;
  rating?: number;
  featured?: boolean;
  date?: string;
}

interface TestimonialsPanelProps {
  items: TestimonialItem[];
  locale: string;
  categoryOptions: Array<{ value: string; label: string; labelCn?: string }>;
  updateFormValue: (path: string[], value: any) => void;
  addTestimonialItem: () => void;
  removeTestimonialItem: (index: number) => void;
}

export function TestimonialsPanel({
  items,
  locale,
  categoryOptions,
  updateFormValue,
  addTestimonialItem,
  removeTestimonialItem,
}: TestimonialsPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-gray-500 uppercase">
          Client Testimonials
        </div>
        <button
          type="button"
          onClick={addTestimonialItem}
          className="px-3 py-1 rounded-md border border-gray-200 text-xs"
        >
          Add Testimonial
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id || index} className="border border-gray-100 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-500">
                Testimonial {index + 1}
              </div>
              <button
                type="button"
                onClick={() => removeTestimonialItem(index)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <textarea
                className="w-full min-h-[90px] rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Quote (EN)"
                value={item.quote || ''}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'quote'], event.target.value)
                }
              />
              <textarea
                className="w-full min-h-[90px] rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Quote (ZH)"
                value={item.quoteCn || ''}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'quoteCn'], event.target.value)
                }
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Author (EN)"
                value={item.author || ''}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'author'], event.target.value)
                }
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Author (ZH)"
                value={item.authorCn || ''}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'authorCn'], event.target.value)
                }
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Title (EN)"
                value={item.title || ''}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'title'], event.target.value)
                }
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Title (ZH)"
                value={item.titleCn || ''}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'titleCn'], event.target.value)
                }
              />
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={item.category || ''}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'category'], event.target.value)
                }
              >
                <option value="">Select category</option>
                {item.category &&
                  !categoryOptions.some((option) => option.value === item.category) && (
                    <option value={item.category}>{item.category}</option>
                  )}
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {locale === 'zh' ? option.labelCn || option.label : option.label}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Project Slug (optional)"
                value={item.projectSlug || ''}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'projectSlug'], event.target.value)
                }
              />
              <input
                type="number"
                min={0}
                max={5}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Rating (0-5)"
                value={item.rating ?? 5}
                onChange={(event) =>
                  updateFormValue(
                    ['items', String(index), 'rating'],
                    event.target.value === '' ? '' : Number(event.target.value)
                  )
                }
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Date (YYYY-MM)"
                value={item.date || ''}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'date'], event.target.value)
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={Boolean(item.featured)}
                onChange={(event) =>
                  updateFormValue(['items', String(index), 'featured'], event.target.checked)
                }
              />
              Featured testimonial
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
