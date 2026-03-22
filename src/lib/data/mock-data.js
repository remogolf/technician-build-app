export const buildOrders = [
  {
    id: 'BO-1042',
    partId: 'base_mech_assy',
    partName: 'Base Mech Assembly',
    status: 'in_progress',
    built: 5,
    target: 50,
    nextUnitNumber: 6,
    wipLocation: 'Tech-WIP-01',

    assemblyInstruction: {
      title: 'Base Mech Assembly Procedure',
      revision: 'Rev C',
      url: 'https://example.com/instructions/base-mech-assembly-rev-c'
    },

    bom: [
      {
        bomLineId: 'bom_motor',
        partId: 'motor',
        name: 'Motor',
        required: 1,
        serialized: true,
        tracked: true,
        requiresPairing: true,
        pairBeforeBuild: true
      },
      {
        bomLineId: 'bom_esc',
        partId: 'esc',
        name: 'ESC',
        required: 1,
        serialized: true,
        tracked: true,
        requiresPairing: true,
        pairBeforeBuild: true
      },
      {
        bomLineId: 'bom_frame',
        partId: 'frame',
        name: 'Frame',
        required: 1,
        serialized: false,
        tracked: false,
        requiresPairing: false,
        pairBeforeBuild: false
      },
      {
        bomLineId: 'bom_screw',
        partId: 'screw',
        name: 'Screw',
        required: 4,
        serialized: false,
        tracked: false,
        requiresPairing: false,
        pairBeforeBuild: false
      }
    ],

    stockEntries: [
      // Serialized motors in source stock
      {
        stockId: 'stk_motor_1001',
        partId: 'motor',
        partName: 'Motor',
        locationId: 'shelf_a',
        locationName: 'Shelf A',
        qty: 1,
        serialized: true,
        serial: 'MTR-1001'
      },
      {
        stockId: 'stk_motor_1002',
        partId: 'motor',
        partName: 'Motor',
        locationId: 'shelf_a',
        locationName: 'Shelf A',
        qty: 1,
        serialized: true,
        serial: 'MTR-1002'
      },
      {
        stockId: 'stk_motor_1003',
        partId: 'motor',
        partName: 'Motor',
        locationId: 'shelf_b',
        locationName: 'Shelf B',
        qty: 1,
        serialized: true,
        serial: 'MTR-1003'
      },
      {
        stockId: 'stk_motor_1004',
        partId: 'motor',
        partName: 'Motor',
        locationId: 'shelf_b',
        locationName: 'Shelf B',
        qty: 1,
        serialized: true,
        serial: 'MTR-1004'
      },

      // Serialized ESCs in source stock
      {
        stockId: 'stk_esc_2001',
        partId: 'esc',
        partName: 'ESC',
        locationId: 'elec_01',
        locationName: 'Electronics 01',
        qty: 1,
        serialized: true,
        serial: 'ESC-2001'
      },
      {
        stockId: 'stk_esc_2002',
        partId: 'esc',
        partName: 'ESC',
        locationId: 'elec_01',
        locationName: 'Electronics 01',
        qty: 1,
        serialized: true,
        serial: 'ESC-2002'
      },
      {
        stockId: 'stk_esc_2003',
        partId: 'esc',
        partName: 'ESC',
        locationId: 'elec_02',
        locationName: 'Electronics 02',
        qty: 1,
        serialized: true,
        serial: 'ESC-2003'
      },

      // Non-serialized frames
      {
        stockId: 'stk_frame_a',
        partId: 'frame',
        partName: 'Frame',
        locationId: 'rack_f1',
        locationName: 'Rack F1',
        qty: 12,
        serialized: false,
        serial: null
      },

      // Bulk screws
      {
        stockId: 'stk_screw_a12',
        partId: 'screw',
        partName: 'Screw',
        locationId: 'bin_a12',
        locationName: 'Bin A12',
        qty: 120,
        serialized: false,
        serial: null
      },
      {
        stockId: 'stk_screw_b04',
        partId: 'screw',
        partName: 'Screw',
        locationId: 'bin_b04',
        locationName: 'Bin B04',
        qty: 12,
        serialized: false,
        serial: null
      }
    ],

    wipEntries: [
      // Already picked serialized parts in WIP
      {
        wipEntryId: 'wip_motor_1005',
        stockId: 'wip_motor_1005',
        sourceStockId: 'stk_motor_1005_src',
        partId: 'motor',
        partName: 'Motor',
        locationId: 'tech_wip_01',
        locationName: 'Tech-WIP-01',
        qty: 1,
        serialized: true,
        serial: 'MTR-1005'
      },
      {
        wipEntryId: 'wip_motor_1006',
        stockId: 'wip_motor_1006',
        sourceStockId: 'stk_motor_1006_src',
        partId: 'motor',
        partName: 'Motor',
        locationId: 'tech_wip_01',
        locationName: 'Tech-WIP-01',
        qty: 1,
        serialized: true,
        serial: 'MTR-1006'
      },
      {
        wipEntryId: 'wip_esc_2005',
        stockId: 'wip_esc_2005',
        sourceStockId: 'stk_esc_2005_src',
        partId: 'esc',
        partName: 'ESC',
        locationId: 'tech_wip_01',
        locationName: 'Tech-WIP-01',
        qty: 1,
        serialized: true,
        serial: 'ESC-2005'
      },
      {
        wipEntryId: 'wip_esc_2006',
        stockId: 'wip_esc_2006',
        sourceStockId: 'stk_esc_2006_src',
        partId: 'esc',
        partName: 'ESC',
        locationId: 'tech_wip_01',
        locationName: 'Tech-WIP-01',
        qty: 1,
        serialized: true,
        serial: 'ESC-2006'
      },

      // Picked bulk stock in WIP
      {
        stockId: 'wip_frame_batch_01',
        sourceStockId: 'stk_frame_a',
        partId: 'frame',
        partName: 'Frame',
        locationId: 'tech_wip_01',
        locationName: 'Tech-WIP-01',
        qty: 3,
        serialized: false,
        serial: null
      },
      {
        stockId: 'wip_screw_batch_01',
        sourceStockId: 'stk_screw_a12',
        partId: 'screw',
        partName: 'Screw',
        locationId: 'tech_wip_01',
        locationName: 'Tech-WIP-01',
        qty: 20,
        serialized: false,
        serial: null
      }
    ],

    activeRun: {
      runId: 'run_bo_1042_01',
      targetQty: 3,
      completedQty: 1,
      status: 'assembling',
      startedAt: Date.now() - 1000 * 60 * 30,

      stagedOutputs: [
        {
          stagedId: 'staged_6',
          unitNumber: 6,
          outputSerial: 'BMA-0006',
          status: 'ready',
          createdAt: Date.now() - 1000 * 60 * 10,
          childSerialAssignments: [
            {
              bomLineId: 'bom_motor',
              partId: 'motor',
              requiredQty: 1,
              assignedStockEntryIds: ['wip_motor_1005']
            },
            {
              bomLineId: 'bom_esc',
              partId: 'esc',
              requiredQty: 1,
              assignedStockEntryIds: ['wip_esc_2005']
            }
          ]
        },
        {
          stagedId: 'staged_7',
          unitNumber: 7,
          outputSerial: '',
          status: 'draft',
          createdAt: Date.now() - 1000 * 60 * 5,
          childSerialAssignments: [
            {
              bomLineId: 'bom_motor',
              partId: 'motor',
              requiredQty: 1,
              assignedStockEntryIds: ['wip_motor_1006']
            },
            {
              bomLineId: 'bom_esc',
              partId: 'esc',
              requiredQty: 1,
              assignedStockEntryIds: []
            }
          ]
        }
      ],

      outputs: [
        {
          outputId: 'out_5',
          unitNumber: 5,
          serial: 'BMA-0005',
          status: 'built',
          createdAt: Date.now() - 1000 * 60 * 20,
          childSerialAssignments: [
            {
              bomLineId: 'bom_motor',
              partId: 'motor',
              stockEntryIds: ['wip_motor_1004_prev']
            },
            {
              bomLineId: 'bom_esc',
              partId: 'esc',
              stockEntryIds: ['wip_esc_2004_prev']
            }
          ]
        }
      ]
    }
  }
];