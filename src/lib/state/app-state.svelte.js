// @ts-nocheck
import { buildOrders as seedOrders } from '$lib/data/mock-data.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const appState = $state({
  buildOrders: clone(seedOrders)
});

export function getBuildOrder(id) {
  return appState.buildOrders.find((bo) => bo.id === id);
}

export function getBoRemainingQty(boId) {
  const bo = getBuildOrder(boId);
  if (!bo) return 0;
  return Math.max(0, bo.target - bo.built);
}

export function startRun(boId, qty) {
  const bo = getBuildOrder(boId);
  if (!bo) return false;

  const remaining = getBoRemainingQty(boId);
  const safeQty = Math.max(1, Math.min(qty, remaining));

  bo.activeRun = {
    targetQty: safeQty,
    completedQty: 0,
    outputs: [],
    stagedOutputs: []
  };

  return true;
}

export function clearRun(boId) {
  const bo = getBuildOrder(boId);
  if (!bo) return;
  bo.activeRun = null;
}

export function getActiveRun(boId) {
  const bo = getBuildOrder(boId);
  return bo?.activeRun ?? null;
}

export function getRunRemainingQty(boId) {
  const run = getActiveRun(boId);
  if (!run) return 0;
  return Math.max(0, run.targetQty - run.completedQty);
}

export function isRunComplete(boId) {
  return getRunRemainingQty(boId) === 0;
}

export function getBomLine(boId, partId) {
  const bo = getBuildOrder(boId);
  if (!bo) return null;
  return bo.bom.find((line) => line.partId === partId) ?? null;
}

export function getSourceEntriesForPart(boId, partId) {
  const bo = getBuildOrder(boId);
  if (!bo) return [];

  return bo.stockEntries
    .filter((entry) => entry.partId === partId && entry.qty > 0)
    .map((entry) => ({ ...entry }));
}

export function getWipEntriesForPart(boId, partId) {
  const bo = getBuildOrder(boId);
  if (!bo) return [];

  return bo.wipEntries
    .filter((entry) => entry.partId === partId && entry.qty > 0)
    .map((entry) => ({ ...entry }));
}

export function getSourceQtyForPart(boId, partId) {
  return getSourceEntriesForPart(boId, partId).reduce((sum, entry) => sum + entry.qty, 0);
}

export function getWipQtyForPart(boId, partId) {
  return getWipEntriesForPart(boId, partId).reduce((sum, entry) => sum + entry.qty, 0);
}

export function getRunRequiredQtyForPart(boId, partId) {
  const line = getBomLine(boId, partId);
  const run = getActiveRun(boId);
  if (!line || !run) return 0;
  return line.required * run.targetQty;
}

export function getNextUnitRequiredQtyForPart(boId, partId) {
  const line = getBomLine(boId, partId);
  if (!line) return 0;
  return line.required;
}

export function getBomLineState(boId, partId) {
  const line = getBomLine(boId, partId);
  const run = getActiveRun(boId);
  if (!line) return null;

  const source = getSourceQtyForPart(boId, partId);
  const wip = getWipQtyForPart(boId, partId);
  const runRequired = run ? line.required * run.targetQty : line.required;
  const missing = Math.max(0, runRequired - wip);
  const ready = wip >= runRequired;
  const sourceEntries = getSourceEntriesForPart(boId, partId);

  return {
    ...line,
    perUnitRequired: line.required,
    runTargetQty: run?.targetQty ?? 1,
    runRequired,
    source,
    wip,
    missing,
    ready,
    sourceEntriesCount: sourceEntries.length
  };
}

export function getRequiredPartsState(boId) {
  const bo = getBuildOrder(boId);
  if (!bo) return [];
  return bo.bom.map((line) => getBomLineState(boId, line.partId));
}

export function getReadyCount(boId) {
  return getRequiredPartsState(boId).filter((line) => line.ready).length;
}

export function canStageFullRun(boId) {
  const lines = getRequiredPartsState(boId);
  return lines.length > 0 && lines.every((line) => line.ready);
}

export function canBuildNextUnit(boId) {
  const bo = getBuildOrder(boId);
  if (!bo) return false;

  for (const line of bo.bom) {
    const wipQty = getWipQtyForPart(boId, line.partId);
    if (wipQty < line.required) {
      return false;
    }
  }

  return true;
}

export function moveFromSourceToWip(boId, stockId, qty = 1) {
  const bo = getBuildOrder(boId);
  if (!bo || qty <= 0) return false;

  const stockEntry = bo.stockEntries.find((entry) => entry.stockId === stockId);
  if (!stockEntry || stockEntry.qty <= 0) return false;

  const transferable = Math.min(stockEntry.qty, qty);
  if (transferable <= 0) return false;

  stockEntry.qty -= transferable;

  const existingWip = bo.wipEntries.find(
    (entry) => entry.partId === stockEntry.partId && entry.sourceStockId === stockEntry.stockId
  );

  if (existingWip) {
    existingWip.qty += transferable;
  } else {
    bo.wipEntries.push({
      wipEntryId: uid('wip'),
      partId: stockEntry.partId,
      partName: stockEntry.partName,
      qty: transferable,
      sourceStockId: stockEntry.stockId,
      sourceLocationId: stockEntry.locationId,
      sourceLocationName: stockEntry.locationName
    });
  }

  bo.stockEntries = [...bo.stockEntries];
  bo.wipEntries = [...bo.wipEntries];

  return true;
}

export function getReturnDestinationsForWipEntry(boId, wipEntryId) {
  const bo = getBuildOrder(boId);
  if (!bo) return [];

  const wipEntry = bo.wipEntries.find((entry) => entry.wipEntryId === wipEntryId);
  if (!wipEntry) return [];

  return bo.stockEntries
    .filter((entry) => entry.partId === wipEntry.partId)
    .map((entry) => ({
      stockId: entry.stockId,
      locationId: entry.locationId,
      locationName: entry.locationName,
      qty: entry.qty,
      isOriginal: entry.stockId === wipEntry.sourceStockId
    }));
}

export function returnFromWip(boId, wipEntryId, qty = 1, destinationStockId = null) {
  const bo = getBuildOrder(boId);
  if (!bo || qty <= 0) return false;

  const wipEntry = bo.wipEntries.find((entry) => entry.wipEntryId === wipEntryId);
  if (!wipEntry || wipEntry.qty <= 0) return false;

  const targetStockId = destinationStockId ?? wipEntry.sourceStockId;
  const destinationEntry = bo.stockEntries.find((entry) => entry.stockId === targetStockId);
  if (!destinationEntry) return false;
  if (destinationEntry.partId !== wipEntry.partId) return false;

  const transferable = Math.min(wipEntry.qty, qty);
  if (transferable <= 0) return false;

  wipEntry.qty -= transferable;
  destinationEntry.qty += transferable;

  bo.wipEntries = bo.wipEntries.filter((entry) => entry.qty > 0);
  bo.stockEntries = [...bo.stockEntries];
  bo.wipEntries = [...bo.wipEntries];
  return true;
}

export function getWipEntriesGrouped(boId) {
  const bo = getBuildOrder(boId);
  if (!bo) return [];

  /** @type {Record<string, any>} */
  const grouped = {};

  for (const entry of bo.wipEntries) {
    if (entry.qty <= 0) continue;

    if (!grouped[entry.partId]) {
      grouped[entry.partId] = {
        partId: entry.partId,
        partName: entry.partName,
        totalQty: 0,
        entries: []
      };
    }

    const group = grouped[entry.partId];
    group.totalQty += entry.qty;
    group.entries.push({ ...entry });
  }

  return Object.values(grouped);
}

export function getBomLineSourceOptions(boId, lineId) {
  const bo = getBuildOrder(boId);
  if (!bo) return [];

  const line = bo.bom.find((x) => x.bomLineId === lineId || x.partId === lineId || x.id === lineId);
  if (!line) return [];

  const relevant = bo.stockEntries.filter((entry) => entry.partId === line.partId && entry.qty > 0);

  const requiresSerial = line.serialized === true || line.tracked === true || line.requiresSerialTracking === true;

  if (requiresSerial) {
    return relevant
      .filter((entry) => entry.qty > 0)
      .flatMap((entry) => {
        // Serialized entries should be handled as one-by-one entries.
        // If, for some reason, qty > 1 is present, emit one entry per unit.
        const qty = Math.max(1, Math.floor(entry.qty));
        return Array.from({ length: qty }, (_, index) => ({
          key: `serial-stock-${entry.stockId}-${entry.serial ?? index}`,
          stockId: String(entry.stockId),
          locationName: entry.locationName,
          qty: 1,
          isSerialized: true,
          serial: entry.serial ?? entry.serialNumber ?? null,
          labelSecondary: entry.serial ?? entry.serialNumber ?? 'Serialized item'
        }));
      });
  }

  const grouped = {};

  for (const entry of relevant) {
    if (entry.qty <= 0) continue;
    const key = String(entry.stockId);

    if (grouped[key]) {
      grouped[key].qty += entry.qty;
    } else {
      grouped[key] = {
        key: `bulk-${entry.stockId}`,
        stockId: String(entry.stockId),
        locationName: entry.locationName,
        qty: entry.qty,
        isSerialized: false,
        serial: null,
        labelSecondary: 'Bulk stock'
      };
    }
  }

  return Object.values(grouped);
}

export function getWipDisplayEntries(boId) {
  const bo = getBuildOrder(boId);
  if (!bo || !bo.wipEntries) return [];

  const grouped = {};

  for (const entry of bo.wipEntries) {
    const key = String(entry.partId);
    if (!grouped[key]) {
      grouped[key] = {
        partId: entry.partId,
        partName: entry.partName,
        totalQty: 0,
        bulkQty: 0,
        serializedCount: 0,
        serializedItems: [],
        sourceLocationNames: [],
        rawEntries: []
      };
    }

    const group = grouped[key];
    group.totalQty += entry.qty;
    group.rawEntries.push(entry);

    if (entry.sourceLocationName && !group.sourceLocationNames.includes(entry.sourceLocationName)) {
      group.sourceLocationNames.push(entry.sourceLocationName);
    }

    if (entry.serial || entry.serialNumber) {
      group.serializedCount += 1;
      group.serializedItems.push({
        stockId: String(entry.stockId),
        serial: entry.serial ?? entry.serialNumber,
        qty: entry.qty,
        sourceLocationName: entry.sourceLocationName
      });
    } else {
      group.bulkQty += entry.qty;
    }
  }

  return Object.values(grouped);
}

export function getAllSourcePartsSummary(boId) {
  const bo = getBuildOrder(boId);
  if (!bo) return [];

  /** @type {Record<string, any>} */
  const grouped = {};

  for (const entry of bo.stockEntries) {
    if (!grouped[entry.partId]) {
      grouped[entry.partId] = {
        partId: entry.partId,
        partName: entry.partName,
        totalQty: 0,
        entries: []
      };
    }

    const group = grouped[entry.partId];
    group.totalQty += entry.qty;
    group.entries.push({ ...entry });
  }

  return Object.values(grouped);
}

export function completeOneUnitInRun(boId) {
  const bo = getBuildOrder(boId);
  const run = getActiveRun(boId);
  if (!bo || !run) return false;
  if (!canBuildNextUnit(boId)) return false;
  if (run.completedQty >= run.targetQty) return false;

  for (const line of bo.bom) {
    let remaining = line.required;

    const candidates = bo.wipEntries
      .filter((entry) => entry.partId === line.partId && entry.qty > 0)
      .sort((a, b) => a.qty - b.qty);

    for (const entry of candidates) {
      if (remaining <= 0) break;
      const used = Math.min(entry.qty, remaining);
      entry.qty -= used;
      remaining -= used;
    }

    if (remaining > 0) return false;
  }

  bo.wipEntries = bo.wipEntries.filter((entry) => entry.qty > 0);

  const output = {
    outputId: uid('out'),
    unitNumber: bo.nextUnitNumber,
    serial: '',
    status: 'awaiting_serial',
    createdAt: Date.now()
  };

  run.outputs.push(output);
  run.completedQty += 1;
  bo.built += 1;
  bo.nextUnitNumber += 1;
  bo.status = bo.built >= bo.target ? 'done' : 'in_progress';

  return true;
}

export function getPendingSerialOutputs(boId) {
  const run = getActiveRun(boId);
  if (!run) return [];
  return run.outputs.filter((output) => output.status === 'awaiting_serial');
}

export function getRunOutputs(boId) {
  const run = getActiveRun(boId);
  if (!run) return [];
  return run.outputs;
}

export function getRunOutputById(boId, outputId) {
  const run = getActiveRun(boId);
  if (!run) return null;
  return run.outputs.find((output) => output.outputId === outputId) ?? null;
}

export function getStagedOutputById(boId, stagedId) {
  const run = getActiveRun(boId);
  if (!run) return null;
  return run.stagedOutputs.find((stage) => stage.stagedId === stagedId) ?? null;
}

export function createStagedOutput(boId, unitNumber) {
  const run = getActiveRun(boId);
  if (!run) return null;

  const staged = {
    stagedId: uid('staged'),
    unitNumber,
    outputSerial: '',
    status: 'draft',
    childSerialAssignments: [],
    createdAt: Date.now()
  };

  run.stagedOutputs.push(staged);
  return staged;
}

export function getRunStagedOutputs(boId) {
  const run = getActiveRun(boId);
  if (!run) return [];
  return run.stagedOutputs.filter((stage) => stage.status !== 'cancelled');
}

export function updateStagedOutputSerial(boId, stagedId, serial) {
  const staged = getStagedOutputById(boId, stagedId);
  if (!staged) return false;

  const clean = (serial ?? '').trim();
  staged.outputSerial = clean;
  if (clean) {
    staged.status = staged.status === 'draft' ? 'ready' : staged.status;
  }
  return true;
}

export function assignSerializedChildToStagedOutput(boId, stagedId, bomLineId, stockEntryId) {
  const staged = getStagedOutputById(boId, stagedId);
  if (!staged) return false;

  let child = staged.childSerialAssignments.find((x) => x.bomLineId === bomLineId);
  if (!child) {
    child = {
      bomLineId,
      partId: null,
      requiredQty: 1,
      assignedStockEntryIds: [],
      mode: 'required'
    };
    staged.childSerialAssignments.push(child);
  }

  if (!child.assignedStockEntryIds.includes(stockEntryId)) {
    child.assignedStockEntryIds.push(stockEntryId);
  }

  return true;
}

export function removeSerializedChildFromStagedOutput(boId, stagedId, bomLineId, stockEntryId) {
  const staged = getStagedOutputById(boId, stagedId);
  if (!staged) return false;

  const child = staged.childSerialAssignments.find((x) => x.bomLineId === bomLineId);
  if (!child) return false;

  child.assignedStockEntryIds = child.assignedStockEntryIds.filter((id) => id !== stockEntryId);

  return true;
}

export function deleteOrCancelStagedOutput(boId, stagedId) {
  const run = getActiveRun(boId);
  if (!run) return false;

  const staged = run.stagedOutputs.find((x) => x.stagedId === stagedId);
  if (!staged) return false;

  staged.status = 'cancelled';
  return true;
}

export function isStagedOutputReady(boId, stagedId) {
  const staged = getStagedOutputById(boId, stagedId);
  if (!staged) return false;

  if (!staged.outputSerial || !staged.outputSerial.trim()) return false;

  for (const child of staged.childSerialAssignments) {
    if (!child.assignedStockEntryIds || child.assignedStockEntryIds.length < (child.requiredQty || 1)) {
      return false;
    }
  }

  return true;
}

export function completeStagedOutput(boId, stagedId) {
  return commitStagedOutput(boId, stagedId) !== null;
}

export function getNextStagedUnitNumber(boId) {
  const run = getActiveRun(boId);
  if (!run) return 1;
  const existing = run.stagedOutputs.map((x) => x.unitNumber);
  return existing.length === 0 ? 1 : Math.max(...existing) + 1;
}

export function consumeSpecificWipEntries(boId, stockEntryIds) {
  const bo = getBuildOrder(boId);
  if (!bo) return false;

  for (const wipId of stockEntryIds) {
    const entry = bo.wipEntries.find((e) => e.wipEntryId === wipId);
    if (!entry || entry.qty <= 0) {
      return false;
    }
    entry.qty -= 1;
  }

  bo.wipEntries = bo.wipEntries.filter((entry) => entry.qty > 0);
  return true;
}

export function commitStagedOutput(boId, stagedId) {
  const bo = getBuildOrder(boId);
  const run = getActiveRun(boId);
  if (!bo || !run) return null;

  const staged = getStagedOutputById(boId, stagedId);
  if (!staged || staged.status === 'committed' || staged.status === 'cancelled') return null;

  if (!isStagedOutputReady(boId, stagedId)) return null;

  const explicitStockIds = [];
  for (const child of staged.childSerialAssignments || []) {
    for (const entryId of child.assignedStockEntryIds || []) {
      explicitStockIds.push(entryId);
    }
  }

  const consumedExplicit = consumeSpecificWipEntries(boId, explicitStockIds);
  if (!consumedExplicit) return null;

  const serializedLineIds = (staged.childSerialAssignments || []).map((child) => child.bomLineId);

  for (const line of bo.bom) {
    if (serializedLineIds.includes(line.partId) || serializedLineIds.includes(line.id)) {
      continue;
    }

    let remaining = line.required;
    const candidates = bo.wipEntries
      .filter((entry) => entry.partId === line.partId && entry.qty > 0)
      .sort((a, b) => a.qty - b.qty);

    for (const entry of candidates) {
      if (remaining <= 0) break;
      const used = Math.min(entry.qty, remaining);
      entry.qty -= used;
      remaining -= used;
    }

    if (remaining > 0) {
      return null;
    }
  }

  bo.wipEntries = bo.wipEntries.filter((entry) => entry.qty > 0);

  const output = {
    outputId: uid('out'),
    unitNumber: staged.unitNumber,
    serial: staged.outputSerial,
    status: 'built',
    createdAt: Date.now(),
    stagedId: staged.stagedId,
    childSerialAssignments: (staged.childSerialAssignments || []).map((child) => ({
      bomLineId: child.bomLineId,
      partId: child.partId,
      stockEntryIds: [...child.assignedStockEntryIds]
    }))
  };

  run.outputs.push(output);
  run.completedQty += 1;
  bo.built += 1;
  bo.nextUnitNumber += 1;
  bo.status = bo.built >= bo.target ? 'done' : 'in_progress';

  staged.status = 'committed';
  staged.committedOutputId = output.outputId;

  return output;
}


export function getSerializedTrackedBomLines(boId) {
  const bo = getBuildOrder(boId);
  if (!bo) return [];

  const serializedTrackedParts = ['motor', 'esc', 'frame'];

  return bo.bom.filter((line) => {
    if (!line || typeof line.required !== 'number' || line.required <= 0) {
      return false;
    }

    if (line.serialized === true || line.tracked === true) {
      return true;
    }

    if (serializedTrackedParts.includes(line.partId)) {
      return true;
    }

    return false;
  });
}

export function getAvailableSerializedWipEntriesForBomLine(boId, bomLineId, excludeAssigned = true) {
  const bo = getBuildOrder(boId);
  const run = getActiveRun(boId);
  if (!bo) return [];

  const bomLine = bo.bom.find((line) => line.partId === bomLineId || line.id === bomLineId);
  if (!bomLine) return [];

  const assignedEntryIds = [];
  if (excludeAssigned && run && Array.isArray(run.stagedOutputs)) {
    for (const staged of run.stagedOutputs) {
      if (staged.status === 'cancelled') continue;
      for (const child of staged.childSerialAssignments || []) {
        if (child.bomLineId === bomLineId) {
          for (const entryId of child.assignedStockEntryIds || []) {
            if (!assignedEntryIds.includes(entryId)) {
              assignedEntryIds.push(entryId);
            }
          }
        }
      }
    }
  }

  return bo.wipEntries
    .filter((entry) => entry.partId === bomLine.partId && entry.qty > 0)
    .filter((entry) => (excludeAssigned ? !assignedEntryIds.includes(entry.wipEntryId) : true));
}

export function assignSerialToOutput(boId, outputId, serial) {
  const run = getActiveRun(boId);
  if (!run) return false;

  const output = run.outputs.find((x) => x.outputId === outputId);
  if (!output) return false;

  const clean = serial.trim();
  if (!clean) return false;

  output.serial = clean;
  output.status = 'serialized';
  return true;
}

export function reassignOutputSerial(boId, outputId, serial) {
  const run = getActiveRun(boId);
  if (!run) return false;

  const output = run.outputs.find((x) => x.outputId === outputId);
  if (!output || output.status !== 'built') return false;

  const clean = (serial ?? '').trim();
  if (!clean) return false;

  output.serial = clean;
  output.status = 'built';
  return true;
}

export function reassignOutputChildStockEntry(boId, outputId, bomLineId, oldEntryId, newEntryId) {
  const run = getActiveRun(boId);
  if (!run) return false;

  const output = run.outputs.find((x) => x.outputId === outputId);
  if (!output || output.status !== 'built') return false;

  const child = output.childSerialAssignments?.find((c) => c.bomLineId === bomLineId);
  if (!child) return false;

  const idx = child.stockEntryIds.indexOf(oldEntryId);
  if (idx === -1) return false;

  child.stockEntryIds[idx] = newEntryId;
  return true;
}

export function areAllRunOutputsSerialized(boId) {
  const run = getActiveRun(boId);
  if (!run) return false;
  if (run.outputs.length === 0) return false;
  return run.outputs.every((output) => output.status === 'serialized');
}

export function updateBomPicked(boId, itemId, delta = 1) {
  const bo = getBuildOrder(boId);
  if (!bo) return;

  const item = bo.bom.find((x) => x.id === itemId);
  if (!item) return;

  item.picked = Math.max(0, Math.min(item.required, item.picked + delta));
}

export function resetAssemblyState(boId) {
  const bo = getBuildOrder(boId);
  if (!bo) return;

  bo.bom.forEach((item) => {
    item.picked = 0;
  });

  bo.steps.forEach((step) => {
    step.done = false;
  });

  bo.serial = '';
}

export function toggleStep(boId, stepId) {
  const bo = getBuildOrder(boId);
  if (!bo) return;

  const step = bo.steps.find((x) => x.id === stepId);
  if (!step) return;

  step.done = !step.done;
}

export function setSerial(boId, serial) {
  const bo = getBuildOrder(boId);
  if (!bo) return;

  bo.serial = serial;
}

export function completeUnit(boId) {
  const bo = getBuildOrder(boId);
  if (!bo) return;

  bo.built += 1;
  bo.nextUnitNumber += 1;
  bo.status = bo.built >= bo.target ? 'done' : 'in_progress';

  resetAssemblyState(boId);
}
