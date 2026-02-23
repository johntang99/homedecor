interface ThemePanelProps {
  getPathValue: (path: string[]) => any;
  updateFormValue: (path: string[], value: any) => void;
}

export function ThemePanel({ getPathValue, updateFormValue }: ThemePanelProps) {
  const fontFamilyFields: Array<{
    key: 'display' | 'heading' | 'subheading' | 'body' | 'small';
    label: string;
    placeholder: string;
  }> = [
    {
      key: 'display',
      label: 'Display Title Font Family',
      placeholder: "'Playfair Display', Georgia, serif",
    },
    {
      key: 'heading',
      label: 'Heading Font Family',
      placeholder: "'Playfair Display', Georgia, serif",
    },
    {
      key: 'subheading',
      label: 'Subheading Font Family',
      placeholder: "'Playfair Display', Georgia, serif",
    },
    {
      key: 'body',
      label: 'Body/Description Font Family',
      placeholder:
        "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    {
      key: 'small',
      label: 'Small Text Font Family',
      placeholder:
        "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  ];

  const applyScreenshotFontPreset = () => {
    updateFormValue(['typography', 'fonts', 'display'], "'Playfair Display', Georgia, serif");
    updateFormValue(['typography', 'fonts', 'heading'], "'Playfair Display', Georgia, serif");
    updateFormValue(['typography', 'fonts', 'subheading'], "'Playfair Display', Georgia, serif");
    updateFormValue(
      ['typography', 'fonts', 'body'],
      "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    );
    updateFormValue(
      ['typography', 'fonts', 'small'],
      "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    );
  };

  const renderColorField = (label: string, path: string[]) => {
    const value = getPathValue(path);
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500">{label}</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={value || ''}
            onChange={(event) => updateFormValue(path, event.target.value)}
            placeholder="#000000"
          />
        </div>
        <input
          type="color"
          className="mt-6 h-10 w-10 rounded-md border border-gray-200"
          value={value || '#000000'}
          onChange={(event) => updateFormValue(path, event.target.value)}
          aria-label={`${label} color`}
        />
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-6">
      <div className="text-xs font-semibold text-gray-500 uppercase">
        Theme
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Typography Sizes
          </div>
          {(['display', 'heading', 'subheading', 'body', 'small'] as const).map(
            (key) => (
              <div key={`type-${key}`}>
                <label className="block text-xs text-gray-500">
                  {key}
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={String(getPathValue(['typography', key]) || '')}
                  onChange={(event) =>
                    updateFormValue(['typography', key], event.target.value)
                  }
                  placeholder="e.g. 2rem"
                />
              </div>
            )
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-gray-500 uppercase">
              Font Families
            </div>
            <button
              type="button"
              onClick={applyScreenshotFontPreset}
              className="rounded-md border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Apply Screenshot Preset
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Controls `theme.typography.fonts.*` used by the site.
          </p>
          {fontFamilyFields.map(({ key, label, placeholder }) => (
            <div key={`font-${key}`}>
              <label className="block text-xs text-gray-500">
                {label}
              </label>
              <input
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={String(getPathValue(['typography', 'fonts', key]) || '')}
                onChange={(event) =>
                  updateFormValue(['typography', 'fonts', key], event.target.value)
                }
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Primary Colors
          </div>
          {renderColorField('Primary', ['colors', 'primary', 'DEFAULT'])}
          {renderColorField('Primary Dark', ['colors', 'primary', 'dark'])}
          {renderColorField('Primary Light', ['colors', 'primary', 'light'])}
          {renderColorField('Primary 50', ['colors', 'primary', '50'])}
          {renderColorField('Primary 100', ['colors', 'primary', '100'])}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Secondary Colors
          </div>
          {renderColorField('Secondary', ['colors', 'secondary', 'DEFAULT'])}
          {renderColorField('Secondary Dark', ['colors', 'secondary', 'dark'])}
          {renderColorField('Secondary Light', ['colors', 'secondary', 'light'])}
          {renderColorField('Secondary 50', ['colors', 'secondary', '50'])}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Backdrop Colors
          </div>
          {renderColorField('Backdrop Primary', ['colors', 'backdrop', 'primary'])}
          {renderColorField('Backdrop Secondary', ['colors', 'backdrop', 'secondary'])}
        </div>
      </div>
    </div>
  );
}
