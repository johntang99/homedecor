interface SelectOption {
  value: string;
  label: string;
  labelCn?: string;
}

interface PortfolioItemPanelProps {
  formData: Record<string, any>;
  locale: string;
  portfolioCategoryOptions: SelectOption[];
  portfolioStyleOptions: SelectOption[];
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
  addPortfolioGalleryItem: () => void;
  removePortfolioGalleryItem: (index: number) => void;
}

export function PortfolioItemPanel({
  formData,
  locale,
  portfolioCategoryOptions,
  portfolioStyleOptions,
  updateFormValue,
  openImagePicker,
  addPortfolioGalleryItem,
  removePortfolioGalleryItem,
}: PortfolioItemPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="text-xs font-semibold text-gray-500 uppercase">
        Portfolio Project
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Title"
          value={formData.title || ''}
          onChange={(event) => updateFormValue(['title'], event.target.value)}
        />
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Title (Chinese)"
          value={formData.titleCn || ''}
          onChange={(event) => updateFormValue(['titleCn'], event.target.value)}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <select
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={formData.category || ''}
          onChange={(event) => updateFormValue(['category'], event.target.value)}
        >
          <option value="">Select category</option>
          {formData.category &&
            !portfolioCategoryOptions.some((item) => item.value === formData.category) && (
              <option value={formData.category}>{formData.category}</option>
            )}
          {portfolioCategoryOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {locale === 'zh' ? item.labelCn || item.label : item.label}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={formData.style || ''}
          onChange={(event) => updateFormValue(['style'], event.target.value)}
        >
          <option value="">Select style</option>
          {formData.style &&
            !portfolioStyleOptions.some((item) => item.value === formData.style) && (
              <option value={formData.style}>{formData.style}</option>
            )}
          {portfolioStyleOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {locale === 'zh' ? item.labelCn || item.label : item.label}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Location"
          value={formData.location || ''}
          onChange={(event) => updateFormValue(['location'], event.target.value)}
        />
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Year"
          value={formData.year || ''}
          onChange={(event) => updateFormValue(['year'], event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-gray-500">Hero / Cover Image</label>
        <div className="flex gap-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Cover image URL"
            value={formData.coverImage || ''}
            onChange={(event) => updateFormValue(['coverImage'], event.target.value)}
          />
          <button
            type="button"
            onClick={() => openImagePicker(['coverImage'])}
            className="px-3 rounded-md border border-gray-200 text-xs"
          >
            Choose
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-gray-500">Overview (EN)</label>
        <textarea
          className="w-full min-h-[90px] rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={formData.overview?.body || ''}
          onChange={(event) => updateFormValue(['overview', 'body'], event.target.value)}
        />
        <label className="block text-xs text-gray-500">Overview (ZH)</label>
        <textarea
          className="w-full min-h-[90px] rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={formData.overview?.bodyCn || ''}
          onChange={(event) => updateFormValue(['overview', 'bodyCn'], event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase">Gallery Images</span>
          <button
            type="button"
            onClick={addPortfolioGalleryItem}
            className="px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
          >
            Add Image
          </button>
        </div>

        {(Array.isArray(formData.gallery) ? formData.gallery : []).map(
          (item: any, index: number) => (
            <div key={index} className="rounded-md border border-gray-200 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Image URL"
                  value={item?.image || ''}
                  onChange={(event) =>
                    updateFormValue(['gallery', String(index), 'image'], event.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => openImagePicker(['gallery', String(index), 'image'])}
                  className="px-3 rounded-md border border-gray-200 text-xs"
                >
                  Choose
                </button>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Alt (EN)"
                  value={item?.alt || ''}
                  onChange={(event) =>
                    updateFormValue(['gallery', String(index), 'alt'], event.target.value)
                  }
                />
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Alt (ZH)"
                  value={item?.altCn || ''}
                  onChange={(event) =>
                    updateFormValue(['gallery', String(index), 'altCn'], event.target.value)
                  }
                />
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={item?.layout || 'full'}
                  onChange={(event) =>
                    updateFormValue(['gallery', String(index), 'layout'], event.target.value)
                  }
                >
                  <option value="full">Full Width</option>
                  <option value="half">Half Width</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => removePortfolioGalleryItem(index)}
                  className="px-3 py-1.5 rounded-md border border-red-200 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
