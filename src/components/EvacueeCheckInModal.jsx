// ==============================================================================
// TwinGuard AI - Mobile Evacuee Indoor Check-In Modal
// First-time onboarding upon scanning QR code: Floor & Room selection with suggestions
// Displays full floor architecture, exit diagnostics, and personal identity registration
// ==============================================================================

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  DoorOpen,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  Layers,
  Compass,
  CheckCircle2,
  X,
  Flame,
  Radio,
  ChevronRight
} from 'lucide-react';
import { FLOOR_THEMES, ROOM_TEMPLATES } from '../simulation/Doorways.js';

// Dynamic Department Generator for all 100 Rooms
const getRoomDetails = (floor, roomIdx) => {
  const tmpl = ROOM_TEMPLATES[roomIdx];
  const roomNum = `${floor}${roomIdx < 9 ? '0' + (roomIdx + 1) : roomIdx + 1}`;
  const isNorth = tmpl.centerZ < 0;
  const wing = isNorth ? 'North Wing' : 'South Wing';

  const theme = FLOOR_THEMES[floor] || { name: 'Corporate Division', prefix: `L${floor}` };

  const deptMap = {
    1: ['Cafe Lounge', 'Visitor Concierge', 'Grand Atrium Reception', 'Logistics Depot', 'Baggage Inspection', 'Facility Ops', 'Security Dispatch', 'Medical Triage', 'Transit Dispatch', 'Grand Portico'],
    2: ['Accounting Suite', 'Corporate Audit', 'Legal Chambers', 'Contracts Division', 'Tax Advisory', 'Risk Assessment', 'Compliance Office', 'Treasury Operations', 'Billing Annex', 'Financial Analytics'],
    3: ['Cloud Infra Lab', 'DevOps Ops Center', 'Kubernetes Core', 'Microservices Studio', 'Database Clusters', 'API Gateway Hub', 'Backend Architecture', 'QA Automation', 'SRE Incident Room', 'Cloud Security'],
    4: ['Neural Computing Lab', 'Deep Learning Hub', 'Computer Vision Studio', 'Robotics Innovation', 'Large Model Research', 'Cognitive Architecture', 'Autonomous Systems', 'Edge Inference', 'GPU Cluster Ops', 'AI Safety Annex'],
    5: ['Cyber Defense SOC', 'Threat Intel Center', 'Malware Analysis', 'Penetration Testing', 'Firewall Operations', 'Zero Trust Architecture', 'Identity & Access', 'Forensic Investigations', 'Security Analytics', 'Crisis Command'],
    6: ['Global Brand Studio', 'Media Production', 'Public Relations', 'Social Analytics', 'Campaign Strategy', 'Digital Content Hub', 'Creative Design Lab', 'Market Research', 'Press Briefing Suite', 'Broadcast Studio'],
    7: ['Design System Core', 'UI/UX Interactive Lab', '3D Prototyping Studio', 'Ergonomics Center', 'Product Strategy', 'Industrial Design', 'User Research Hub', 'Wireframing Suite', 'Design Ops Lab', 'Exhibition Showcase'],
    8: ['Genomics Laboratory', 'Biosensor Testing', 'Nanotech Research', 'Biochemical Core', 'Cellular Analysis', 'Cleanroom Facility', 'Sensor Calibration', 'Environmental Chamber', 'Spectroscopy Lab', 'Cryo Storage Annex'],
    9: ['Global Strategy Suite', 'Vice Presidents Office', 'International Relations', 'Corporate Expansion', 'M&A Advisory', 'Diplomatic Lounge', 'Strategic Briefing', 'Executive Conference', 'Regional Directors Hub', 'Protocol Suite'],
    10: ['Executive Penthouse', 'Chairman Private Suite', 'Presidential Boardroom', 'VIP Strategy Studio', 'Skyline Horizon Suite', 'Global Board Chamber', 'Executive Council', 'High-Level Summit Room', 'Chief Counsel Chamber', 'Observation Penthouse']
  };

  const depts = deptMap[floor] || deptMap[4];
  const deptName = depts[roomIdx] || `Office ${roomNum}`;

  return {
    id: `f${floor}_${tmpl.idSuffix}`,
    roomNum: `Room ${roomNum}`,
    name: deptName,
    fullName: `${theme.prefix} • Room ${roomNum} (${deptName})`,
    wing,
    doorX: tmpl.doorX,
    centerX: tmpl.centerX,
    centerZ: tmpl.centerZ
  };
};

export function EvacueeCheckInModal({
  isOpen,
  initialFloor = 4,
  initialRoomId = 'f4_r1',
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  const [selectedFloor, setSelectedFloor] = useState(initialFloor);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [searchQuery, setSearchQuery] = useState('');
  const [wingFilter, setWingFilter] = useState('ALL'); // 'ALL' | 'NORTH' | 'SOUTH'
  const [step, setStep] = useState(1); // Step 1: Select Floor -> Step 2: Select Room & Review Floor Info

  // Generate All 10 Rooms on Selected Floor
  const roomsOnSelectedFloor = useMemo(() => {
    return Array.from({ length: 10 }, (_, idx) => getRoomDetails(selectedFloor, idx));
  }, [selectedFloor]);

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return roomsOnSelectedFloor.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.roomNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesWing =
        wingFilter === 'ALL' ||
        (wingFilter === 'NORTH' && r.wing === 'North Wing') ||
        (wingFilter === 'SOUTH' && r.wing === 'South Wing');

      return matchesSearch && matchesWing;
    });
  }, [roomsOnSelectedFloor, searchQuery, wingFilter]);

  // Selected Room Object
  const currentSelectedRoom = useMemo(() => {
    return (
      roomsOnSelectedFloor.find((r) => r.id === selectedRoomId) ||
      roomsOnSelectedFloor[0]
    );
  }, [roomsOnSelectedFloor, selectedRoomId]);

  // Handle Submission
  const handleComplete = () => {
    onConfirm({
      floor: selectedFloor,
      roomId: currentSelectedRoom.id,
      roomName: `${currentSelectedRoom.roomNum} - ${currentSelectedRoom.name}`
    });
  };

  const floorTheme = FLOOR_THEMES[selectedFloor] || { name: 'Commercial Tower' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] rounded-3xl border border-slate-700/80 shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #0d1527 0%, #090e1a 100%)',
          color: '#f8fafc',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-white">
                  Indoor Digital Twin Check-In
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step {step} of 2
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Register your exact physical presence in the building
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* ──────── STEP 1: SELECT FLOOR LEVEL ──────── */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Layers className="w-4 h-4" />
                  Select Your Current Floor Level (1 - 10):
                </span>
                <span className="text-[11px] text-slate-400">10 Total Storeys</span>
              </div>

              {/* 10-Floor Vertical Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((fl) => {
                  const theme = FLOOR_THEMES[fl] || { name: 'Corporate Division' };
                  const isSelected = selectedFloor === fl;

                  return (
                    <button
                      key={fl}
                      onClick={() => {
                        setSelectedFloor(fl);
                        // Auto-assign first room of that floor
                        setSelectedRoomId(`f${fl}_r1`);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-400'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-slate-800/90 text-white border border-slate-700/80">
                          Level {fl}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div className="text-[11px] font-bold text-slate-200 truncate mt-1">
                        {theme.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {fl === 1 ? 'Ground Portals & Plaza' : '2 Core Stairwells • 10 Rooms'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step 1 Next Button */}
              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer mt-2"
              >
                <span>Continue to Room Selection (Floor {selectedFloor})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ──────── STEP 2: SELECT SPECIFIC ROOM & FLOOR OVERVIEW ──────── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Floor Overview & Evacuation Readiness Card (Requirement 2) */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-black">
                      LEVEL {selectedFloor}
                    </span>
                    <span className="text-xs font-bold text-indigo-200">
                      {floorTheme.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-[10.5px] text-indigo-300 hover:text-white underline font-semibold cursor-pointer"
                  >
                    Change Floor
                  </button>
                </div>

                {/* Exits and Stairwells Diagnostic */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-500/20 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">West Wing Exit:</div>
                    <div className="font-extrabold text-white flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Stairwell Core A
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">24m • Pressurized Safe Core</div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">East Wing Exit:</div>
                    <div className="font-extrabold text-white flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Stairwell Core B
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">42m • Pressurized Safe Core</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10.5px] text-indigo-300 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>2 Fire Hose Cabinets • 10 Class-A Fire Barrier Doors Monitored</span>
                </div>
              </div>

              {/* Room Selection Heading & Suggestions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <DoorOpen className="w-4 h-4" />
                    Which Room / Lab are you currently in?
                  </span>
                  <span className="text-[10.5px] text-slate-400">10 Rooms Available</span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search room number or department (e.g. 401, Neural, Lab)..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                {/* Wing Filter Chips */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setWingFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors ${
                      wingFilter === 'ALL'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    All Rooms (10)
                  </button>
                  <button
                    onClick={() => setWingFilter('NORTH')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors ${
                      wingFilter === 'NORTH'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    North Wing (Rooms 01 - 05)
                  </button>
                  <button
                    onClick={() => setWingFilter('SOUTH')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors ${
                      wingFilter === 'SOUTH'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    South Wing (Rooms 06 - 10)
                  </button>
                </div>
              </div>

              {/* 10 Room Cards */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {filteredRooms.map((rm) => {
                  const isSelected = selectedRoomId === rm.id;

                  return (
                    <button
                      key={rm.id}
                      onClick={() => setSelectedRoomId(rm.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all active:scale-98 cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {rm.roomNum.replace('Room ', '')}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {rm.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {rm.wing} • Doorway at X: {rm.doorX}m
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-indigo-400">
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Action Confirm */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  Back
                </button>

                <button
                  onClick={handleComplete}
                  className="flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Location & Enter Facility</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

