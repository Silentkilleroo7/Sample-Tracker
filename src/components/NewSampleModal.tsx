import React, { useState, useEffect } from 'react';
import { FabricItem } from '../types/fabric';
import {
  SampleItem,
  SamplePriority,
  SampleType,
  PRESET_STYLE_IMAGES,
} from '../types/sample';
import {
  X,
  Plus,
  AlertTriangle,
  Layers,
  Database,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Lock,
  Edit3,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import {
  RequisitionOptions,
  loadRequisitionOptions,
  saveRequisitionOptions,
  syncRequisitionOptionsFromCloud,
} from '../types/requisitionOptions';
import { uploadStylePhoto } from '../lib/supabase';

interface NewSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  fabrics: FabricItem[];
  onCreateSample: (sampleData: Partial<SampleItem>, deductYards: boolean) => void;
  onOpenAddFabric?: () => void;
}

export const NewSampleModal: React.FC<NewSampleModalProps> = ({
  isOpen,
  onClose,
  fabrics,
  onCreateSample,
  onOpenAddFabric,
}) => {
  // Load persistent database options
  const [options, setOptions] = useState<RequisitionOptions>(loadRequisitionOptions);

  // Field values
  const [styleCode, setStyleCode] = useState('');
  const [styleName, setStyleName] = useState('');
  const [buyer, setBuyer] = useState(options.buyers[0] || 'Levi Strauss & Co.');
  const [poNumber, setPoNumber] = useState('');
  const [lineCode, setLineCode] = useState(options.lineCodes[0]?.code || 'LINE-A01');
  const [sampleType, setSampleType] = useState<SampleType>('Red Seal Sample');
  const [color, setColor] = useState(options.colors[0] || 'Vintage Indigo');
  const [size, setSize] = useState(options.sizes[2] || 'M');
  const [quantity, setQuantity] = useState(1);
  const [selectedFabricId, setSelectedFabricId] = useState(fabrics[0]?.id || '');
  const [customFabricCode, setCustomFabricCode] = useState('');
  const [customFabricName, setCustomFabricName] = useState('');
  const [requiredYards, setRequiredYards] = useState(3.0);
  const [priority, setPriority] = useState<SamplePriority>('normal');
  const [targetParcelDate, setTargetParcelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [shipmentDate, setShipmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [washType, setWashType] = useState(options.washTypes[0] || 'Bio-Enzyme Stone Wash');
  const [courier, setCourier] = useState(options.couriers[0] || 'DHL Express Worldwide');
  const [autoDeduct, setAutoDeduct] = useState(true);
  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);

  // Style Picture state
  const [thumbnail, setThumbnail] = useState<string>(PRESET_STYLE_IMAGES[1].url);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      syncRequisitionOptionsFromCloud().then((synced) => {
        setOptions(synced);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (fabrics.length > 0 && (!selectedFabricId || !fabrics.some((f) => f.id === selectedFabricId))) {
      setSelectedFabricId(fabrics[0].id);
    }
  }, [fabrics, selectedFabricId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await uploadStylePhoto(files[i], {
          styleCode: styleCode.trim() || 'STYLE_UPLOAD',
        });
        if (res.url) urls.push(res.url);
      }
      if (urls.length > 0) {
        setThumbnail(urls[0]);
        setUploadedImages((prev) => Array.from(new Set([...urls, ...prev])));
        setSaveToast(`Uploaded ${urls.length} product photo${urls.length > 1 ? 's' : ''} to storage!`);
      }
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Inline "Add New Option" Drawer States
  const [addingField, setAddingField] = useState<
    'buyer' | 'line' | 'sampleType' | 'color' | 'size' | 'wash' | 'courier' | null
  >(null);

  // Input states for new options
  const [newBuyer, setNewBuyer] = useState('');
  const [newLineCode, setNewLineCode] = useState('');
  const [newLineDesc, setNewLineDesc] = useState('');
  const [newSampleType, setNewSampleType] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newWash, setNewWash] = useState('');
  const [newCourier, setNewCourier] = useState('');

  // Notification / confirmation feedback
  const [saveToast, setSaveToast] = useState<string | null>(null);

  useEffect(() => {
    if (saveToast) {
      const t = setTimeout(() => setSaveToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [saveToast]);

  if (!isOpen) return null;

  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId);
  const willTriggerLowStock =
    selectedFabric && selectedFabric.availableYards - requiredYards <= 5;

  const triggerSaveNotification = (msg: string) => {
    setSaveToast(msg);
  };

  const handleSaveNewBuyer = () => {
    const trimmed = newBuyer.trim();
    if (!trimmed) return;
    if (!options.buyers.includes(trimmed)) {
      const updated = { ...options, buyers: [...options.buyers, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Buyer "${trimmed}" saved to database for future requisitions!`);
    }
    setBuyer(trimmed);
    setNewBuyer('');
    setAddingField(null);
  };

  const handleSaveNewLine = () => {
    const code = newLineCode.trim().toUpperCase();
    if (!code) return;
    const desc = newLineDesc.trim();
    const label = desc ? `${code} (${desc})` : code;
    const exists = options.lineCodes.some((c) => c.code === code);
    if (!exists) {
      const updated = {
        ...options,
        lineCodes: [...options.lineCodes, { code, label }],
      };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Line "${code}" saved to database for future requisitions!`);
    }
    setLineCode(code);
    setNewLineCode('');
    setNewLineDesc('');
    setAddingField(null);
  };

  const handleSaveNewSampleType = () => {
    const trimmed = newSampleType.trim();
    if (!trimmed) return;
    if (!options.sampleTypes.includes(trimmed)) {
      const updated = { ...options, sampleTypes: [...options.sampleTypes, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Sample Type "${trimmed}" saved to database for future requisitions!`);
    }
    setSampleType(trimmed as SampleType);
    setNewSampleType('');
    setAddingField(null);
  };

  const handleSaveNewColor = () => {
    const trimmed = newColor.trim();
    if (!trimmed) return;
    if (!options.colors.includes(trimmed)) {
      const updated = { ...options, colors: [...options.colors, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Color "${trimmed}" saved to database for future requisitions!`);
    }
    setColor(trimmed);
    setNewColor('');
    setAddingField(null);
  };

  const handleSaveNewSize = () => {
    const trimmed = newSize.trim();
    if (!trimmed) return;
    if (!options.sizes.includes(trimmed)) {
      const updated = { ...options, sizes: [...options.sizes, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Size "${trimmed}" saved to database for future requisitions!`);
    }
    setSize(trimmed);
    setNewSize('');
    setAddingField(null);
  };

  const handleSaveNewWash = () => {
    const trimmed = newWash.trim();
    if (!trimmed) return;
    if (!options.washTypes.includes(trimmed)) {
      const updated = { ...options, washTypes: [...options.washTypes, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Wash Recipe "${trimmed}" saved to database for future requisitions!`);
    }
    setWashType(trimmed);
    setNewWash('');
    setAddingField(null);
  };

  const handleSaveNewCourier = () => {
    const trimmed = newCourier.trim();
    if (!trimmed) return;
    if (!options.couriers.includes(trimmed)) {
      const updated = { ...options, couriers: [...options.couriers, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Courier "${trimmed}" saved to database for future requisitions!`);
    }
    setCourier(trimmed);
    setNewCourier('');
    setAddingField(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleCode.trim() || !styleName.trim() || !shipmentDate) return;
    // Trigger 2nd-time confirmation with Edit option or Save option
    setShowSecondConfirmation(true);
  };

  const handleFinalConfirmSave = () => {
    if (!styleCode.trim() || !styleName.trim() || !shipmentDate) return;

    const finalFabricId = selectedFabric?.id || `fab-inline-${Date.now()}`;
    const finalFabricCode =
      selectedFabric?.code || customFabricCode.trim().toUpperCase() || 'FAB-GEN-01';
    const finalFabricName =
      selectedFabric?.name || customFabricName.trim() || 'Standard Production Fabric';
    const finalThumbnail = thumbnail || PRESET_STYLE_IMAGES[1].url;
    const finalImages = Array.from(new Set([finalThumbnail, ...uploadedImages]));
    const nowIso = new Date().toISOString();

    const formatVolarDate = (dateStr?: string) => {
      const d = dateStr ? new Date(dateStr) : new Date();
      if (Number.isNaN(d.getTime())) return dateStr || '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = String(d.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    };

    const newSample: Partial<SampleItem> = {
      styleCode: styleCode.trim().toUpperCase(),
      styleName: styleName.trim(),
      buyer,
      thumbnail: finalThumbnail,
      images: finalImages,
      poNumber: poNumber.trim() || `PO-${Math.floor(10000 + Math.random() * 90000)}`,
      lineCode,
      sampleType,
      color,
      size,
      quantity,
      fabricId: finalFabricId,
      fabricCode: finalFabricCode,
      fabricName: finalFabricName,
      fabricRequiredYards: requiredYards,
      stage: 'requisition',
      priority,
      targetParcelDate,
      shipmentDate,
      isRequisitionLocked: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      stageHistory: [
        {
          stage: 'requisition',
          timestamp: nowIso,
          note: `Requisition confirmed & permanently locked for ${sampleType}. Shipment Date: ${shipmentDate}. Required fabric: ${requiredYards} yds of ${finalFabricCode}`,
          operator: 'Merchandiser',
        },
      ],
      washDetails: {
        washType,
        washTechnician: 'Anwar Hossain',
        washFormula: 'Neutral enzyme bath + softening',
      },
      finishingDetails: {
        finishingLine: 'Finishing Line #1',
        supervisor: 'Sunil Das',
        ironingDone: false,
        threadTrimmingDone: false,
        taggingDone: false,
        qualityPassed: false,
      },
      parcelDetails: {
        courier,
        trackingNumber: '',
        parcelDate: targetParcelDate,
        recipient: `${buyer} Design Lab`,
        destinationCountry: 'Global HQ',
        dispatchStatus: 'pending',
        workbookSent: false,
      },
      approvalDetails: {
        washComments: '',
        washApproved: false,
        trimsComments: '',
        trimsApproved: false,
        accessoriesComments: '',
        accessoriesApproved: false,
        buttonApproved: false,
        threadApproved: false,
        zipperApproved: false,
        labelApproved: false,
        overallVerdict: 'pending',
      },
      requisitionForm: {
        companyName: 'VOLAR FASHION PVT LTD',
        date: formatVolarDate(nowIso),
        requiredDate: formatVolarDate(targetParcelDate),
        shipmentDate,
        buyer,
        requestedBy: 'Zahid Anwar',
        priorityType: priority === 'urgent' ? 'urgent' : 'normal',
        sampleType,
        descriptionCode: styleCode.trim().toUpperCase(),
        styleName: styleName.trim(),
        sampleSizeLabel: `${sampleType}\n${quantity}x Size ${size}`,
        colorWash: color,
        fabricCode: finalFabricCode,
        fitting: 'As Tech Pack & comments',
        threadInstruction: 'Same as Instructions',
        quantityText: `${quantity} Pcs`,
        block: 'as spec',
        fabricComposition: finalFabricName,
        supplier: selectedFabric?.supplier || 'Mill Partner / Volar Textile',
        weight: selectedFabric?.gsm ? `${selectedFabric.gsm} GSM` : '11.5 OZ / 320 GSM',
        trims: {
          mainLabel: true,
          sizeLabel: true,
          careOrigin: false,
          button: true,
          buckles: false,
          velcro: false,
          rivet: false,
          stud: false,
          thread: true,
          threadNote: 'AS PER CHART',
          interlining: true,
          elastic: false,
          zipper: true,
          drawstring: true,
          stopperEyelet: true,
          snap: false,
          pocketing: true,
          pocketingNote: 'TC POCKETING ( WHITE )',
          customTrims: [],
        },
        specialInstructions: 'PLEASE FOLLOW THE DETAILS OF OUR PROVIDED SAMPLE',
        samplingSectionNotes: 'Pattern checked. Sewing allocated to line in-charge.',
        receivedBy: '',
        merchandiserSignature: 'Zahid Anwar',
        isLocked: true,
        lockedAt: nowIso,
      },
    };

    setShowSecondConfirmation(false);
    onCreateSample(newSample, autoDeduct);
    onClose();
  };

  const daysUntilShipment = (() => {
    if (!shipmentDate) return null;
    const t = new Date(shipmentDate + 'T00:00:00').getTime();
    if (Number.isNaN(t)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((t - today.getTime()) / (1000 * 60 * 60 * 24));
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs text-slate-300">
        {saveToast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl shadow-emerald-950/60 border border-emerald-400 flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-xs">{saveToast}</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Create New Sample Requisition</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Persistent Options Database
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Every option has an &ldquo;+ Add&rdquo; option saved directly to the database so you won&apos;t need to re-enter it in the future!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Style Picture & Techpack Sketch Section */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-1.5 text-xs">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Style Picture / Garment Spec Photo *</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-colors">
                  <Upload className={`w-3 h-3 ${isUploadingPhoto ? 'animate-bounce' : ''}`} />
                  <span>{isUploadingPhoto ? 'Uploading to Storage...' : 'Upload Product Photo(s)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  {showCustomUrlInput ? 'Hide URL' : 'Paste URL'}
                </button>
              </div>
            </div>

            {showCustomUrlInput && (
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  placeholder="https://example.com/garment-photo.jpg"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customImageUrl.trim()) {
                      setThumbnail(customImageUrl.trim());
                      setCustomImageUrl('');
                      setShowCustomUrlInput(false);
                    }
                  }}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-900 border-2 border-indigo-500/50 shrink-0 shadow-lg group">
                <img
                  src={thumbnail}
                  alt="Style Preview"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-indigo-300 text-[8px] font-bold text-center py-0.5">
                  Selected
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Or select preset style picture (1-click):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {PRESET_STYLE_IMAGES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setThumbnail(preset.url)}
                      className={`relative w-11 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        thumbnail === preset.url
                          ? 'border-indigo-400 scale-105 shadow-md shadow-indigo-600/30'
                          : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Style Code */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Style Code / Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ST-9040"
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* 2. Style Name */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Style Name & Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Relaxed Carpenter Painter Pant"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* 3. Buyer / Customer with + Add Option */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Buyer / Customer</label>
                <button
                  type="button"
                  onClick={() => setAddingField(addingField === 'buyer' ? null : 'buyer')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Buyer</span>
                </button>
              </div>

              {addingField === 'buyer' && (
                <div className="mb-2 p-2 bg-indigo-950/50 border border-indigo-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                    <Database className="w-3 h-3" />
                    <span>Save New Buyer to Database:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Diesel Jeans / Italy"
                      value={newBuyer}
                      onChange={(e) => setNewBuyer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNewBuyer();
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveNewBuyer}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] shadow transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingField(null)}
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <select
                value={buyer}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setAddingField('buyer');
                  } else {
                    setBuyer(e.target.value);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {options.buyers.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="__ADD_NEW__" className="text-indigo-400 font-bold">
                  ➕ Add New Buyer to Database...
                </option>
              </select>
            </div>

            {/* 4. PO Number */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                PO / Order Number
              </label>
              <input
                type="text"
                placeholder="e.g. PO-LS-99210"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* 5. Sewing Line Code with + Add Option */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Sewing Line Code</label>
                <button
                  type="button"
                  onClick={() => setAddingField(addingField === 'line' ? null : 'line')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Line</span>
                </button>
              </div>

              {addingField === 'line' && (
                <div className="mb-2 p-2 bg-indigo-950/50 border border-indigo-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                    <Database className="w-3 h-3" />
                    <span>Save New Sewing Line to Database:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Code (e.g. LINE-E01)"
                      value={newLineCode}
                      onChange={(e) => setNewLineCode(e.target.value)}
                      className="bg-slate-900 border border-indigo-500/50 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Description (e.g. Heavy Jackets)"
                      value={newLineDesc}
                      onChange={(e) => setNewLineDesc(e.target.value)}
                      className="bg-slate-900 border border-indigo-500/50 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddingField(null)}
                      className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewLine}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                    >
                      Save Line to Database
                    </button>
                  </div>
                </div>
              )}

              <select
                value={lineCode}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setAddingField('line');
                  } else {
                    setLineCode(e.target.value);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {options.lineCodes.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
                <option value="__ADD_NEW__" className="text-indigo-400 font-bold">
                  ➕ Add New Sewing Line to Database...
                </option>
              </select>
            </div>

            {/* 6. Sample Type with + Add Option */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Sample Type</label>
                <button
                  type="button"
                  onClick={() => setAddingField(addingField === 'sampleType' ? null : 'sampleType')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Type</span>
                </button>
              </div>

              {addingField === 'sampleType' && (
                <div className="mb-2 p-2 bg-indigo-950/50 border border-indigo-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                    <Database className="w-3 h-3" />
                    <span>Save New Sample Type to Database:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Wearer Trial Sample"
                      value={newSampleType}
                      onChange={(e) => setNewSampleType(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNewSampleType();
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveNewSampleType}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingField(null)}
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <select
                value={sampleType}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setAddingField('sampleType');
                  } else {
                    setSampleType(e.target.value as SampleType);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {options.sampleTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === 'Red Seal Sample'
                      ? 'Red Seal Sample (Pre-Production Approval)'
                      : t}
                  </option>
                ))}
                <option value="__ADD_NEW__" className="text-indigo-400 font-bold">
                  ➕ Add New Sample Type to Database...
                </option>
              </select>
            </div>
          </div>

          {/* 7. Fabric Linkage Section with + Add Fabric */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Fabric Inventory Linkage
              </h3>
              {onOpenAddFabric && (
                <button
                  type="button"
                  onClick={onOpenAddFabric}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add New Fabric to Stock</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fabrics.length > 0 ? (
                <div>
                  <label className="block text-slate-400 mb-1">
                    Select Fabric from Stock *
                  </label>
                  <select
                    value={selectedFabricId}
                    onChange={(e) => setSelectedFabricId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                  >
                    {fabrics.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name} ({f.availableYards.toFixed(1)} yds avail)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Fabric Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FAB-DNM-01"
                      value={customFabricCode}
                      onChange={(e) => setCustomFabricCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Fabric Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12oz Indigo Denim"
                      value={customFabricName}
                      onChange={(e) => setCustomFabricName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">
                  Required Fabric Yards for this Sample
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="100"
                  value={requiredYards}
                  onChange={(e) => setRequiredYards(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                />
              </div>
            </div>

            {willTriggerLowStock && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Warning:</strong> Cutting this sample will leave{' '}
                  <strong className="text-white">
                    {(selectedFabric!.availableYards - requiredYards).toFixed(1)} yds
                  </strong>{' '}
                  (≤ 5 yds threshold). This will trigger the RED Alert on the Dashboard!
                </span>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={autoDeduct}
                onChange={(e) => setAutoDeduct(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0"
              />
              <span>
                Automatically deduct {requiredYards} yds from available fabric inventory on requisition creation
              </span>
            </label>
          </div>

          {/* 8. Color, Size, Qty, Priority with + Add Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Color */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400">Color / Shade</label>
                <button
                  type="button"
                  onClick={() => setAddingField(addingField === 'color' ? null : 'color')}
                  className="text-[9px] font-bold text-indigo-400 hover:text-white cursor-pointer"
                  title="Add new color to database"
                >
                  + Add
                </button>
              </div>
              {addingField === 'color' && (
                <div className="mb-1.5 p-1.5 bg-indigo-950/60 border border-indigo-500/40 rounded-lg flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New color..."
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="flex-1 bg-slate-900 border border-indigo-500/40 rounded px-1.5 py-0.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewColor}
                    className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                  >
                    Save
                  </button>
                </div>
              )}
              <input
                type="text"
                list="color-options-list"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
              />
              <datalist id="color-options-list">
                {options.colors.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Size */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400">Size Spec</label>
                <button
                  type="button"
                  onClick={() => setAddingField(addingField === 'size' ? null : 'size')}
                  className="text-[9px] font-bold text-indigo-400 hover:text-white cursor-pointer"
                  title="Add new size to database"
                >
                  + Add
                </button>
              </div>
              {addingField === 'size' && (
                <div className="mb-1.5 p-1.5 bg-indigo-950/60 border border-indigo-500/40 rounded-lg flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New size..."
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="flex-1 bg-slate-900 border border-indigo-500/40 rounded px-1.5 py-0.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewSize}
                    className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                  >
                    Save
                  </button>
                </div>
              )}
              <select
                value={size}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setAddingField('size');
                  } else {
                    setSize(e.target.value);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
              >
                {options.sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="__ADD_NEW__">➕ Add Size...</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-slate-400 mb-1">Quantity (pcs)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SamplePriority)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-semibold"
              >
                <option value="normal">🔵 Normal</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>

          {/* 9. Shipment Date (Mandatory for Fast Approval Priority), Target Parcel Date, Wash Recipe (+ Add), Courier (+ Add) */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Order / Bulk Shipment Date * (Determines Fast Approval Priority)</span>
              </label>
              {daysUntilShipment !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    daysUntilShipment <= 7
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : daysUntilShipment <= 14
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {daysUntilShipment < 0
                    ? `Overdue by ${Math.abs(daysUntilShipment)}d • Immediate Approval Priority`
                    : daysUntilShipment === 0
                    ? 'Ships Today • Urgent Fast Approval'
                    : `Ships in ${daysUntilShipment} days • ${
                        daysUntilShipment <= 14 ? 'Earlier Priority Sample' : 'Scheduled Shipment'
                      }`}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <input
                type="date"
                required
                value={shipmentDate}
                onChange={(e) => setShipmentDate(e.target.value)}
                className="w-full bg-slate-900 border border-amber-500/50 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Every style is saved with its <strong>Shipment Date</strong> so earlier shipment styles missing approval for <strong>Button, Thread, Wash, Trims, or Accessories</strong> are prioritized on the Dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">
                Target Parcel Date *
              </label>
              <input
                type="date"
                required
                value={targetParcelDate}
                onChange={(e) => setTargetParcelDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400">Wash Recipe / Finish</label>
                <button
                  type="button"
                  onClick={() => setAddingField(addingField === 'wash' ? null : 'wash')}
                  className="text-[9px] font-bold text-indigo-400 hover:text-white cursor-pointer"
                  title="Add new wash formula to database"
                >
                  + Add Wash
                </button>
              </div>
              {addingField === 'wash' && (
                <div className="mb-1.5 p-1.5 bg-indigo-950/60 border border-indigo-500/40 rounded-lg flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New wash formula..."
                    value={newWash}
                    onChange={(e) => setNewWash(e.target.value)}
                    className="flex-1 bg-slate-900 border border-indigo-500/40 rounded px-1.5 py-0.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewWash}
                    className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                  >
                    Save
                  </button>
                </div>
              )}
              <select
                value={washType}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setAddingField('wash');
                  } else {
                    setWashType(e.target.value);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
              >
                {options.washTypes.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
                <option value="__ADD_NEW__">➕ Add New Wash Recipe...</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400">Courier / Service</label>
                <button
                  type="button"
                  onClick={() => setAddingField(addingField === 'courier' ? null : 'courier')}
                  className="text-[9px] font-bold text-indigo-400 hover:text-white cursor-pointer"
                  title="Add courier service to database"
                >
                  + Add Courier
                </button>
              </div>
              {addingField === 'courier' && (
                <div className="mb-1.5 p-1.5 bg-indigo-950/60 border border-indigo-500/40 rounded-lg flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New courier..."
                    value={newCourier}
                    onChange={(e) => setNewCourier(e.target.value)}
                    className="flex-1 bg-slate-900 border border-indigo-500/40 rounded px-1.5 py-0.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewCourier}
                    className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                  >
                    Save
                  </button>
                </div>
              )}
              <select
                value={courier}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setAddingField('courier');
                  } else {
                    setCourier(e.target.value);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white"
              >
                {options.couriers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__ADD_NEW__">➕ Add New Courier...</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Requires 2nd confirmation before permanent save (locked once saved)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Save Requisition (Proceed to Confirmation)</span>
              </button>
            </div>
          </div>
        </form>

        {/* ============================================================ */}
        {/* 2ND CONFIRMATION MODAL OVERLAY (Edit Option vs Save & Lock) */}
        {/* ============================================================ */}
        {showSecondConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold uppercase">
                      2nd Confirmation Step
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Cannot Be Edited Once Saved
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    Confirm Requisition Before Permanent Save
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    Please verify all style specifications and the <strong>Shipment Date</strong> below. You can click <strong>Edit Requisition</strong> to make changes now, or <strong>Confirm &amp; Save Requisition</strong> to lock and save it permanently.
                  </p>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-700/80">
                  <img
                    src={thumbnail || PRESET_STYLE_IMAGES[1].url}
                    alt={styleName}
                    className="w-14 h-16 rounded-lg object-cover border border-indigo-500/40 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm text-indigo-300 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40">
                        {styleCode.trim().toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 font-semibold text-[11px]">
                        {sampleType}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-[11px]">
                        Shipment: {shipmentDate}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1 truncate">
                      {styleName.trim()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Buyer: <strong className="text-slate-200">{buyer}</strong> • Line: <strong className="text-slate-200 font-mono">{lineCode}</strong> • Qty: <strong className="text-slate-200">{quantity} pcs ({size})</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Order Shipment Date</span>
                    <span className="font-mono font-bold text-amber-300">{shipmentDate}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Target Parcel Date</span>
                    <span className="font-mono font-bold text-emerald-300">{targetParcelDate}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Fabric &amp; Required Yds</span>
                    <span className="font-mono font-bold text-indigo-300">
                      {selectedFabric?.code || customFabricCode || 'FAB-GEN-01'} ({requiredYards} yds)
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Color / Shade</span>
                    <span className="font-semibold text-white">{color}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Wash Recipe</span>
                    <span className="font-semibold text-cyan-300 truncate block">{washType}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Priority Level</span>
                    <span className="font-bold uppercase text-rose-300">{priority}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-[11px] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong>Permanent Lock Notice:</strong> Once you click <strong>Save Requisition</strong> below, this requisition cannot be edited anymore.
                  </span>
                </div>
              </div>

              {/* 2nd Confirmation Action Buttons: Edit Option OR Save Option */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSecondConfirmation(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Requisition (Go Back &amp; Edit)</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirmSave}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirm &amp; Save Requisition (Lock Permanently)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
