interface ServicesPagePanelProps {
  formData: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function ServicesPagePanel({
  formData,
  updateFormValue,
  openImagePicker,
}: ServicesPagePanelProps) {
  const designItems = Array.isArray(formData?.designServices?.items)
    ? formData.designServices.items
    : [];
  const processSteps = Array.isArray(formData?.process?.steps)
    ? formData.process.steps
    : [];
  const specialties = Array.isArray(formData?.specialties?.items)
    ? formData.specialties.items
    : [];
  const capabilities = Array.isArray(formData?.constructionServices?.capabilities)
    ? formData.constructionServices.capabilities
    : [];

  const addDesignItem = () => {
    updateFormValue(['designServices', 'items'], [
      ...designItems,
      { title: '', titleCn: '', description: '', descriptionCn: '', image: '' },
    ]);
  };
  const removeDesignItem = (index: number) => {
    const next = [...designItems];
    next.splice(index, 1);
    updateFormValue(['designServices', 'items'], next);
  };

  const addProcessStep = () => {
    updateFormValue(['process', 'steps'], [
      ...processSteps,
      {
        number: processSteps.length + 1,
        title: '',
        titleCn: '',
        description: '',
        descriptionCn: '',
      },
    ]);
  };
  const removeProcessStep = (index: number) => {
    const next = [...processSteps];
    next.splice(index, 1);
    updateFormValue(['process', 'steps'], next);
  };

  const addSpecialtyItem = () => {
    updateFormValue(['specialties', 'items'], [
      ...specialties,
      { icon: '', label: '', labelCn: '' },
    ]);
  };
  const removeSpecialtyItem = (index: number) => {
    const next = [...specialties];
    next.splice(index, 1);
    updateFormValue(['specialties', 'items'], next);
  };

  const addCapability = () => {
    updateFormValue(['constructionServices', 'capabilities'], [
      ...capabilities,
      { label: '', labelCn: '' },
    ]);
  };
  const removeCapability = (index: number) => {
    const next = [...capabilities];
    next.splice(index, 1);
    updateFormValue(['constructionServices', 'capabilities'], next);
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase">Design Services</div>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Section Headline (EN)"
            value={formData?.designServices?.headline || ''}
            onChange={(event) => updateFormValue(['designServices', 'headline'], event.target.value)}
          />
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Section Headline (ZH)"
            value={formData?.designServices?.headlineCn || ''}
            onChange={(event) => updateFormValue(['designServices', 'headlineCn'], event.target.value)}
          />
        </div>
        <button type="button" onClick={addDesignItem} className="px-3 py-1 rounded-md border border-gray-200 text-xs">
          Add Design Service Item
        </button>
        {designItems.map((item: any, index: number) => (
          <div key={index} className="border border-gray-100 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Item {index + 1}</div>
              <button type="button" onClick={() => removeDesignItem(index)} className="text-xs text-red-600">
                Remove
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Title (EN)"
                value={item?.title || ''}
                onChange={(event) =>
                  updateFormValue(['designServices', 'items', String(index), 'title'], event.target.value)
                }
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Title (ZH)"
                value={item?.titleCn || ''}
                onChange={(event) =>
                  updateFormValue(['designServices', 'items', String(index), 'titleCn'], event.target.value)
                }
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <textarea
                className="w-full min-h-[72px] rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Description (EN)"
                value={item?.description || ''}
                onChange={(event) =>
                  updateFormValue(['designServices', 'items', String(index), 'description'], event.target.value)
                }
              />
              <textarea
                className="w-full min-h-[72px] rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Description (ZH)"
                value={item?.descriptionCn || ''}
                onChange={(event) =>
                  updateFormValue(['designServices', 'items', String(index), 'descriptionCn'], event.target.value)
                }
              />
            </div>
            <div className="flex gap-2">
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Image URL"
                value={item?.image || ''}
                onChange={(event) =>
                  updateFormValue(['designServices', 'items', String(index), 'image'], event.target.value)
                }
              />
              <button
                type="button"
                onClick={() => openImagePicker(['designServices', 'items', String(index), 'image'])}
                className="px-3 rounded-md border border-gray-200 text-xs"
              >
                Choose
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase">Construction Services</div>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Headline (EN)"
            value={formData?.constructionServices?.headline || ''}
            onChange={(event) => updateFormValue(['constructionServices', 'headline'], event.target.value)}
          />
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Headline (ZH)"
            value={formData?.constructionServices?.headlineCn || ''}
            onChange={(event) => updateFormValue(['constructionServices', 'headlineCn'], event.target.value)}
          />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <textarea
            className="w-full min-h-[72px] rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Body (EN)"
            value={formData?.constructionServices?.body || ''}
            onChange={(event) => updateFormValue(['constructionServices', 'body'], event.target.value)}
          />
          <textarea
            className="w-full min-h-[72px] rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Body (ZH)"
            value={formData?.constructionServices?.bodyCn || ''}
            onChange={(event) => updateFormValue(['constructionServices', 'bodyCn'], event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Image URL"
            value={formData?.constructionServices?.image || ''}
            onChange={(event) => updateFormValue(['constructionServices', 'image'], event.target.value)}
          />
          <button
            type="button"
            onClick={() => openImagePicker(['constructionServices', 'image'])}
            className="px-3 rounded-md border border-gray-200 text-xs"
          >
            Choose
          </button>
        </div>
        <button type="button" onClick={addCapability} className="px-3 py-1 rounded-md border border-gray-200 text-xs">
          Add Capability
        </button>
        {capabilities.map((cap: any, index: number) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] items-center">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Capability (EN)"
              value={cap?.label || ''}
              onChange={(event) =>
                updateFormValue(['constructionServices', 'capabilities', String(index), 'label'], event.target.value)
              }
            />
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Capability (ZH)"
              value={cap?.labelCn || ''}
              onChange={(event) =>
                updateFormValue(['constructionServices', 'capabilities', String(index), 'labelCn'], event.target.value)
              }
            />
            <button type="button" onClick={() => removeCapability(index)} className="text-xs text-red-600 px-2">
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase">Furnishing Services</div>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Headline (EN)"
            value={formData?.furnishingServices?.headline || ''}
            onChange={(event) => updateFormValue(['furnishingServices', 'headline'], event.target.value)}
          />
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Headline (ZH)"
            value={formData?.furnishingServices?.headlineCn || ''}
            onChange={(event) => updateFormValue(['furnishingServices', 'headlineCn'], event.target.value)}
          />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <textarea
            className="w-full min-h-[72px] rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Body (EN)"
            value={formData?.furnishingServices?.body || ''}
            onChange={(event) => updateFormValue(['furnishingServices', 'body'], event.target.value)}
          />
          <textarea
            className="w-full min-h-[72px] rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Body (ZH)"
            value={formData?.furnishingServices?.bodyCn || ''}
            onChange={(event) => updateFormValue(['furnishingServices', 'bodyCn'], event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Image URL"
            value={formData?.furnishingServices?.image || ''}
            onChange={(event) => updateFormValue(['furnishingServices', 'image'], event.target.value)}
          />
          <button
            type="button"
            onClick={() => openImagePicker(['furnishingServices', 'image'])}
            className="px-3 rounded-md border border-gray-200 text-xs"
          >
            Choose
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="CTA Label (EN)"
            value={formData?.furnishingServices?.ctaLabel || ''}
            onChange={(event) => updateFormValue(['furnishingServices', 'ctaLabel'], event.target.value)}
          />
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="CTA Label (ZH)"
            value={formData?.furnishingServices?.ctaLabelCn || ''}
            onChange={(event) => updateFormValue(['furnishingServices', 'ctaLabelCn'], event.target.value)}
          />
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="CTA Href"
            value={formData?.furnishingServices?.ctaHref || ''}
            onChange={(event) => updateFormValue(['furnishingServices', 'ctaHref'], event.target.value)}
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase">Process</div>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Process Headline (EN)"
            value={formData?.process?.headline || ''}
            onChange={(event) => updateFormValue(['process', 'headline'], event.target.value)}
          />
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Process Headline (ZH)"
            value={formData?.process?.headlineCn || ''}
            onChange={(event) => updateFormValue(['process', 'headlineCn'], event.target.value)}
          />
        </div>
        <button type="button" onClick={addProcessStep} className="px-3 py-1 rounded-md border border-gray-200 text-xs">
          Add Process Step
        </button>
        {processSteps.map((step: any, index: number) => (
          <div key={index} className="border border-gray-100 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Step {index + 1}</div>
              <button type="button" onClick={() => removeProcessStep(index)} className="text-xs text-red-600">
                Remove
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              <input
                type="number"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="No."
                value={step?.number ?? index + 1}
                onChange={(event) =>
                  updateFormValue(
                    ['process', 'steps', String(index), 'number'],
                    event.target.value === '' ? '' : Number(event.target.value)
                  )
                }
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Title (EN)"
                value={step?.title || ''}
                onChange={(event) =>
                  updateFormValue(['process', 'steps', String(index), 'title'], event.target.value)
                }
              />
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Title (ZH)"
                value={step?.titleCn || ''}
                onChange={(event) =>
                  updateFormValue(['process', 'steps', String(index), 'titleCn'], event.target.value)
                }
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <textarea
                className="w-full min-h-[60px] rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Description (EN)"
                value={step?.description || ''}
                onChange={(event) =>
                  updateFormValue(['process', 'steps', String(index), 'description'], event.target.value)
                }
              />
              <textarea
                className="w-full min-h-[60px] rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Description (ZH)"
                value={step?.descriptionCn || ''}
                onChange={(event) =>
                  updateFormValue(['process', 'steps', String(index), 'descriptionCn'], event.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase">Specialties</div>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Specialties Headline (EN)"
            value={formData?.specialties?.headline || ''}
            onChange={(event) => updateFormValue(['specialties', 'headline'], event.target.value)}
          />
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Specialties Headline (ZH)"
            value={formData?.specialties?.headlineCn || ''}
            onChange={(event) => updateFormValue(['specialties', 'headlineCn'], event.target.value)}
          />
        </div>
        <button type="button" onClick={addSpecialtyItem} className="px-3 py-1 rounded-md border border-gray-200 text-xs">
          Add Specialty
        </button>
        {specialties.map((item: any, index: number) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto] items-center">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Icon"
              value={item?.icon || ''}
              onChange={(event) =>
                updateFormValue(['specialties', 'items', String(index), 'icon'], event.target.value)
              }
            />
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Label (EN)"
              value={item?.label || ''}
              onChange={(event) =>
                updateFormValue(['specialties', 'items', String(index), 'label'], event.target.value)
              }
            />
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Label (ZH)"
              value={item?.labelCn || ''}
              onChange={(event) =>
                updateFormValue(['specialties', 'items', String(index), 'labelCn'], event.target.value)
              }
            />
            <button type="button" onClick={() => removeSpecialtyItem(index)} className="text-xs text-red-600 px-2">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
