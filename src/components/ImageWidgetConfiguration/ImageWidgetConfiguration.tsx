import '@faclon-labs/design-sdk/styles.css';
import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabItem,
  Accordion,
  AccordionItem,
  ProductAccordionItem,
  TextInput,
  SelectInput,
  DropdownMenu,
  ActionListItem,
  Button,
  Switch,
  UploadCta,
} from '@faclon-labs/design-sdk';
import './ImageWidgetConfiguration.css';
import {
  ImageWidgetConfig,
  ImageCondition,
  ConditionOperator,
  ImageWidgetStyle,
  ImageWidgetSource,
} from '../../iosense-sdk/types';

interface ImageWidgetConfigurationProps {
  config: ImageWidgetConfig;
  authentication: string;
  onChange: (config: ImageWidgetConfig) => void;
}

// ── Operator options ──────────────────────────────────────────────────────────
const OPERATOR_OPTIONS: { label: string; value: ConditionOperator }[] = [
  { label: 'Greater than (>)',           value: '>'  },
  { label: 'Less than (<)',              value: '<'  },
  { label: 'Greater than or equal (≥)',  value: '>=' },
  { label: 'Less than or equal (≤)',     value: '<=' },
  { label: 'Equal to (=)',               value: '==' },
];

// ── Default config shape ──────────────────────────────────────────────────────
const DEFAULT_CONFIG: ImageWidgetConfig = {
  source: { customValue: '' },
  conditions: [],
  defaultImageUrl: '',
  defaultImageName: '',
  link: { url: '' },
  style: {
    wrapInCard: true,
    backgroundColor: '',
    borderColor: '',
    borderWidth: '',
    borderRadius: '',
    padding: '',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mergeConfig(incoming: ImageWidgetConfig | undefined): ImageWidgetConfig {
  if (!incoming) return DEFAULT_CONFIG;
  return {
    ...DEFAULT_CONFIG,
    ...incoming,
    source: { ...DEFAULT_CONFIG.source, ...incoming.source },
    conditions: incoming.conditions ?? [],
    link: { ...DEFAULT_CONFIG.link, ...incoming.link },
    style: { ...DEFAULT_CONFIG.style, ...incoming.style },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ImageWidgetConfiguration: React.FC<ImageWidgetConfigurationProps> = ({
  config,
  onChange,
}) => {
  const [cfg, setCfg] = useState<ImageWidgetConfig>(() => mergeConfig(config));
  const [activeTab, setActiveTab] = useState<'data' | 'link' | 'style'>('data');
  // Track which operator SelectInput dropdown is open (by condition id, or 'none')
  const [openOperatorId, setOpenOperatorId] = useState<string | null>(null);
  // Track which condition accordions are expanded
  const [expandedConditions, setExpandedConditions] = useState<Set<string>>(new Set());

  // Sync incoming config prop → local state (repatch on edit)
  useEffect(() => {
    setCfg(mergeConfig(config));
  }, [config]);

  // Emit updated config upstream
  const emit = (updated: ImageWidgetConfig) => {
    setCfg(updated);
    onChange(updated);
  };

  // ── Data source (expression) ─────────────────────────────────────────────
  const handleBindingsChange = ({ value }: { name: string; value: string }) => {
    emit({ ...cfg, source: { customValue: value } });
  };

  // ── Conditions ───────────────────────────────────────────────────────────
  const addCondition = () => {
    const newCondition: ImageCondition = {
      id: uid(),
      dataPointIndex: 0,
      operator: '>',
      value: '',
      imageUrl: '',
      imageName: '',
    };
    const updated = { ...cfg, conditions: [...cfg.conditions, newCondition] };
    setExpandedConditions((prev) => new Set([...prev, newCondition.id]));
    emit(updated);
  };

  const deleteCondition = (id: string) => {
    emit({ ...cfg, conditions: cfg.conditions.filter((c) => c.id !== id) });
    setExpandedConditions((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateCondition = (id: string, patch: Partial<ImageCondition>) => {
    emit({
      ...cfg,
      conditions: cfg.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const handleConditionImageUpload = async (id: string, files: FileList) => {
    const file = files[0];
    if (!file) return;
    const imageUrl = await readFileAsBase64(file);
    updateCondition(id, { imageUrl, imageName: file.name });
  };

  const handleDefaultImageUpload = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    const imageUrl = await readFileAsBase64(file);
    emit({ ...cfg, defaultImageUrl: imageUrl, defaultImageName: file.name });
  };

  const toggleConditionExpand = (id: string) => {
    setExpandedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOperatorSelect = (conditionId: string, operator: ConditionOperator) => {
    updateCondition(conditionId, { operator });
    setOpenOperatorId(null);
  };

  // ── Link ─────────────────────────────────────────────────────────────────
  const handleLinkChange = ({ value }: { name: string; value: string }) => {
    emit({ ...cfg, link: { url: value } });
  };

  // ── Style ─────────────────────────────────────────────────────────────────
  const handleStyleChange = (patch: Partial<ImageWidgetStyle>) => {
    emit({ ...cfg, style: { ...cfg.style, ...patch } });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const bindings = cfg.source?.customValue ?? '';

  return (
    <div className="iw-config">
      <Tabs variant="Bordered" isFullWidth>
        <TabItem
          label="Data"
          isSelected={activeTab === 'data'}
          onClick={() => setActiveTab('data')}
        />
        <TabItem
          label="Link"
          isSelected={activeTab === 'link'}
          onClick={() => setActiveTab('link')}
        />
        <TabItem
          label="Style"
          isSelected={activeTab === 'style'}
          onClick={() => setActiveTab('style')}
        />
      </Tabs>

      {/* ── Tab: Data ───────────────────────────────────────────────────────── */}
      {activeTab === 'data' && (
        <div className="iw-config__tab-content">
          <Accordion mode="multiple" defaultExpandedKeys={['data-source', 'conditions']}>

            {/* Data Source */}
            <AccordionItem title="Data Source" value="data-source">
              <div className="iw-config__accordion-body">
                <TextInput
                  label="Expression"
                  placeholder="Enter expression (e.g. {{sensor.temperature}})"
                  value={bindings}
                  onChange={handleBindingsChange}
                />
                <span className="BodyXSmallRegular iw-config__help-text">
                  The expression is resolved by the platform. The result is passed as data to the widget.
                </span>
              </div>
            </AccordionItem>

            {/* Image Conditions */}
            <AccordionItem title="Image Conditions" value="conditions">
              <div className="iw-config__accordion-body">

                {/* Default image */}
                <div className="iw-config__section-label">
                  <span className="BodySmallMedium">Default Image</span>
                  <span className="BodyXSmallRegular iw-config__help-text">
                    Shown when no condition matches
                  </span>
                </div>
                {cfg.defaultImageUrl ? (
                  <div className="iw-config__image-preview">
                    <img
                      className="iw-config__image-thumb"
                      src={cfg.defaultImageUrl}
                      alt="Default"
                    />
                    <span className="BodyXSmallRegular iw-config__image-name">
                      {cfg.defaultImageName || 'Default image'}
                    </span>
                    <Button
                      variant="Tertiary"
                      color="Negative"
                      size="XSmall"
                      label="Remove"
                      onClick={() => emit({ ...cfg, defaultImageUrl: '', defaultImageName: '' })}
                    />
                  </div>
                ) : (
                  <UploadCta
                    bodyText="Drag image here or"
                    linkText="Upload"
                    accept="image/*"
                    multiple={false}
                    onFilesSelect={handleDefaultImageUpload}
                  />
                )}

                <div className="iw-config__divider" />

                {/* Condition list */}
                {cfg.conditions.length > 0 && (
                  <div className="iw-config__conditions-list">
                    {cfg.conditions.map((condition, index) => (
                      <ProductAccordionItem
                        id={condition.id}
                        title={`Condition ${index + 1}`}
                        subtitle={
                          condition.operator && condition.value
                            ? `Data ${condition.operator} ${condition.value}`
                            : 'Not configured'
                        }
                        isExpanded={expandedConditions.has(condition.id)}
                        isActive
                        onToggle={() => toggleConditionExpand(condition.id)}
                        onClose={() => deleteCondition(condition.id)}
                      >
                        <div className="iw-config__condition-body">

                          {/* Data Point Index + Operator + Value row */}
                          <div className="iw-config__field-row">
                            <div className="iw-config__index-wrap">
                              <TextInput
                                label="Data Point"
                                type="number"
                                placeholder="0"
                                value={String(condition.dataPointIndex ?? 0)}
                                onChange={({ value }) => {
                                  const parsed = parseInt(value, 10);
                                  updateCondition(condition.id, {
                                    dataPointIndex: isNaN(parsed) || parsed < 0 ? 0 : parsed,
                                  });
                                }}
                                helpText="Index (0, 1, 2…)"
                              />
                            </div>

                            <div className="iw-config__operator-wrap">
                              <SelectInput
                                label="Operator"
                                value={
                                  OPERATOR_OPTIONS.find((o) => o.value === condition.operator)
                                    ?.label ?? ''
                                }
                                isOpen={openOperatorId === condition.id}
                                onClick={() =>
                                  setOpenOperatorId((prev) =>
                                    prev === condition.id ? null : condition.id
                                  )
                                }
                              >
                                <DropdownMenu>
                                  {OPERATOR_OPTIONS.map((op) => (
                                    <ActionListItem
                                      id={`op-${condition.id}-${op.value}`}
                                      contentType="Item"
                                      title={op.label}
                                      isSelected={condition.operator === op.value}
                                      onClick={() =>
                                        handleOperatorSelect(condition.id, op.value)
                                      }
                                    />
                                  ))}
                                </DropdownMenu>
                              </SelectInput>
                            </div>

                            <div className="iw-config__value-wrap">
                              <TextInput
                                label="Value"
                                type="number"
                                placeholder="e.g. 50"
                                value={condition.value}
                                onChange={({ value }) =>
                                  updateCondition(condition.id, { value })
                                }
                              />
                            </div>
                          </div>

                          {/* Image upload for this condition */}
                          <span className="BodySmallMedium">Condition Image</span>
                          {condition.imageUrl ? (
                            <div className="iw-config__image-preview">
                              <img
                                className="iw-config__image-thumb"
                                src={condition.imageUrl}
                                alt={`Condition ${index + 1}`}
                              />
                              <span className="BodyXSmallRegular iw-config__image-name">
                                {condition.imageName || 'Image'}
                              </span>
                              <Button
                                variant="Tertiary"
                                color="Negative"
                                size="XSmall"
                                label="Remove"
                                onClick={() =>
                                  updateCondition(condition.id, {
                                    imageUrl: '',
                                    imageName: '',
                                  })
                                }
                              />
                            </div>
                          ) : (
                            <UploadCta
                              bodyText="Drag image here or"
                              linkText="Upload"
                              accept="image/*"
                              multiple={false}
                              onFilesSelect={(files) =>
                                handleConditionImageUpload(condition.id, files)
                              }
                            />
                          )}
                        </div>
                      </ProductAccordionItem>
                    ))}
                  </div>
                )}

                {/* Add Condition button */}
                <div className="iw-config__add-row">
                  <Button
                    variant="Secondary"
                    color="Primary"
                    size="Small"
                    label="+ Add Condition"
                    onClick={addCondition}
                  />
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* ── Tab: Link ───────────────────────────────────────────────────────── */}
      {activeTab === 'link' && (
        <div className="iw-config__tab-content">
          <div className="iw-config__link-section">
            <TextInput
              label="Redirect URL"
              type="url"
              placeholder="https://example.com/page or /internal/path"
              value={cfg.link.url}
              onChange={handleLinkChange}
              showClearButton
              onClearButtonClicked={() =>
                emit({ ...cfg, link: { url: '' } })
              }
            />
            <span className="BodyXSmallRegular iw-config__help-text">
              If the URL has the same origin as this application, clicking the widget will navigate
              internally without a full page reload. External URLs open in a new tab.
            </span>
          </div>
        </div>
      )}

      {/* ── Tab: Style ──────────────────────────────────────────────────────── */}
      {activeTab === 'style' && (
        <div className="iw-config__tab-content">
          <Accordion mode="single" defaultExpandedKeys={['card-style']}>
            <AccordionItem title="Card Styling" value="card-style">
              <div className="iw-config__accordion-body">
                <Switch
                  label="Wrap in Card"
                  isChecked={cfg.style.wrapInCard}
                  onChange={({ checked }) =>
                    handleStyleChange({ wrapInCard: checked })
                  }
                />
                <TextInput
                  label="Background Color"
                  placeholder="e.g. #ffffff or rgba(255,255,255,1)"
                  value={cfg.style.backgroundColor}
                  onChange={({ value }) =>
                    handleStyleChange({ backgroundColor: value })
                  }
                />
                <TextInput
                  label="Border Color"
                  placeholder="e.g. #e0e0e0"
                  value={cfg.style.borderColor}
                  onChange={({ value }) =>
                    handleStyleChange({ borderColor: value })
                  }
                />
                <TextInput
                  label="Border Width (px)"
                  type="number"
                  placeholder="e.g. 1"
                  value={cfg.style.borderWidth}
                  onChange={({ value }) =>
                    handleStyleChange({ borderWidth: value })
                  }
                />
                <TextInput
                  label="Border Radius (px)"
                  type="number"
                  placeholder="e.g. 8"
                  value={cfg.style.borderRadius}
                  onChange={({ value }) =>
                    handleStyleChange({ borderRadius: value })
                  }
                />
                <TextInput
                  label="Padding (px)"
                  type="number"
                  placeholder="e.g. 12"
                  value={cfg.style.padding}
                  onChange={({ value }) =>
                    handleStyleChange({ padding: value })
                  }
                />
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
};
