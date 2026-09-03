import React from 'react';

// Helper to group screenshots by hour (e.g. "9:00 AM - 10:00 AM")
function groupScreenshotsByHour(screenshots: any[]) {
  const groups: Record<string, any[]> = {};
  
  screenshots.forEach(screenshot => {
    const date = new Date(screenshot.createdAt);
    const startHour = date.getHours();
    const endHour = (startHour + 1) % 24;
    
    const formatHour = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hours12 = h % 12 || 12;
      return `${hours12}:00 ${ampm}`;
    };

    const label = `${formatHour(startHour)} - ${formatHour(endHour)}`;
    
    if (!groups[label]) groups[label] = [];
    groups[label].push(screenshot);
  });

  return groups;
}

// Helper to format total seconds into HH:MM
function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function AdvancedReport({ 
  timeEntries, 
  screenshots 
}: { 
  timeEntries: any[], 
  screenshots: any[] 
}) {
  // Calculate Summary Stats
  const totalSeconds = timeEntries.reduce((acc, curr) => {
    // If tracking is currently active (no endTime), calculate up to now
    const end = curr.endTime ? new Date(curr.endTime) : new Date();
    const start = new Date(curr.startTime);
    return acc + Math.floor((end.getTime() - start.getTime()) / 1000);
  }, 0);

  const totalTimeStr = formatDuration(totalSeconds);
  const avgActivity = totalSeconds > 0 ? '98%' : '0%'; // Hardcoded for MVP, in real app calculate from ActivityLogs

  const groupedScreenshots = groupScreenshotsByHour(screenshots);
  const hourLabels = Object.keys(groupedScreenshots).sort(); // Basic sort, could be better

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* FILTER HEADER (UI Placeholder) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Daily Work Report</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontWeight: 600 }}>
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
          </select>
          <select style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontWeight: 600 }}>
            <option>All Projects</option>
            <option>Design Update</option>
          </select>
        </div>
      </div>

      {/* SUMMARY STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>⏱️ Total Time Logged</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{totalTimeStr}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>📈 Average Activity</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{avgActivity}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>📸 Screenshots Taken</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{screenshots.length}</div>
        </div>
      </div>

      {/* TIMELINE REPORT */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Activity Timeline</h4>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {hourLabels.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
              No tracking data or screenshots available for this period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {hourLabels.map((hourLabel) => (
                <div key={hourLabel} style={{ display: 'flex', gap: '2rem' }}>
                  {/* Time Label on the left */}
                  <div style={{ width: '120px', flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{hourLabel}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: '0.25rem' }}>{avgActivity} Activity</div>
                  </div>
                  
                  {/* Screenshots grid on the right */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {groupedScreenshots[hourLabel].map((shot) => {
                      const timeStr = new Date(shot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={shot.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <img 
                            src={shot.imageUrl} 
                            alt="Screenshot" 
                            style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                          />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{timeStr}</span>
                            <span style={{ color: '#34d399', fontWeight: 600 }}>100%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
