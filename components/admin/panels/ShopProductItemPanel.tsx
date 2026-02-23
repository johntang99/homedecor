interface SelectOption {
  value: string;
  label: string;
  labelCn?: string;
}

interface ShopProductItemPanelProps {
  formData: Record<string, any>;
  locale: string;
  shopCategoryOptions: SelectOption[];
  shopRoomOptions: SelectOption[];
  updateFormValue: (path: string[], value: any) => void;
}

export function ShopProductItemPanel({
  formData,
  locale,
  shopCategoryOptions,
  shopRoomOptions,
  updateFormValue,
}: ShopProductItemPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="text-xs font-semibold text-gray-500 uppercase">
        Shop Product
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
            !shopCategoryOptions.some((item) => item.value === formData.category) && (
              <option value={formData.category}>{formData.category}</option>
            )}
          {shopCategoryOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {locale === 'zh' ? item.labelCn || item.label : item.label}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={formData.room || ''}
          onChange={(event) => updateFormValue(['room'], event.target.value)}
        >
          <option value="">Select room</option>
          {formData.room && !shopRoomOptions.some((item) => item.value === formData.room) && (
            <option value={formData.room}>{formData.room}</option>
          )}
          {shopRoomOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {locale === 'zh' ? item.labelCn || item.label : item.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Price"
          value={formData.price ?? ''}
          onChange={(event) =>
            updateFormValue(
              ['price'],
              event.target.value === '' ? '' : Number(event.target.value)
            )
          }
        />

        <select
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={formData.status || 'available'}
          onChange={(event) => updateFormValue(['status'], event.target.value)}
        >
          <option value="available">available</option>
          <option value="sold-out">sold-out</option>
          <option value="coming-soon">coming-soon</option>
        </select>
      </div>
    </div>
  );
}
