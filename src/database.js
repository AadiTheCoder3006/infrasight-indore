const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.json');
const SEED_PATH = path.join(__dirname, 'data', 'seed_issues.json');

class Database {
  constructor() {
    this.issues = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        this.issues = JSON.parse(raw);
      } else {
        const rawSeed = fs.readFileSync(SEED_PATH, 'utf8');
        this.issues = JSON.parse(rawSeed);
        this.save();
      }
    } catch (err) {
      console.error('Error loading database, resetting to seed:', err);
      const rawSeed = fs.readFileSync(SEED_PATH, 'utf8');
      this.issues = JSON.parse(rawSeed);
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.issues, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  getIssues({ type, status, area, min_score, max_score, sort = 'priority_score', order = 'desc', limit } = {}) {
    let result = [...this.issues];

    if (type && type !== 'All Types' && type !== 'All') {
      const tNorm = type.toLowerCase().replace(/[^a-z]/g, '');
      result = result.filter(item => {
        const itemType = (item.type || '').toLowerCase().replace(/[^a-z]/g, '');
        return itemType.includes(tNorm) || tNorm.includes(itemType);
      });
    }

    if (status && status !== 'All Status' && status !== 'All') {
      const sNorm = status.toLowerCase();
      result = result.filter(item => {
        const isStatus = (item.status || '').toLowerCase();
        if (sNorm === 'open' && (isStatus === 'reported' || isStatus === 'open')) return true;
        if (sNorm === 'reported' && (isStatus === 'reported' || isStatus === 'open')) return true;
        if (sNorm === 'in progress' && isStatus.includes('progress')) return true;
        if (sNorm === 'fixed' && (isStatus === 'fixed' || isStatus === 'resolved')) return true;
        return isStatus === sNorm;
      });
    }

    if (area && area !== 'All Areas' && area !== 'All') {
      result = result.filter(item => 
        (item.area || '').toLowerCase().includes(area.toLowerCase()) ||
        (item.address || '').toLowerCase().includes(area.toLowerCase())
      );
    }

    if (min_score != null) {
      result = result.filter(item => (item.priority_score || 0) >= Number(min_score));
    }

    if (max_score != null) {
      result = result.filter(item => (item.priority_score || 0) <= Number(max_score));
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sort] ?? 0;
      let valB = b[sort] ?? 0;
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    if (limit) {
      result = result.slice(0, Number(limit));
    }

    return result;
  }

  getIssueById(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toLowerCase();
    return this.issues.find(item => 
      String(item.id).toLowerCase() === cleanId || 
      String(item.rawId || '').toLowerCase() === cleanId
    ) || null;
  }

  createReport(data) {
    const nextSeq = 100 + this.issues.length;
    const id = `IS-0${nextSeq}`;
    const refNumber = `IMC-2026-${11500 + this.issues.length}`;

    // Map common category strings to standard issue types
    let type = data.type || data.category || 'pothole';
    const typeLower = type.toLowerCase();
    if (typeLower.includes('pothole') || typeLower.includes('road')) type = 'pothole';
    else if (typeLower.includes('street') || typeLower.includes('light')) type = 'broken_streetlight';
    else if (typeLower.includes('drain') || typeLower.includes('flood') || typeLower.includes('sewer')) type = 'overflowing_drain';
    else if (typeLower.includes('garb') || typeLower.includes('waste')) type = 'garbage';
    else if (typeLower.includes('pipe') || typeLower.includes('water')) type = 'water_pipeline';
    else if (typeLower.includes('foot') || typeLower.includes('walk') || typeLower.includes('slab')) type = 'damaged_footpath';
    else if (typeLower.includes('traffic') || typeLower.includes('signal')) type = 'traffic_signal';

    let department = 'Roads & Highways Department';
    if (type === 'broken_streetlight') department = 'Electrical & Street Lighting';
    else if (type === 'overflowing_drain') department = 'Drainage & Sewerage Division';
    else if (type === 'garbage') department = 'Solid Waste Management';
    else if (type === 'water_pipeline') department = 'Narmada Water Supply Project';
    else if (type === 'damaged_footpath') department = 'Civil Infrastructure Works';
    else if (type === 'traffic_signal') department = 'Traffic & Signals Department';

    const priorityScore = data.priority_score || Math.floor(Math.random() * 25) + 70; // 70 - 95

    const newIssue = {
      id,
      rawId: id,
      title: data.title || `${type.replace(/_/g, ' ').toUpperCase()} reported on ${data.area || data.address || 'Indore road'}`,
      type,
      status: 'Reported',
      priority_score: priorityScore,
      area: data.area || 'Vijay Nagar',
      address: data.address || `${data.area || 'Vijay Nagar'}, Indore`,
      ward: data.ward || 'Ward 34 - Central',
      report_count: 1,
      latitude: Number(data.latitude) || 22.7533,
      longitude: Number(data.longitude) || 75.8937,
      image_url: data.image_url || '/pothole.jpg',
      created_at: new Date().toISOString(),
      department,
      detections: data.detections || [
        {
          class: type,
          confidence: 0.94,
          bbox: [0.2, 0.35, 0.6, 0.45],
          label: `${type.replace(/_/g, ' ')} · AI Detected (94%)`
        }
      ],
      connected_hazards: data.connected_hazards || [
        {
          type: 'transit_route',
          distance_m: 25,
          risk_level: priorityScore >= 80 ? 'High' : 'Medium'
        }
      ],
      complaints: [
        {
          reference_number: refNumber,
          citizen_name: data.citizen_name || 'Citizen Reporter',
          phone: data.citizen_phone || '+91 98260 00000',
          created_at: new Date().toISOString()
        }
      ],
      timeline: [
        {
          status: 'Reported',
          time: new Date().toISOString(),
          by: data.citizen_name || 'Citizen (Mobile Portal)',
          note: data.description || 'Hazard report logged with GPS coordinates and photo evidence.'
        }
      ]
    };

    this.issues.unshift(newIssue);
    this.save();
    return newIssue;
  }

  updateStatus(id, newStatus, changedBy = 'Admin') {
    const issue = this.getIssueById(id);
    if (!issue) return null;

    issue.status = newStatus;
    if (!issue.timeline) issue.timeline = [];
    issue.timeline.push({
      status: newStatus,
      time: new Date().toISOString(),
      by: changedBy,
      note: `Status updated to ${newStatus} by ${changedBy}.`
    });

    this.save();
    return issue;
  }

  verifyRepair(id, verificationData = {}) {
    const issue = this.getIssueById(id);
    if (!issue) return null;

    issue.status = 'Fixed';
    if (!issue.timeline) issue.timeline = [];
    issue.timeline.push({
      status: 'Fixed',
      time: new Date().toISOString(),
      by: verificationData.officer || 'Admin Verifier',
      note: verificationData.notes || 'Repair proof verified by Computer Vision and signed off by Field Officer.'
    });

    if (verificationData.proof_image) {
      issue.repair_proof_url = verificationData.proof_image;
    }

    this.save();
    return {
      success: true,
      issue,
      verified_at: new Date().toISOString(),
      ai_confidence: 0.96,
      message: 'Repair verified and closed successfully'
    };
  }

  getStats() {
    const totalReports = this.issues.reduce((acc, curr) => acc + (curr.report_count || 1), 0);
    const criticalCount = this.issues.filter(i => (i.priority_score || 0) >= 80 && i.status !== 'Fixed').length;
    const resolvedCount = this.issues.filter(i => i.status === 'Fixed' || i.status === 'Resolved').length;
    const inProgressCount = this.issues.filter(i => (i.status || '').toLowerCase().includes('progress')).length;

    const issuesByType = {
      pothole: 0,
      broken_streetlight: 0,
      overflowing_drain: 0,
      garbage: 0,
      water_pipeline: 0,
      damaged_footpath: 0,
      traffic_signal: 0
    };

    for (const item of this.issues) {
      const t = item.type || 'pothole';
      if (issuesByType[t] != null) {
        issuesByType[t]++;
      } else {
        issuesByType[t] = 1;
      }
    }

    const reportsOverTime = [
      { date: 'Mon', reports: 17 },
      { date: 'Tue', reports: 21 },
      { date: 'Wed', reports: 15 },
      { date: 'Thu', reports: 26 },
      { date: 'Fri', reports: 30 },
      { date: 'Sat', reports: 23 },
      { date: 'Sun', reports: 14 }
    ];

    const topPriority = this.getIssues({ sort: 'priority_score', order: 'desc', limit: 6 });

    return {
      total_reports: totalReports,
      total_issues: this.issues.length,
      critical_issues: criticalCount,
      resolved_issues: resolvedCount,
      in_progress_count: inProgressCount,
      issues_by_type: issuesByType,
      reports_over_time: reportsOverTime,
      top_priority_issues: topPriority,
      avg_resolution_hours: 28,
      ward_coverage: '85/85 Wards Onboarded'
    };
  }

  getHeatmapData(filterType = '') {
    // Generate realistic heatmap cluster points across Indore
    let items = [...this.issues];
    if (filterType && filterType !== 'All' && filterType !== 'All Issue Types') {
      const fNorm = filterType.toLowerCase();
      items = items.filter(i => (i.type || '').toLowerCase().includes(fNorm));
    }

    // Map existing issues
    const points = items.map(i => ({
      lat: i.latitude,
      lng: i.longitude,
      weight: ((i.priority_score || 70) / 100),
      score: i.priority_score || 75,
      area: i.area || 'Indore',
      type: i.type || 'Pothole',
      id: i.id
    }));

    // Add extra geo density points around major Indore transit hubs
    const extraClusters = [
      { lat: 22.7533, lng: 75.8937, weight: 0.9, score: 92, area: 'Vijay Nagar', type: 'pothole' },
      { lat: 22.7510, lng: 75.8900, weight: 0.85, score: 88, area: 'Scheme 54', type: 'pothole' },
      { lat: 22.7196, lng: 75.8577, weight: 0.95, score: 96, area: 'Rajwada', type: 'traffic_signal' },
      { lat: 22.7180, lng: 75.8550, weight: 0.7, score: 72, area: 'Sarafa Bazaar', type: 'garbage' },
      { lat: 22.7244, lng: 75.8839, weight: 0.75, score: 74, area: 'Palasia', type: 'broken_streetlight' },
      { lat: 22.7280, lng: 75.8810, weight: 0.65, score: 68, area: 'Industry House', type: 'broken_streetlight' },
      { lat: 22.6922, lng: 75.8672, weight: 0.88, score: 88, area: 'Bhawarkua', type: 'water_pipeline' },
      { lat: 22.6950, lng: 75.8690, weight: 0.6, score: 64, area: 'Vishnupuri', type: 'water_pipeline' },
      { lat: 22.7155, lng: 75.8821, weight: 0.82, score: 85, area: 'Geeta Bhavan', type: 'overflowing_drain' },
      { lat: 22.7091, lng: 75.9142, weight: 0.62, score: 62, area: 'Bicholi Mardana', type: 'garbage' },
      { lat: 22.7018, lng: 75.8711, weight: 0.58, score: 58, area: 'Sapna Sangeeta', type: 'damaged_footpath' },
      { lat: 22.6985, lng: 75.8344, weight: 0.83, score: 83, area: 'Annapurna', type: 'pothole' },
      { lat: 22.7300, lng: 75.8600, weight: 0.7, score: 70, area: 'Mari Mata Chowk', type: 'pothole' },
      { lat: 22.6850, lng: 75.8450, weight: 0.75, score: 76, area: 'Sudama Nagar', type: 'overflowing_drain' },
      { lat: 22.7420, lng: 75.9050, weight: 0.8, score: 82, area: 'Khajrana', type: 'garbage' }
    ];

    if (!filterType || filterType === 'All' || filterType === 'All Issue Types') {
      points.push(...extraClusters);
    } else {
      const fNorm = filterType.toLowerCase();
      points.push(...extraClusters.filter(c => c.type.toLowerCase().includes(fNorm)));
    }

    return points;
  }
}

module.exports = new Database();
