interface CollectionItemPanelProps {
  formData: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
  addCollectionMoodImage: () => void;
  removeCollectionMoodImage: (index: number) => void;
}

export function CollectionItemPanel({
  formData,
  updateFormValue,
  openImagePicker,
  addCollectionMoodImage,
  removeCollectionMoodImage,
}: CollectionItemPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="text-xs font-semibold text-gray-500 uppercase">
        Collection
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Slug"
          value={formData.slug || ''}
          onChange={(event) => updateFormValue(['slug'], event.target.value)}
        />
        <div className="flex items-center gap-2 px-2">
          <input
            id="collection-featured"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={Boolean(formData.featured)}
            onChange={(event) => updateFormValue(['featured'], event.target.checked)}
          />
          <label htmlFor="collection-featured" className="text-sm text-gray-700">
            Featured
          </label>
        </div>
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

      <div className="space-y-2">
        <label className="block text-xs text-gray-500">Cover Image</label>
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
        {formData.coverImage && (
          <img
            src={formData.coverImage}
            alt={formData.title || 'Collection cover'}
            className="h-32 w-full rounded-md object-cover border border-gray-200"
          />
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <textarea
          className="w-full min-h-[90px] rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Description (EN)"
          value={formData.description || ''}
          onChange={(event) => updateFormValue(['description'], event.target.value)}
        />
        <textarea
          className="w-full min-h-[90px] rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Description (ZH)"
          value={formData.descriptionCn || ''}
          onChange={(event) => updateFormValue(['descriptionCn'], event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs text-gray-500">Mood Images</label>
          <button
            type="button"
            onClick={addCollectionMoodImage}
            className="px-2.5 py-1 rounded-md border border-gray-200 text-xs hover:bg-gray-50"
          >
            Add Mood Image
          </button>
        </div>
        <div className="space-y-3">
          {(Array.isArray(formData.moodImages) ? formData.moodImages : []).map(
            (image: string, index: number) => (
              <div
                key={`mood-image-${index}`}
                className="rounded-md border border-gray-200 p-3 space-y-2"
              >
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder={`Mood image URL #${index + 1}`}
                    value={image || ''}
                    onChange={(event) =>
                      updateFormValue(['moodImages', String(index)], event.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => openImagePicker(['moodImages', String(index)])}
                    className="px-3 rounded-md border border-gray-200 text-xs"
                  >
                    Choose
                  </button>
                </div>
                {image && (
                  <img
                    src={image}
                    alt={`Mood ${index + 1}`}
                    className="h-24 w-full rounded-md object-cover border border-gray-200"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeCollectionMoodImage(index)}
                  className="px-3 py-1.5 rounded-md border border-red-200 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            )
          )}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <textarea
          className="w-full min-h-[72px] rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Portfolio Project Slugs (one per line)"
          value={Array.isArray(formData.portfolioProjects) ? formData.portfolioProjects.join('\n') : ''}
          onChange={(event) =>
            updateFormValue(
              ['portfolioProjects'],
              event.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
        <textarea
          className="w-full min-h-[72px] rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Shop Product Slugs (one per line)"
          value={Array.isArray(formData.shopProducts) ? formData.shopProducts.join('\n') : ''}
          onChange={(event) =>
            updateFormValue(
              ['shopProducts'],
              event.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
      </div>
    </div>
  );
}
