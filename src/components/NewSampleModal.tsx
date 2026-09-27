import React, { useState, useEffect } from 'react';
import { FabricItem } from '../types/fabric';
import {
  SampleItem,
  SamplePriority,
  SampleType,
  PRESET_STYLE_IMAGES,
  CORE_SEAL_SAMPLE_TYPES,
  getSampleImage,
  getSampleTypeTone,
} from '../types/sample';
import { SampleTypeBadge } from './SampleTypeBadge';
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
  Tag,
  Sparkles,
  RefreshCw,
  FileText,
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
  samples?: SampleItem[];
  initialSelectedStyle?: SampleItem | null;
  onCreateSample: (sampleData: Partial<SampleItem>, deductYards: boolean) => void;
  onUpdateStoredStyle?: (sampleId: string, updates: Partial<SampleItem>) => void;
  onOpenAddFabric?: () => void;
}

export const NewSampleModal: React.FC<NewSampleModalProps> = ({
  isOpen,
  onClose,
  fabrics,
  samples = [],
  initialSelectedStyle = null,
  onCreateSample,
  onUpdateStoredStyle,
  onOpenAddFabric,
}) => {
  // Load persistent user-saved database options (clean, no mock data)
  const [options, setOptions] = useState<RequisitionOptions>(loadRequisitionOptions);
  const [selectedStoredStyleId, setSelectedStoredStyleId] = useState<string>('');

  // Clean, blank initial form fields (no pre-filled mock data)
  const [styleCode, setStyleCode] = useState('');
  const [styleName, setStyleName] = useState('');
  const [buyer, setBuyer] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [lineCode, setLineCode] = useState('');
  const [sampleType, setSampleType] = useState<string>('');
  const [color, setColor] = useState('');

  // Size input: type a size and press Enter to list it without submitting or filling the rest of the form
  const [sizeInput, setSizeInput] = useState('');
  const [listedSizes, setListedSizes] = useState<string[]>([]);

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedFabricId, setSelectedFabricId] = useState('');
  const [customFabricCode, setCustomFabricCode] = useState('');
  const [customFabricName, setCustomFabricName] = useState('');
  const [requiredYards, setRequiredYards] = useState<number>(1);
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
  const [washType, setWashType] = useState('');
  const [courier, setCourier] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [autoDeduct, setAutoDeduct] = useState(true);

  // Thread, Zipper & Button Notes for Requisition Form
  const [threadNote, setThreadNote] = useState('');
  const [zipperNote, setZipperNote] = useState('');
  const [buttonNote, setButtonNote] = useState('');
  const [includeThreadTrim, setIncludeThreadTrim] = useState(true);
  const [includeZipperTrim, setIncludeZipperTrim] = useState(true);
  const [includeButtonTrim, setIncludeButtonTrim] = useState(true);

  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState<'create' | 'update'>('create');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Style Picture state (only the single selected image is connected to the style)
  const [thumbnail, setThumbnail] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);

  // Notification / confirmation feedback
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const populateFromStoredStyle = (stored: SampleItem) => {
    setSelectedStoredStyleId(stored.id);
    setStyleCode(stored.styleCode || '');
    setStyleName(stored.styleName || '');
    setBuyer(stored.buyer || '');
    setPoNumber(stored.poNumber || '');
    setLineCode(stored.lineCode || '');
    setSampleType(stored.sampleType || '');
    setColor(stored.color || '');
    const parsedSizes = (stored.size || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setListedSizes(parsedSizes);
    setSizeInput('');
    setQuantity(stored.quantity || 1);
    setSelectedFabricId(stored.fabricId || '');
    setCustomFabricCode(stored.fabricId ? '' : stored.fabricCode || '');
    setCustomFabricName(stored.fabricId ? '' : stored.fabricName || '');
    setRequiredYards(stored.fabricRequiredYards ?? 1);
    setPriority(stored.priority || 'normal');
    if (stored.targetParcelDate) setTargetParcelDate(stored.targetParcelDate);
    if (stored.shipmentDate) setShipmentDate(stored.shipmentDate);
    setWashType(stored.washDetails?.washType || '');
    setCourier(stored.parcelDetails?.courier || '');
    setRequestedBy(stored.requisitionForm?.requestedBy || '');

    const storedThread =
      stored.threadNote ||
      stored.requisitionForm?.threadNote ||
      stored.requisitionForm?.trims?.threadNote ||
      stored.requisitionForm?.threadInstruction ||
      '';
    const storedZipper =
      stored.zipperNote ||
      stored.requisitionForm?.zipperNote ||
      stored.requisitionForm?.trims?.zipperNote ||
      '';
    const storedButton =
      stored.buttonNote ||
      stored.requisitionForm?.buttonNote ||
      stored.requisitionForm?.trims?.buttonNote ||
      '';

    setThreadNote(storedThread);
    setZipperNote(storedZipper);
    setButtonNote(storedButton);
    setIncludeThreadTrim(
      stored.requisitionForm?.trims?.thread !== undefined
        ? stored.requisitionForm.trims.thread
        : true
    );
    setIncludeZipperTrim(
      stored.requisitionForm?.trims?.zipper !== undefined
        ? stored.requisitionForm.trims.zipper
        : true
    );
    setIncludeButtonTrim(
      stored.requisitionForm?.trims?.button !== undefined
        ? stored.requisitionForm.trims.button
        : true
    );

    setThumbnail(getSampleImage(stored));
    setValidationError(null);
    setSaveToast(
      `Selected Stored Style "${stored.styleCode}" — you can now change Color, Wash, or Sizes!`
    );
  };

  useEffect(() => {
    if (isOpen) {
      syncRequisitionOptionsFromCloud().then((synced) => {
        setOptions(synced);
      });
      if (initialSelectedStyle) {
        populateFromStoredStyle(initialSelectedStyle);
      }
    }
  }, [isOpen, initialSelectedStyle]);

  useEffect(() => {
    if (saveToast) {
      const t = setTimeout(() => setSaveToast(null), 2800);
      return () => clearTimeout(t);
    }
  }, [saveToast]);

  if (!isOpen) return null;

  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId);
  const willTriggerLowStock =
    selectedFabric && selectedFabric.availableYards - requiredYards <= 5;
  const selectedStoredSample = samples.find((s) => s.id === selectedStoredStyleId) || null;

  const triggerSaveNotification = (msg: string) => {
    setSaveToast(msg);
  };

  const resetFormFields = () => {
    setSelectedStoredStyleId('');
    setStyleCode('');
    setStyleName('');
    setBuyer('');
    setPoNumber('');
    setLineCode('');
    setSampleType('');
    setColor('');
    setSizeInput('');
    setListedSizes([]);
    setQuantity(1);
    setSelectedFabricId('');
    setCustomFabricCode('');
    setCustomFabricName('');
    setRequiredYards(1);
    setPriority('normal');
    setWashType('');
    setCourier('');
    setRequestedBy('');
    setThreadNote('');
    setZipperNote('');
    setButtonNote('');
    setIncludeThreadTrim(true);
    setIncludeZipperTrim(true);
    setIncludeButtonTrim(true);
    setThumbnail('');
    setValidationError(null);
    setShowSecondConfirmation(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const res = await uploadStylePhoto(files[0], {
        styleCode: styleCode.trim() || 'STYLE_UPLOAD',
      });
      if (res.url) {
        setThumbnail(res.url);
        setSaveToast('Selected product photo connected to this style!');
      }
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // ============================================================================
  // ENTER-TO-LIST HANDLERS (Pressing Enter lists the item ONLY, never fills/submits form)
  // ============================================================================

  const handleAddSizeToList = (rawVal?: string) => {
    const val = (rawVal !== undefined ? rawVal : sizeInput).trim().toUpperCase();
    if (!val) return;

    // Support comma-separated sizes if user typed "S, M, L"
    const parts = val
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    setListedSizes((prev) => {
      const next = Array.from(new Set([...prev, ...parts]));
      return next;
    });

    // Also persist to saved options.sizes if new
    const newSizesForDb = parts.filter((p) => !options.sizes.includes(p));
    if (newSizesForDb.length > 0) {
      const updated = {
        ...options,
        sizes: Array.from(new Set([...options.sizes, ...newSizesForDb])),
      };
      setOptions(updated);
      saveRequisitionOptions(updated);
    }

    setSizeInput('');
    triggerSaveNotification(`Size "${parts.join(', ')}" listed!`);
  };

  const handleRemoveListedSize = (sizeToRemove: string) => {
    setListedSizes((prev) => prev.filter((s) => s !== sizeToRemove));
  };

  const handleToggleSavedSize = (s: string) => {
    if (listedSizes.includes(s)) {
      setListedSizes((prev) => prev.filter((item) => item !== s));
    } else {
      setListedSizes((prev) => [...prev, s]);
    }
  };

  const handleListBuyerOnEnter = () => {
    const trimmed = buyer.trim();
    if (!trimmed) return;
    if (!options.buyers.includes(trimmed)) {
      const updated = { ...options, buyers: [...options.buyers, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Buyer "${trimmed}" listed & saved!`);
    } else {
      triggerSaveNotification(`Buyer "${trimmed}" selected!`);
    }
  };

  const handleListLineOnEnter = () => {
    const code = lineCode.trim().toUpperCase();
    if (!code) return;
    setLineCode(code);
    const exists = options.lineCodes.some((c) => c.code === code);
    if (!exists) {
      const updated = {
        ...options,
        lineCodes: [...options.lineCodes, { code, label: code }],
      };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Sewing Line "${code}" listed & saved!`);
    } else {
      triggerSaveNotification(`Sewing Line "${code}" selected!`);
    }
  };

  const handleListSampleTypeOnEnter = () => {
    const trimmed = sampleType.trim();
    if (!trimmed) return;
    if (!options.sampleTypes.includes(trimmed)) {
      const updated = { ...options, sampleTypes: [...options.sampleTypes, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Sample Type "${trimmed}" listed & saved!`);
    } else {
      triggerSaveNotification(`Sample Type "${trimmed}" selected!`);
    }
  };

  const handleListColorOnEnter = () => {
    const trimmed = color.trim();
    if (!trimmed) return;
    if (!options.colors.includes(trimmed)) {
      const updated = { ...options, colors: [...options.colors, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Color "${trimmed}" listed & saved!`);
    } else {
      triggerSaveNotification(`Color "${trimmed}" selected!`);
    }
  };

  const handleListWashOnEnter = () => {
    const trimmed = washType.trim();
    if (!trimmed) return;
    if (!options.washTypes.includes(trimmed)) {
      const updated = { ...options, washTypes: [...options.washTypes, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Wash "${trimmed}" listed & saved!`);
    } else {
      triggerSaveNotification(`Wash "${trimmed}" selected!`);
    }
  };

  const handleListCourierOnEnter = () => {
    const trimmed = courier.trim();
    if (!trimmed) return;
    if (!options.couriers.includes(trimmed)) {
      const updated = { ...options, couriers: [...options.couriers, trimmed] };
      setOptions(updated);
      saveRequisitionOptions(updated);
      triggerSaveNotification(`Courier "${trimmed}" listed & saved!`);
    } else {
      triggerSaveNotification(`Courier "${trimmed}" selected!`);
    }
  };

  // Effective size string from listedSizes (or any pending text in sizeInput)
  const effectiveSizeString = (() => {
    const pending = sizeInput.trim().toUpperCase();
    const combined = pending
      ? Array.from(new Set([...listedSizes, pending]))
      : listedSizes;
    return combined.join(', ');
  })();

  const handleProceedToConfirmation = (mode: 'create' | 'update' = 'create') => {
    setValidationError(null);
    if (!styleCode.trim()) {
      setValidationError('Please enter or select the Style Code / Number.');
      return;
    }
    if (!styleName.trim()) {
      setValidationError('Please enter the Style Name & Description.');
      return;
    }
    if (!shipmentDate) {
      setValidationError('Please select the Order / Bulk Shipment Date.');
      return;
    }

    // If user typed a size in the input box but didn't hit Enter yet, list it automatically
    if (sizeInput.trim()) {
      handleAddSizeToList(sizeInput);
    }

    // Save any newly typed options into the persistent lists for future use
    const nextOptions: RequisitionOptions = {
      buyers: buyer.trim()
        ? Array.from(new Set([...options.buyers, buyer.trim()]))
        : options.buyers,
      lineCodes: lineCode.trim()
        ? options.lineCodes.some((l) => l.code === lineCode.trim().toUpperCase())
          ? options.lineCodes
          : [
              ...options.lineCodes,
              { code: lineCode.trim().toUpperCase(), label: lineCode.trim().toUpperCase() },
            ]
        : options.lineCodes,
      sampleTypes: sampleType.trim()
        ? Array.from(new Set([...options.sampleTypes, sampleType.trim()]))
        : options.sampleTypes,
      sizes: options.sizes,
      colors: color.trim()
        ? Array.from(new Set([...options.colors, color.trim()]))
        : options.colors,
      washTypes: washType.trim()
        ? Array.from(new Set([...options.washTypes, washType.trim()]))
        : options.washTypes,
      couriers: courier.trim()
        ? Array.from(new Set([...options.couriers, courier.trim()]))
        : options.couriers,
    };
    setOptions(nextOptions);
    saveRequisitionOptions(nextOptions);

    setConfirmationMode(mode);
    setShowSecondConfirmation(true);
  };

  const handleFinalConfirmSave = () => {
    if (!styleCode.trim() || !styleName.trim() || !shipmentDate) return;

    const finalSize = effectiveSizeString || 'Standard';
    const finalSampleType = (sampleType.trim() || 'Initial Sample') as SampleType;
    const finalBuyer = buyer.trim() || 'Direct Buyer';
    const finalLineCode = lineCode.trim().toUpperCase() || 'LINE-01';
    const finalColor = color.trim() || 'Standard';
    const finalWash = washType.trim() || 'Standard Wash';
    const finalCourier = courier.trim() || '';

    const finalThreadNote = threadNote.trim();
    const finalZipperNote = zipperNote.trim();
    const finalButtonNote = buttonNote.trim();

    const finalFabricId = selectedFabric?.id || '';
    const finalFabricCode =
      selectedFabric?.code || customFabricCode.trim().toUpperCase() || '';
    const finalFabricName =
      selectedFabric?.name || customFabricName.trim() || '';
    // Connect ONLY the selected image with this style
    const finalThumbnail = thumbnail.trim();
    const finalImages = finalThumbnail ? [finalThumbnail] : [];
    const nowIso = new Date().toISOString();

    const formatVolarDate = (dateStr?: string) => {
      const d = dateStr ? new Date(dateStr) : new Date();
      if (Number.isNaN(d.getTime())) return dateStr || '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = String(d.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    };

    const combinedColorWash =
      finalWash &&
      finalWash !== 'Standard Wash' &&
      !finalColor.toLowerCase().includes(finalWash.toLowerCase())
        ? `${finalColor} / ${finalWash}`
        : finalColor;

    const notesSummaryParts: string[] = [];
    if (finalThreadNote) notesSummaryParts.push(`THREAD: ${finalThreadNote}`);
    if (finalZipperNote) notesSummaryParts.push(`ZIPPER: ${finalZipperNote}`);
    if (finalButtonNote) notesSummaryParts.push(`BUTTON: ${finalButtonNote}`);
    const autoSpecialInstructions = notesSummaryParts.join(' | ');

    const newSample: Partial<SampleItem> = {
      styleCode: styleCode.trim().toUpperCase(),
      styleName: styleName.trim(),
      buyer: finalBuyer,
      thumbnail: finalThumbnail || undefined,
      images: finalImages,
      poNumber: poNumber.trim(),
      lineCode: finalLineCode,
      sampleType: finalSampleType,
      color: finalColor,
      size: finalSize,
      quantity,
      fabricId: finalFabricId,
      fabricCode: finalFabricCode,
      fabricName: finalFabricName,
      fabricRequiredYards: requiredYards,
      threadNote: finalThreadNote,
      zipperNote: finalZipperNote,
      buttonNote: finalButtonNote,
      stage:
        selectedStoredSample && confirmationMode === 'update'
          ? selectedStoredSample.stage
          : 'requisition',
      priority,
      targetParcelDate,
      shipmentDate,
      isRequisitionLocked: true,
      createdAt:
        selectedStoredSample && confirmationMode === 'update'
          ? selectedStoredSample.createdAt
          : nowIso,
      updatedAt: nowIso,
      stageHistory:
        selectedStoredSample && confirmationMode === 'update'
          ? [
              ...selectedStoredSample.stageHistory,
              {
                stage: selectedStoredSample.stage,
                timestamp: nowIso,
                note: `Updated stored style specs — Color: ${finalColor}, Wash: ${finalWash}, Sizes: ${finalSize}${
                  autoSpecialInstructions ? ` (${autoSpecialInstructions})` : ''
                }.`,
                operator: requestedBy.trim() || 'Merchandiser',
              },
            ]
          : [
              {
                stage: 'requisition',
                timestamp: nowIso,
                note: `Requisition confirmed & permanently locked for ${finalSampleType}. Color: ${finalColor}, Wash: ${finalWash}, Sizes: ${finalSize}.${
                  autoSpecialInstructions ? ` Trims: ${autoSpecialInstructions}.` : ''
                }`,
                operator: requestedBy.trim() || 'Merchandiser',
              },
            ],
      washDetails: {
        ...(selectedStoredSample?.washDetails || {}),
        washType: finalWash,
        washTechnician: selectedStoredSample?.washDetails?.washTechnician || '',
        washFormula: finalWash,
      },
      finishingDetails: selectedStoredSample?.finishingDetails || {
        finishingLine: '',
        supervisor: '',
        ironingDone: false,
        threadTrimmingDone: false,
        taggingDone: false,
        qualityPassed: false,
      },
      parcelDetails: {
        ...(selectedStoredSample?.parcelDetails || {}),
        courier: finalCourier,
        trackingNumber: selectedStoredSample?.parcelDetails?.trackingNumber || '',
        parcelDate: targetParcelDate,
        recipient: finalBuyer,
        destinationCountry: selectedStoredSample?.parcelDetails?.destinationCountry || '',
        dispatchStatus: selectedStoredSample?.parcelDetails?.dispatchStatus || 'pending',
        workbookSent: selectedStoredSample?.parcelDetails?.workbookSent || false,
      },
      approvalDetails: selectedStoredSample?.approvalDetails || {
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
        companyName: selectedStoredSample?.requisitionForm?.companyName || 'VOLAR FASHION PVT LTD',
        date: formatVolarDate(nowIso),
        requiredDate: formatVolarDate(targetParcelDate),
        shipmentDate,
        buyer: finalBuyer,
        requestedBy: requestedBy.trim(),
        priorityType: priority === 'urgent' ? 'urgent' : 'normal',
        sampleType: finalSampleType,
        descriptionCode: styleCode.trim().toUpperCase(),
        styleName: styleName.trim(),
        sampleSizeLabel: `${finalSampleType}\nSize: ${finalSize} (${quantity} Pcs)`,
        colorWash: combinedColorWash,
        fabricCode: finalFabricCode,
        fitting: selectedStoredSample?.requisitionForm?.fitting || '',
        threadInstruction: finalThreadNote || 'AS PER SAMPLE',
        threadNote: finalThreadNote,
        zipperNote: finalZipperNote,
        buttonNote: finalButtonNote,
        quantityText: `${quantity} Pcs`,
        block: selectedStoredSample?.requisitionForm?.block || '',
        fabricComposition: finalFabricName,
        supplier: selectedFabric?.supplier || selectedStoredSample?.requisitionForm?.supplier || '',
        weight: selectedFabric?.gsm
          ? `${selectedFabric.gsm} GSM`
          : selectedStoredSample?.requisitionForm?.weight || '',
        trims: {
          mainLabel: true,
          sizeLabel: true,
          careOrigin: false,
          button: includeButtonTrim || Boolean(finalButtonNote),
          buttonNote: finalButtonNote,
          buckles: false,
          velcro: false,
          rivet: false,
          stud: false,
          thread: includeThreadTrim || Boolean(finalThreadNote),
          threadNote: finalThreadNote || 'AS PER CHART',
          interlining: false,
          elastic: false,
          zipper: includeZipperTrim || Boolean(finalZipperNote),
          zipperNote: finalZipperNote,
          drawstring: false,
          stopperEyelet: false,
          snap: false,
          pocketing: false,
          pocketingNote: '',
          customTrims: [],
        },
        specialInstructions: autoSpecialInstructions,
        samplingSectionNotes: selectedStoredSample?.requisitionForm?.samplingSectionNotes || '',
        receivedBy: selectedStoredSample?.requisitionForm?.receivedBy || '',
        merchandiserSignature: requestedBy.trim(),
        isLocked: true,
        lockedAt: nowIso,
      },
    };

    if (confirmationMode === 'update' && selectedStoredSample && onUpdateStoredStyle) {
      onUpdateStoredStyle(selectedStoredSample.id, newSample);
      resetFormFields();
      onClose();
      return;
    }

    resetFormFields();
    onCreateSample(newSample, autoDeduct && Boolean(selectedFabric));
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

  // Prevent accidental Enter key submission on any regular input field
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs text-slate-300">
        {saveToast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl shadow-emerald-950/60 border border-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-xs">{saveToast}</span>
          </div>
        )}

        <button
          type="button"
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
              <h2 className="text-lg font-black text-white">
                {selectedStoredSample
                  ? `Stored Style Selected: ${selectedStoredSample.styleCode}`
                  : 'Create Sample Requisition / Select Stored Style'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Live Database
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Select any stored style from our database to change <strong className="text-emerald-300">Color, Wash, or Sizes</strong>, or include <strong className="text-amber-300">Thread, Zipper &amp; Button notes</strong> in the Requisition Form.
            </p>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold">{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProceedToConfirmation('create');
          }}
          onKeyDown={handleFormKeyDown}
          className="space-y-4"
        >
          {/* STORED STYLE SELECTOR FROM DATABASE */}
          <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>
                  Select Listed Style from Database (Change Color, Wash, or Sizes)
                </span>
              </label>
              {selectedStoredSample && (
                <button
                  type="button"
                  onClick={resetFormFields}
                  className="text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Clear &amp; Input New Style</span>
                </button>
              )}
            </div>

            {samples.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                Once a style has been listed in this system, it will appear here so you can select it and change its Color, Wash, or Sizes anytime.
              </p>
            ) : (
              <>
                <select
                  value={selectedStoredStyleId}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) {
                      resetFormFields();
                      return;
                    }
                    const found = samples.find((s) => s.id === id);
                    if (found) populateFromStoredStyle(found);
                  }}
                  className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">
                    -- Select a Stored Style from Database ({samples.length} Listed Style{samples.length > 1 ? 's' : ''}) --
                  </option>
                  {samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.styleCode} — {s.styleName} | Color: {s.color} | Wash: {s.washDetails?.washType || 'N/A'} | Sizes: {s.size}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-emerald-300/80 font-semibold">
                    Stored Styles:
                  </span>
                  {samples.map((s) => {
                    const isSelected = selectedStoredStyleId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => populateFromStoredStyle(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-500/50 hover:text-white'
                        }`}
                      >
                        <span>{s.styleCode}</span>
                        <span className="text-[10px] font-sans font-normal opacity-85 truncate max-w-[110px]">
                          ({s.color} • {s.size})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {selectedStoredSample && (
              <div className="p-2 rounded-lg bg-emerald-900/30 border border-emerald-500/40 text-emerald-200 text-[11px]">
                ✅ <strong>{selectedStoredSample.styleCode} ({selectedStoredSample.styleName})</strong> loaded! You can now change its <strong>Color</strong>, <strong>Wash</strong>, or <strong>Sizes</strong> below and either update this stored style or create a new requisition.
              </div>
            )}
          </div>
          {/* Style Picture & Techpack Sketch Section */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-1.5 text-xs">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Style Picture / Garment Spec Photo (Optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-colors">
                  <Upload className={`w-3 h-3 ${isUploadingPhoto ? 'animate-bounce' : ''}`} />
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Select / Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (customImageUrl.trim()) {
                        setThumbnail(customImageUrl.trim());
                        setCustomImageUrl('');
                        setShowCustomUrlInput(false);
                      }
                    }
                  }}
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
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              {thumbnail ? (
                <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500 shrink-0 shadow-lg">
                  <img
                    src={thumbnail}
                    alt="Selected Style"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[8px] font-bold text-center py-0.5">
                    Selected
                  </span>
                </div>
              ) : (
                <div className="w-16 h-20 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 text-[9px] text-center p-1 shrink-0">
                  <ImageIcon className="w-4 h-4 mb-0.5 opacity-60" />
                  <span>No Image</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-slate-400">
                    Or click a style image below to select (only the selected image will be connected):
                  </span>
                  {thumbnail && (
                    <button
                      type="button"
                      onClick={() => setThumbnail('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {PRESET_STYLE_IMAGES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setThumbnail(preset.url)}
                      className={`relative w-11 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        thumbnail === preset.url
                          ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                          : 'border-slate-700 hover:border-slate-500 opacity-65 hover:opacity-100'
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
                placeholder="Enter Style Code (e.g. ST-101)"
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* 2. Style Name */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Style Name &amp; Description *
              </label>
              <input
                type="text"
                placeholder="Enter Style Name"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* 3. Buyer / Customer (Type & Press Enter to List) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Buyer / Customer</label>
                <span className="text-[10px] text-slate-400">Press Enter to list</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  list="buyer-datalist"
                  placeholder="Type Buyer & press Enter..."
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleListBuyerOnEnter();
                    }
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleListBuyerOnEnter}
                  className="px-2.5 py-2.5 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-700 rounded-xl font-bold text-[11px] transition-colors cursor-pointer shrink-0"
                  title="List Buyer"
                >
                  List
                </button>
              </div>
              <datalist id="buyer-datalist">
                {options.buyers.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {options.buyers.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {options.buyers.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBuyer(b)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                        buyer === b
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. PO Number */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                PO / Order Number
              </label>
              <input
                type="text"
                placeholder="Enter PO Number"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* 5. Sewing Line Code (Type & Press Enter to List) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Sewing Line Code</label>
                <span className="text-[10px] text-slate-400">Press Enter to list</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  list="line-datalist"
                  placeholder="Type Line Code & press Enter..."
                  value={lineCode}
                  onChange={(e) => setLineCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleListLineOnEnter();
                    }
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleListLineOnEnter}
                  className="px-2.5 py-2.5 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-700 rounded-xl font-bold text-[11px] transition-colors cursor-pointer shrink-0"
                >
                  List
                </button>
              </div>
              <datalist id="line-datalist">
                {options.lineCodes.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </datalist>
              {options.lineCodes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {options.lineCodes.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLineCode(l.code)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors cursor-pointer ${
                        lineCode === l.code
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {l.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Sample Type (Gold Seal = Gold, Red Seal = Red, Initial = White Tone) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>Sample Type</span>
                  {sampleType.trim() && (
                    <SampleTypeBadge sampleType={sampleType.trim()} size="xs" />
                  )}
                </label>
                <span className="text-[10px] text-slate-400">Press Enter to list</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  list="sampletype-datalist"
                  placeholder="e.g. Initial Sample, Red Seal Sample, Gold Seal Sample..."
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleListSampleTypeOnEnter();
                    }
                  }}
                  className={`flex-1 border rounded-xl p-2.5 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all font-semibold ${
                    getSampleTypeTone(sampleType).inputClass
                  }`}
                />
                <button
                  type="button"
                  onClick={handleListSampleTypeOnEnter}
                  className="px-2.5 py-2.5 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-700 rounded-xl font-bold text-[11px] transition-colors cursor-pointer shrink-0"
                >
                  List
                </button>
              </div>
              <datalist id="sampletype-datalist">
                {Array.from(new Set([...CORE_SEAL_SAMPLE_TYPES, ...options.sampleTypes])).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {Array.from(new Set([...CORE_SEAL_SAMPLE_TYPES, ...options.sampleTypes])).map((t) => {
                  const tone = getSampleTypeTone(t);
                  const isSelected =
                    sampleType.trim().toLowerCase() === t.toLowerCase();
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSampleType(t)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                        isSelected ? tone.activePillClass : tone.idlePillClass
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${tone.dotClass}`}></span>
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 7. SIZE SPEC — INTERACTIVE ENTER-TO-LIST BOX */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>Size Spec Input (Type Size &amp; Press Enter to List)</span>
              </label>
              <span className="text-[10px] text-indigo-300 font-mono">
                Pressing Enter lists the size below without submitting the form
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type size (e.g. S, M, L, XL, 30, 32) and press Enter..."
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddSizeToList();
                  }
                }}
                className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAddSizeToList()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add / List Size</span>
              </button>
            </div>

            {/* Currently Listed Sizes for this Sample */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">
                Listed Sizes:
              </span>
              {listedSizes.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">
                  No sizes listed yet — type a size above and press Enter
                </span>
              ) : (
                listedSizes.map((sz) => (
                  <span
                    key={sz}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs shadow-sm"
                  >
                    <span>{sz}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveListedSize(sz)}
                      className="hover:text-rose-200 cursor-pointer"
                      title="Remove size"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Previously Saved Sizes in Database (Quick Toggle) */}
            {options.sizes.length > 0 && (
              <div className="pt-1.5 border-t border-indigo-500/20 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Saved Sizes (click to toggle):</span>
                {options.sizes.map((s) => {
                  const isSelected = listedSizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleToggleSavedSize(s)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isSelected ? `✓ ${s}` : `+ ${s}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 8. Color, Quantity, Priority, Requested By */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Color / Shade */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Color / Shade</label>
                <span className="text-[10px] text-slate-400">Press Enter to list</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  list="color-options-list"
                  placeholder="Type Color & press Enter..."
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleListColorOnEnter();
                    }
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={handleListColorOnEnter}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-700 rounded-xl font-bold text-[11px] cursor-pointer"
                >
                  List
                </button>
              </div>
              <datalist id="color-options-list">
                {options.colors.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {options.colors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {options.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                        color === c
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Quantity (pcs)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Priority</label>
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

          {/* 9. Fabric Linkage Section */}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fabrics.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">
                    Select Fabric from Stock (or enter custom below)
                  </label>
                  <select
                    value={selectedFabricId}
                    onChange={(e) => setSelectedFabricId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono"
                  >
                    <option value="">-- Enter Custom Fabric Below --</option>
                    {fabrics.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name} ({f.availableYards.toFixed(1)} yds avail)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!selectedFabricId && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Fabric Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FAB-01"
                      value={customFabricCode}
                      onChange={(e) => setCustomFabricCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Fabric Description / Composition
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100% Cotton Twill"
                      value={customFabricName}
                      onChange={(e) => setCustomFabricName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-400 mb-1">
                  Required Fabric Yards
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="500"
                  value={requiredYards}
                  onChange={(e) => setRequiredYards(Math.max(0, Number(e.target.value)))}
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

            {selectedFabric && (
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={autoDeduct}
                  onChange={(e) => setAutoDeduct(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>
                  Automatically deduct {requiredYards} yds from available fabric inventory on save
                </span>
              </label>
            )}
          </div>

          {/* 10. Shipment Date (Mandatory for Fast Approval Priority) */}
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
                Every style is saved with its <strong>Shipment Date</strong> so earlier shipment styles awaiting <strong>Button, Thread, Wash, Trims, or Accessories</strong> approval are prioritized on the Dashboard.
              </p>
            </div>
          </div>

          {/* 11. Target Parcel Date, Wash Recipe, Courier, Requested By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
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
              <label className="block text-slate-300 font-semibold mb-1">
                Requested By / Merchandiser
              </label>
              <input
                type="text"
                placeholder="Enter Merchandiser Name"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Wash Recipe / Finish</label>
                <span className="text-[10px] text-slate-400">Press Enter to list</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  list="wash-datalist"
                  placeholder="Type Wash Recipe & press Enter..."
                  value={washType}
                  onChange={(e) => setWashType(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleListWashOnEnter();
                    }
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={handleListWashOnEnter}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-700 rounded-xl font-bold text-[11px] cursor-pointer"
                >
                  List
                </button>
              </div>
              <datalist id="wash-datalist">
                {options.washTypes.map((w) => (
                  <option key={w} value={w} />
                ))}
              </datalist>
              {options.washTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {options.washTypes.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWashType(w)}
                      className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                        washType === w
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Courier / Service</label>
                <span className="text-[10px] text-slate-400">Press Enter to list</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  list="courier-datalist"
                  placeholder="Type Courier & press Enter..."
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleListCourierOnEnter();
                    }
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={handleListCourierOnEnter}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-700 rounded-xl font-bold text-[11px] cursor-pointer"
                >
                  List
                </button>
              </div>
              <datalist id="courier-datalist">
                {options.couriers.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {options.couriers.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {options.couriers.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCourier(c)}
                      className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                        courier === c
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 12. Thread, Zipper & Button Notes (Included Directly in Requisition Form) */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>
                  Thread, Zipper &amp; Button Notes (Included in Requisition Form)
                </span>
              </label>
              <span className="text-[10px] text-indigo-300/80 font-mono">
                Printed in Main Table &amp; Trims Checklist on Requisition Form
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Thread Note */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeThreadTrim}
                      onChange={(e) => setIncludeThreadTrim(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Thread Note</span>
                  </label>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    THREAD
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. TKT 40/2 DTM / Contrast Gold"
                  value={threadNote}
                  onChange={(e) => setThreadNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Zipper Note */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeZipperTrim}
                      onChange={(e) => setIncludeZipperTrim(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Zipper Note</span>
                  </label>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                    ZIPPER
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. YKK #5 Metal Brass Auto-Lock"
                  value={zipperNote}
                  onChange={(e) => setZipperNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Button Note */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeButtonTrim}
                      onChange={(e) => setIncludeButtonTrim(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Button Note</span>
                  </label>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    BUTTON
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 17mm Antique Brass Shank / 24L"
                  value={buttonNote}
                  onChange={(e) => setButtonNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Requires 2nd confirmation before permanent save (locked once saved)
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {selectedStoredSample && onUpdateStoredStyle && (
                <button
                  type="button"
                  onClick={() => handleProceedToConfirmation('update')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Update Stored Style ({selectedStoredSample.styleCode})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleProceedToConfirmation('create')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {selectedStoredSample
                    ? 'Give New Requisition for Selected Style'
                    : 'Save Requisition (Proceed to Confirmation)'}
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* ============================================================ */}
        {/* 2ND CONFIRMATION MODAL OVERLAY (Edit Option vs Save & Lock) */}
        {/* ============================================================ */}
        {showSecondConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs text-slate-200">
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
                    Please verify all style specifications and the <strong>Shipment Date</strong> below. Click <strong>Edit Requisition</strong> to make changes now, or <strong>Confirm &amp; Save Requisition</strong> to lock and save it permanently.
                  </p>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-700/80">
                  {thumbnail && (
                    <img
                      src={thumbnail}
                      alt={styleName}
                      className="w-14 h-16 rounded-lg object-cover border border-indigo-500/40 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm text-indigo-300 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40">
                        {styleCode.trim().toUpperCase()}
                      </span>
                      <SampleTypeBadge
                        sampleType={sampleType.trim() || 'Initial Sample'}
                        size="sm"
                      />
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-[11px]">
                        Shipment: {shipmentDate}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1 truncate">
                      {styleName.trim()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Buyer: <strong className="text-slate-200">{buyer.trim() || 'N/A'}</strong> • Line: <strong className="text-slate-200 font-mono">{lineCode.trim() || 'N/A'}</strong> • Sizes: <strong className="text-indigo-300 font-mono">{effectiveSizeString || 'Standard'}</strong> ({quantity} pcs)
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
                      {selectedFabric?.code || customFabricCode || 'N/A'} ({requiredYards} yds)
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Color / Shade</span>
                    <span className="font-semibold text-white">{color.trim() || 'N/A'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Wash Recipe</span>
                    <span className="font-semibold text-cyan-300 truncate block">{washType.trim() || 'N/A'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Priority Level</span>
                    <span className="font-bold uppercase text-rose-300">{priority}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Thread Note</span>
                    <span className="font-semibold text-indigo-300 truncate block">{threadNote.trim() || 'AS PER CHART'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Zipper Note</span>
                    <span className="font-semibold text-cyan-300 truncate block">{zipperNote.trim() || '—'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Button Note</span>
                    <span className="font-semibold text-emerald-300 truncate block">{buttonNote.trim() || '—'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-[11px] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong>Permanent Lock Notice:</strong> Once you click <strong>Confirm &amp; Save Requisition</strong> below, this requisition cannot be edited anymore.
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
