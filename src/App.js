import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Line, ComposedChart, ReferenceDot
} from 'recharts';
import './App.css';

function App() {
  // --- Updated State for Inputs based on new Request Body ---
  const [formData, setFormData] = useState({
    dataId: '',
    company_name: '',
    facility_name: '',
    address: '',
    filename: '',
    tariff_rate: 0,
  });

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Handle number conversion for tariff_rate
    setFormData({ 
      ...formData, 
      [name]: name === 'tariff_rate' ? Number(value) : value 
    });
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const response = await fetch(`https://fiber.preciousifeaka.site/api/v1/data/${formData.dataId}/energy-analytics-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.company_name,
          facility_name: formData.facility_name,
          address: formData.address,
          filename: formData.filename,
          tariff_rate: formData.tariff_rate
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setReportData(result.data);
      } else {
        setError(result.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Helper Formatters ---
  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(Math.round(num));
  const formatDecimal = (num) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(num);

  return (
    <div className="container">
      <h1>Energy Analytics Report Generator</h1>

      {/* --- Updated Input Section --- */}
      <div className="input-section">
        <div className="input-group">
          <label>Data ID (UUID)</label>
          <input name="dataId" value={formData.dataId} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Company Name</label>
          <input name="company_name" value={formData.company_name} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Facility Name</label>
          <input name="facility_name" value={formData.facility_name} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Address</label>
          <input name="address" value={formData.address} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Filename</label>
          <input name="filename" value={formData.filnaeme} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Tariff Rate</label>
          <input name="tariff_rate" type="number" value={formData.tariff_rate} onChange={handleChange} />
        </div>
        <button className="generate-btn" onClick={generateReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 20 }}>Error: {error}</div>}

      {/* --- Report Rendering Logic --- */}
      {reportData && (
        <>
          {/* Render Facility Info for ALL report types */}
          <FacilityHeader info={reportData.facility_info} period={reportData.period} />

          {/* Render Specific Period View */}
          {reportData.period === 'day' && (
            <DayReportView data={reportData} formatNumber={formatNumber} formatCurrency={formatCurrency} />
          )}
          
          {reportData.period === 'week' && (
            <WeekReportView data={reportData} formatNumber={formatNumber} formatCurrency={formatCurrency} formatDecimal={formatDecimal} />
          )}

          {reportData.period === 'month' && (
            <MonthReportView data={reportData} formatNumber={formatNumber} formatCurrency={formatCurrency} formatDecimal={formatDecimal} />
          )}
        </>
      )}
    </div>
  );
}

// ==========================================
// NEW: Facility Header Component
// ==========================================
function FacilityHeader({ info, period }) {
  if (!info) return null;
  return (
    <div className="facility-header">
      <div className="facility-title">
        <h2>{info.facility_name}</h2>
        <div className="facility-meta">
          <strong>{info.company_name}</strong> • {info.address}
        </div>
      </div>
      <div className="facility-badge">
        {period} Report
      </div>
    </div>
  );
}

// ==========================================
// 1. MONTH REPORT VIEW
// ==========================================
function MonthReportView({ data, formatNumber, formatCurrency, formatDecimal }) {
  const { data_quality_indicators, energy_load_summary, performance_reviews } = data;

  const getOpDetailsString = (opData) => {
    return `Avg: ${formatNumber(opData.avg_kva)} | Min: ${formatNumber(opData.min_kva)} | Max: ${formatNumber(opData.max_kva)} kVA`;
  }
  const getProfileDetailsString = (stats) => {
    return `Avg: ${formatNumber(stats.average)} | Min: ${formatNumber(stats.min)} | Max: ${formatNumber(stats.max)} kVA`;
  }

  return (
    <div>
      <h2 className="section-title">Executive Summary (Monthly Overview)</h2>
      <div style={{fontSize: '0.9rem', color: '#666', marginBottom: '20px'}}>
        Total Values: {data_quality_indicators.total_values} readings |
        Missing Values: {data_quality_indicators.total_missing} readings |
        Percentage Missing: {data_quality_indicators.percentage_missing} | 
        Interval: {data_quality_indicators.measurment_interval_minutes} mins
      </div>

      <div className="card-grid">
        <StatCard label="Total Energy (KWh)" value={formatNumber(energy_load_summary.total_energy_consumed)} />
        <StatCard label="Peak Load" value={`${formatNumber(energy_load_summary.peak_load)} kVA`} />
        <StatCard label="Total Cost" value={formatCurrency(energy_load_summary.total_energy_cost)} />
        <StatCard label="Load Factor" value={energy_load_summary.load_factor} />
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Monthly Consumption Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={energy_load_summary.consumption_summary.monthly_consumption}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month_label" />
            <YAxis />
            <Tooltip formatter={(value) => formatNumber(value) + " KWh"} />
            <Bar dataKey="total_consumption_kwh" fill="#9c27b0" name="Energy (KWh)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="section-title">Monthly Performance Reviews</h2>
      {performance_reviews.map((month, index) => (
        <div key={index} className="daily-review" style={{borderLeft: '5px solid #9c27b0'}}>
          <div className="daily-header" style={{background: '#7b1fa2', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>{month.month_label}</h3>
            {month.comparison_with_previous && (
              <span style={{fontSize: '0.9rem', background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '4px'}}>
                {month.comparison_with_previous.direction === 'increase' ? '▲' : '▼'} {month.comparison_with_previous.percentage} vs prev
              </span>
            )}
          </div>

          <div className="card-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
            <StatCard label="Total KWh" value={formatNumber(month.summary_cards.total_energy_consumption)} />
            <StatCard label="Peak kVA" value={formatNumber(month.summary_cards.peak_kva)} />
            <StatCard label="Cost" value={formatCurrency(month.summary_cards.energy_cost)} />
            <StatCard label="Daily Avg KWh" value={formatDecimal(month.summary_cards.daily_avg_energy)} />
            <StatCard label="Weekday Avg KWh" value={formatDecimal(month.summary_cards.weekday_avg_energy)} />
            <StatCard label="Weekend Avg Kwh" value={formatDecimal(month.summary_cards.weekend_avg_energy)} />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', marginBottom: '30px'}}>
            <div className="chart-container" style={{height: '300px', marginBottom: 0}}>
                <h4 className="chart-title">Daily Consumption (kWh)</h4>
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={month.daily_consumption_chart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip labelFormatter={(label, payload) => payload[0]?.payload.full_date} formatter={(value) => formatNumber(value) + " kWh"} />
                    <Bar dataKey="consumption_kwh" fill="#7b1fa2" />
                </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-container" style={{height: '300px', marginBottom: 0, overflowY: 'auto'}}>
                <h4 className="chart-title">Week-on-Week (KWh)</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    {month.week_comparison_list.map((item, i) => (
                        <div key={i} style={{display: 'flex', alignItems: 'center', fontSize: '0.8rem'}}>
                            <div style={{width: '60px'}}>{item.label}</div>
                            <div style={{flex: 1, background: '#e0e0e0', height: '10px', borderRadius: '5px', margin: '0 10px'}}>
                                <div style={{
                                    width: `${(item.value_kwh / Math.max(...month.week_comparison_list.map(x=>x.value_kwh))) * 100}%`,
                                    background: '#7b1fa2',
                                    height: '100%', borderRadius: '5px'
                                }}></div>
                            </div>
                            <div style={{width: '70px', textAlign: 'right'}}>{formatNumber(item.value_kwh)}</div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="chart-container">
            <h4 className="chart-title">Monthly 24-Hour Load Profile (Range & Average)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={month.hourly_load_profile.graph_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="max_range" stroke="none" fill="#f3e5f5" name="Max Range" />
                <Area type="monotone" dataKey="min_range" stroke="none" fill="#fff" name="Min Range" />
                <Line type="monotone" dataKey="average_load" stroke="#7b1fa2" strokeWidth={2} dot={false} name="Average" />
                <ReferenceDot 
                    x={month.hourly_load_profile.peak_event.hour} 
                    y={month.hourly_load_profile.peak_event.value} 
                    r={6} fill="red" stroke="none" 
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{textAlign: 'center', fontSize: '0.9rem'}}>
                Peak Event: <strong style={{color:'red'}}>{formatNumber(month.hourly_load_profile.peak_event.value)} kVA</strong> at {month.hourly_load_profile.peak_event.formatted_hour}
            </div>
          </div>

          <div className="op-hours-grid">
            <div className="op-card">
                <h4>Weekdays</h4>
                <div className="op-details" style={{fontSize: '1rem'}}>
                    {getProfileDetailsString(month.load_profile_analysis.weekday)}
                </div>
            </div>
            <div className="op-card">
                <h4>Weekends</h4>
                <div className="op-details" style={{fontSize: '1rem'}}>
                    {getProfileDetailsString(month.load_profile_analysis.weekend)}
                </div>
            </div>
          </div>

          <div className="op-hours-grid">
            <div className="op-card">
              <h4>{month.operating_hours.daytime.label}</h4>
              <div className="op-percent">{month.operating_hours.daytime.percentage}</div>
              <div className="op-details">
                Consumption: {formatNumber(month.operating_hours.daytime.energy_consumption)} KWh<br/>
                {getOpDetailsString(month.operating_hours.daytime)}
              </div>
            </div>
            <div className="op-card night">
              <h4>{month.operating_hours.nighttime.label}</h4>
              <div className="op-percent">{month.operating_hours.nighttime.percentage}</div>
              <div className="op-details">
                Consumption: {formatNumber(month.operating_hours.nighttime.energy_consumption)} KWh<br/>
                {getOpDetailsString(month.operating_hours.nighttime)}
              </div>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}

// ==========================================
// 2. WEEK REPORT VIEW
// ==========================================
function WeekReportView({ data, formatNumber, formatCurrency, formatDecimal }) {
  const { data_quality_indicators, energy_load_summary, performance_reviews } = data;

  const weeklyTrendData = energy_load_summary.consumption_summary.weekly_consumption.map(w => ({
    week_label: w.week_label,
    total_consumption: w.total_consumption_kwh
  }));

  const getOpDetailsString = (opData) => {
    return `Avg: ${formatNumber(opData.avg_kva)} | Min: ${formatNumber(opData.min_kva)} | Max: ${formatNumber(opData.max_kva)} kVA`;
  }
  const getProfileDetailsString = (stats) => {
    return `Avg: ${formatNumber(stats.average)} | Min: ${formatNumber(stats.min)} | Max: ${formatNumber(stats.max)} kVA`;
  }

  return (
    <div>
      <h2 className="section-title">Executive Summary (Weekly Overview)</h2>
      <div style={{fontSize: '0.9rem', color: '#666', marginBottom: '20px'}}>
        Total Weeks: {performance_reviews.length} weeks |
        Total Values: {data_quality_indicators.total_values} readings |
        Missing Values: {data_quality_indicators.total_missing} readings |
        Percentage Missing: {data_quality_indicators.percentage_missing} | 
        Interval: {data_quality_indicators.measurment_interval_minutes} mins
      </div>

      <div className="card-grid">
        <StatCard label="Total Energy (kWh)" value={formatDecimal(energy_load_summary.total_energy_consumed)} />
        <StatCard label="Peak Load" value={`${formatNumber(energy_load_summary.peak_load)} kVA`} />
        <StatCard label="Total Cost" value={formatCurrency(energy_load_summary.total_energy_cost)} />
        <StatCard label="Load Factor" value={energy_load_summary.load_factor} />
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Weekly Consumption Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week_label" />
            <YAxis />
            <Tooltip formatter={(value) => formatDecimal(value) + " kWh"} />
            <Bar dataKey="total_consumption" fill="#2196f3" name="Energy (kWh)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="section-title">Weekly Performance Reviews</h2>
      {performance_reviews.map((week, index) => (
        <div key={index} className="daily-review" style={{borderLeft: '5px solid #2196f3'}}>
          <div className="daily-header" style={{background: '#1976d2', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>{week.full_week_label}</h3>
            {week.comparison_with_previous && (
              <span style={{fontSize: '0.9rem', background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '4px'}}>
                {week.comparison_with_previous.direction === 'increase' ? '▲' : '▼'} {week.comparison_with_previous.percentage} vs prev
              </span>
            )}
          </div>

          <div className="card-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
            <StatCard label="Total kWh" value={formatDecimal(week.summary_cards.total_energy_consumption)} />
            <StatCard label="Peak kVA" value={formatNumber(week.summary_cards.peak_kva)} />
            <StatCard label="Cost" value={formatCurrency(week.summary_cards.energy_cost)} />
            <StatCard label="Daily Avg" value={formatDecimal(week.summary_cards.daily_avg_energy)} />
            <StatCard label="Weekday Avg" value={formatDecimal(week.summary_cards.weekday_avg_energy)} />
            <StatCard label="Weekend Avg" value={formatDecimal(week.summary_cards.weekend_avg_energy)} />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', marginBottom: '30px'}}>
            <div className="chart-container" style={{height: '300px', marginBottom: 0}}>
                <h4 className="chart-title">Daily Consumption (kWh)</h4>
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week.daily_consumption_chart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatNumber(value) + " kWh"} />
                    <Bar dataKey="consumption_kwh" fill="#4caf50" />
                </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-container" style={{height: '300px', marginBottom: 0, overflowY: 'auto'}}>
                <h4 className="chart-title">Comparison (kWh)</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    {week.week_comparison_list.map((item, i) => (
                        <div key={i} style={{display: 'flex', alignItems: 'center', fontSize: '0.8rem'}}>
                            <div style={{width: '60px'}}>{item.label}</div>
                            <div style={{flex: 1, background: '#e0e0e0', height: '10px', borderRadius: '5px', margin: '0 10px'}}>
                                <div style={{
                                    width: `${(item.value_kwh / Math.max(...week.week_comparison_list.map(x=>x.value_kwh))) * 100}%`,
                                    background: item.label === week.week_label ? '#4caf50' : '#bdbdbd',
                                    height: '100%', borderRadius: '5px'
                                }}></div>
                            </div>
                            <div style={{width: '60px', textAlign: 'right'}}>{formatNumber(item.value_kwh)}</div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="chart-container">
            <h4 className="chart-title">Weekly 24-Hour Load Profile</h4>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={week.hourly_load_profile.graph_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="max_range" stroke="none" fill="#c8e6c9" name="Max Range" />
                <Area type="monotone" dataKey="min_range" stroke="none" fill="#fff" name="Min Range" />
                <Line type="monotone" dataKey="average_load" stroke="#2e7d32" strokeWidth={2} dot={false} name="Average" />
                <ReferenceDot 
                    x={week.hourly_load_profile.peak_event.hour} 
                    y={week.hourly_load_profile.peak_event.value} 
                    r={6} fill="red" stroke="none" 
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{textAlign: 'center', fontSize: '0.9rem'}}>
                Peak Event: <strong style={{color:'red'}}>{formatNumber(week.hourly_load_profile.peak_event.value)} kVA</strong> at {week.hourly_load_profile.peak_event.formatted_hour}
            </div>
          </div>

          <div className="chart-container" style={{height: 'auto'}}>
            <h4 className="chart-title">Daily Consumption Heatmap</h4>
            <ConsumptionHeatmap data={week.consumption_pattern_table} />
          </div>

          <div className="op-hours-grid">
            <div className="op-card">
                <h4>Weekdays</h4>
                <div className="op-details" style={{fontSize: '1rem'}}>
                    {getProfileDetailsString(week.load_profile_analysis.weekday)}
                </div>
            </div>
            <div className="op-card">
                <h4>Weekends</h4>
                <div className="op-details" style={{fontSize: '1rem'}}>
                    {getProfileDetailsString(week.load_profile_analysis.weekend)}
                </div>
            </div>
          </div>

          <div className="op-hours-grid">
            <div className="op-card">
              <h4>{week.operating_hours.daytime.label}</h4>
              <div className="op-percent">{week.operating_hours.daytime.percentage}</div>
              <div className="op-details">
                Consumption: {formatDecimal(week.operating_hours.daytime.energy_consumption)} kWh<br/>
                {getOpDetailsString(week.operating_hours.daytime)}
              </div>
            </div>
            <div className="op-card night">
              <h4>{week.operating_hours.nighttime.label}</h4>
              <div className="op-percent">{week.operating_hours.nighttime.percentage}</div>
              <div className="op-details">
                Consumption: {formatDecimal(week.operating_hours.nighttime.energy_consumption)} kWh<br/>
                {getOpDetailsString(week.operating_hours.nighttime)}
              </div>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}

function ConsumptionHeatmap({ data }) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({length: 24}, (_, i) => i);
    let maxVal = 0;
    Object.values(data).forEach(dayObj => {
        Object.values(dayObj).forEach(val => { if(val > maxVal) maxVal = val; })
    });

    return (
        <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem'}}>
                <thead>
                    <tr><th style={{padding: '5px'}}></th>{hours.map(h => <th key={h} style={{padding: '5px'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {days.map(day => (
                        <tr key={day}>
                            <td style={{fontWeight: 'bold', padding: '5px'}}>{day}</td>
                            {hours.map(h => {
                                const val = data[day]?.[h] || 0;
                                const intensity = maxVal > 0 ? val / maxVal : 0;
                                return (
                                    <td key={h} style={{
                                        backgroundColor: `rgba(76, 175, 80, ${intensity})`,
                                        color: intensity > 0.6 ? 'white' : 'black',
                                        textAlign: 'center',
                                        padding: '4px',
                                        border: '1px solid #eee'
                                    }} title={`${val.toLocaleString()} kWh`}></td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ==========================================
// 3. DAY REPORT VIEW
// ==========================================
function DayReportView({ data, formatNumber, formatCurrency }) {
  const { data_quality_indicators, energy_load_summary, performance_reviews } = data;
  const typicalProfile = energy_load_summary.typical_day_profile;

  const getOpDetailsString = (opData) => {
    return `Avg: ${formatNumber(opData.avg_kva)} | Min: ${formatNumber(opData.min_kva)} | Max: ${formatNumber(opData.max_kva)} kVA`;
  }

  return (
    <div>
      <h2 className="section-title">Executive Summary (Global)</h2>
      <div style={{fontSize: '0.9rem', color: '#666', marginBottom: '20px'}}>
        Total Values: {data_quality_indicators.total_values} readings |
        Missing Values: {data_quality_indicators.total_missing} readings |
        Percentage Missing: {data_quality_indicators.percentage_missing} | 
        Interval: {data_quality_indicators.measurment_interval_minutes} mins
      </div>

      <div className="card-grid">
        <StatCard label="Total Energy Consumed" value={`${formatNumber(energy_load_summary.total_energy_consumed / 1000)} KWh`} />
        <StatCard label="Peak Load" value={`${formatNumber(energy_load_summary.peak_load)} kVA`} />
        <StatCard label="Total Energy Cost" value={formatCurrency(energy_load_summary.total_energy_cost)} />
        <StatCard label="Load Factor" value={energy_load_summary.load_factor} />
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Daily Energy Consumption Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={energy_load_summary.consumption_summary.daily_consumption}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formatted_date" tickFormatter={(val) => val.split(',')[0]} />
            <YAxis />
            <Tooltip formatter={(value) => formatNumber(value) + " kWh"} />
            <Bar dataKey="consumption_kwh" fill="#4caf50" name="Energy (kWh)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Typical 24-Hour Load Profile</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={typicalProfile.hourly_data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="max_range" stackId="1" stroke="none" fill="#ffebee" name="Max Range" />
            <Area type="monotone" dataKey="min_range" stackId="2" stroke="none" fill="#e8f5e9" name="Min Range" />
            <Line type="monotone" dataKey="average_load" stroke="#2e7d32" strokeWidth={3} dot={false} name="Average Load" />
            <ReferenceDot x={typicalProfile.peak_event.hour} y={typicalProfile.peak_event.value} r={6} fill="red" stroke="none" />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{textAlign: 'center', fontSize: '0.9rem'}}>
          Peak Event (Max Range): <strong style={{color:'red'}}>{formatNumber(typicalProfile.peak_event.value)} kVA</strong> at {typicalProfile.peak_event.formatted_hour}
        </div>
      </div>

      <h2 className="section-title">Daily Performance Reviews</h2>
      {performance_reviews.map((day, index) => (
        <div key={index} className="daily-review">
          <div className="daily-header">
            <h3>{day.formatted_date} Analysis</h3>
          </div>

          <div className="card-grid">
            <StatCard label="Daily Total" value={`${formatNumber(day.summary_cards.total_energy_consumption)} kWh`} />
            <StatCard label="Daily Peak" value={`${formatNumber(day.summary_cards.peak_kva)} kVA`} />
            <StatCard label="Daily Cost" value={formatCurrency(day.summary_cards.energy_cost)} />
          </div>

          <div className="op-hours-grid">
            <div className="op-card">
              <h4>{day.operating_hours.daytime.label}</h4>
              <div className="op-percent">{day.operating_hours.daytime.percentage}</div>
              <div className="op-details">
                Consumption: {formatNumber(day.operating_hours.daytime.energy_consumption)} kWh<br/>
                {getOpDetailsString(day.operating_hours.daytime)}
              </div>
            </div>
            <div className="op-card night">
              <h4>{day.operating_hours.nighttime.label}</h4>
              <div className="op-percent">{day.operating_hours.nighttime.percentage}</div>
              <div className="op-details">
                Consumption: {formatNumber(day.operating_hours.nighttime.energy_consumption)} kWh<br/>
                {getOpDetailsString(day.operating_hours.nighttime)}
              </div>
            </div>
          </div>

          <div className="chart-container" style={{height: '300px'}}>
            <h4 className="chart-title">Hourly Load Profile - {day.formatted_date}</h4>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={day.hourly_load_profile.graph_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value) => formatNumber(value) + " kVA"} />
                <Area type="monotone" dataKey="average_load" stroke="#4caf50" fill="#c8e6c9" name="Load (kVA)" />
                <ReferenceDot 
                  x={day.hourly_load_profile.peak_event.hour} 
                  y={day.hourly_load_profile.peak_event.value} 
                  r={6} fill="red" stroke="none" 
                />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{textAlign: 'center', fontSize: '0.85rem', marginTop: '10px'}}>
               Peak Load: <strong style={{color:'red'}}>{formatNumber(day.hourly_load_profile.peak_event.value)} kVA</strong> at {day.hourly_load_profile.peak_event.formatted_hour}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const StatCard = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default App;