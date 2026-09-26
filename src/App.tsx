/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  INITIAL_SAMPLES,
  INITIAL_FABRICS,
  INITIAL_NOTIFICATIONS,
} from './data/initialData';
import {
  SampleItem,
  SampleStage,
  STAGE_CONFIG,
  ApprovalDetails,
  ParcelDetails,
  VolarRequisitionForm,
  generateWhatsAppFollowUpLink,
  getSampleImage,
} from './types/sample';
import { FabricItem, isFabricLowStock } from './types/fabric';
import { PushNotification } from './types/notification';
import { BVTestItem, INITIAL_BV_TESTS, isTestOverdueForResubmission } from './types/test';
import {
  supabase,
  fetchAllSupabaseData,
  upsertSampleInSupabase,
  deleteSampleFromSupabase,
  upsertFabricInSupabase,
  upsertBVTestInSupabase,
  deleteBVTestFromSupabase,
  insertNotificationInSupabase,
  markNotificationReadInSupabase,
  markAllNotificationsReadInSupabase,
  clearAllNotificationsInSupabase,
  clearAllDatabaseTablesInSupabase,
} from './lib/supabase';

import { Navbar } from './components/Navbar';
import { StyleProductImage, ImageZoomProvider } from './components/StyleProductImage';
import { AppView } from './components/Sidebar';
import { MainModulesBottom } from './components/MainModulesBottom';
import { DashboardView } from './components/DashboardView';
import { AllSamplesView } from './components/AllSamplesView';
import { WashSectionView } from './components/WashSectionView';
import { FinishingSectionView } from './components/FinishingSectionView';
import { ApprovalParcelView } from './components/ApprovalParcelView';
import { TestSectionView } from './components/TestSectionView';
import { FabricInventoryView } from './components/FabricInventoryView';

import { NewSampleModal } from './components/NewSampleModal';
import { StageAdvanceModal } from './components/StageAdvanceModal';
import { SampleDetailModal } from './components/SampleDetailModal';
import { RestockFabricModal } from './components/RestockFabricModal';
import { AddFabricModal } from './components/AddFabricModal';
import { FollowUpModal } from './components/FollowUpModal';
import { RequisitionCompleteModal } from './components/RequisitionCompleteModal';
import { NewBVTestModal } from './components/NewBVTestModal';
import { UpdateBVResultModal } from './components/UpdateBVResultModal';
import { ResubmitBVTestModal } from './components/ResubmitBVTestModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { NotificationToastContainer } from './components/NotificationToastContainer';

// Sound utility for real-time notification chimes
function playNotificationChime(type: 'critical' | 'success' | 'info' | 'warning') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'critical') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.12);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
    } else {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    }

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio restriction errors
  }
}

export default function App() {
  // Purge legacy demo localStorage keys on load so the live app starts 100% clean
  useEffect(() => {
    try {
      localStorage.removeItem('threadtrack_samples');
      localStorage.removeItem('threadtrack_fabrics');
      localStorage.removeItem('threadtrack_notifs');
      localStorage.removeItem('threadtrack_bv_tests');
      localStorage.removeItem('threadtrack_live_req_options_v1');
    } catch {
      // Ignore storage access errors in restricted browsers
    }
  }, []);

  // 1. Persistence State (Fresh Live Keys + Cloud Sync with Supabase)
  const [samples, setSamples] = useState<SampleItem[]>(() => {
    try {
      const saved = localStorage.getItem('threadtrack_live_samples_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((s: SampleItem) => ({
            ...s,
            sampleType: (s.sampleType as string) === 'Pre-Production (PP)' ? 'Red Seal Sample' : s.sampleType,
            thumbnail: s.thumbnail || getSampleImage(s),
            images: s.images && s.images.length > 0 ? s.images : [s.thumbnail || getSampleImage(s)],
          }));
        }
      }
    } catch {
      // Ignore parse/storage error
    }
    return INITIAL_SAMPLES;
  });

  const [fabrics, setFabrics] = useState<FabricItem[]>(() => {
    try {
      const saved = localStorage.getItem('threadtrack_live_fabrics_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse/storage error
    }
    return INITIAL_FABRICS;
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    try {
      const saved = localStorage.getItem('threadtrack_live_notifs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse/storage error
    }
    return INITIAL_NOTIFICATIONS;
  });

  // 1.4 Bureau Veritas (BV) Tests State
  const [tests, setTests] = useState<BVTestItem[]>(() => {
    try {
      const saved = localStorage.getItem('threadtrack_live_bv_tests_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse/storage error
    }
    return INITIAL_BV_TESTS;
  });

  // Load initial data from Supabase & subscribe to real-time updates
  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      const data = await fetchAllSupabaseData();
      if (!data || !isMounted) return;
      setSamples(data.samples);
      setFabrics(data.fabrics);
      setTests(data.tests);
      setNotifications(data.notifications);
    }

    void loadCloudData();

    const client = supabase;
    if (!client) return;

    let channel: ReturnType<typeof client.channel> | null = null;
    try {
      channel = client
        .channel('threadtrack-live-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'samples' }, () => {
          void loadCloudData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fabrics' }, () => {
          void loadCloudData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bv_tests' }, () => {
          void loadCloudData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          void loadCloudData();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription warning:', err);
    }

    return () => {
      isMounted = false;
      if (channel) {
        try {
          void client.removeChannel(channel);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Save to localStorage cache
  useEffect(() => {
    try {
      localStorage.setItem('threadtrack_live_samples_v1', JSON.stringify(samples));
    } catch {
      // Ignore storage quota/access errors
    }
  }, [samples]);

  useEffect(() => {
    try {
      localStorage.setItem('threadtrack_live_fabrics_v1', JSON.stringify(fabrics));
    } catch {
      // Ignore storage quota/access errors
    }
  }, [fabrics]);

  useEffect(() => {
    try {
      localStorage.setItem('threadtrack_live_notifs_v1', JSON.stringify(notifications));
    } catch {
      // Ignore storage quota/access errors
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('threadtrack_live_bv_tests_v1', JSON.stringify(tests));
    } catch {
      // Ignore storage quota/access errors
    }
  }, [tests]);

  // 2. Navigation & Search State
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialStageFilter, setInitialStageFilter] = useState<SampleStage | 'all'>('all');

  // 3. Modals State
  const [isNewSampleModalOpen, setIsNewSampleModalOpen] = useState(false);
  const [isRequisitionCompleteModalOpen, setIsRequisitionCompleteModalOpen] = useState(false);
  const [completedRequisitionSample, setCompletedRequisitionSample] = useState<SampleItem | null>(null);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [selectedSampleForAdvance, setSelectedSampleForAdvance] = useState<SampleItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSampleForDetail, setSelectedSampleForDetail] = useState<SampleItem | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedSampleForFollowUp, setSelectedSampleForFollowUp] = useState<SampleItem | null>(null);

  // Test Modals State
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState(false);
  const [isUpdateResultModalOpen, setIsUpdateResultModalOpen] = useState(false);
  const [selectedTestForUpdate, setSelectedTestForUpdate] = useState<BVTestItem | null>(null);
  const [isResubmitTestModalOpen, setIsResubmitTestModalOpen] = useState(false);
  const [selectedTestForResubmit, setSelectedTestForResubmit] = useState<BVTestItem | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedFabricForRestock, setSelectedFabricForRestock] = useState<FabricItem | null>(null);
  const [isAddFabricModalOpen, setIsAddFabricModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Push Notification Dispatcher
  const sendPushNotification = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'critical',
    extra?: { sampleId?: string; fabricCode?: string; styleCode?: string }
  ) => {
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      ...extra,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    void insertNotificationInSupabase(newNotif);
    playNotificationChime(type);
  };

  // 4. Sample Requisition Creation
  const handleCreateSample = (
    sampleData: Partial<SampleItem>,
    deductYards: boolean
  ) => {
    const newSample = sampleData as SampleItem;
    newSample.id = `smp-${Date.now()}`;

    // Auto deduct fabric if requested
    if (deductYards && newSample.fabricId) {
      setFabrics((prev) =>
        prev.map((f) => {
          if (f.id === newSample.fabricId) {
            const updatedAvailable = Math.max(
              0,
              f.availableYards - newSample.fabricRequiredYards
            );
            const updatedAllocated =
              f.allocatedYards + newSample.fabricRequiredYards;

            // Link style code if not already linked
            const updatedLinks = f.linkedStyleCodes.includes(newSample.styleCode)
              ? f.linkedStyleCodes
              : [...f.linkedStyleCodes, newSample.styleCode];

            // If newly falls <= 5 yds, trigger critical alert!
            if (updatedAvailable <= 5) {
              sendPushNotification(
                'Critical Fabric Shortage Alert!',
                `Fabric ${f.code} has fallen to ${updatedAvailable.toFixed(1)} yds (≤ 5 yds threshold). Linked to Style ${newSample.styleCode}.`,
                'critical',
                { fabricCode: f.code, styleCode: newSample.styleCode }
              );
            }

            const updatedFabric: FabricItem = {
              ...f,
              availableYards: updatedAvailable,
              allocatedYards: updatedAllocated,
              linkedStyleCodes: updatedLinks,
            };
            void upsertFabricInSupabase(updatedFabric);
            return updatedFabric;
          }
          return f;
        })
      );
    }

    setSamples((prev) => [newSample, ...prev]);
    void upsertSampleInSupabase(newSample);
    setCompletedRequisitionSample(newSample);
    setIsRequisitionCompleteModalOpen(true);

    sendPushNotification(
      'New Sample Requisition Raised',
      `Requisition for ${newSample.styleCode} (${newSample.styleName}) initialized in Requisition stage.`,
      'info',
      { sampleId: newSample.id, styleCode: newSample.styleCode }
    );
  };

  const handleSaveRequisitionForm = (sampleId: string, form: VolarRequisitionForm) => {
    const lockedForm: VolarRequisitionForm = {
      ...form,
      isLocked: true,
      lockedAt: form.lockedAt || new Date().toISOString(),
    };
    setSamples((prev) =>
      prev.map((s) => {
        if (s.id === sampleId) {
          const updated: SampleItem = {
            ...s,
            shipmentDate: lockedForm.shipmentDate || s.shipmentDate || s.targetParcelDate,
            isRequisitionLocked: true,
            requisitionForm: lockedForm,
            updatedAt: new Date().toISOString(),
          };
          void upsertSampleInSupabase(updated);
          return updated;
        }
        return s;
      })
    );
    if (completedRequisitionSample && completedRequisitionSample.id === sampleId) {
      setCompletedRequisitionSample((prev) =>
        prev
          ? {
              ...prev,
              shipmentDate: lockedForm.shipmentDate || prev.shipmentDate,
              isRequisitionLocked: true,
              requisitionForm: lockedForm,
            }
          : null
      );
    }
    if (selectedSampleForDetail && selectedSampleForDetail.id === sampleId) {
      setSelectedSampleForDetail((prev) =>
        prev
          ? {
              ...prev,
              shipmentDate: lockedForm.shipmentDate || prev.shipmentDate,
              isRequisitionLocked: true,
              requisitionForm: lockedForm,
            }
          : null
      );
    }
    sendPushNotification(
      'Requisition Saved & Permanently Locked',
      `Requisition for ${ lockedForm.descriptionCode || 'Style' } has been confirmed and permanently locked.`,
      'success',
      { sampleId }
    );
  };

  const handleUpdateSampleThumbnail = (
    sampleId: string,
    newThumbnail: string,
    additionalImages?: string[]
  ) => {
    setSamples((prev) =>
      prev.map((s) => {
        if (s.id === sampleId) {
          const updated = {
            ...s,
            thumbnail: newThumbnail,
            images: additionalImages || [newThumbnail, ...(s.images || [])],
            updatedAt: new Date().toISOString(),
          };
          void upsertSampleInSupabase(updated);
          return updated;
        }
        return s;
      })
    );
    if (selectedSampleForDetail && selectedSampleForDetail.id === sampleId) {
      setSelectedSampleForDetail((prev) =>
        prev
          ? {
              ...prev,
              thumbnail: newThumbnail,
              images: additionalImages || [newThumbnail, ...(prev.images || [])],
            }
          : null
      );
    }
  };

  // 5. Stage Advancement Engine
  const handleConfirmAdvanceStage = (
    sampleId: string,
    targetStage: SampleStage,
    note: string,
    operator: string,
    stageUpdates?: any
  ) => {
    setSamples((prev) =>
      prev.map((s) => {
        if (s.id === sampleId) {
          const updatedHistory = [
            ...s.stageHistory,
            {
              stage: targetStage,
              timestamp: new Date().toISOString(),
              note,
              operator,
            },
          ];

          const updated = {
            ...s,
            stage: targetStage,
            updatedAt: new Date().toISOString(),
            stageHistory: updatedHistory,
            ...stageUpdates,
          };

          void upsertSampleInSupabase(updated);
          return updated;
        }
        return s;
      })
    );

    const sample = samples.find((s) => s.id === sampleId);
    const styleCode = sample?.styleCode || 'Style';
    const targetLabel = STAGE_CONFIG[targetStage].label;

    sendPushNotification(
      `Status Advanced: ${targetLabel}`,
      `Style ${styleCode} has successfully moved to "${targetLabel}".`,
      targetStage === 'approval_comments' ? 'success' : 'info',
      { sampleId, styleCode }
    );
  };

  // Direct advance trigger helper
  const handleTriggerAdvance = (sample: SampleItem) => {
    setSelectedSampleForAdvance(sample);
    setIsAdvanceModalOpen(true);
  };

  // 6. Approval Comments & Parcel Updates
  const handleUpdateApprovalDetails = (
    sampleId: string,
    details: ApprovalDetails
  ) => {
    setSamples((prev) =>
      prev.map((s) => {
        if (s.id === sampleId) {
          const updated = {
            ...s,
            approvalDetails: details,
            updatedAt: new Date().toISOString(),
          };
          void upsertSampleInSupabase(updated);
          return updated;
        }
        return s;
      })
    );

    const sample = samples.find((s) => s.id === sampleId);
    sendPushNotification(
      'Buyer Remarks Saved',
      `Approval remarks updated for ${sample?.styleCode || 'Style'}. Verdict: ${details.overallVerdict.toUpperCase()}`,
      details.overallVerdict === 'approved' ? 'success' : 'info',
      { sampleId, styleCode: sample?.styleCode }
    );
  };

  const handleUpdateParcelDetails = (
    sampleId: string,
    details: ParcelDetails
  ) => {
    setSamples((prev) =>
      prev.map((s) => {
        if (s.id === sampleId) {
          const updated = {
            ...s,
            parcelDetails: details,
            updatedAt: new Date().toISOString(),
          };
          void upsertSampleInSupabase(updated);
          return updated;
        }
        return s;
      })
    );
  };

  // 7. Finishing Checklist item toggle
  const handleToggleFinishingChecklist = (
    sampleId: string,
    itemKey: 'ironingDone' | 'threadTrimmingDone' | 'taggingDone' | 'qualityPassed'
  ) => {
    setSamples((prev) =>
      prev.map((s) => {
        if (s.id === sampleId) {
          const currentVal = s.finishingDetails[itemKey];
          const updated = {
            ...s,
            finishingDetails: {
              ...s.finishingDetails,
              [itemKey]: !currentVal,
            },
            updatedAt: new Date().toISOString(),
          };
          void upsertSampleInSupabase(updated);
          return updated;
        }
        return s;
      })
    );
  };

  // 8. Fabric Stock Management & Resolution
  const handleConfirmRestockFabric = (
    fabricId: string,
    additionalYards: number
  ) => {
    setFabrics((prev) =>
      prev.map((f) => {
        if (f.id === fabricId) {
          const newAvailable = Math.max(0, f.availableYards + additionalYards);
          const wasLow = f.availableYards <= 5;
          const isNowSufficient = newAvailable > 5;

          if (wasLow && isNowSufficient) {
            sendPushNotification(
              'Fabric Low Stock Resolved',
              `Fabric ${f.code} restocked to ${newAvailable.toFixed(1)} yds. Red alert cleared.`,
              'success',
              { fabricCode: f.code }
            );
          } else if (newAvailable <= 5) {
            sendPushNotification(
              'Fabric Stock Warning',
              `Fabric ${f.code} current available stock is ${newAvailable.toFixed(1)} yds (≤ 5 yds).`,
              'warning',
              { fabricCode: f.code }
            );
          } else {
            sendPushNotification(
              'Fabric Stock Received',
              `Received ${additionalYards} yds of ${f.code}. Total available: ${newAvailable.toFixed(1)} yds.`,
              'info',
              { fabricCode: f.code }
            );
          }

          const updatedFabric: FabricItem = {
            ...f,
            availableYards: newAvailable,
            lastReceivedDate: new Date().toISOString().split('T')[0],
          };
          void upsertFabricInSupabase(updatedFabric);
          return updatedFabric;
        }
        return f;
      })
    );
  };

  const handleAddNewFabric = (fabric: FabricItem) => {
    setFabrics((prev) => [fabric, ...prev]);
    void upsertFabricInSupabase(fabric);
    sendPushNotification(
      'New Fabric Registered',
      `Fabric ${fabric.code} (${fabric.name}) added with ${fabric.availableYards} yds initial stock.`,
      'success',
      { fabricCode: fabric.code }
    );
  };

  // 9. Parcel Follow-Up & Workbook Sent Handlers
  const handleOpenFollowUp = (sample: SampleItem) => {
    setSelectedSampleForFollowUp(sample);
    setIsFollowUpModalOpen(true);
  };

  const handleToggleWorkbookSent = (sampleId: string) => {
    setSamples((prev) =>
      prev.map((s) => {
        if (s.id === sampleId) {
          const nextSent = !s.parcelDetails.workbookSent;
          const updated = {
            ...s,
            updatedAt: new Date().toISOString(),
            parcelDetails: {
              ...s.parcelDetails,
              workbookSent: nextSent,
              workbookSentDate: nextSent
                ? s.parcelDetails.workbookSentDate || new Date().toISOString().split('T')[0]
                : undefined,
            },
          };
          void upsertSampleInSupabase(updated);
          return updated;
        }
        return s;
      })
    );

    const target = samples.find((s) => s.id === sampleId);
    const nowSent = !target?.parcelDetails.workbookSent;
    sendPushNotification(
      nowSent ? 'Workbook Sent Confirmed' : 'Workbook Status: Pending',
      nowSent
        ? `Workbook sent confirmed for Style ${target?.styleName || 'Style'} (${target?.styleCode || ''}).`
        : `Workbook marked as pending dispatch for Style ${target?.styleName || 'Style'}.`,
      nowSent ? 'success' : 'warning',
      { sampleId, styleCode: target?.styleCode }
    );
  };

  const handleSaveFollowUp = (
    sampleId: string,
    followUpData: {
      followUpDate: string;
      followUpTime?: string;
      status: 'pending' | 'completed' | 'scheduled';
      whatsAppNumber: string;
      notes?: string;
    },
    workbookSent: boolean,
    workbookSentDate?: string,
    workbookNotes?: string
  ) => {
    setSamples((prev) =>
      prev.map((s) => {
        if (s.id === sampleId) {
          const updated = {
            ...s,
            updatedAt: new Date().toISOString(),
            parcelDetails: {
              ...s.parcelDetails,
              workbookSent,
              workbookSentDate: workbookSent
                ? workbookSentDate || new Date().toISOString().split('T')[0]
                : undefined,
              workbookNotes,
              followUp: {
                ...s.parcelDetails.followUp,
                ...followUpData,
              },
            },
          };
          void upsertSampleInSupabase(updated);
          return updated;
        }
        return s;
      })
    );

    const target = samples.find((s) => s.id === sampleId);
    sendPushNotification(
      'Follow-Up & Workbook Updated',
      `Follow-up scheduled (${followUpData.followUpDate}) and Workbook status updated for ${target?.styleName || 'Style'}.`,
      'info',
      { sampleId, styleCode: target?.styleCode }
    );
  };

  const handleSendWhatsAppNotification = (
    sample: SampleItem,
    phone: string,
    customMessage?: string
  ) => {
    const url = generateWhatsAppFollowUpLink(sample, phone, customMessage);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Update follow up timestamp
    setSamples((prev) =>
      prev.map((s) => {
        if (s.id === sample.id) {
          const updated = {
            ...s,
            parcelDetails: {
              ...s.parcelDetails,
              followUp: {
                followUpDate:
                  s.parcelDetails.followUp?.followUpDate ||
                  new Date().toISOString().split('T')[0],
                status: 'scheduled' as const,
                whatsAppNumber: phone,
                notes: s.parcelDetails.followUp?.notes,
                lastNotifiedAt: new Date().toISOString(),
              },
            },
          };
          void upsertSampleInSupabase(updated);
          return updated;
        }
        return s;
      })
    );

    sendPushNotification(
      'WhatsApp Follow-Up Dispatched',
      `Follow-up notification for Style "${sample.styleName}" (${sample.styleCode}) dispatched to connected WhatsApp: ${phone}`,
      'success',
      { sampleId: sample.id, styleCode: sample.styleCode }
    );
  };

  // 10. Bureau Veritas (BV) Test Module Handlers
  const handleCreateBVTest = (testData: Partial<BVTestItem>) => {
    const newTest: BVTestItem = {
      ...testData,
      id: `test-bv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as BVTestItem;

    setTests((prev) => [newTest, ...prev]);
    void upsertBVTestInSupabase(newTest);

    sendPushNotification(
      'Sample Sent to Bureau Veritas (BV)',
      `${newTest.sampleType === 'garment' ? `Garment ${newTest.styleCode}` : `Fabric ${newTest.fabricCode}`} dispatched to BV for testing. Expected: ${newTest.expectedDate}`,
      'info',
      { sampleId: newTest.sampleId, styleCode: newTest.styleCode }
    );
  };

  const handleSaveBVTestResult = (
    testId: string,
    resultData: {
      reportNumber: string;
      resultDate: string;
      overallResult: 'PASS' | 'FAIL';
      status: 'passed' | 'failed';
      failReason?: string;
      failedParameters?: any[];
      reTestRequired: boolean;
      inspectorNotes?: string;
    }
  ) => {
    const now = new Date().toISOString();
    const dueTimestamp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    setTests((prev) =>
      prev.map((t) => {
        if (t.id === testId) {
          const updated: BVTestItem = {
            ...t,
            ...resultData,
            failedTimestamp: resultData.status === 'failed' ? now : undefined,
            resubmitDueTimestamp: resultData.status === 'failed' ? dueTimestamp : undefined,
            updatedAt: now,
          };
          void upsertBVTestInSupabase(updated);
          return updated;
        }
        return t;
      })
    );

    const test = tests.find((t) => t.id === testId);
    const isFail = resultData.overallResult === 'FAIL';

    sendPushNotification(
      isFail ? 'BV Test Result: FAILED (24h Re-Test Active)' : 'BV Test Result: PASSED ✅',
      isFail
        ? `Report ${resultData.reportNumber}: ${test?.styleCode || test?.fabricCode} failed due to ${resultData.failReason || 'parameters'}. Re-submit to BV required within 24h.`
        : `Report ${resultData.reportNumber}: ${test?.styleCode || test?.fabricCode} passed all BV quality standards!`,
      isFail ? 'critical' : 'success',
      { sampleId: test?.sampleId, styleCode: test?.styleCode }
    );
  };

  const handleResubmitBVTest = (
    testId: string,
    resubmitData: {
      resubmittedDate: string;
      expectedDate: string;
      resubmissionNotes: string;
      retestReportNumber: string;
    }
  ) => {
    setTests((prev) =>
      prev.map((t) => {
        if (t.id === testId) {
          const updated: BVTestItem = {
            ...t,
            status: 'retest_submitted',
            resubmittedDate: resubmitData.resubmittedDate,
            expectedDate: resubmitData.expectedDate,
            resubmissionNotes: resubmitData.resubmissionNotes,
            previousReportNumber: t.reportNumber,
            retestReportNumber: resubmitData.retestReportNumber,
            updatedAt: new Date().toISOString(),
          };
          void upsertBVTestInSupabase(updated);
          return updated;
        }
        return t;
      })
    );

    const test = tests.find((t) => t.id === testId);
    sendPushNotification(
      'BV Re-Test Specimen Dispatched',
      `Re-test sample for ${test?.styleCode || test?.fabricCode} dispatched to Bureau Veritas. Reference: ${resubmitData.retestReportNumber}.`,
      'info',
      { sampleId: test?.sampleId, styleCode: test?.styleCode }
    );
  };

  const handleDeleteBVTest = (testId: string) => {
    setTests((prev) => prev.filter((t) => t.id !== testId));
    void deleteBVTestFromSupabase(testId);
    sendPushNotification('Test Record Removed', 'BV test item removed from registry.', 'info');
  };

  // 24-Hour Overdue Re-test Check & Notification Dispatcher
  useEffect(() => {
    const overdueTests = tests.filter((t) => isTestOverdueForResubmission(t));
    if (overdueTests.length > 0) {
      overdueTests.forEach((ot) => {
        const alreadyNotified = notifications.some(
          (n) => n.title.includes('24H Re-Test Alert') && n.message.includes(ot.styleCode || ot.fabricCode || '')
        );
        if (!alreadyNotified) {
          sendPushNotification(
            '⚠️ 24H Re-Test Alert: Bureau Veritas (BV)',
            `Sample ${ot.styleCode || ot.fabricCode} failed ${ot.failReason?.split(':')[0] || 'BV test'}. 24+ hours elapsed since failure. Immediate re-submission to BV required!`,
            'critical',
            { sampleId: ot.sampleId, styleCode: ot.styleCode }
          );
        }
      });
    }
  }, [tests]);

  const handleDeleteSample = (sampleId: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== sampleId));
    void deleteSampleFromSupabase(sampleId);
    sendPushNotification('Sample Removed', 'Sample has been removed from tracking.', 'info');
  };

  // Export & Reset
  const handleExportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ samples, fabrics, tests }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ga_sample_tracking_master_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetData = () => {
    localStorage.removeItem('threadtrack_live_samples_v1');
    localStorage.removeItem('threadtrack_live_fabrics_v1');
    localStorage.removeItem('threadtrack_live_notifs_v1');
    localStorage.removeItem('threadtrack_live_bv_tests_v1');
    localStorage.removeItem('threadtrack_clean_req_options_v2');
    void clearAllDatabaseTablesInSupabase();
    setSamples(INITIAL_SAMPLES);
    setFabrics(INITIAL_FABRICS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setTests(INITIAL_BV_TESTS);
  };

  // Counts for sidebar & badges
  const lowFabricCount = fabrics.filter(isFabricLowStock).length;
  const overdueTestCount = tests.filter(isTestOverdueForResubmission).length;

  const counts = {
    total: samples.length,
    sewing: samples.filter((s) => s.stage === 'sewing').length,
    wash: samples.filter((s) => s.stage === 'wash').length,
    finishing: samples.filter((s) => s.stage === 'finishing').length,
    readyForParcel: samples.filter((s) => s.stage === 'ready_for_parcel').length,
    approvals: samples.filter((s) => s.stage === 'approval_comments').length,
    lowFabric: lowFabricCount,
    testCount: tests.length,
    testOverdue: overdueTestCount,
  };

  return (
    <ImageZoomProvider onUpdateSampleThumbnail={handleUpdateSampleThumbnail}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onNewRequisition={() => setIsNewSampleModalOpen(true)}
        lowStockCount={lowFabricCount}
        onNavigateToLowStock={() => {
          setCurrentView('fabric_inventory');
        }}
        onExportData={handleExportData}
        onResetData={handleResetData}
      />

      {/* 2. Main Full-Width View Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto">
        <main className="p-4 sm:p-6 lg:p-8 pb-32 sm:pb-28 min-w-0">
          {currentView === 'dashboard' && (
            <DashboardView
              samples={samples}
              fabrics={fabrics}
              tests={tests}
              onNavigateToView={(view, filter) => {
                setCurrentView(view);
                if (filter?.stage) {
                  setInitialStageFilter(filter.stage);
                }
              }}
              onSelectSample={(sample) => {
                setSelectedSampleForDetail(sample);
                setIsDetailModalOpen(true);
              }}
              onAdvanceStage={handleTriggerAdvance}
              onNewRequisition={() => setIsNewSampleModalOpen(true)}
              onRestockFabric={(fabric) => {
                setSelectedFabricForRestock(fabric);
                setIsRestockModalOpen(true);
              }}
              onOpenFollowUp={handleOpenFollowUp}
              onToggleWorkbookSent={handleToggleWorkbookSent}
              onSendWhatsApp={handleSendWhatsAppNotification}
              onUpdateApprovalDetails={handleUpdateApprovalDetails}
            />
          )}

          {currentView === 'all_samples' && (
            <AllSamplesView
              samples={samples}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectSample={(sample) => {
                setSelectedSampleForDetail(sample);
                setIsDetailModalOpen(true);
              }}
              onAdvanceStage={handleTriggerAdvance}
              onNewRequisition={() => setIsNewSampleModalOpen(true)}
              onDeleteSample={handleDeleteSample}
              initialStageFilter={initialStageFilter}
              onOpenFollowUp={handleOpenFollowUp}
              onToggleWorkbookSent={handleToggleWorkbookSent}
              onSendWhatsApp={handleSendWhatsAppNotification}
              onOpenRequisitionSlip={(sample) => {
                setCompletedRequisitionSample(sample);
                setIsRequisitionCompleteModalOpen(true);
              }}
            />
          )}

          {currentView === 'wash' && (
            <WashSectionView
              samples={samples}
              onSelectSample={(sample) => {
                setSelectedSampleForDetail(sample);
                setIsDetailModalOpen(true);
              }}
              onAdvanceStage={handleTriggerAdvance}
            />
          )}

          {currentView === 'finishing' && (
            <FinishingSectionView
              samples={samples}
              onSelectSample={(sample) => {
                setSelectedSampleForDetail(sample);
                setIsDetailModalOpen(true);
              }}
              onAdvanceStage={handleTriggerAdvance}
              onToggleChecklistItem={handleToggleFinishingChecklist}
            />
          )}

          {currentView === 'approvals' && (
            <ApprovalParcelView
              samples={samples}
              onSelectSample={(sample) => {
                setSelectedSampleForDetail(sample);
                setIsDetailModalOpen(true);
              }}
              onAdvanceStage={handleTriggerAdvance}
              onUpdateApprovalDetails={handleUpdateApprovalDetails}
              onUpdateParcelDetails={handleUpdateParcelDetails}
              onOpenFollowUp={handleOpenFollowUp}
              onToggleWorkbookSent={handleToggleWorkbookSent}
              onSendWhatsApp={handleSendWhatsAppNotification}
            />
          )}

          {currentView === 'test' && (
            <TestSectionView
              tests={tests}
              samples={samples}
              fabrics={fabrics}
              onOpenNewTestModal={() => setIsNewTestModalOpen(true)}
              onOpenUpdateResultModal={(test) => {
                setSelectedTestForUpdate(test);
                setIsUpdateResultModalOpen(true);
              }}
              onOpenResubmitModal={(test) => {
                setSelectedTestForResubmit(test);
                setIsResubmitTestModalOpen(true);
              }}
              onDeleteTest={handleDeleteBVTest}
            />
          )}

          {currentView === 'fabric_inventory' && (
            <FabricInventoryView
              fabrics={fabrics}
              samples={samples}
              onRestockFabric={(fabric) => {
                setSelectedFabricForRestock(fabric);
                setIsRestockModalOpen(true);
              }}
              onAddNewFabric={() => setIsAddFabricModalOpen(true)}
              onDeductFabric={(fabric) => {
                handleConfirmRestockFabric(fabric.id, -2.5);
              }}
              onSelectSampleByCode={(code) => {
                const found = samples.find((s) => s.styleCode === code);
                if (found) {
                  setSelectedSampleForDetail(found);
                  setIsDetailModalOpen(true);
                } else {
                  setSearchQuery(code);
                  setCurrentView('all_samples');
                }
              }}
            />
          )}
        </main>
      </div>

      {/* 3. Main Tracking Modules in Bottom Side as Main Modules */}
      <MainModulesBottom
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          setInitialStageFilter('all');
        }}
        counts={counts}
      />

      {/* Floating Push Notification Toasts */}
      <NotificationToastContainer
        notifications={notifications}
        onDismiss={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
          void markNotificationReadInSupabase(id);
        }}
        onNotificationClick={(notif) => {
          if (notif.sampleId) {
            const found = samples.find((s) => s.id === notif.sampleId);
            if (found) {
              setSelectedSampleForDetail(found);
              setIsDetailModalOpen(true);
            }
          } else if (notif.fabricCode) {
            setCurrentView('fabric_inventory');
          }
        }}
      />

      {/* Slide-over Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          void markAllNotificationsReadInSupabase();
        }}
        onClearNotifications={() => {
          setNotifications([]);
          void clearAllNotificationsInSupabase();
        }}
        onNotificationClick={(notif) => {
          setIsNotificationDrawerOpen(false);
          if (notif.sampleId) {
            const found = samples.find((s) => s.id === notif.sampleId);
            if (found) {
              setSelectedSampleForDetail(found);
              setIsDetailModalOpen(true);
            }
          } else if (notif.fabricCode) {
            setCurrentView('fabric_inventory');
          }
        }}
      />

      {/* Modals */}
      <NewSampleModal
        isOpen={isNewSampleModalOpen}
        onClose={() => setIsNewSampleModalOpen(false)}
        fabrics={fabrics}
        onCreateSample={handleCreateSample}
        onOpenAddFabric={() => setIsAddFabricModalOpen(true)}
      />

      <StageAdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => {
          setIsAdvanceModalOpen(false);
          setSelectedSampleForAdvance(null);
        }}
        sample={selectedSampleForAdvance}
        onConfirmAdvance={handleConfirmAdvanceStage}
      />

      <SampleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSampleForDetail(null);
        }}
        sample={selectedSampleForDetail}
        onAdvanceStage={handleTriggerAdvance}
        onOpenFollowUp={handleOpenFollowUp}
        onToggleWorkbookSent={handleToggleWorkbookSent}
        onSendWhatsApp={handleSendWhatsAppNotification}
        onOpenRequisitionSlip={(sample) => {
          setCompletedRequisitionSample(sample);
          setIsRequisitionCompleteModalOpen(true);
        }}
        onUpdateSampleThumbnail={handleUpdateSampleThumbnail}
      />

      <RequisitionCompleteModal
        isOpen={isRequisitionCompleteModalOpen}
        onClose={() => {
          setIsRequisitionCompleteModalOpen(false);
          setCompletedRequisitionSample(null);
        }}
        sample={completedRequisitionSample}
        onSaveForm={handleSaveRequisitionForm}
        onViewInPipeline={(sample) => {
          setCurrentView('all_samples');
          setSelectedSampleForDetail(sample);
          setIsDetailModalOpen(true);
        }}
      />

      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setSelectedSampleForFollowUp(null);
        }}
        sample={selectedSampleForFollowUp}
        onSaveFollowUp={handleSaveFollowUp}
        onSendWhatsApp={handleSendWhatsAppNotification}
      />

      <RestockFabricModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setSelectedFabricForRestock(null);
        }}
        fabric={selectedFabricForRestock}
        onConfirmRestock={handleConfirmRestockFabric}
      />

      <AddFabricModal
        isOpen={isAddFabricModalOpen}
        onClose={() => setIsAddFabricModalOpen(false)}
        onAddFabric={handleAddNewFabric}
      />

      {/* Bureau Veritas (BV) Test Modals */}
      <NewBVTestModal
        isOpen={isNewTestModalOpen}
        onClose={() => setIsNewTestModalOpen(false)}
        samples={samples}
        fabrics={fabrics}
        onCreateTest={handleCreateBVTest}
      />

      <UpdateBVResultModal
        isOpen={isUpdateResultModalOpen}
        onClose={() => {
          setIsUpdateResultModalOpen(false);
          setSelectedTestForUpdate(null);
        }}
        test={selectedTestForUpdate}
        onSaveResult={handleSaveBVTestResult}
      />

      <ResubmitBVTestModal
        isOpen={isResubmitTestModalOpen}
        onClose={() => {
          setIsResubmitTestModalOpen(false);
          setSelectedTestForResubmit(null);
        }}
        test={selectedTestForResubmit}
        onConfirmResubmit={handleResubmitBVTest}
      />
      </div>
    </ImageZoomProvider>
  );
}

